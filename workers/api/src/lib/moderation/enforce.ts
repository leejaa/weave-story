import { and, eq, sql } from 'drizzle-orm';
import { chapters, contentReports } from '../schema';
import { notifyOwner } from '../notify/owner';
import type { DB } from '../db';
import type { WorkerEnv } from '../../types';

// 챕터를 N명의 서로 다른 사용자가 신고하면 자동 숨김.
export const REPORT_HIDE_THRESHOLD = 3;

/**
 * 챕터를 숨김 처리하고 운영자에게 알린다. 이미 hidden이면 중복 알림을 보내지 않는다.
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

  // 이미 숨김 상태였다면(빈 배열) 알림 생략 — 중복 알림 방지.
  if (updated.length === 0) return;

  await notifyOwner(
    env,
    `🚫 콘텐츠 자동 숨김 (${context.source})\nchapterId: ${chapterId}\n${context.detail}`,
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
