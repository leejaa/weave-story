import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { hideChapter } from '../src/lib/moderation/enforce';
import { chapters } from '../src/lib/schema';
import { testDb, hasTestDb, fakeEnv, createUser, createChapterForUser, getCredits, deleteUser } from './helpers';

describe.skipIf(!hasTestDb)('hideChapter (모더레이션 숨김 + 크레딧)', () => {
  const db = testDb();
  const cleanup: string[] = [];
  afterEach(async () => {
    while (cleanup.length) await deleteUser(db, cleanup.pop()!);
  });

  it('생성 분류기 숨김(generation)은 크레딧 1 환원 + 멱등', async () => {
    const u = await createUser(db, { credits: 5 });
    cleanup.push(u.id);
    const { chapter } = await createChapterForUser(db, u.id);

    await hideChapter(fakeEnv, db, chapter.id, { source: 'generation', detail: 'test' });

    const [c1] = await db.select().from(chapters).where(eq(chapters.id, chapter.id));
    expect(c1.moderationStatus).toBe('hidden');
    expect(await getCredits(db, u.id)).toBe(6); // 5 + 1 환원

    // 멱등 — 이미 hidden이면 추가 환원 없음.
    await hideChapter(fakeEnv, db, chapter.id, { source: 'generation', detail: 'test again' });
    expect(await getCredits(db, u.id)).toBe(6);
  });

  it('신고 기반 숨김(reports)은 크레딧 환원 안 함', async () => {
    const u = await createUser(db, { credits: 5 });
    cleanup.push(u.id);
    const { chapter } = await createChapterForUser(db, u.id);

    await hideChapter(fakeEnv, db, chapter.id, { source: 'reports', detail: 'test' });

    const [c1] = await db.select().from(chapters).where(eq(chapters.id, chapter.id));
    expect(c1.moderationStatus).toBe('hidden');
    expect(await getCredits(db, u.id)).toBe(5); // 변화 없음
  });
});
