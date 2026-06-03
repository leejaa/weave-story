import { Hono } from 'hono';
import { eq, and, gt } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, accounts, sessions } from '../lib/schema';
import { verifyAppleIdentityToken } from '../lib/auth/apple';
import { exchangeAppleAuthCode } from '../lib/auth/apple-oauth';
import { verifyGoogleIdToken } from '../lib/auth/google';
import { signAccessToken, generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from '../lib/tokens';
import type { AppEnv } from '../types';

export const authRouter = new Hono<AppEnv>();

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
