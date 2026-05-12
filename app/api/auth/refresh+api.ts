import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sessions } from '@/lib/db/schema';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '@/lib/auth/tokens';

export async function POST(request: Request) {
  const { refreshToken } = await request.json();

  if (!refreshToken) {
    return Response.json({ error: 'refreshToken required' }, { status: 400 });
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const now = new Date();

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.refreshTokenHash, tokenHash), gt(sessions.expiresAt, now)),
  });

  if (!session) {
    return Response.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  // Rotate refresh token
  const newRawRefreshToken = generateRefreshToken();
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await db
    .update(sessions)
    .set({ refreshTokenHash: hashRefreshToken(newRawRefreshToken), expiresAt: newExpiresAt })
    .where(eq(sessions.id, session.id));

  const accessToken = await signAccessToken(session.userId);

  return Response.json({ accessToken, refreshToken: newRawRefreshToken });
}
