import { and, eq } from 'drizzle-orm';
import { accounts, threads, stories } from '../schema';
import type { DB } from '../db';
import type { WorkerEnv } from '../../types';

// 앱인토스 스마트 발송(기능성 메시지) — 토스 로그인 유저에게 푸시.
// 기존 Expo/FCM 푸시(sendChapterReadyPush)와 독립적으로 동작(additive).
const TOSS_API = 'https://apps-in-toss-api.toss.im';

/** 유저의 토스 userKey 조회(provider='toss' 계정의 providerSub). 없으면 null. */
async function tossUserKeyFor(db: DB, userId: string): Promise<string | null> {
  const acc = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, 'toss')),
  });
  return acc?.providerSub ?? null;
}

/**
 * 챕터 생성 완료 → 토스 유저에게 기능성 메시지 발송. best-effort.
 * 발송 조건: mTLS 바인딩 + 템플릿 코드 설정 + 해당 유저가 토스 계정. 하나라도 없으면 조용히 skip.
 * "이야기 완성"은 기능성 메시지라 별도 알림 동의 불필요.
 */
export async function sendTossChapterReadyPush(
  env: WorkerEnv,
  db: DB,
  params: { threadId: string },
): Promise<void> {
  const templateSetCode = env.TOSS_MESSAGE_TEMPLATE_CODE;
  if (!env.TOSS_MTLS || !templateSetCode) return; // 미설정 시 skip

  try {
    const [row] = await db
      .select({ userId: threads.userId, title: stories.title })
      .from(threads)
      .innerJoin(stories, eq(threads.storyId, stories.id))
      .where(eq(threads.id, params.threadId))
      .limit(1);
    if (!row) return;

    const userKey = await tossUserKeyFor(db, row.userId);
    if (!userKey) return; // 토스 유저 아님(Expo/FCM 경로로 발송됨)

    const res = await env.TOSS_MTLS.fetch(`${TOSS_API}/api-partner/v1/apps-in-toss/messenger/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-toss-user-key': userKey },
      body: JSON.stringify({
        templateSetCode,
        // 콘솔 템플릿이 사용하는 변수. 템플릿 등록 시 키를 맞춰주세요.
        context: { storyTitle: row.title ?? '이야기', path: `/reading/${params.threadId}` },
      }),
    });
    if (!res.ok) {
      console.warn(`[toss-push] send-message failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.warn('[toss-push] error', err);
  }
}
