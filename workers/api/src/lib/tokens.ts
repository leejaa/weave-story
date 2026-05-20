import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_BYTES = 40;

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function signAccessToken(userId: string, jwtSecret: string): Promise<string> {
  const secret = new TextEncoder().encode(jwtSecret);
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);
}

export async function verifyAccessToken(token: string, jwtSecret: string): Promise<{ sub: string }> {
  const secret = new TextEncoder().encode(jwtSecret);
  const { payload } = await jwtVerify(token, secret);
  return { sub: payload.sub as string };
}

export function generateRefreshToken(): string {
  const bytes = new Uint8Array(REFRESH_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashRefreshToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
