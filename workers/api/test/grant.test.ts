import { describe, it, expect, afterEach } from 'vitest';
import { hasGrant, applyGrant } from '../src/lib/purchases/grant';
import { testDb, hasTestDb, createUser, getCredits, deleteUser } from './helpers';

const PRODUCT = 'com.leejahun.weavestory.credits_value_10';

describe.skipIf(!hasTestDb)('purchase grant (지급 멱등성)', () => {
  const db = testDb();
  const cleanup: string[] = [];
  afterEach(async () => {
    while (cleanup.length) await deleteUser(db, cleanup.pop()!);
  });

  it('최초 지급은 크레딧을 더하고, 같은 grantKey는 hasGrant로 걸러짐', async () => {
    const u = await createUser(db, { credits: 0 });
    cleanup.push(u.id);
    const key = `tx-${crypto.randomUUID()}`;

    expect(await hasGrant(db, u.id, PRODUCT, key)).toBe(false);

    const r = await applyGrant(db, { userId: u.id, productId: PRODUCT, grantKey: key, credits: 10 });
    expect(r.credits).toBe(10);

    // 동일 결제 재시도 → 라우트가 여기서 조기 반환(이중 지급 방지).
    expect(await hasGrant(db, u.id, PRODUCT, key)).toBe(true);
    expect(await getCredits(db, u.id)).toBe(10);
  });

  it('다른 grantKey는 별개로 지급된다', async () => {
    const u = await createUser(db, { credits: 0 });
    cleanup.push(u.id);

    await applyGrant(db, { userId: u.id, productId: PRODUCT, grantKey: `tx-${crypto.randomUUID()}`, credits: 10 });
    await applyGrant(db, { userId: u.id, productId: PRODUCT, grantKey: `tx-${crypto.randomUUID()}`, credits: 3 });

    expect(await getCredits(db, u.id)).toBe(13);
  });
});
