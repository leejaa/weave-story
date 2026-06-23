import { and, eq } from 'drizzle-orm';
import { makeDb } from '../db';
import { chapters, stories, users } from '../schema';
import { generateFirstChapterBackground, generateNextChapterBackground } from '../threads/background';
import { notifyOwner } from '../notify/owner';
import { moderateChapterContent } from '../moderation/classify';
import { hideChapter } from '../moderation/enforce';
import { sendTossChapterReadyPush } from '../notify/toss-push';
import { logError } from '../observability/logger';
import { alertServerError } from '../observability/alert';
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

// 생성 직후 안전성 분류 — 정책 위반이면 자동 숨김 + 운영자 알림(best-effort).
// 분류기 오류는 fail-open(콘텐츠는 노출)하되 생성 흐름을 막지 않는다.
// 생성 직후 안전성 분류 — 정책 위반이면 자동 숨김. 숨겼으면 true 반환(푸시 차단용).
async function moderateGeneratedChapter(
  job: StoryGenerationJob,
  env: WorkerEnv,
  db: ReturnType<typeof makeDb>,
): Promise<boolean> {
  try {
    const [row] = await db
      .select({ content: chapters.content, title: chapters.title })
      .from(chapters)
      .where(eq(chapters.id, job.chapterId))
      .limit(1);
    if (!row?.content) return false;

    const verdict = await moderateChapterContent(row.content, env.AI_GATEWAY_API_KEY);
    if (verdict.action === 'hide') {
      await hideChapter(env, db, job.chapterId, {
        source: 'generation',
        detail: `title: ${row.title ?? '-'}\ncategories: ${verdict.categories.join(', ') || '-'}\nreason: ${verdict.reason || '-'}`,
      });
      console.warn(`${getJobTag(job)} moderation_hidden categories=${verdict.categories.join(',')}`);
      return true;
    }
  } catch (err) {
    // 모더레이션 실패가 챕터 생성을 실패로 만들지 않도록 흡수한다.
    console.error(`${getJobTag(job)} moderation_error`, err);
  }
  return false;
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
    });

    // 운영자 알림 — 첫 챕터 완성(best-effort). 여기 도달 = 생성 성공.
    try {
      const [row] = await db
        .select({ title: stories.title, status: stories.status, email: users.email, name: users.name })
        .from(stories)
        .innerJoin(users, eq(stories.userId, users.id))
        .where(eq(stories.id, job.storyId));
      if (row && row.status === 'ready') {
        await notifyOwner(env, `✨ 첫 챕터 완성\nuser: ${row.email ?? row.name ?? '-'}\ntitle: ${row.title ?? '-'}`);
      }
    } catch (err) {
      console.error('[notify] first-chapter failed', err);
    }

    const hiddenFirst = await moderateGeneratedChapter(job, env, db);
    // 토스 유저 푸시(기능성 메시지) — 숨김 처리 안 됐을 때만. Expo/FCM 푸시는 background에서 별도 발송.
    if (!hiddenFirst) await sendTossChapterReadyPush(env, db, { threadId: job.threadId });
    return;
  }

  await generateNextChapterBackground({
    chapterId: job.chapterId,
    genCtx: job.genCtx,
    db,
    apiKey: env.AI_GATEWAY_API_KEY,
  });

  const hiddenNext = await moderateGeneratedChapter(job, env, db);
  if (!hiddenNext && job.genCtx.threadId) {
    await sendTossChapterReadyPush(env, db, { threadId: job.genCtx.threadId });
  }
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

      const errorName = err instanceof Error ? err.name : 'Error';
      const terminalLogCtx = {
        type: job.type,
        chapterId: job.chapterId,
        storyId: job.type === 'first-chapter' ? job.storyId : undefined,
        attempts: message.attempts,
      };

      if (err instanceof NonRetryableStoryGenerationError) {
        await markJobFailed(job, env);
        message.ack();
        console.warn(`${tag} ack non_retryable`);
        logError(err, { event: 'queue_job_failed', requestId: job.jobId, durationMs: elapsed, extra: { reason: 'non_retryable', ...terminalLogCtx } });
        await alertServerError(env, { source: 'queue', requestId: job.jobId, path: `story-generation/${job.type}`, errorName });
        continue;
      }

      if (message.attempts >= MAX_DELIVERY_ATTEMPTS) {
        await markJobFailed(job, env);
        message.ack();
        console.error(`${tag} final_failed attempts=${message.attempts}`, error);
        logError(err, { event: 'queue_job_failed', requestId: job.jobId, durationMs: elapsed, extra: { reason: 'max_attempts', ...terminalLogCtx } });
        await alertServerError(env, { source: 'queue', requestId: job.jobId, path: `story-generation/${job.type}`, errorName });
        continue;
      }

      const delaySeconds = getRetryDelaySeconds(message.attempts);
      message.retry({ delaySeconds });
      console.warn(`${tag} retry scheduled delay=${delaySeconds}s next_attempt=${message.attempts + 1}`);
    }
  }
}
