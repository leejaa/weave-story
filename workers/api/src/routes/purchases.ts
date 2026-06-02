import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, purchaseGrants } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
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
  const body = await c.req.json() as { productId?: unknown; transactionId?: unknown };
  const { productId, transactionId } = body;

  if (typeof productId !== 'string' || typeof transactionId !== 'string') {
    return c.json({ error: 'productId and transactionId required' }, 400);
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
      eq(purchaseGrants.rcPurchaseDateMs, transactionId),
    ));

  if (alreadyGranted.length > 0) {
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return c.json({ credits: user.credits, alreadyGranted: true });
  }

  const isValid = await verifyAppleTransaction(transactionId, productId, c.env);
  if (!isValid) {
    console.error(`[grant] Apple verification failed transactionId=${transactionId} product=${productId}`);
    return c.json({ error: 'Purchase verification failed' }, 402);
  }

  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${creditsToGrant}` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });

  await db.insert(purchaseGrants).values({
    userId,
    productId,
    rcPurchaseDateMs: transactionId,
    creditsGranted: creditsToGrant,
  });

  console.log(`[grant] granted userId=${userId} product=${productId} credits=${creditsToGrant} total=${updated.credits}`);
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
