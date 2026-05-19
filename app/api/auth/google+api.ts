import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users, accounts, sessions } from '@/lib/db/schema';
import { verifyGoogleIdToken } from '@/lib/auth/google';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '@/lib/auth/tokens';

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return Response.json({ error: 'idToken required' }, { status: 400 });
  }

  const googlePayload = await verifyGoogleIdToken(idToken).catch(() => null);
  if (!googlePayload) {
    return Response.json({ error: 'Invalid Google token' }, { status: 401 });
  }

  const { sub: googleSub, email, name, picture } = googlePayload;

  const existingAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, 'google'), eq(accounts.providerSub, googleSub)),
    with: { user: true },
  });

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
    await db
      .update(users)
      .set({ email: email ?? null, name: name ?? null, avatarUrl: picture ?? null })
      .where(eq(users.id, userId));
  } else {
    const [newUser] = await db
      .insert(users)
      .values({ email: email ?? null, name: name ?? null, avatarUrl: picture ?? null })
      .returning({ id: users.id });

    await db.insert(accounts).values({
      userId: newUser.id,
      provider: 'google',
      providerSub: googleSub,
    });

    userId = newUser.id;
  }

  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await db.insert(sessions).values({
    userId,
    refreshTokenHash: hashRefreshToken(rawRefreshToken),
    expiresAt,
  });

  const accessToken = await signAccessToken(userId);

  return Response.json({ accessToken, refreshToken: rawRefreshToken });
}
