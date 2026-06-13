import { Hono } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { users, accounts } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { revokeAppleRefreshToken } from '../lib/auth/apple-oauth';
import { notifyOwner } from '../lib/notify/owner';
import { kstDateString } from '../lib/time';
import type { AppEnv } from '../types';

// 일일 보상 — KST 날짜당 1회, 1크레딧.
const DAILY_REWARD_CREDITS = 1;

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

// 일일 보상 수령. KST 날짜당 1회만 성공(조건부 UPDATE로 중복 수령 레이스 방지).
meRouter.post('/daily-reward', async (c) => {
  const userId = c.get('userId');
  const db = makeDb(c.env.DATABASE_URL);
  const today = kstDateString();

  const updated = await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${DAILY_REWARD_CREDITS}`,
      lastDailyClaimDate: today,
    })
    .where(and(
      eq(users.id, userId),
      sql`(${users.lastDailyClaimDate} is distinct from ${today})`,
    ))
    .returning({ credits: users.credits });

  if (updated.length === 0) {
    // 이미 오늘 수령함 — 현재 잔액만 반환.
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return c.json({ claimed: false, credits: user?.credits ?? 0, dailyClaimable: false });
  }

  return c.json({ claimed: true, credits: updated[0].credits, granted: DAILY_REWARD_CREDITS, dailyClaimable: false });
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
