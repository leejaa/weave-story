import { Hono } from 'hono';
import { eq, desc, ne, and, lte, asc } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { threads, stories, chapters, interventions } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { buildChapterContext, type PrevChapterRow } from '../lib/threads/chapter-context';
import { generateNextChapterBackground } from '../lib/threads/background';
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

    c.executionCtx.waitUntil(generateNextChapterBackground({ chapterId: resetChapter.id, genCtx, db, apiKey: c.env.AI_GATEWAY_API_KEY }));

    const [currentThread] = await db
      .select({ currentChapter: threads.currentChapter, progress: threads.progress, status: threads.status })
      .from(threads).where(eq(threads.id, threadId));

    return c.json({ chapter: resetChapter, thread: currentThread, intervention: ivRecord });
  }

  const isLast = nextChapterNumber > threadRow.estimatedChapters;
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

  c.executionCtx.waitUntil(generateNextChapterBackground({ chapterId: pendingChapter.id, genCtx, db, apiKey: c.env.AI_GATEWAY_API_KEY }));

  return c.json({ chapter: pendingChapter, thread: updatedThread, intervention: ivRecord });
});
