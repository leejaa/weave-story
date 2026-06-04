import { Hono } from 'hono';
import { makeDb } from '../lib/db';
import { pushTokens } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import type { AppEnv } from '../types';

export const pushRouter = new Hono<AppEnv>();

pushRouter.use(requireAuth);

// Register (or re-assign) an Expo push token for the signed-in user's device.
pushRouter.post('/register', async (c) => {
  const userId = c.get('userId');
  const body = (await c.req.json()) as { token?: unknown; platform?: unknown };
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : null;

  if (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken')) {
    return c.json({ error: 'invalid token' }, 400);
  }

  const db = makeDb(c.env.DATABASE_URL);
  await db
    .insert(pushTokens)
    .values({ userId, token, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId, platform, updatedAt: new Date() },
    });

  return c.json({ ok: true });
});
