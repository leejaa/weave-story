import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { revokeGrantByKey } from '../src/lib/purchases/revoke';
import { purchaseGrants } from '../src/lib/schema';
import { testDb, hasTestDb, fakeEnv, createUser, getCredits, deleteUser } from './helpers';

async function addGrant(db: ReturnType<typeof testDb>, userId: string, key: string, credits: number) {
  await db.insert(purchaseGrants).values({
    userId,
    productId: 'com.leejahun.weavestory.credits_starter_3',
    rcPurchaseDateMs: key,
    creditsGranted: credits,
  });
}

describe.skipIf(!hasTestDb)('revokeGrantByKey (환불)', () => {
  const db = testDb();
  const cleanup: string[] = [];
  afterEach(async () => {
    while (cleanup.length) await deleteUser(db, cleanup.pop()!);
  });

  it('크레딧을 차감하고 grant를 refunded로 표시, 재호출은 멱등', async () => {
    const u = await createUser(db, { credits: 10 });
    cleanup.push(u.id);
    const key = `tx-${crypto.randomUUID()}`;
    await addGrant(db, u.id, key, 3);

    const first = await revokeGrantByKey(fakeEnv, db, key, 'apple');
    expect(first.revoked).toBe(true);
    expect(await getCredits(db, u.id)).toBe(7);

    const [g] = await db.select().from(purchaseGrants).where(eq(purchaseGrants.rcPurchaseDateMs, key));
    expect(g.status).toBe('refunded');
    expect(g.refundedAt).not.toBeNull();

    // 멱등 — 두 번째 호출은 회수 안 함.
    const second = await revokeGrantByKey(fakeEnv, db, key, 'apple');
    expect(second.revoked).toBe(false);
    expect(await getCredits(db, u.id)).toBe(7);
  });

  it('잔액이 부족하면 0으로 바닥 처리(음수 방지)', async () => {
    const u = await createUser(db, { credits: 1 });
    cleanup.push(u.id);
    const key = `tx-${crypto.randomUUID()}`;
    await addGrant(db, u.id, key, 3);

    const r = await revokeGrantByKey(fakeEnv, db, key, 'google');
    expect(r.revoked).toBe(true);
    expect(await getCredits(db, u.id)).toBe(0);
  });

  it('존재하지 않는 grantKey는 no-op', async () => {
    const r = await revokeGrantByKey(fakeEnv, db, `missing-${crypto.randomUUID()}`, 'apple');
    expect(r.revoked).toBe(false);
  });
});
