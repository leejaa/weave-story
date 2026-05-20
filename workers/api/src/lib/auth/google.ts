import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const GOOGLE_ISSUER = 'https://accounts.google.com';

export interface GoogleTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(
  idToken: string,
  iosClientId: string,
  webClientId: string,
): Promise<GoogleTokenPayload> {
  const audiences = [iosClientId, webClientId].filter(Boolean);

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUER,
    audience: audiences,
  });

  if (!payload.sub) throw new Error('Missing sub in Google token');

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
  };
}
