import { and, eq, sql } from 'drizzle-orm';
import { users, purchaseGrants } from '../schema';
import type { DB } from '../db';

// grantKey = Apple transactionId 또는 Android purchaseToken (멱등 키).

/** 이미 지급된 결제인지 확인(중복 지급 방지 — 검증 전에 호출해 재검증 비용 절약). */
export async function hasGrant(db: DB, userId: string, productId: string, grantKey: string): Promise<boolean> {
  const rows = await db
    .select({ id: purchaseGrants.id })
    .from(purchaseGrants)
    .where(and(
      eq(purchaseGrants.userId, userId),
      eq(purchaseGrants.productId, productId),
      eq(purchaseGrants.rcPurchaseDateMs, grantKey),
    ));
  return rows.length > 0;
}

/** 크레딧을 더하고 지급 이력을 기록한다. 호출 전 hasGrant로 중복을 걸러야 한다. */
export async function applyGrant(
  db: DB,
  args: { userId: string; productId: string; grantKey: string; credits: number },
): Promise<{ credits: number; email: string | null }> {
  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${args.credits}` })
    .where(eq(users.id, args.userId))
    .returning({ credits: users.credits, email: users.email });

  await db.insert(purchaseGrants).values({
    userId: args.userId,
    productId: args.productId,
    rcPurchaseDateMs: args.grantKey,
    creditsGranted: args.credits,
  });

  return { credits: updated.credits, email: updated.email };
}
