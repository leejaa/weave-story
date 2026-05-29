import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { stories, threads, chapters, users } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { checkPromptSpecificity } from '../lib/ai/prompt-check';
import { createFirstChapterGenerationJob } from '../lib/queue/story-generation-jobs';
import { enqueueStoryGenerationJob } from '../lib/queue/story-generation-queue';
import type { AppEnv } from '../types';

export const storiesRouter = new Hono<AppEnv>();

storiesRouter.use(requireAuth);

storiesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  const rows = await db.select().from(stories).where(eq(stories.userId, userId)).orderBy(asc(stories.createdAt));
  return c.json(rows);
});

storiesRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const prompt = body?.prompt as string | undefined;
  const estimatedChapters = typeof body?.estimatedChapters === 'number' ? body.estimatedChapters : 10;
  if (!prompt?.trim()) return c.json({ error: 'prompt required' }, 400);

  const db = makeDb(c.env.DATABASE_URL);

  const [userRow] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
  if (!userRow || userRow.credits <= 0) return c.json({ error: 'insufficient_credits' }, 402);
  await db.update(users).set({ credits: sql`${users.credits} - 1` }).where(eq(users.id, userId));

  const [story] = await db.insert(stories)
    .values({ userId, setupAnswers: { prompt: prompt.trim() }, estimatedChapters, status: 'generating' })
    .returning();

  const [thread] = await db.insert(threads).values({ userId, storyId: story.id }).returning();

  const [pendingChapter] = await db.insert(chapters)
    .values({ threadId: thread.id, chapterNumber: 1, status: 'generating', content: null })
    .returning();

  const generationJob = createFirstChapterGenerationJob({
    storyId: story.id,
    threadId: thread.id,
    chapterId: pendingChapter.id,
    genCtx: { prompt: prompt.trim(), estimatedChapters },
  });

  try {
    await enqueueStoryGenerationJob(c.env.STORY_GENERATION_QUEUE, generationJob);
  } catch (err) {
    console.error(`[stories] generation enqueue failed story=${story.id} thread=${thread.id}`, err);
    await Promise.all([
      db.update(chapters).set({ status: 'failed' }).where(eq(chapters.id, pendingChapter.id)),
      db.update(stories).set({ status: 'failed' }).where(eq(stories.id, story.id)),
      db.update(users).set({ credits: sql`${users.credits} + 1` }).where(eq(users.id, userId)),
    ]);
    return c.json({ error: 'generation enqueue failed' }, 503);
  }

  return c.json({ threadId: thread.id }, 201);
});

storiesRouter.post('/check-prompt', async (c) => {
  const body = await c.req.json();
  const prompt = body?.prompt as string | undefined;
  if (!prompt?.trim()) return c.json({ error: 'prompt required' }, 400);

  const result = await checkPromptSpecificity(prompt.trim(), c.env.AI_GATEWAY_API_KEY);
  return c.json(result);
});
