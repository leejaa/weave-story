import { describe, it, expect, afterEach } from 'vitest';
import { claimDailyReward } from '../src/lib/rewards/daily';
import { testDb, hasTestDb, createUser, getCredits, deleteUser } from './helpers';

describe.skipIf(!hasTestDb)('claimDailyReward', () => {
  const db = testDb();
  const cleanup: string[] = [];
  afterEach(async () => {
    while (cleanup.length) await deleteUser(db, cleanup.pop()!);
  });

  it('첫 수령은 +1, 같은 날 재수령은 no-op', async () => {
    const u = await createUser(db, { credits: 5, lastDailyClaimDate: null });
    cleanup.push(u.id);

    const first = await claimDailyReward(db, u.id, '2026-06-14');
    expect(first.claimed).toBe(true);
    expect(first.credits).toBe(6);

    const second = await claimDailyReward(db, u.id, '2026-06-14');
    expect(second.claimed).toBe(false);
    expect(second.credits).toBe(6);

    expect(await getCredits(db, u.id)).toBe(6);
  });

  it('날짜가 바뀌면 다시 수령 가능', async () => {
    const u = await createUser(db, { credits: 0, lastDailyClaimDate: '2026-06-13' });
    cleanup.push(u.id);

    const r = await claimDailyReward(db, u.id, '2026-06-14');
    expect(r.claimed).toBe(true);
    expect(r.credits).toBe(1);
  });
});
