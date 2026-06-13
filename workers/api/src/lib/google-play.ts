import type { WorkerEnv } from '../types';

const PACKAGE_NAME = 'com.leejahun.weavestory';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

// Per-isolate access-token cache. Google access tokens live ~1h; reusing one
// across requests in the same isolate avoids re-signing a JWT on every grant.
let cachedToken: { token: string; expiresAt: number } | null = null;

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Service-account keys are PKCS8 ("-----BEGIN PRIVATE KEY-----"). Tolerate the
  // JSON-escaped "\n" form as well as real newlines so the secret can be stored
  // either way.
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (ch) => ch.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function buildServiceAccountJWT(env: WorkerEnv, now: number): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlEncode(JSON.stringify({
    iss: env.GOOGLE_PLAY_SA_CLIENT_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;

  const key = await importPrivateKey(env.GOOGLE_PLAY_SA_PRIVATE_KEY ?? '');
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken(env: WorkerEnv): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

  const assertion = await buildServiceAccountJWT(env, now);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

type ProductPurchase = {
  // 0 = Purchased, 1 = Canceled, 2 = Pending
  purchaseState?: number;
  // 0 = Yet to be consumed, 1 = Consumed
  consumptionState?: number;
  purchaseType?: number;
};

/**
 * Verify a Google Play one-time product purchase with the Play Developer API.
 *
 * Mirrors the Apple verification path: returns true only when the token resolves
 * to a real, purchased (not pending/canceled) transaction for the expected
 * product. Acknowledgement + consumption are handled client-side by expo-iap's
 * `finishTransaction({ isConsumable: true })`, so this only authorizes the grant.
 */
export async function verifyGooglePurchase(
  purchaseToken: string,
  productId: string,
  env: WorkerEnv,
): Promise<boolean> {
  if (!env.GOOGLE_PLAY_SA_CLIENT_EMAIL || !env.GOOGLE_PLAY_SA_PRIVATE_KEY) {
    console.error('[google-verify] service account credentials not configured');
    return false;
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(env);
  } catch (err) {
    console.error('[google-verify] failed to obtain access token', err);
    return false;
  }

  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}` +
    `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.error(`[google-verify] HTTP ${res.status} for product=${productId}: ${await res.text()}`);
    return false;
  }

  const purchase = await res.json() as ProductPurchase;
  const valid = purchase.purchaseState === 0;
  if (!valid) {
    console.error('[google-verify] purchase not in purchased state', { purchaseState: purchase.purchaseState });
  }
  return valid;
}

type VoidedPurchase = { purchaseToken?: string; voidedTimeMillis?: string; orderId?: string };

/**
 * 최근 환불/취소(voided)된 일회성 구매 토큰 목록. Voided Purchases API 폴링용.
 * `sinceMs` 이후 voided된 건만 조회. SA 미설정 시 빈 배열.
 */
export async function listVoidedPurchaseTokens(env: WorkerEnv, sinceMs: number): Promise<string[]> {
  if (!env.GOOGLE_PLAY_SA_CLIENT_EMAIL || !env.GOOGLE_PLAY_SA_PRIVATE_KEY) {
    console.error('[google-voided] service account credentials not configured');
    return [];
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(env);
  } catch (err) {
    console.error('[google-voided] failed to obtain access token', err);
    return [];
  }

  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}` +
    `/purchases/voidedpurchases?startTime=${sinceMs}&type=1`; // type=1: 일회성+구독 모두 포함

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.error(`[google-voided] HTTP ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = (await res.json()) as { voidedPurchases?: VoidedPurchase[] };
  return (data.voidedPurchases ?? [])
    .map((v) => v.purchaseToken)
    .filter((t): t is string => typeof t === 'string' && t.length > 0);
}
