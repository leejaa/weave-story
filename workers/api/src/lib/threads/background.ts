import { and, eq } from 'drizzle-orm';
import { chapters, stories, threads } from '../schema';
import { updateStoryState } from '../ai/story-generation';
import type { ContinuationContext, SetupContext } from '../ai/story-generation';
import type { DB } from '../db';
import { sendChapterReadyPush } from '../push';
import { loadStoryBible } from '../story-harness/memory/load-story-bible';
import { judgeChapter } from '../story-harness/quality/judge-chapter';
import { runFirstChapterHarness } from '../story-harness/pipeline/run-first-chapter-harness';
import { runNextChapterHarness } from '../story-harness/pipeline/run-next-chapter-harness';

type GenerateNextParams = {
  chapterId: string;
  genCtx: ContinuationContext;
  db: DB;
  apiKey: string;
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
};

/**
 * Runs inside the story-generation queue consumer.
 * Throws generation errors so Cloudflare Queues can retry the job.
 */
export async function generateNextChapterBackground({ chapterId, genCtx, db, apiKey }: GenerateNextParams): Promise<void> {
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

  // 구조적 진행 상태(story_state) 갱신 — 손실 recap을 대체. 캐논 모순 방지 + 떡밥/인물/직전결과 추적.
  try {
    const newState = await updateStoryState({
      prevState: genCtx.storyState ?? null,
      chapterContent: generated.content,
      chosenOption: genCtx.chosenOption,
      canon: genCtx.canon ?? null,
      chapterNumber: nextChapterNumber,
      estimatedChapters: genCtx.estimatedChapters,
      threadId,
      apiKey,
      language: genCtx.language,
    });
    if (threadId !== '?') {
      await db.update(threads).set({ storyState: newState }).where(eq(threads.id, threadId));
    }
    console.log(`${tag} state saved elapsed=${Date.now() - startMs}ms`);
  } catch (err) {
    console.error(`${tag} state failed non_critical elapsed=${Date.now() - startMs}ms`, err);
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

  // 의미적 품질 심사(측정, 비치명적) — chapter_judgements 저장. 챕터는 이미 저장·노출된 뒤라 사용자 영향 없음.
  if (threadId !== '?') {
    try {
      const [st] = await db.select({ storyId: threads.storyId }).from(threads).where(eq(threads.id, threadId));
      if (st) {
        const bible = await loadStoryBible(db, st.storyId);
        await judgeChapter({
          db, apiKey, storyId: st.storyId, threadId, chapterId,
          chapterNumber: nextChapterNumber,
          mode: bible?.outline ? 'outline' : 'legacy',
          language: genCtx.language,
          outline: bible?.outline ?? null,
          content: generated.content,
          chosenOption: genCtx.chosenOption,
        });
      }
    } catch (err) {
      console.error(`${tag} judge failed non_critical`, err);
    }
  }
}

/**
 * Runs inside the story-generation queue consumer.
 * Throws generation errors so Cloudflare Queues can retry the job.
 */
export async function generateFirstChapterBackground({
  storyId, threadId, chapterId, genCtx, db, apiKey, coverWorkerUrl, coverWorkerApiKey,
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

  // 초기 구조적 상태(story_state) 생성 — 1챕터 본문 + 캐논 기반. 이후 챕터마다 갱신.
  try {
    const bible = await loadStoryBible(db, storyId);
    const newState = await updateStoryState({
      prevState: null,
      chapterContent: generated.content,
      chosenOption: null,
      canon: bible?.canon ?? null,
      chapterNumber: 1,
      estimatedChapters: genCtx.estimatedChapters,
      threadId,
      apiKey,
      language: genCtx.language,
    });
    await db.update(threads).set({ storyState: newState }).where(eq(threads.id, threadId));
    console.log(`${tag} state saved elapsed=${Date.now() - startMs}ms`);
  } catch (err) {
    console.error(`${tag} state failed non_critical elapsed=${Date.now() - startMs}ms`, err);
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

  // 의미적 품질 심사(측정, 비치명적).
  try {
    const bible = await loadStoryBible(db, storyId);
    await judgeChapter({
      db, apiKey, storyId, threadId, chapterId,
      chapterNumber: 1,
      mode: bible?.outline ? 'outline' : 'legacy',
      language: genCtx.language,
      outline: bible?.outline ?? null,
      content: generated.content,
      chosenOption: null,
    });
  } catch (err) {
    console.error(`${tag} judge failed non_critical`, err);
  }
}
