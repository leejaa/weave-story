import { Hono } from 'hono';
import { eq, desc, ne, and, lte, asc, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { threads, stories, chapters, interventions, users } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { buildChapterContext, type PrevChapterRow } from '../lib/threads/chapter-context';
import { createFirstChapterGenerationJob, createNextChapterGenerationJob } from '../lib/queue/story-generation-jobs';
import { enqueueStoryGenerationJob } from '../lib/queue/story-generation-queue';
import type { AppEnv } from '../types';

export const threadsRouter = new Hono<AppEnv>();

threadsRouter.use(requireAuth);

threadsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  const rows = await db
    .select({
      threadId: threads.id,
      status: threads.status,
      currentChapter: threads.currentChapter,
      progress: threads.progress,
      lastReadAt: threads.lastReadAt,
      storyId: stories.id,
      title: stories.title,
      genre: stories.genre,
      mood: stories.mood,
      coverImageUrl: stories.coverImageUrl,
      estimatedChapters: stories.estimatedChapters,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(eq(threads.userId, userId))
    .orderBy(desc(threads.lastReadAt));

  return c.json(rows);
});

threadsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const { storyId } = await c.req.json();
  if (!storyId) return c.json({ error: 'storyId required' }, 400);

  const db = makeDb(c.env.DATABASE_URL);
  const [thread] = await db.insert(threads).values({ userId, storyId }).returning();

  const [sourceThread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(and(eq(threads.storyId, storyId), ne(threads.id, thread.id)))
    .limit(1);

  if (sourceThread) {
    const [ch1] = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.threadId, sourceThread.id), eq(chapters.chapterNumber, 1)))
      .limit(1);

    if (ch1) {
      await db.insert(chapters).values({
        threadId: thread.id,
        chapterNumber: 1,
        title: ch1.title,
        content: ch1.content,
        imageUrl: ch1.imageUrl,
        options: ch1.options as { index: number; text: string }[],
      });
    }
  }

  return c.json(thread, 201);
});

threadsRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const threadId = c.req.param('id');
  const db = makeDb(c.env.DATABASE_URL);

  const [row] = await db
    .select({
      threadId: threads.id,
      status: threads.status,
      currentChapter: threads.currentChapter,
      progress: threads.progress,
      lastReadAt: threads.lastReadAt,
      storyId: stories.id,
      title: stories.title,
      genre: stories.genre,
      mood: stories.mood,
      coverImageUrl: stories.coverImageUrl,
      estimatedChapters: stories.estimatedChapters,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!row) return c.json({ error: 'Not found' }, 404);

  const [allChapters, allInterventions] = await Promise.all([
    db.select().from(chapters).where(eq(chapters.threadId, threadId)).orderBy(asc(chapters.chapterNumber)),
    db.select().from(interventions).where(eq(interventions.threadId, threadId)).orderBy(asc(interventions.createdAt)),
  ]);

  return c.json({ ...row, chapters: allChapters, interventions: allInterventions });
});

// Re-run a failed first-chapter generation for an existing thread. No credit charge —
// the credit was already spent when the story was created.
threadsRouter.post('/:id/retry-first-chapter', async (c) => {
  const userId = c.get('userId');
  const threadId = c.req.param('id');
  const db = makeDb(c.env.DATABASE_URL);

  const [row] = await db
    .select({
      storyId: stories.id,
      estimatedChapters: stories.estimatedChapters,
      setupAnswers: stories.setupAnswers,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!row) return c.json({ error: 'Not found' }, 404);

  const [ch1] = await db
    .select({ id: chapters.id, status: chapters.status })
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, 1)));

  if (!ch1) return c.json({ error: 'Chapter not found' }, 404);
  if (ch1.status !== 'failed') return c.json({ error: 'Chapter not in failed state' }, 409);

  const answers = row.setupAnswers as { prompt?: string };
  const prompt = (answers.prompt ?? '').trim();
  if (!prompt) return c.json({ error: 'Missing prompt' }, 400);

  await Promise.all([
    db.update(chapters)
      .set({ status: 'generating', content: null, title: null, options: null, situation: null, question: null, summary: null })
      .where(eq(chapters.id, ch1.id)),
    db.update(stories).set({ status: 'generating' }).where(eq(stories.id, row.storyId)),
  ]);

  try {
    await enqueueStoryGenerationJob(
      c.env.STORY_GENERATION_QUEUE,
      createFirstChapterGenerationJob({
        storyId: row.storyId,
        threadId,
        chapterId: ch1.id,
        genCtx: { prompt, estimatedChapters: row.estimatedChapters },
      }),
    );
  } catch (err) {
    console.error(`[threads] retry first-chapter enqueue failed thread=${threadId}`, err);
    await db.update(chapters).set({ status: 'failed' }).where(eq(chapters.id, ch1.id));
    return c.json({ error: 'generation enqueue failed' }, 503);
  }

  return c.json({ ok: true });
});

threadsRouter.post('/:id/choose', async (c) => {
  const userId = c.get('userId');
  const threadId = c.req.param('id');
  const { chapterNumber, choiceIndex, customInput } = await c.req.json();

  if (typeof chapterNumber !== 'number') return c.json({ error: 'chapterNumber required' }, 400);
  const hasChoice = typeof choiceIndex === 'number';
  const hasCustom = typeof customInput === 'string' && customInput.trim().length > 0;
  if (!hasChoice && !hasCustom) return c.json({ error: 'choiceIndex or customInput required' }, 400);

  const db = makeDb(c.env.DATABASE_URL);

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

  if (!threadRow) return c.json({ error: 'Not found' }, 404);

  // Detect retry
  let isRetry = false;
  if (threadRow.currentChapter !== chapterNumber) {
    if (threadRow.currentChapter === chapterNumber + 1) {
      const [maybeFailed] = await db
        .select({ status: chapters.status })
        .from(chapters)
        .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, chapterNumber + 1)));
      if (maybeFailed?.status === 'failed') isRetry = true;
    }
    if (!isRetry) return c.json({ error: 'Chapter mismatch' }, 409);
  }

  const allPrevChapters = await db
    .select({ chapterNumber: chapters.chapterNumber, options: chapters.options, content: chapters.content, summary: chapters.summary })
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), lte(chapters.chapterNumber, chapterNumber)))
    .orderBy(asc(chapters.chapterNumber));

  const { current: currentChapter, previousChaptersSummaries } = buildChapterContext(
    allPrevChapters as PrevChapterRow[],
    chapterNumber,
  );

  let chosenText: string;
  let ivRecord: typeof interventions.$inferSelect;

  if (hasCustom) {
    chosenText = customInput.trim();
    const [iv] = await db.insert(interventions).values({ threadId, chapterNumber, type: 'free_input', freeText: chosenText }).returning();
    ivRecord = iv;
  } else {
    const opts = (currentChapter?.options as { index: number; text: string }[] | null) ?? [];
    chosenText = opts.find(o => o.index === choiceIndex)?.text ?? '';
    const [iv] = await db.insert(interventions).values({ threadId, chapterNumber, type: 'choice', choiceIndex }).returning();
    ivRecord = iv;
  }

  const nextChapterNumber = chapterNumber + 1;
  const answers = threadRow.setupAnswers as { prompt?: string };
  const genCtx = {
    threadId,
    prompt: answers.prompt ?? '',
    estimatedChapters: threadRow.estimatedChapters,
    previousChapterNumber: chapterNumber,
    previousChapterContent: currentChapter?.content ?? '',
    previousChaptersSummaries,
    chosenOption: chosenText,
    nextChapterNumber,
  };

  if (isRetry) {
    const [resetChapter] = await db
      .update(chapters)
      .set({ status: 'generating', content: null, title: null, options: null, situation: null, question: null, summary: null })
      .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, nextChapterNumber)))
      .returning();

    try {
      await enqueueStoryGenerationJob(
        c.env.STORY_GENERATION_QUEUE,
        createNextChapterGenerationJob({ chapterId: resetChapter.id, genCtx }),
      );
    } catch (err) {
      console.error(`[threads] retry generation enqueue failed thread=${threadId} chapter=${nextChapterNumber}`, err);
      await db.update(chapters).set({ status: 'failed' }).where(eq(chapters.id, resetChapter.id));
      return c.json({ error: 'generation enqueue failed' }, 503);
    }

    const [currentThread] = await db
      .select({ currentChapter: threads.currentChapter, progress: threads.progress, status: threads.status })
      .from(threads).where(eq(threads.id, threadId));

    return c.json({ chapter: resetChapter, thread: currentThread, intervention: ivRecord });
  }

  const isLast = nextChapterNumber > threadRow.estimatedChapters;

  if (!isRetry && !isLast) {
    const [userRow] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    if (!userRow || userRow.credits <= 0) return c.json({ error: 'insufficient_credits' }, 402);
    await db.update(users).set({ credits: sql`${users.credits} - 1` }).where(eq(users.id, userId));
  }

  const newProgress = Math.min((nextChapterNumber - 1) / threadRow.estimatedChapters, 1).toFixed(3);
  const newStatus = isLast ? 'completed' : 'active';

  const [updatedThread] = await db
    .update(threads)
    .set({ currentChapter: nextChapterNumber, progress: newProgress, lastReadAt: new Date(), status: newStatus, ...(newStatus === 'completed' ? { finishedAt: new Date() } : {}) })
    .where(eq(threads.id, threadId))
    .returning({ currentChapter: threads.currentChapter, progress: threads.progress, status: threads.status });

  if (isLast) return c.json({ chapter: null, thread: updatedThread, intervention: ivRecord });

  const [existing] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.threadId, threadId), eq(chapters.chapterNumber, nextChapterNumber)));

  if (existing) return c.json({ chapter: existing, thread: updatedThread, intervention: ivRecord });

  const [pendingChapter] = await db
    .insert(chapters)
    .values({ threadId, chapterNumber: nextChapterNumber, title: null, content: null, status: 'generating', options: null })
    .returning();

  try {
    await enqueueStoryGenerationJob(
      c.env.STORY_GENERATION_QUEUE,
      createNextChapterGenerationJob({ chapterId: pendingChapter.id, genCtx }),
    );
  } catch (err) {
    console.error(`[threads] generation enqueue failed thread=${threadId} chapter=${nextChapterNumber}`, err);
    await Promise.all([
      db.update(chapters).set({ status: 'failed' }).where(eq(chapters.id, pendingChapter.id)),
      db.update(users).set({ credits: sql`${users.credits} + 1` }).where(eq(users.id, userId)),
    ]);
    return c.json({ error: 'generation enqueue failed' }, 503);
  }

  return c.json({ chapter: pendingChapter, thread: updatedThread, intervention: ivRecord });
});
