import { Hono } from 'hono';
import { makeDb } from '../lib/db';
import {
  decodeJWSPayload,
  getAppleTransactionInfo,
  type AppleTransactionInfo,
} from '../lib/purchases/apple-storekit';
import { revokeGrantByKey } from '../lib/purchases/revoke';
import type { AppEnv } from '../types';

// App Store Server Notifications V2. App Store Connect에 이 URL을 등록한다.
// 인증 없는 공개 엔드포인트지만, 환불은 알림을 트리거로만 쓰고 Apple API 재조회로
// 확정하므로 위조 알림은 무해하다.
type AppleNotificationBody = { signedPayload?: string };
type AppleNotificationPayload = {
  notificationType?: string;
  subtype?: string;
  data?: { signedTransactionInfo?: string };
};

// 환불/회수 계열 알림 — 크레딧을 회수해야 하는 타입.
const REVOKE_TYPES = new Set(['REFUND', 'REVOKE']);

export const storeNotificationsRouter = new Hono<AppEnv>();

storeNotificationsRouter.post('/apple', async (c) => {
  let body: AppleNotificationBody;
  try {
    body = (await c.req.json()) as AppleNotificationBody;
  } catch {
    return c.json({ error: 'invalid body' }, 400);
  }
  if (!body.signedPayload) return c.json({ error: 'signedPayload required' }, 400);

  let payload: AppleNotificationPayload;
  try {
    payload = decodeJWSPayload<AppleNotificationPayload>(body.signedPayload);
  } catch {
    return c.json({ error: 'invalid signedPayload' }, 400);
  }

  const type = payload.notificationType ?? '';
  if (!REVOKE_TYPES.has(type) || !payload.data?.signedTransactionInfo) {
    // 환불 외 알림(구독 갱신 등)은 현재 처리 대상이 아님 — 정상 ack.
    return c.json({ ok: true, ignored: type || 'unknown' });
  }

  let tx: AppleTransactionInfo;
  try {
    tx = decodeJWSPayload<AppleTransactionInfo>(payload.data.signedTransactionInfo);
  } catch {
    return c.json({ error: 'invalid transaction info' }, 400);
  }

  const transactionId = tx.transactionId;
  if (!transactionId) return c.json({ ok: true, ignored: 'no_transaction_id' });

  // 알림을 신뢰하지 않고 Apple에 재조회해 환불(revocationDate) 확정.
  const confirmed = await getAppleTransactionInfo(transactionId, c.env);
  if (!confirmed?.revocationDate) {
    console.warn(`[apple-notify] type=${type} tx=${transactionId} not confirmed revoked — skipping`);
    return c.json({ ok: true, confirmed: false });
  }

  const db = makeDb(c.env.DATABASE_URL);
  const { revoked } = await revokeGrantByKey(c.env, db, transactionId, 'apple');
  console.log(`[apple-notify] type=${type} tx=${transactionId} revoked=${revoked}`);
  return c.json({ ok: true, revoked });
});
