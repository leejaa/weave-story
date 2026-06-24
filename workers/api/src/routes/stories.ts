import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { stories, threads, chapters, users } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { checkPromptSpecificity } from '../lib/ai/prompt-check';
import { normalizeStoryLang, detectPromptLanguage, languageToHarnessLang } from '../lib/ai/story-lang';
import { createFirstChapterGenerationJob } from '../lib/queue/story-generation-jobs';
import { enqueueStoryGenerationJob } from '../lib/queue/story-generation-queue';
import { notifyOwner } from '../lib/notify/owner';
import { rateLimit } from '../lib/middleware/rate-limit';
import type { AppEnv } from '../types';

export const storiesRouter = new Hono<AppEnv>();

storiesRouter.use(requireAuth);

// AI 생성·검사 엔드포인트 레이트 리밋(userId 키). requireAuth 이후라 userId 보장.
const genLimit = rateLimit((e) => e.GEN_RATE_LIMITER, (c) => c.get('userId'));

storiesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  const rows = await db.select().from(stories).where(eq(stories.userId, userId)).orderBy(asc(stories.createdAt));
  return c.json(rows);
});

storiesRouter.post('/', genLimit, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const prompt = body?.prompt as string | undefined;
  const hintGenre = (body?.hintGenre as string | undefined)?.trim().slice(0, 40) || undefined;
  // Chapter count is server-authoritative: the client-sent value is intentionally ignored so
  // story length can be tuned from the worker alone (appintoss would otherwise need a store
  // review per change). Override via STORY_CHAPTER_COUNT; defaults to a standard one-volume book.
  const envChapterCount = Number(c.env.STORY_CHAPTER_COUNT);
  // Phase B(아웃라인): 사전 저작 비트 시트는 짧을수록 비트가 탄탄해 완결·응집이 좋아 기본 12화.
  const estimatedChapters = Math.min(50, Math.max(1,
    Number.isFinite(envChapterCount) && envChapterCount > 0 ? Math.floor(envChapterCount) : 12));
  const detectedLang = detectPromptLanguage(prompt ?? '');
  const language = languageToHarnessLang(detectedLang);
  const outputLanguage = detectedLang !== language ? detectedLang : undefined;
  if (!prompt?.trim()) return c.json({ error: 'prompt required' }, 400);
  if (prompt.trim().length > 2000) return c.json({ error: 'prompt too long' }, 400); // 입력 검증: 길이 제한


  const db = makeDb(c.env.DATABASE_URL);

  const [userRow] = await db.select({ credits: users.credits, email: users.email, name: users.name }).from(users).where(eq(users.id, userId));
  if (!userRow || userRow.credits <= 0) return c.json({ error: 'insufficient_credits' }, 402);
  await db.update(users).set({ credits: sql`${users.credits} - 1` }).where(eq(users.id, userId));

  const [story] = await db.insert(stories)
    .values({ userId, setupAnswers: { prompt: prompt.trim(), ...(hintGenre ? { hintGenre } : {}) }, estimatedChapters, language, status: 'generating' })
    .returning();

  const who = userRow.email ?? userRow.name ?? userId;
  const promptPreview = prompt.trim().slice(0, 120);
  c.executionCtx.waitUntil(notifyOwner(c.env, `📖 새 이야기 생성\nuser: ${who}\nlang: ${language}${outputLanguage ? ` → output: ${outputLanguage}` : ''}\nprompt: ${promptPreview}`));

  const [thread] = await db.insert(threads).values({ userId, storyId: story.id }).returning();

  const [pendingChapter] = await db.insert(chapters)
    .values({ threadId: thread.id, chapterNumber: 1, status: 'generating', content: null })
    .returning();

  const generationJob = createFirstChapterGenerationJob({
    storyId: story.id,
    threadId: thread.id,
    chapterId: pendingChapter.id,
    genCtx: { prompt: prompt.trim(), estimatedChapters, language, outputLanguage, hintGenre },
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

storiesRouter.post('/check-prompt', genLimit, async (c) => {
  const body = await c.req.json();
  const prompt = body?.prompt as string | undefined;
  if (!prompt?.trim()) return c.json({ error: 'prompt required' }, 400);
  if (prompt.trim().length > 2000) return c.json({ error: 'prompt too long' }, 400);

  const result = await checkPromptSpecificity(prompt.trim(), c.env.AI_GATEWAY_API_KEY, normalizeStoryLang(body?.language));
  return c.json(result);
});
