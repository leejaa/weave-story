import { and, eq, sql } from 'drizzle-orm';
import { chapters, contentReports, threads, users } from '../schema';
import { notifyOwner } from '../notify/owner';
import type { DB } from '../db';
import type { WorkerEnv } from '../../types';

// 스토리는 유저별 비공개라 한 챕터는 사실상 본인만 본다 → 본인 신고 1건이면 숨김.
export const REPORT_HIDE_THRESHOLD = 1;

// 챕터 1개 생성에 드는 크레딧. 생성 직후 자동 숨김 시 환원한다.
const CHAPTER_CREDIT_COST = 1;

/**
 * 챕터를 숨김 처리하고 운영자에게 알린다. 이미 hidden이면 중복 처리하지 않는다.
 * 생성 직후(분류기) 자동 숨김이면 사용자가 못 읽는 콘텐츠에 쓴 크레딧을 환원한다.
 * best-effort — 알림 실패가 본 흐름을 막지 않는다.
 */
export async function hideChapter(
  env: WorkerEnv,
  db: DB,
  chapterId: string,
  context: { source: 'generation' | 'reports'; detail: string },
): Promise<void> {
  const updated = await db
    .update(chapters)
    .set({ moderationStatus: 'hidden' })
    .where(and(eq(chapters.id, chapterId), sql`${chapters.moderationStatus} <> 'hidden'`))
    .returning({ id: chapters.id });

  // 이미 숨김 상태였다면(빈 배열) 중복 처리·알림 생략.
  if (updated.length === 0) return;

  // 생성 분류기가 숨긴 경우: 읽지 못한 콘텐츠에 쓴 크레딧 1을 소유자에게 환원.
  let refunded = false;
  if (context.source === 'generation') {
    const [owner] = await db
      .select({ userId: threads.userId })
      .from(chapters)
      .innerJoin(threads, eq(chapters.threadId, threads.id))
      .where(eq(chapters.id, chapterId))
      .limit(1);
    if (owner) {
      await db
        .update(users)
        .set({ credits: sql`${users.credits} + ${CHAPTER_CREDIT_COST}` })
        .where(eq(users.id, owner.userId));
      refunded = true;
    }
  }

  await notifyOwner(
    env,
    `🚫 콘텐츠 자동 숨김 (${context.source})\nchapterId: ${chapterId}\n${context.detail}${refunded ? `\n💳 크레딧 ${CHAPTER_CREDIT_COST} 환원` : ''}`,
  );
}

/** 해당 챕터를 신고한 서로 다른 사용자 수. */
export async function countDistinctReporters(db: DB, chapterId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(distinct ${contentReports.reporterUserId})` })
    .from(contentReports)
    .where(eq(contentReports.chapterId, chapterId));
  return Number(row?.n ?? 0);
}
