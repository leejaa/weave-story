import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import type { AppEnv } from '../types';

export const meRouter = new Hono<AppEnv>();

meRouter.use(requireAuth);

meRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, avatarUrl: users.avatarUrl, credits: users.credits })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return c.json({ error: 'Not found' }, 404);
  return c.json(user);
});
