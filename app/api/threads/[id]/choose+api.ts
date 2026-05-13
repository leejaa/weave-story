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
  if (threadRow.currentChapter !== chapterNumber) {
    return Response.json({ error: 'Chapter mismatch' }, { status: 409 });
  }

  const [currentChapter] = await db
    .select({ options: chapters.options, content: chapters.content })
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, chapterNumber)));

  let chosenText: string;
  if (hasCustom) {
    chosenText = customInput.trim();
    await db.insert(interventions).values({
      threadId, chapterNumber, type: 'free_input', freeText: chosenText,
    });
  } else {
    const opts = (currentChapter?.options as { index: number; text: string }[] | null) ?? [];
    chosenText = opts.find(o => o.index === choiceIndex)?.text ?? '';
    await db.insert(interventions).values({
      threadId, chapterNumber, type: 'choice', choiceIndex,
    });
  }

  const nextChapterNumber = chapterNumber + 1;
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
    return Response.json({ chapter: null, thread: updatedThread });
  }

  // Check if this chapter was pre-generated (shouldn't happen normally, but guard)
  const [existing] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, nextChapterNumber)));

  if (existing) {
    return Response.json({ chapter: existing, thread: updatedThread });
  }

  // Insert a generating placeholder and kick off background generation
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

  // Fire-and-forget — Node.js process continues after response is sent
  ;(async () => {
    try {
      const generated = await generateNextChapter({
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
    } catch (err) {
      console.error('[choose] background generation failed:', err);
      await db
        .update(chapters)
        .set({ status: 'failed' })
        .where(eq(chapters.id, pendingChapter.id));
    }
  })();

  return Response.json({ chapter: pendingChapter, thread: updatedThread });
}
