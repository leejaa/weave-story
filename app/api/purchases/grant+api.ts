import { db } from '@/lib/db/client';
import { users, purchaseGrants } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { eq, and, sql } from 'drizzle-orm';

const CREDITS_PER_PRODUCT: Record<string, number> = {
  'com.leejahun.weavestory.credits_starter_3': 3,
  'com.leejahun.weavestory.credits_value_10': 10,
};

async function verifyPurchaseWithRevenueCat(
  userId: string,
  productId: string,
  purchaseDateMs: string,
): Promise<boolean> {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) {
    console.warn('[grant] REVENUECAT_SECRET_KEY not set — skipping verification');
    return true;
  }

  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error(`[grant] RC API error status=${res.status}`);
    return false;
  }

  const data = await res.json();
  const purchases = data.subscriber?.non_subscriptions?.[productId] ?? [];

  return purchases.some((p: { purchase_date_ms: number }) =>
    String(p.purchase_date_ms) === purchaseDateMs,
  );
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, purchaseDateMs } = await request.json();
  if (typeof productId !== 'string' || typeof purchaseDateMs !== 'string') {
    return Response.json({ error: 'productId and purchaseDateMs required' }, { status: 400 });
  }

  const creditsToGrant = CREDITS_PER_PRODUCT[productId];
  if (!creditsToGrant) {
    return Response.json({ error: 'Unknown product' }, { status: 400 });
  }

  const alreadyGranted = await db
    .select({ id: purchaseGrants.id })
    .from(purchaseGrants)
    .where(and(
      eq(purchaseGrants.userId, userId),
      eq(purchaseGrants.productId, productId),
      eq(purchaseGrants.rcPurchaseDateMs, purchaseDateMs),
    ));

  if (alreadyGranted.length > 0) {
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return Response.json({ credits: user.credits, alreadyGranted: true });
  }

  const isValid = await verifyPurchaseWithRevenueCat(userId, productId, purchaseDateMs);
  if (!isValid) {
    return Response.json({ error: 'Purchase verification failed' }, { status: 402 });
  }

  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${creditsToGrant}` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });

  await db.insert(purchaseGrants).values({
    userId, productId, rcPurchaseDateMs: purchaseDateMs, creditsGranted: creditsToGrant,
  });

  console.log(`[grant] granted userId=${userId} product=${productId} credits=${creditsToGrant} total=${updated.credits}`);
  return Response.json({ credits: updated.credits });
}
