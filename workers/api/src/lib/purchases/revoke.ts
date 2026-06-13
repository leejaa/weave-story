import { and, eq, sql } from 'drizzle-orm';
import { users, purchaseGrants } from '../schema';
import { notifyOwner } from '../notify/owner';
import type { DB } from '../db';
import type { WorkerEnv } from '../../types';

/**
 * 환불/취소된 결제의 크레딧을 회수한다. grantKey(Apple transactionId 또는
 * Android purchaseToken)로 active 지급 건을 찾아 차감(0 미만 방지)하고 refunded로 표시.
 * status='active'만 대상으로 하므로 중복 호출에 안전(멱등).
 */
export async function revokeGrantByKey(
  env: WorkerEnv,
  db: DB,
  grantKey: string,
  source: 'apple' | 'google',
): Promise<{ revoked: boolean }> {
  const [grant] = await db
    .select()
    .from(purchaseGrants)
    .where(and(eq(purchaseGrants.rcPurchaseDateMs, grantKey), eq(purchaseGrants.status, 'active')))
    .limit(1);

  if (!grant) return { revoked: false };

  // 크레딧을 이미 써버려 잔액이 부족하면 0으로 바닥 처리(음수 방지).
  const [updated] = await db
    .update(users)
    .set({ credits: sql`GREATEST(0, ${users.credits} - ${grant.creditsGranted})` })
    .where(eq(users.id, grant.userId))
    .returning({ credits: users.credits, email: users.email });

  await db
    .update(purchaseGrants)
    .set({ status: 'refunded', refundedAt: new Date() })
    .where(eq(purchaseGrants.id, grant.id));

  console.log(`[revoke] source=${source} grant=${grant.id} user=${grant.userId} product=${grant.productId} -${grant.creditsGranted} credits → ${updated?.credits}`);
  await notifyOwner(
    env,
    `↩️ 환불 — 크레딧 회수 (${source})\nuser: ${updated?.email ?? grant.userId}\nproduct: ${grant.productId}\n-${grant.creditsGranted} 크레딧 (잔액 ${updated?.credits})`,
  );

  return { revoked: true };
}
