import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, accounts } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { revokeAppleRefreshToken } from '../lib/auth/apple-oauth';
import { notifyOwner } from '../lib/notify/owner';
import { kstDateString } from '../lib/time';
import { claimDailyReward, DAILY_REWARD_CREDITS } from '../lib/rewards/daily';
import type { AppEnv } from '../types';

export const meRouter = new Hono<AppEnv>();

meRouter.use(requireAuth);

meRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      credits: users.credits,
      lastDailyClaimDate: users.lastDailyClaimDate,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return c.json({ error: 'Not found' }, 404);

  const { lastDailyClaimDate, ...rest } = user;
  return c.json({ ...rest, dailyClaimable: lastDailyClaimDate !== kstDateString() });
});

// 일일 보상 수령. KST 날짜당 1회만 성공.
meRouter.post('/daily-reward', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);

  const { claimed, credits } = await claimDailyReward(db, userId, kstDateString());
  return c.json({
    claimed,
    credits,
    granted: claimed ? DAILY_REWARD_CREDITS : 0,
    dailyClaimable: false,
  });
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
