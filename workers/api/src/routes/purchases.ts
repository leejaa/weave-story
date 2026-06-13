import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, purchaseGrants } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { verifyGooglePurchase } from '../lib/google-play';
import { verifyAppleTransaction } from '../lib/purchases/apple-storekit';
import { notifyOwner } from '../lib/notify/owner';
import type { AppEnv } from '../types';

export const CREDITS_PER_PRODUCT: Record<string, number> = {
  'com.leejahun.weavestory.credits_starter_3': 3,
  'com.leejahun.weavestory.credits_value_10': 10,
};

export const purchasesRouter = new Hono<AppEnv>();

purchasesRouter.use(requireAuth);

purchasesRouter.post('/grant', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json() as {
    productId?: unknown;
    transactionId?: unknown;
    purchaseToken?: unknown;
    platform?: unknown;
  };

  const productId = typeof body.productId === 'string' ? body.productId : null;
  const transactionId = typeof body.transactionId === 'string' ? body.transactionId : null;
  const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken : null;
  // Default to ios so already-shipped clients (which don't send `platform`) keep
  // verifying against Apple.
  const platform = body.platform === 'android' ? 'android' : 'ios';

  if (!productId) return c.json({ error: 'productId required' }, 400);

  const creditsToGrant = CREDITS_PER_PRODUCT[productId];
  if (!creditsToGrant) return c.json({ error: 'Unknown product' }, 400);

  // Unique key we dedupe + record grants on (stored in rc_purchase_date_ms):
  // Apple transactionId or Android purchaseToken.
  const grantKey = platform === 'android' ? purchaseToken : transactionId;
  if (!grantKey) {
    const field = platform === 'android' ? 'purchaseToken' : 'transactionId';
    return c.json({ error: `${field} required` }, 400);
  }

  const db = makeDb(c.env.DATABASE_URL);

  const alreadyGranted = await db
    .select({ id: purchaseGrants.id })
    .from(purchaseGrants)
    .where(and(
      eq(purchaseGrants.userId, userId),
      eq(purchaseGrants.productId, productId),
      eq(purchaseGrants.rcPurchaseDateMs, grantKey),
    ));

  if (alreadyGranted.length > 0) {
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return c.json({ credits: user.credits, alreadyGranted: true });
  }

  const isValid = platform === 'android'
    ? await verifyGooglePurchase(grantKey, productId, c.env)
    : await verifyAppleTransaction(grantKey, productId, c.env);

  if (!isValid) {
    console.error(`[grant] ${platform} verification failed product=${productId}`);
    return c.json({ error: 'Purchase verification failed' }, 402);
  }

  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${creditsToGrant}` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits, email: users.email });

  await db.insert(purchaseGrants).values({
    userId,
    productId,
    rcPurchaseDateMs: grantKey,
    creditsGranted: creditsToGrant,
  });

  console.log(`[grant] granted userId=${userId} platform=${platform} product=${productId} credits=${creditsToGrant} total=${updated.credits}`);
  c.executionCtx.waitUntil(notifyOwner(c.env, `💳 결제\nuser: ${updated.email ?? userId}\nproduct: ${productId}\nplatform: ${platform}\n+${creditsToGrant} 크레딧 (총 ${updated.credits})`));
  return c.json({ credits: updated.credits });
});
