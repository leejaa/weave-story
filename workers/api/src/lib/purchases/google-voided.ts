import { makeDb } from '../db';
import { listVoidedPurchaseTokens } from '../google-play';
import { revokeGrantByKey } from './revoke';
import type { WorkerEnv } from '../../types';

const LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000; // 최근 30일 환불 조회

/**
 * Google Play 환불(voided) 폴링 — cron에서 호출. 최근 voided 토큰을 조회해
 * 매칭되는 active 지급 건의 크레딧을 회수한다. revokeGrantByKey가 멱등이라
 * 매 실행 재처리해도 안전(이미 refunded면 no-op).
 */
export async function pollGoogleVoidedPurchases(env: WorkerEnv): Promise<void> {
  const sinceMs = Date.now() - LOOKBACK_MS;
  const tokens = await listVoidedPurchaseTokens(env, sinceMs);
  if (tokens.length === 0) return;

  const db = makeDb(env.DATABASE_URL);
  let revoked = 0;
  for (const token of tokens) {
    const r = await revokeGrantByKey(env, db, token, 'google');
    if (r.revoked) revoked += 1;
  }
  console.log(`[google-voided] checked=${tokens.length} revoked=${revoked}`);
}
