import { and, eq } from 'drizzle-orm';
import { chapters, stories, threads } from '../schema';
import { generateNextChapter, generateChapterSummary, generateFirstChapter } from '../ai/story-generation';
import type { ContinuationContext, SetupContext } from '../ai/story-generation';
import type { DB } from '../db';
import { sendChapterReadyPush } from '../push';
import { runFirstChapterHarness } from '../story-harness/pipeline/run-first-chapter-harness';
import { runNextChapterHarness } from '../story-harness/pipeline/run-next-chapter-harness';

type GenerateNextParams = {
  chapterId: string;
  genCtx: ContinuationContext;
  db: DB;
  apiKey: string;
  useHarness?: boolean;
};

type GenerateFirstParams = {
  storyId: string;
  threadId: string;
  chapterId: string;
  genCtx: SetupContext;
  db: DB;
  apiKey: string;
  coverWorkerUrl: string;
  coverWorkerApiKey: string;
  useHarness?: boolean;
};

/**
 * Runs inside the story-generation queue consumer.
 * Throws generation errors so Cloudflare Queues can retry the job.
 */
export async function generateNextChapterBackground({ chapterId, genCtx, db, apiKey, useHarness = true }: GenerateNextParams): Promise<void> {
  const { threadId = '?', nextChapterNumber } = genCtx;
  const tag = `[bg] thread=${threadId} chapter=${nextChapterNumber}`;
  const startMs = Date.now();

  const generated = useHarness
    ? await runNextChapterHarness({ chapterId, genCtx, db, apiKey })
    : await generateNextChapter(genCtx, apiKey);

  const [saved] = await db.update(chapters).set({
    title: generated.chapterTitle,
    content: generated.content,
    situation: generated.situation || null,
    question: generated.question || null,
    status: 'ready',
    options: generated.choices.length > 0
      ? generated.choices.map((text, index) => ({ index, text }))
      : null,
  })
    .where(and(eq(chapters.id, chapterId), eq(chapters.status, 'generating')))
    .returning({ id: chapters.id });

  if (!saved) {
    console.warn(`${tag} skip save chapterId=${chapterId} status_changed elapsed=${Date.now() - startMs}ms`);
    return;
  }

  console.log(`${tag} chapter saved elapsed=${Date.now() - startMs}ms`);

  try {
    const summary = await generateChapterSummary(generated.content, nextChapterNumber, threadId, apiKey, genCtx.language);
    await db.update(chapters).set({ summary }).where(eq(chapters.id, chapterId));
    console.log(`${tag} summary saved elapsed=${Date.now() - startMs}ms`);
  } catch (err) {
    console.error(`${tag} summary failed non_critical elapsed=${Date.now() - startMs}ms`, err);
  }

  // Notify the user (best-effort) that the next chapter is ready.
  if (threadId !== '?') {
    try {
      const [row] = await db
        .select({ userId: threads.userId, title: stories.title })
        .from(threads)
        .innerJoin(stories, eq(threads.storyId, stories.id))
        .where(eq(threads.id, threadId));
      if (row) {
        await sendChapterReadyPush({ db, userId: row.userId, threadId, storyTitle: row.title, language: genCtx.language, kind: 'next' });
      }
    } catch (err) {
      console.error(`${tag} push failed non_critical`, err);
    }
  }
}

/**
 * Runs inside the story-generation queue consumer.
 * Throws generation errors so Cloudflare Queues can retry the job.
 */
export async function generateFirstChapterBackground({
  storyId, threadId, chapterId, genCtx, db, apiKey, coverWorkerUrl, coverWorkerApiKey, useHarness = true,
}: GenerateFirstParams): Promise<void> {
  const tag = `[bg] story=${storyId}`;
  const startMs = Date.now();

  const generated = useHarness
    ? await runFirstChapterHarness({ storyId, threadId, chapterId, genCtx, db, apiKey })
    : await generateFirstChapter(genCtx, apiKey);

  const [saved] = await db.update(chapters).set({
      title: generated.chapterTitle,
      content: generated.content,
      situation: generated.situation,
      question: generated.question,
      options: generated.choices.map((text, index) => ({ index, text })),
      status: 'ready',
    })
    .where(and(eq(chapters.id, chapterId), eq(chapters.status, 'generating')))
    .returning({ id: chapters.id });

  if (!saved) {
    console.warn(`${tag} skip save chapterId=${chapterId} status_changed elapsed=${Date.now() - startMs}ms`);
  }

  await db.update(stories)
    .set({ title: generated.title, genre: generated.genre, status: 'ready' })
    .where(and(eq(stories.id, storyId), eq(stories.status, 'generating')));

  console.log(`${tag} done title="${generated.title}" elapsed=${Date.now() - startMs}ms`);

  try {
    const summary = await generateChapterSummary(generated.content, 1, threadId, apiKey, genCtx.language);
    await db.update(chapters).set({ summary }).where(eq(chapters.id, chapterId));
    console.log(`${tag} summary saved elapsed=${Date.now() - startMs}ms`);
  } catch (err) {
    console.error(`${tag} summary failed non_critical elapsed=${Date.now() - startMs}ms`, err);
  }

  // Cover image — non-critical
  try {
    await fetch(coverWorkerUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${coverWorkerApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, title: generated.title, genre: generated.genre, prompt: genCtx.prompt }),
    });
  } catch (err) {
    console.error(`${tag} cover enqueue failed non_critical elapsed=${Date.now() - startMs}ms`, err);
  }

  // Notify the user (best-effort) that their story's first chapter is ready.
  try {
    const [s] = await db.select({ userId: stories.userId }).from(stories).where(eq(stories.id, storyId));
    if (s) {
      await sendChapterReadyPush({ db, userId: s.userId, threadId, storyTitle: generated.title, language: genCtx.language, kind: 'first' });
    }
  } catch (err) {
    console.error(`${tag} push failed non_critical`, err);
  }
}
