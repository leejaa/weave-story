import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, accounts } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { revokeAppleRefreshToken } from '../lib/auth/apple-oauth';
import { notifyOwner } from '../lib/notify/owner';
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

// Permanently delete the account and ALL associated data (Apple Guideline 5.1.1(v)).
// Cascading FKs remove stories, threads, chapters, purchase grants, sessions, etc.
meRouter.delete('/', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  // 알림용으로 삭제 전에 식별 정보 확보.
  const [deleting] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId));

  // Sever the Sign in with Apple link (best-effort) before deleting the row.
  const appleAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, 'apple')),
  });
  if (appleAccount?.appleRefreshToken) {
    await revokeAppleRefreshToken(appleAccount.appleRefreshToken, c.env);
  }

  await db.delete(users).where(eq(users.id, userId));
  c.executionCtx.waitUntil(notifyOwner(c.env, `👋 회원 탈퇴\nuser: ${deleting?.email ?? deleting?.name ?? userId}`));
  return c.json({ ok: true });
});
