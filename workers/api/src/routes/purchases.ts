import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, purchaseGrants } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import type { AppEnv } from '../types';

const CREDITS_PER_PRODUCT: Record<string, number> = {
  'com.leejahun.weavestory.credits_starter_3': 3,
  'com.leejahun.weavestory.credits_value_10': 10,
};

export const purchasesRouter = new Hono<AppEnv>();

purchasesRouter.use(requireAuth);

purchasesRouter.post('/grant', async (c) => {
  const userId = c.get('userId');
  const { productId, purchaseDateMs } = await c.req.json();

  if (typeof productId !== 'string' || typeof purchaseDateMs !== 'string') {
    return c.json({ error: 'productId and purchaseDateMs required' }, 400);
  }

  const creditsToGrant = CREDITS_PER_PRODUCT[productId];
  if (!creditsToGrant) return c.json({ error: 'Unknown product' }, 400);

  const db = makeDb(c.env.DATABASE_URL);

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
    return c.json({ credits: user.credits, alreadyGranted: true });
  }

  const secretKey = c.env.REVENUECAT_SECRET_KEY;
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    console.error(`[grant] RC API error status=${res.status}`);
    return c.json({ error: 'Purchase verification failed' }, 402);
  }

  const data = await res.json() as { subscriber?: { non_subscriptions?: Record<string, { purchase_date_ms: number }[]> } };
  const purchases = data.subscriber?.non_subscriptions?.[productId] ?? [];
  const isValid = purchases.some(p => String(p.purchase_date_ms) === purchaseDateMs);

  if (!isValid) return c.json({ error: 'Purchase verification failed' }, 402);

  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${creditsToGrant}` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });

  await db.insert(purchaseGrants).values({ userId, productId, rcPurchaseDateMs: purchaseDateMs, creditsGranted: creditsToGrant });

  console.log(`[grant] granted userId=${userId} product=${productId} credits=${creditsToGrant} total=${updated.credits}`);
  return c.json({ credits: updated.credits });
});
