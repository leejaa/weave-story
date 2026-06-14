import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { verifyGooglePurchase } from '../lib/google-play';
import { verifyAppleTransaction } from '../lib/purchases/apple-storekit';
import { hasGrant, applyGrant } from '../lib/purchases/grant';
import { TOSS_CREDITS_PER_SKU, verifyTossOrder } from '../lib/purchases/toss-iap';
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

  // 중복 지급 방지 — 검증 전에 확인해 재검증 비용을 아낀다.
  if (await hasGrant(db, userId, productId, grantKey)) {
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

  const { credits, email } = await applyGrant(db, { userId, productId, grantKey, credits: creditsToGrant });

  console.log(`[grant] granted userId=${userId} platform=${platform} product=${productId} credits=${creditsToGrant} total=${credits}`);
  c.executionCtx.waitUntil(notifyOwner(c.env, `💳 결제\nuser: ${email ?? userId}\nproduct: ${productId}\nplatform: ${platform}\n+${creditsToGrant} 크레딧 (총 ${credits})`));
  return c.json({ credits });
});

// 앱인토스 IAP 지급. 클라 processProductGrant 콜백 → { orderId, sku }.
// orderId 기준 멱등. 토스 주문검증(getIapOrderStatus)은 스키마 확정 전까지 로깅+옵션 강제.
purchasesRouter.post('/toss', async (c) => {
  const userId = c.get('userId');
  const body = (await c.req.json().catch(() => ({}))) as { orderId?: unknown; sku?: unknown };
  const orderId = typeof body.orderId === 'string' ? body.orderId : null;
  const sku = typeof body.sku === 'string' ? body.sku : null;

  if (!orderId || !sku) return c.json({ error: 'orderId and sku required' }, 400);
  const creditsToGrant = TOSS_CREDITS_PER_SKU[sku];
  if (!creditsToGrant) return c.json({ error: 'Unknown sku' }, 400);

  const db = makeDb(c.env.DATABASE_URL);

  // 멱등 — 같은 orderId 재요청은 이중 지급 안 함.
  if (await hasGrant(db, userId, sku, orderId)) {
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return c.json({ granted: true, credits: user?.credits ?? 0, alreadyGranted: true });
  }

  // 주문 검증 — 응답 스키마 로깅. 강제 모드(TOSS_IAP_ENFORCE_VERIFY='true')면 통과 필수.
  const { verified } = await verifyTossOrder(c.env, orderId);
  if (c.env.TOSS_IAP_ENFORCE_VERIFY === 'true' && !verified) {
    console.error(`[toss-iap] verify failed (enforced) order=${orderId} sku=${sku}`);
    return c.json({ granted: false, error: 'order not verified' }, 402);
  }

  const { credits, email } = await applyGrant(db, { userId, productId: sku, grantKey: orderId, credits: creditsToGrant });
  console.log(`[toss-iap] granted userId=${userId} sku=${sku} order=${orderId} +${creditsToGrant} total=${credits} verified=${verified}`);
  c.executionCtx.waitUntil(notifyOwner(c.env, `💳 결제 (Toss)\nuser: ${email ?? userId}\nsku: ${sku}\norder: ${orderId}\n+${creditsToGrant} 크레딧 (총 ${credits})${verified ? '' : '\n⚠️ 검증 미통과(로깅)'}`));
  return c.json({ granted: true, credits });
});
