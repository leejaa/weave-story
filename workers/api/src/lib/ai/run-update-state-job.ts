import { eq } from 'drizzle-orm';
import { chapters, threads } from '../schema';
import type { DB } from '../db';
import { updateStoryState } from './story-generation';
import { loadStoryBible } from '../story-harness/memory/load-story-bible';
import type { UpdateStateJob } from '../queue/story-generation-jobs';

// update-state 큐 잡 처리기 — 생성 호출과 분리된 독립 실행(신선한 호출 수명).
// prevState(이 화 이전 상태) 스냅샷을 페이로드로 받으므로, 몇 번 재실행돼도
// 항상 동일 입력 → 동일 결과로 덮어써 멱등하다(누적 중복 적용 없음).
export async function runUpdateStateJob(params: { db: DB; apiKey: string; job: UpdateStateJob }): Promise<void> {
  const { db, apiKey, job } = params;
  const tag = `[state-job] thread=${job.threadId} chapter=${job.chapterNumber}`;

  const [thread] = await db
    .select({ storyId: threads.storyId })
    .from(threads)
    .where(eq(threads.id, job.threadId))
    .limit(1);
  if (!thread) {
    console.warn(`${tag} skip thread_not_found`);
    return;
  }

  const [chapter] = await db
    .select({ content: chapters.content })
    .from(chapters)
    .where(eq(chapters.id, job.chapterId))
    .limit(1);
  if (!chapter?.content) {
    console.warn(`${tag} skip chapter_missing`);
    return;
  }

  const bible = await loadStoryBible(db, thread.storyId);

  const newState = await updateStoryState({
    prevState: job.prevState,
    chapterContent: chapter.content,
    chosenOption: job.chosenOption,
    canon: bible?.canon ?? null,
    chapterNumber: job.chapterNumber,
    estimatedChapters: job.estimatedChapters,
    threadId: job.threadId,
    apiKey,
    language: job.language,
  });

  await db.update(threads).set({ storyState: newState }).where(eq(threads.id, job.threadId));
  console.log(`${tag} state saved`);
}
