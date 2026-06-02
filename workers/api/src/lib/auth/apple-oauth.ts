import { SignJWT, importPKCS8 } from 'jose';
import type { WorkerEnv } from '../../types';

// Sign in with Apple server-to-server OAuth: used to capture a refresh token at
// sign-in and revoke it on account deletion (Apple Guideline 5.1.1(v)).
//
// Everything here is best-effort: if the Sign in with Apple key isn't configured yet,
// these helpers no-op rather than breaking sign-in. Once the APPLE_SIGNIN_* secrets
// are set, revocation becomes fully functional.

const APPLE_BUNDLE_ID = 'com.leejahun.weavestory';
const APPLE_BASE = 'https://appleid.apple.com';

export function appleSigninConfigured(env: WorkerEnv): boolean {
  return Boolean(env.APPLE_SIGNIN_TEAM_ID && env.APPLE_SIGNIN_KEY_ID && env.APPLE_SIGNIN_PRIVATE_KEY);
}

async function buildClientSecret(env: WorkerEnv): Promise<string> {
  const key = await importPKCS8(env.APPLE_SIGNIN_PRIVATE_KEY as string, 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_SIGNIN_KEY_ID as string })
    .setIssuer(env.APPLE_SIGNIN_TEAM_ID as string)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience(APPLE_BASE)
    .setSubject(APPLE_BUNDLE_ID)
    .sign(key);
}

async function postForm(path: string, params: Record<string, string>): Promise<Response> {
  return fetch(`${APPLE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
}

/** Exchange the one-time authorization code from the client for a refresh token. */
export async function exchangeAppleAuthCode(code: string, env: WorkerEnv): Promise<string | null> {
  if (!appleSigninConfigured(env)) return null;
  try {
    const res = await postForm('/auth/token', {
      client_id: APPLE_BUNDLE_ID,
      client_secret: await buildClientSecret(env),
      code,
      grant_type: 'authorization_code',
    });
    if (!res.ok) {
      console.error(`[apple-oauth] token exchange failed status=${res.status}`);
      return null;
    }
    const data = await res.json() as { refresh_token?: string };
    return data.refresh_token ?? null;
  } catch (err) {
    console.error('[apple-oauth] token exchange error', err);
    return null;
  }
}

/** Revoke a stored Apple refresh token so the Sign in with Apple link is fully severed. */
export async function revokeAppleRefreshToken(refreshToken: string, env: WorkerEnv): Promise<boolean> {
  if (!appleSigninConfigured(env)) return false;
  try {
    const res = await postForm('/auth/revoke', {
      client_id: APPLE_BUNDLE_ID,
      client_secret: await buildClientSecret(env),
      token: refreshToken,
      token_type_hint: 'refresh_token',
    });
    if (!res.ok) console.error(`[apple-oauth] revoke failed status=${res.status}`);
    return res.ok;
  } catch (err) {
    console.error('[apple-oauth] revoke error', err);
    return false;
  }
}
