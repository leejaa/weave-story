import { createMiddleware } from 'hono/factory';
import { verifyAccessToken } from '../tokens';
import type { AppEnv } from '../../types';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  const token = auth.slice(7);
  const payload = await verifyAccessToken(token, c.env.JWT_SECRET).catch(() => null);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  c.set('userId', payload.sub);
  await next();
});
