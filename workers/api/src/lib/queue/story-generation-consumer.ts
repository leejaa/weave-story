import { and, eq } from 'drizzle-orm';
import { makeDb } from '../db';
import { chapters, stories } from '../schema';
import { generateFirstChapterBackground, generateNextChapterBackground } from '../threads/background';
import type { WorkerEnv } from '../../types';
import type { StoryGenerationJob } from './story-generation-jobs';
import { NonRetryableStoryGenerationError } from '../story-harness/errors';

const MAX_DELIVERY_ATTEMPTS = 4;

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

function getRetryDelaySeconds(attempts: number): number {
  return Math.min(15 * 2 ** Math.max(attempts - 1, 0), 120);
}

function getJobTag(job: StoryGenerationJob): string {
  const threadPart = job.type === 'first-chapter'
    ? ` thread=${job.threadId}`
    : ` thread=${job.genCtx.threadId ?? '?'}`;
  const chapterPart = job.type === 'first-chapter'
    ? ' chapter=1'
    : ` chapter=${job.genCtx.nextChapterNumber}`;
  return `[story-generation] type=${job.type} job=${job.jobId}${threadPart}${chapterPart} chapterId=${job.chapterId}`;
}

async function assertJobCanRun(job: StoryGenerationJob, db: ReturnType<typeof makeDb>): Promise<boolean> {
  const [chapter] = await db
    .select({ status: chapters.status })
    .from(chapters)
    .where(eq(chapters.id, job.chapterId))
    .limit(1);

  if (!chapter) {
    throw new NonRetryableStoryGenerationError(`chapter not found: ${job.chapterId}`);
  }

  if (chapter.status === 'ready') {
    console.log(`${getJobTag(job)} skip status=ready`);
    return false;
  }

  if (chapter.status === 'failed') {
    console.log(`${getJobTag(job)} skip status=failed`);
    return false;
  }

  if (job.type === 'first-chapter') {
    const [story] = await db
      .select({ status: stories.status })
      .from(stories)
      .where(eq(stories.id, job.storyId))
      .limit(1);

    if (!story) {
      throw new NonRetryableStoryGenerationError(`story not found: ${job.storyId}`);
    }

    if (chapter.status === 'ready' && (story.status === 'ready' || story.status === 'completed')) {
      console.log(`${getJobTag(job)} skip story_status=${story.status} chapter_status=ready`);
      return false;
    }

    if (story.status === 'failed') {
      console.log(`${getJobTag(job)} skip story_status=failed`);
      return false;
    }
  }

  return true;
}

async function markJobFailed(job: StoryGenerationJob, env: WorkerEnv): Promise<void> {
  const db = makeDb(env.DATABASE_URL);

  await db
    .update(chapters)
    .set({ status: 'failed' })
    .where(and(eq(chapters.id, job.chapterId), eq(chapters.status, 'generating')));

  if (job.type === 'first-chapter') {
    await db
      .update(stories)
      .set({ status: 'failed' })
      .where(and(eq(stories.id, job.storyId), eq(stories.status, 'generating')));
  }
}

async function processStoryGenerationJob(job: StoryGenerationJob, env: WorkerEnv): Promise<void> {
  const db = makeDb(env.DATABASE_URL);
  const shouldRun = await assertJobCanRun(job, db);
  if (!shouldRun) return;

  if (job.type === 'first-chapter') {
    await generateFirstChapterBackground({
      storyId: job.storyId,
      threadId: job.threadId,
      chapterId: job.chapterId,
      genCtx: job.genCtx,
      db,
      apiKey: env.AI_GATEWAY_API_KEY,
      coverWorkerUrl: env.CF_COVER_WORKER_URL,
      coverWorkerApiKey: env.AI_GATEWAY_API_KEY,
      useHarness: env.USE_STORY_HARNESS !== 'false',
    });
    return;
  }

  await generateNextChapterBackground({
    chapterId: job.chapterId,
    genCtx: job.genCtx,
    db,
    apiKey: env.AI_GATEWAY_API_KEY,
    useHarness: env.USE_STORY_HARNESS !== 'false',
  });
}

export async function handleStoryGenerationQueue(
  batch: MessageBatch<StoryGenerationJob>,
  env: WorkerEnv,
): Promise<void> {
  for (const message of batch.messages) {
    const job = message.body;
    const tag = getJobTag(job);
    const startMs = Date.now();

    console.log(`${tag} start attempt=${message.attempts}/${MAX_DELIVERY_ATTEMPTS}`);

    try {
      await processStoryGenerationJob(job, env);
      message.ack();
      console.log(`${tag} ack elapsed=${Date.now() - startMs}ms`);
    } catch (err) {
      const elapsed = Date.now() - startMs;
      const error = serializeError(err);
      console.error(`${tag} error attempt=${message.attempts} elapsed=${elapsed}ms`, error);

      if (err instanceof NonRetryableStoryGenerationError) {
        await markJobFailed(job, env);
        message.ack();
        console.warn(`${tag} ack non_retryable`);
        continue;
      }

      if (message.attempts >= MAX_DELIVERY_ATTEMPTS) {
        await markJobFailed(job, env);
        message.ack();
        console.error(`${tag} final_failed attempts=${message.attempts}`, error);
        continue;
      }

      const delaySeconds = getRetryDelaySeconds(message.attempts);
      message.retry({ delaySeconds });
      console.warn(`${tag} retry scheduled delay=${delaySeconds}s next_attempt=${message.attempts + 1}`);
    }
  }
}
