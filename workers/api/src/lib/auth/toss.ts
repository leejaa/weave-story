import type { WorkerEnv } from '../../types';

// 앱인토스 파트너 API. 모든 호출은 mTLS 클라이언트 인증서(env.TOSS_MTLS)로 나가야 한다.
const TOSS_API = 'https://apps-in-toss-api.toss.im';

export type TossReferrer = 'DEFAULT' | 'SANDBOX';

export type TossUser = {
  userKey: string; // 앱별 고유 식별자(평문). provider='toss'의 providerSub로 사용.
  email: string | null;
  name: string | null;
};

/**
 * 토스 API 호출 오류. `infra=true`면 우리 쪽 문제(mTLS 미설정/네트워크/5xx) → 알림 대상.
 * upstreamStatus 4xx(인가코드 만료 등 사용자 측)는 infra=false → 로그만.
 */
export class TossApiError extends Error {
  constructor(message: string, public upstreamStatus?: number, public infra = false) {
    super(message);
    this.name = 'TossApiError';
  }
}

function mtlsFetch(env: WorkerEnv, url: string, init: RequestInit): Promise<Response> {
  if (!env.TOSS_MTLS) {
    throw new TossApiError('TOSS_MTLS binding not configured', undefined, true);
  }
  return env.TOSS_MTLS.fetch(url, init).catch((err) => {
    throw new TossApiError(`toss fetch network error: ${String(err)}`, undefined, true);
  });
}

/** 인가 코드 → 토스 액세스 토큰(유저 조회용). 인가 코드 유효시간 10분. */
async function exchangeAuthorizationCode(
  env: WorkerEnv,
  authorizationCode: string,
  referrer: TossReferrer,
): Promise<string> {
  const res = await mtlsFetch(env, `${TOSS_API}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  if (!res.ok) {
    throw new TossApiError(`toss generate-token failed: ${res.status} ${await res.text()}`, res.status, res.status >= 500);
  }
  // 토스 파트너 API는 { resultType, success: {...} } 봉투 구조. 평면 응답도 방어적으로 허용.
  const raw = (await res.json()) as Record<string, any>;
  const accessToken = raw?.accessToken ?? raw?.success?.accessToken ?? raw?.data?.accessToken;
  if (!accessToken) {
    console.error('[toss] generate-token unexpected shape', { keys: Object.keys(raw ?? {}), body: JSON.stringify(raw).slice(0, 400) });
    throw new TossApiError('toss generate-token: no accessToken', undefined, true);
  }
  return accessToken as string;
}

type LoginMeResponse = {
  userKey: number | string;
  name?: string | null;
  email?: string | null;
};

/** 토스 액세스 토큰으로 로그인 유저 정보 조회. userKey는 평문, name/email은 암호화. */
async function fetchLoginMe(env: WorkerEnv, tossAccessToken: string): Promise<LoginMeResponse> {
  const res = await mtlsFetch(env, `${TOSS_API}/api-partner/v1/apps-in-toss/user/oauth2/login-me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tossAccessToken}` },
  });
  if (!res.ok) {
    throw new TossApiError(`toss login-me failed: ${res.status} ${await res.text()}`, res.status, res.status >= 500);
  }
  // 봉투 구조 처리: success/data 안에 유저 정보가 있을 수 있음.
  const raw = (await res.json()) as Record<string, any>;
  const me = (raw?.success ?? raw?.data ?? raw) as LoginMeResponse;
  if (me?.userKey == null) {
    console.error('[toss] login-me unexpected shape', { keys: Object.keys(raw ?? {}), body: JSON.stringify(raw).slice(0, 400) });
    throw new TossApiError('toss login-me: no userKey', undefined, true);
  }
  return me;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * 토스 암호화 PII 복호화 — AES-256-GCM. 데이터 = base64(IV[12바이트] + ciphertext+tag).
 * AAD/키 미설정이거나 실패하면 null(로그인은 userKey만으로 진행).
 */
async function decryptField(env: WorkerEnv, value: string | null | undefined): Promise<string | null> {
  if (!value || !env.TOSS_DECRYPTION_KEY || !env.TOSS_AAD_STRING) return null;
  try {
    const keyBytes = b64ToBytes(env.TOSS_DECRYPTION_KEY);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
    const data = b64ToBytes(value);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12); // GCM 태그가 뒤에 붙어있음(Web Crypto가 처리)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(env.TOSS_AAD_STRING) },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plain);
  } catch (err) {
    console.warn('[toss] PII decrypt failed', err);
    return null;
  }
}

/** 인가 코드로 토스 로그인 → 유저 식별. (mTLS 필수) */
export async function loginWithTossCode(
  env: WorkerEnv,
  authorizationCode: string,
  referrer: TossReferrer,
): Promise<TossUser> {
  const tossAccessToken = await exchangeAuthorizationCode(env, authorizationCode, referrer);
  const me = await fetchLoginMe(env, tossAccessToken);
  const [email, name] = await Promise.all([
    decryptField(env, me.email),
    decryptField(env, me.name),
  ]);
  return { userKey: String(me.userKey), email, name };
}
