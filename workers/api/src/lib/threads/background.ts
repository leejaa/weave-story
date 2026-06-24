import { and, eq } from 'drizzle-orm';
import { chapters, stories, threads } from '../schema';
import type { ContinuationContext, SetupContext } from '../ai/story-generation';
import type { DB } from '../db';
import { sendChapterReadyPush } from '../push';
import { runFirstChapterHarness } from '../story-harness/pipeline/run-first-chapter-harness';
import { runNextChapterHarness } from '../story-harness/pipeline/run-next-chapter-harness';
import { enqueueStoryGenerationJob } from '../queue/story-generation-queue';
import { createJudgeChapterJob, createUpdateStateJob, type StoryGenerationJob } from '../queue/story-generation-jobs';

type GenerateNextParams = {
  chapterId: string;
  genCtx: ContinuationContext;
  db: DB;
  apiKey: string;
  queue: Queue<StoryGenerationJob>;
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
  queue: Queue<StoryGenerationJob>;
};

/**
 * Runs inside the story-generation queue consumer.
 * Throws generation errors so Cloudflare Queues can retry the job.
 */
export async function generateNextChapterBackground({ chapterId, genCtx, db, apiKey, queue }: GenerateNextParams): Promise<void> {
  const { threadId = '?', nextChapterNumber } = genCtx;
  const tag = `[bg] thread=${threadId} chapter=${nextChapterNumber}`;
  const startMs = Date.now();

  const generated = await runNextChapterHarness({ chapterId, genCtx, db, apiKey });

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

  // 저장 이후의 후처리는 전부 '빠른' 작업(푸시 + enqueue)만 둔다 — 긴 LLM 후처리를 생성
  // 호출 꼬리에 두면 호출 수명 한계에서 잘려 누락되므로, 심사·상태갱신은 독립 큐 잡으로 위임한다.
  if (threadId !== '?') {
    // 1) 사용자 알림을 가장 먼저(가장 빠르고, 더는 상태갱신 LLM 뒤에서 지연되지 않음).
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

    // 2) 품질 심사 잡 enqueue(비치명적).
    try {
      await enqueueStoryGenerationJob(queue, createJudgeChapterJob({
        threadId,
        chapterId,
        chapterNumber: nextChapterNumber,
        language: genCtx.language,
        chosenOption: genCtx.chosenOption ?? null,
      }));
    } catch (err) {
      console.error(`${tag} judge enqueue failed non_critical`, err);
    }

    // 3) 구조적 진행 상태(story_state) 갱신 잡 enqueue. prevState는 '이 화 이전' 스냅샷이라 멱등.
    try {
      await enqueueStoryGenerationJob(queue, createUpdateStateJob({
        threadId,
        chapterId,
        chapterNumber: nextChapterNumber,
        estimatedChapters: genCtx.estimatedChapters,
        language: genCtx.language,
        chosenOption: genCtx.chosenOption ?? null,
        prevState: genCtx.storyState ?? null,
      }));
    } catch (err) {
      console.error(`${tag} state enqueue failed non_critical`, err);
    }
  }
}

/**
 * Runs inside the story-generation queue consumer.
 * Throws generation errors so Cloudflare Queues can retry the job.
 */
export async function generateFirstChapterBackground({
  storyId, threadId, chapterId, genCtx, db, apiKey, coverWorkerUrl, coverWorkerApiKey, queue,
}: GenerateFirstParams): Promise<void> {
  const tag = `[bg] story=${storyId}`;
  const startMs = Date.now();

  const generated = await runFirstChapterHarness({ storyId, threadId, chapterId, genCtx, db, apiKey });

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

  // 저장 이후는 전부 '빠른' 작업(푸시 + enqueue + 커버요청)만 둔다 — 긴 LLM 후처리(상태 생성)는
  // 독립 큐 잡으로 위임해 생성 호출 꼬리 절단의 영향을 받지 않게 한다.

  // 1) 사용자 알림을 가장 먼저.
  try {
    const [s] = await db.select({ userId: stories.userId }).from(stories).where(eq(stories.id, storyId));
    if (s) {
      await sendChapterReadyPush({ db, userId: s.userId, threadId, storyTitle: generated.title, language: genCtx.language, kind: 'first' });
    }
  } catch (err) {
    console.error(`${tag} push failed non_critical`, err);
  }

  // 2) 품질 심사 잡 enqueue(비치명적).
  try {
    await enqueueStoryGenerationJob(queue, createJudgeChapterJob({
      threadId,
      chapterId,
      chapterNumber: 1,
      language: genCtx.language,
      chosenOption: null,
    }));
  } catch (err) {
    console.error(`${tag} judge enqueue failed non_critical`, err);
  }

  // 3) 초기 구조적 상태(story_state) 생성 잡 enqueue(1화는 prevState=null).
  try {
    await enqueueStoryGenerationJob(queue, createUpdateStateJob({
      threadId,
      chapterId,
      chapterNumber: 1,
      estimatedChapters: genCtx.estimatedChapters,
      language: genCtx.language,
      chosenOption: null,
      prevState: null,
    }));
  } catch (err) {
    console.error(`${tag} state enqueue failed non_critical`, err);
  }

  // 4) 커버 이미지 — non-critical(커버 워커로 요청 전송, LLM 아님).
  try {
    await fetch(coverWorkerUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${coverWorkerApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, title: generated.title, genre: generated.genre, prompt: genCtx.prompt }),
    });
  } catch (err) {
    console.error(`${tag} cover enqueue failed non_critical elapsed=${Date.now() - startMs}ms`, err);
  }
}
