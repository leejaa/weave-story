import { and, eq } from 'drizzle-orm';
import { chapters, chapterJudgements, threads } from '../../schema';
import type { DB } from '../../db';
import { loadStoryBible } from '../memory/load-story-bible';
import { judgeChapter } from './judge-chapter';
import type { JudgeChapterJob } from '../../queue/story-generation-jobs';

// judge-chapter 큐 잡 처리기 — 생성 호출과 분리된 독립 실행(신선한 호출 수명).
// 챕터가 이미 저장·노출된 뒤이므로 사용자 영향 없음. 멱등(재배달 시 중복 심사 방지).
export async function runJudgeChapterJob(params: { db: DB; apiKey: string; job: JudgeChapterJob }): Promise<void> {
  const { db, apiKey, job } = params;
  const tag = `[judge-job] thread=${job.threadId} chapter=${job.chapterNumber}`;

  // 멱등 가드: 이미 심사 기록이 있으면 건너뛴다(큐 재배달 대비).
  const [existing] = await db
    .select({ id: chapterJudgements.id })
    .from(chapterJudgements)
    .where(and(eq(chapterJudgements.threadId, job.threadId), eq(chapterJudgements.chapterNumber, job.chapterNumber)))
    .limit(1);
  if (existing) {
    console.log(`${tag} skip already_judged`);
    return;
  }

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
    .select({ content: chapters.content, status: chapters.status, question: chapters.question, options: chapters.options })
    .from(chapters)
    .where(eq(chapters.id, job.chapterId))
    .limit(1);
  if (!chapter?.content) {
    console.warn(`${tag} skip chapter_missing status=${chapter?.status ?? 'none'}`);
    return;
  }

  const choices = Array.isArray(chapter.options)
    ? (chapter.options as Array<{ text?: string }>).map((o) => o?.text ?? '').filter(Boolean)
    : [];

  const bible = await loadStoryBible(db, thread.storyId);

  await judgeChapter({
    db,
    apiKey,
    storyId: thread.storyId,
    threadId: job.threadId,
    chapterId: job.chapterId,
    chapterNumber: job.chapterNumber,
    mode: bible?.outline ? 'outline' : 'legacy',
    language: job.language,
    outline: bible?.outline ?? null,
    content: chapter.content,
    chosenOption: job.chosenOption,
    question: chapter.question,
    choices,
  });
}
