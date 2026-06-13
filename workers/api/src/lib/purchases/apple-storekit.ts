import type { WorkerEnv } from '../../types';

export const BUNDLE_ID = 'com.leejahun.weavestory';

const STOREKIT_HOSTS = [
  'https://api.storekit.itunes.apple.com',
  'https://api.storekit-sandbox.itunes.apple.com',
];

// App Store Server API JWSTransaction 페이로드(필요한 필드만).
export type AppleTransactionInfo = {
  bundleId?: string;
  productId?: string;
  transactionId?: string;
  type?: string;
  // 환불/취소 시에만 존재. 둘 다 있으면 해당 거래는 회수(refund/revoke)된 것.
  revocationDate?: number;
  revocationReason?: number;
};

/** JWS의 payload 세그먼트를 디코드(서명 검증은 별도; 환불은 Apple API 재조회로 확정). */
export function decodeJWSPayload<T = Record<string, unknown>>(jws: string): T {
  const segment = jws.split('.')[1];
  const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
  const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded) as T;
}

/** App Store Server API 인증용 ES256 JWT. */
export async function buildAppleJWT(env: WorkerEnv): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const toB64url = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

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
  const keyBuffer = Uint8Array.from(atob(pemContent), (ch) => ch.charCodeAt(0)).buffer;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${sigB64}`;
}

/**
 * Apple "Get Transaction Info"로 거래 정보를 인증 조회한다(프로덕션→샌드박스 순).
 * 우리 키로 직접 조회하므로 위조 불가 — 환불 확정의 신뢰 소스로 쓴다.
 */
export async function getAppleTransactionInfo(
  transactionId: string,
  env: WorkerEnv,
): Promise<AppleTransactionInfo | null> {
  const jwt = await buildAppleJWT(env);

  for (const baseUrl of STOREKIT_HOSTS) {
    const res = await fetch(`${baseUrl}/inApps/v1/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) {
      console.warn(`[apple-storekit] HTTP ${res.status} from ${baseUrl}, trying next environment`);
      continue;
    }
    const { signedTransactionInfo } = (await res.json()) as { signedTransactionInfo: string };
    return decodeJWSPayload<AppleTransactionInfo>(signedTransactionInfo);
  }

  console.error(`[apple-storekit] transaction not found in any environment transactionId=${transactionId}`);
  return null;
}

/** 결제 지급 승인용 검증 — 번들/상품/소비형 일치 확인. */
export async function verifyAppleTransaction(
  transactionId: string,
  expectedProductId: string,
  env: WorkerEnv,
): Promise<boolean> {
  const info = await getAppleTransactionInfo(transactionId, env);
  if (!info) return false;

  const valid =
    info.bundleId === BUNDLE_ID &&
    info.productId === expectedProductId &&
    info.type === 'Consumable';

  if (!valid) {
    console.error('[apple-storekit] payload mismatch', {
      bundleId: info.bundleId,
      productId: info.productId,
      type: info.type,
    });
  }
  return valid;
}
