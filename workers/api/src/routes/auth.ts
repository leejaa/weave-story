import { Hono } from 'hono';
import { eq, and, gt } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, accounts, sessions } from '../lib/schema';
import { verifyAppleIdentityToken } from '../lib/auth/apple';
import { exchangeAppleAuthCode } from '../lib/auth/apple-oauth';
import { verifyGoogleIdToken } from '../lib/auth/google';
import { signAccessToken, generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from '../lib/tokens';
import { notifyOwner } from '../lib/notify/owner';
import { rateLimit, clientIp } from '../lib/middleware/rate-limit';
import { loginWithTossCode, TossApiError, type TossReferrer } from '../lib/auth/toss';
import { logError } from '../lib/observability/logger';
import { alertServerError } from '../lib/observability/alert';
import type { AppEnv } from '../types';

export const authRouter = new Hono<AppEnv>();

// 인증 엔드포인트 전체에 IP 기반 레이트 리밋(무차별 로그인·데모코드 추측 완화).
authRouter.use('*', rateLimit((e) => e.AUTH_RATE_LIMITER, clientIp));

authRouter.post('/apple', async (c) => {
  const { identityToken, fullName, authorizationCode } = await c.req.json();
  if (!identityToken) return c.json({ error: 'identityToken required' }, 400);

  const applePayload = await verifyAppleIdentityToken(identityToken).catch(() => null);
  if (!applePayload) return c.json({ error: 'Invalid Apple token' }, 401);

  const db = makeDb(c.env.DATABASE_URL);
  const { sub: appleSub, email } = applePayload;

  const existingAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, 'apple'), eq(accounts.providerSub, appleSub)),
  });

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
  } else {
    const name = fullName?.givenName && fullName?.familyName
      ? `${fullName.givenName} ${fullName.familyName}`.trim()
      : (fullName?.givenName ?? null);

    const [newUser] = await db.insert(users).values({ email: email ?? null, name }).returning({ id: users.id });
    await db.insert(accounts).values({ userId: newUser.id, provider: 'apple', providerSub: appleSub });
    userId = newUser.id;
    c.executionCtx.waitUntil(notifyOwner(c.env, `🎉 신규 가입 (Apple)\nemail: ${email ?? '-'}\nname: ${name ?? '-'}`));
  }

  // Capture an Apple refresh token (best-effort) so we can revoke it on account
  // deletion. No-ops if the Sign in with Apple key isn't configured.
  if (typeof authorizationCode === 'string' && authorizationCode) {
    const appleRefreshToken = await exchangeAppleAuthCode(authorizationCode, c.env);
    if (appleRefreshToken) {
      await db.update(accounts)
        .set({ appleRefreshToken })
        .where(and(eq(accounts.provider, 'apple'), eq(accounts.providerSub, appleSub)));
    }
  }

  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await db.insert(sessions).values({ userId, refreshTokenHash: await hashRefreshToken(rawRefreshToken), expiresAt });

  const accessToken = await signAccessToken(userId, c.env.JWT_SECRET);
  return c.json({ accessToken, refreshToken: rawRefreshToken });
});

authRouter.post('/google', async (c) => {
  const { idToken } = await c.req.json();
  if (!idToken) return c.json({ error: 'idToken required' }, 400);

  const googlePayload = await verifyGoogleIdToken(idToken, c.env.GOOGLE_IOS_CLIENT_ID, c.env.GOOGLE_WEB_CLIENT_ID).catch(() => null);
  if (!googlePayload) return c.json({ error: 'Invalid Google token' }, 401);

  const db = makeDb(c.env.DATABASE_URL);
  const { sub: googleSub, email, name, picture } = googlePayload;

  const existingAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, 'google'), eq(accounts.providerSub, googleSub)),
  });

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
    await db.update(users)
      .set({ email: email ?? null, name: name ?? null, avatarUrl: picture ?? null })
      .where(eq(users.id, userId));
  } else {
    const [newUser] = await db.insert(users)
      .values({ email: email ?? null, name: name ?? null, avatarUrl: picture ?? null })
      .returning({ id: users.id });
    await db.insert(accounts).values({ userId: newUser.id, provider: 'google', providerSub: googleSub });
    userId = newUser.id;
    c.executionCtx.waitUntil(notifyOwner(c.env, `🎉 신규 가입 (Google)\nemail: ${email ?? '-'}\nname: ${name ?? '-'}`));
  }

  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await db.insert(sessions).values({ userId, refreshTokenHash: await hashRefreshToken(rawRefreshToken), expiresAt });

  const accessToken = await signAccessToken(userId, c.env.JWT_SECRET);
  return c.json({ accessToken, refreshToken: rawRefreshToken });
});

// 앱인토스(토스 앱 WebView) 로그인. 클라 appLogin() → { authorizationCode, referrer }.
// 서버가 mTLS로 토스 파트너 API를 호출해 userKey를 얻고, 우리 계정/세션을 발급한다.
authRouter.post('/toss', async (c) => {
  const { authorizationCode, referrer } = await c.req.json().catch(() => ({}));
  if (typeof authorizationCode !== 'string' || !authorizationCode) {
    return c.json({ error: 'authorizationCode required' }, 400);
  }
  const ref: TossReferrer = referrer === 'SANDBOX' ? 'SANDBOX' : 'DEFAULT';

  let tossUser;
  try {
    tossUser = await loginWithTossCode(c.env, authorizationCode, ref);
  } catch (err) {
    // CF에 항상 구조 로그(스택 포함) → 검색/디버깅. 인프라성 오류만 텔레그램 알림.
    const requestId = c.req.header('cf-ray') ?? crypto.randomUUID();
    const errorName = err instanceof Error ? err.name : 'Error';
    const isInfra = err instanceof TossApiError ? err.infra : true; // 미상 오류는 인프라로 간주
    logError(err, { event: 'request_error', requestId, method: 'POST', path: '/api/auth/toss', status: 401 });
    if (isInfra) {
      c.executionCtx.waitUntil(alertServerError(c.env, { source: 'request', requestId, method: 'POST', path: '/api/auth/toss', status: 401, errorName }));
    }
    return c.json({ error: 'Invalid Toss authorization' }, 401);
  }

  const db = makeDb(c.env.DATABASE_URL);
  const existingAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, 'toss'), eq(accounts.providerSub, tossUser.userKey)),
  });

  let userId: string;
  if (existingAccount) {
    userId = existingAccount.userId;
    // 복호화된 PII가 있으면 최신화(없으면 기존 값 유지).
    if (tossUser.email || tossUser.name) {
      await db.update(users)
        .set({
          ...(tossUser.email ? { email: tossUser.email } : {}),
          ...(tossUser.name ? { name: tossUser.name } : {}),
        })
        .where(eq(users.id, userId));
    }
  } else {
    const [newUser] = await db.insert(users)
      .values({ email: tossUser.email ?? null, name: tossUser.name ?? null })
      .returning({ id: users.id });
    await db.insert(accounts).values({ userId: newUser.id, provider: 'toss', providerSub: tossUser.userKey });
    userId = newUser.id;
    c.executionCtx.waitUntil(notifyOwner(c.env, `🎉 신규 가입 (Toss)\nuserKey: ${tossUser.userKey}\nemail: ${tossUser.email ?? '-'}`));
  }

  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await db.insert(sessions).values({ userId, refreshTokenHash: await hashRefreshToken(rawRefreshToken), expiresAt });

  const accessToken = await signAccessToken(userId, c.env.JWT_SECRET);
  return c.json({ accessToken, refreshToken: rawRefreshToken });
});

// Review-only demo login. Store reviewers (e.g. Google Play) may not sign in
// with their own accounts, and this app only supports OAuth — so we expose a
// code-gated path that signs the reviewer into a dedicated demo account. The
// code is a server secret (DEMO_LOGIN_CODE) shared out-of-band via the store's
// App Access instructions; without it this endpoint does nothing.
authRouter.post('/demo', async (c) => {
  const { code } = await c.req.json().catch(() => ({}));
  const expected = c.env.DEMO_LOGIN_CODE;
  if (!expected || typeof code !== 'string' || code !== expected) {
    return c.json({ error: 'Invalid demo code' }, 401);
  }

  const db = makeDb(c.env.DATABASE_URL);
  const DEMO_SUB = 'reviewer';

  const existingAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, 'demo'), eq(accounts.providerSub, DEMO_SUB)),
  });

  let userId: string;
  if (existingAccount) {
    userId = existingAccount.userId;
    await db.update(users).set({ credits: 50 }).where(eq(users.id, userId));
  } else {
    const [newUser] = await db.insert(users)
      .values({ email: 'reviewer@weave.story', name: 'Reviewer', credits: 50 })
      .returning({ id: users.id });
    await db.insert(accounts).values({ userId: newUser.id, provider: 'demo', providerSub: DEMO_SUB });
    userId = newUser.id;
  }

  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await db.insert(sessions).values({ userId, refreshTokenHash: await hashRefreshToken(rawRefreshToken), expiresAt });

  const accessToken = await signAccessToken(userId, c.env.JWT_SECRET);
  return c.json({ accessToken, refreshToken: rawRefreshToken });
});

// Revoke a session on logout — deletes the server-side refresh token so a leaked
// token can't be reused after the user signs out. Idempotent: always returns ok.
authRouter.post('/logout', async (c) => {
  const { refreshToken } = await c.req.json().catch(() => ({}));
  if (typeof refreshToken === 'string' && refreshToken) {
    const db = makeDb(c.env.DATABASE_URL);
    await db.delete(sessions).where(eq(sessions.refreshTokenHash, await hashRefreshToken(refreshToken)));
  }
  return c.json({ ok: true });
});

authRouter.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ error: 'refreshToken required' }, 400);

  const db = makeDb(c.env.DATABASE_URL);
  const tokenHash = await hashRefreshToken(refreshToken);
  const now = new Date();

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.refreshTokenHash, tokenHash), gt(sessions.expiresAt, now)),
  });

  if (!session) return c.json({ error: 'Invalid or expired refresh token' }, 401);

  const newRawRefreshToken = generateRefreshToken();
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await db.update(sessions)
    .set({ refreshTokenHash: await hashRefreshToken(newRawRefreshToken), expiresAt: newExpiresAt })
    .where(eq(sessions.id, session.id));

  const accessToken = await signAccessToken(session.userId, c.env.JWT_SECRET);
  return c.json({ accessToken, refreshToken: newRawRefreshToken });
});
