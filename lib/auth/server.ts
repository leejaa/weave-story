import { verifyAccessToken } from './tokens';

export async function getAuthUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const payload = await verifyAccessToken(token).catch(() => null);
  return payload?.sub ?? null;
}
