import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users, accounts, sessions } from '@/lib/db/schema';
import { verifyAppleIdentityToken } from '@/lib/auth/apple';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '@/lib/auth/tokens';

export async function POST(request: Request) {
  const { identityToken, fullName } = await request.json();

  if (!identityToken) {
    return Response.json({ error: 'identityToken required' }, { status: 400 });
  }

  const applePayload = await verifyAppleIdentityToken(identityToken).catch(() => null);
  if (!applePayload) {
    return Response.json({ error: 'Invalid Apple token' }, { status: 401 });
  }

  const { sub: appleSub, email } = applePayload;

  // Find existing account
  const existingAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, 'apple'), eq(accounts.providerSub, appleSub)),
    with: { user: true },
  });

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
  } else {
    // Create new user + account
    const name =
      fullName?.givenName && fullName?.familyName
        ? `${fullName.givenName} ${fullName.familyName}`.trim()
        : (fullName?.givenName ?? null);

    const [newUser] = await db
      .insert(users)
      .values({ email: email ?? null, name })
      .returning({ id: users.id });

    await db.insert(accounts).values({
      userId: newUser.id,
      provider: 'apple',
      providerSub: appleSub,
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
