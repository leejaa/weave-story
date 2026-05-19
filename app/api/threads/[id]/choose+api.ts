import { db } from '@/lib/db/client';
import { threads, stories, chapters, interventions } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { generateNextChapter } from '@/lib/ai/story-generation';
import { eq, and } from 'drizzle-orm';

function extractThreadId(url: string): string | null {
  const match = url.match(/\/api\/threads\/([^/]+)\/choose/);
  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const threadId = extractThreadId(request.url);
  if (!threadId) return Response.json({ error: 'Not found' }, { status: 404 });

  const { chapterNumber, choiceIndex, customInput } = await request.json();
  if (typeof chapterNumber !== 'number') {
    return Response.json({ error: 'chapterNumber required' }, { status: 400 });
  }
  const hasChoice = typeof choiceIndex === 'number';
  const hasCustom = typeof customInput === 'string' && customInput.trim().length > 0;
  if (!hasChoice && !hasCustom) {
    return Response.json({ error: 'choiceIndex or customInput required' }, { status: 400 });
  }

  console.log(`[choose] start thread=${threadId} chapter=${chapterNumber} mode=${hasCustom ? 'custom' : `choice[${choiceIndex}]`}`);

  const [threadRow] = await db
    .select({
      id: threads.id,
      currentChapter: threads.currentChapter,
      estimatedChapters: stories.estimatedChapters,
      setupAnswers: stories.setupAnswers,
      storyId: threads.storyId,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!threadRow) return Response.json({ error: 'Not found' }, { status: 404 });

  // Detect retry: user re-choosing from chapterNumber when chapterNumber+1 has failed
  let isRetry = false;
  if (threadRow.currentChapter !== chapterNumber) {
    if (threadRow.currentChapter === chapterNumber + 1) {
      const [maybeFailed] = await db
        .select({ status: chapters.status })
        .from(chapters)
        .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, chapterNumber + 1)));
      if (maybeFailed?.status === 'failed') {
        isRetry = true;
        console.log(`[choose] retry detected thread=${threadId} retrying chapter=${chapterNumber + 1}`);
      }
    }
    if (!isRetry) {
      console.warn(`[choose] chapter mismatch thread=${threadId} expected=${threadRow.currentChapter} got=${chapterNumber}`);
      return Response.json({ error: 'Chapter mismatch' }, { status: 409 });
    }
  }

  const [currentChapter] = await db
    .select({ options: chapters.options, content: chapters.content })
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, chapterNumber)));

  let chosenText: string;
  let ivRecord: typeof interventions.$inferSelect;

  if (hasCustom) {
    chosenText = customInput.trim();
    console.log(`[choose] custom input thread=${threadId} chapter=${chapterNumber} text="${chosenText.slice(0, 60)}"`);
    const [iv] = await db.insert(interventions).values({
      threadId, chapterNumber, type: 'free_input', freeText: chosenText,
    }).returning();
    ivRecord = iv;
  } else {
    const opts = (currentChapter?.options as { index: number; text: string }[] | null) ?? [];
    chosenText = opts.find(o => o.index === choiceIndex)?.text ?? '';

    if (!chosenText) {
      console.error(
        `[choose] CHOICE_LOOKUP_FAILED thread=${threadId} chapter=${chapterNumber} choiceIndex=${choiceIndex} opts_count=${opts.length} opts=${JSON.stringify(opts)}`,
      );
    } else {
      console.log(`[choose] choice resolved thread=${threadId} chapter=${chapterNumber} index=${choiceIndex} text="${chosenText.slice(0, 60)}"`);
    }

    const [iv] = await db.insert(interventions).values({
      threadId, chapterNumber, type: 'choice', choiceIndex,
    }).returning();
    ivRecord = iv;
  }

  const nextChapterNumber = chapterNumber + 1;

  if (isRetry) {
    // Reset the failed chapter back to generating
    const [resetChapter] = await db
      .update(chapters)
      .set({ status: 'generating', content: null, title: null, options: null, situation: null, question: null })
      .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, nextChapterNumber)))
      .returning();

    const answers = threadRow.setupAnswers as { prompt?: string };

    console.log(`[choose] retry bg:start thread=${threadId} retryChapter=${nextChapterNumber} chosenText_len=${chosenText.length}`);

    ;(async () => {
      const startMs = Date.now();
      try {
        const generated = await generateNextChapter({
          threadId,
          prompt: answers.prompt ?? '',
          estimatedChapters: threadRow.estimatedChapters,
          previousChapterNumber: chapterNumber,
          previousChapterContent: currentChapter?.content ?? '',
          chosenOption: chosenText,
          nextChapterNumber,
        });

        await db
          .update(chapters)
          .set({
            title: generated.chapterTitle,
            content: generated.content,
            situation: generated.situation || null,
            question: generated.question || null,
            status: 'ready',
            options:
              generated.choices.length > 0
                ? generated.choices.map((text, index) => ({ index, text }))
                : null,
          })
          .where(eq(chapters.id, resetChapter.id));

        console.log(
          `[choose] retry bg:done thread=${threadId} chapter=${nextChapterNumber} elapsed=${Date.now() - startMs}ms`,
        );
      } catch (err) {
        console.error(`[choose] retry bg:error thread=${threadId} chapter=${nextChapterNumber} elapsed=${Date.now() - startMs}ms`, err);
        await db
          .update(chapters)
          .set({ status: 'failed' })
          .where(eq(chapters.id, resetChapter.id));
      }
    })();

    const [currentThread] = await db
      .select({ currentChapter: threads.currentChapter, progress: threads.progress, status: threads.status })
      .from(threads)
      .where(eq(threads.id, threadId));

    return Response.json({ chapter: resetChapter, thread: currentThread, intervention: ivRecord });
  }

  // Normal flow
  const isLast = nextChapterNumber > threadRow.estimatedChapters;
  const newProgress = Math.min((nextChapterNumber - 1) / threadRow.estimatedChapters, 1).toFixed(3);
  const newStatus = isLast ? 'completed' : 'active';

  const [updatedThread] = await db
    .update(threads)
    .set({
      currentChapter: nextChapterNumber,
      progress: newProgress,
      lastReadAt: new Date(),
      status: newStatus,
      ...(newStatus === 'completed' ? { finishedAt: new Date() } : {}),
    })
    .where(eq(threads.id, threadId))
    .returning({
      currentChapter: threads.currentChapter,
      progress: threads.progress,
      status: threads.status,
    });

  if (isLast) {
    console.log(`[choose] story completed thread=${threadId} chapter=${chapterNumber}`);
    return Response.json({ chapter: null, thread: updatedThread, intervention: ivRecord });
  }

  const [existing] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, nextChapterNumber)));

  if (existing) {
    console.log(`[choose] chapter already exists thread=${threadId} chapter=${nextChapterNumber}`);
    return Response.json({ chapter: existing, thread: updatedThread, intervention: ivRecord });
  }

  const [pendingChapter] = await db
    .insert(chapters)
    .values({
      threadId,
      chapterNumber: nextChapterNumber,
      title: null,
      content: null,
      status: 'generating',
      options: null,
    })
    .returning();

  const answers = threadRow.setupAnswers as { prompt?: string };

  console.log(`[choose] bg:start thread=${threadId} nextChapter=${nextChapterNumber} chosenText_len=${chosenText.length}`);

  ;(async () => {
    const startMs = Date.now();
    try {
      const generated = await generateNextChapter({
        threadId,
        prompt: answers.prompt ?? '',
        estimatedChapters: threadRow.estimatedChapters,
        previousChapterNumber: chapterNumber,
        previousChapterContent: currentChapter?.content ?? '',
        chosenOption: chosenText,
        nextChapterNumber,
      });

      await db
        .update(chapters)
        .set({
          title: generated.chapterTitle,
          content: generated.content,
          situation: generated.situation || null,
          question: generated.question || null,
          status: 'ready',
          options:
            generated.choices.length > 0
              ? generated.choices.map((text, index) => ({ index, text }))
              : null,
        })
        .where(eq(chapters.id, pendingChapter.id));

      console.log(
        `[choose] bg:done thread=${threadId} chapter=${nextChapterNumber} content=${generated.content.length} choices=${generated.choices.length} elapsed=${Date.now() - startMs}ms`,
      );
    } catch (err) {
      console.error(`[choose] bg:error thread=${threadId} chapter=${nextChapterNumber} elapsed=${Date.now() - startMs}ms`, err);
      await db
        .update(chapters)
        .set({ status: 'failed' })
        .where(eq(chapters.id, pendingChapter.id));
    }
  })();

  return Response.json({ chapter: pendingChapter, thread: updatedThread, intervention: ivRecord });
}
