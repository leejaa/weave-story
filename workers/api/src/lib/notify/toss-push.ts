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

    const payload = {
      templateSetCode,
      // 콘솔 템플릿이 사용하는 변수. 템플릿 등록 시 키를 맞춰주세요.
      context: { storyTitle: row.title ?? '이야기', path: `/reading/${params.threadId}` },
    };

    const res = await env.TOSS_MTLS.fetch(`${TOSS_API}/api-partner/v1/apps-in-toss/messenger/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-toss-user-key': userKey },
      body: JSON.stringify(payload),
    });

    // 토스 API는 HTTP 200이어도 본문이 에러 엔벨로프({ resultType:'FAIL', ... })일 수 있다.
    // (토스 로그인 때 동일 함정) → 본문을 파싱해 SUCCESS 여부로 판정.
    const bodyText = await res.text();
    let resultType: string | undefined;
    try {
      resultType = (JSON.parse(bodyText) as { resultType?: string })?.resultType;
    } catch {
      /* 비 JSON 응답 */
    }
    const ok = res.ok && resultType === 'SUCCESS';

    if (ok) {
      // 첫 실발송 스키마 확정용 로그(저빈도, best-effort). 안정화 후 축소 가능.
      console.log(`[toss-push] sent ok status=${res.status} ctxKeys=${Object.keys(payload.context).join(',')}`);
    } else {
      // 요청 필드명(context/landing 등)이 콘솔 템플릿과 어긋나면 여기서 전체 응답으로 드러난다.
      console.warn(
        `[toss-push] send-message NOT ok status=${res.status} resultType=${resultType ?? 'n/a'} ` +
          `req=${JSON.stringify(payload)} res=${bodyText.slice(0, 600)}`,
      );
    }
  } catch (err) {
    console.warn('[toss-push] error', err);
  }
}
