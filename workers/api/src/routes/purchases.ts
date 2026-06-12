import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, purchaseGrants } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { verifyGooglePurchase } from '../lib/google-play';
import { notifyOwner } from '../lib/notify/owner';
import type { AppEnv, WorkerEnv } from '../types';

const BUNDLE_ID = 'com.leejahun.weavestory';

const CREDITS_PER_PRODUCT: Record<string, number> = {
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

async function verifyAppleTransaction(
  transactionId: string,
  expectedProductId: string,
  env: WorkerEnv,
): Promise<boolean> {
  const jwt = await buildAppleJWT(env);

  for (const baseUrl of [
    'https://api.storekit.itunes.apple.com',
    'https://api.storekit-sandbox.itunes.apple.com',
  ]) {
    const res = await fetch(`${baseUrl}/inApps/v1/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    // A sandbox transaction queried against the production endpoint returns
    // 404 (TransactionIdNotFound) or 401 (production API not yet available
    // because the app has no production release). In either case, fall through
    // to the next environment instead of failing outright.
    if (!res.ok) {
      console.warn(`[apple-verify] HTTP ${res.status} from ${baseUrl}, trying next environment`);
      continue;
    }

    // App Store Server API "Get Transaction Info" returns the JWS in
    // `signedTransactionInfo` (NOT `signedTransaction`).
    const { signedTransactionInfo } = await res.json() as { signedTransactionInfo: string };
    const payload = decodeJWSPayload(signedTransactionInfo);

    const valid =
      payload.bundleId === BUNDLE_ID &&
      payload.productId === expectedProductId &&
      payload.type === 'Consumable';

    if (!valid) {
      console.error(`[apple-verify] payload mismatch`, { bundleId: payload.bundleId, productId: payload.productId, type: payload.type });
    }

    return valid;
  }

  console.error(`[apple-verify] transaction not found in any environment transactionId=${transactionId}`);
  return false;
}

function decodeJWSPayload(jws: string): Record<string, string> {
  const segment = jws.split('.')[1];
  const padded = segment + '='.repeat((4 - segment.length % 4) % 4);
  const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded) as Record<string, string>;
}

async function buildAppleJWT(env: WorkerEnv): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const toB64url = (s: string) =>
    btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const header = toB64url(JSON.stringify({ alg: 'ES256', kid: env.APPLE_IAP_KEY_ID, typ: 'JWT' }));
  const payload = toB64url(JSON.stringify({
    iss: env.APPLE_IAP_ISSUER_ID,
    iat: now,
    exp: now + 300,
    aud: 'appstoreconnect-v1',
    bid: BUNDLE_ID,
  }));

  const signingInput = `${header}.${payload}`;

  const pemContent = env.APPLE_IAP_PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const keyBuffer = Uint8Array.from(atob(pemContent), ch => ch.charCodeAt(0)).buffer;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(signingInput),
  );

  const sigBytes = new Uint8Array(signatureBuffer);
  const sigB64 = btoa(String.fromCharCode(...sigBytes))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${sigB64}`;
}
