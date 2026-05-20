import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_BUNDLE_ID = 'com.leejahun.weavestory';

export interface AppleTokenPayload {
  sub: string;
  email?: string;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleTokenPayload> {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: APPLE_BUNDLE_ID,
  });

  if (!payload.sub) throw new Error('Missing sub in Apple token');

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
  };
}
