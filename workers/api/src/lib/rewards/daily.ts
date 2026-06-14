import { and, eq, sql } from 'drizzle-orm';
import { users } from '../schema';
import type { DB } from '../db';

// 일일 보상 — KST 날짜당 1회, 1크레딧.
export const DAILY_REWARD_CREDITS = 1;

/**
 * 일일 보상 수령. 조건부 UPDATE(오늘과 다를 때만)로 중복 수령 레이스를 막는다.
 * 신규 유저(last_daily_claim_date NULL)는 `is distinct from`으로 정상 수령된다.
 */
export async function claimDailyReward(
  db: DB,
  userId: string,
  today: string,
): Promise<{ claimed: boolean; credits: number }> {
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
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    return { claimed: false, credits: user?.credits ?? 0 };
  }

  return { claimed: true, credits: updated[0].credits };
}
