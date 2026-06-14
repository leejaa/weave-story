import { eq } from 'drizzle-orm';
import { makeDb } from '../src/lib/db';
import { users, stories, threads, chapters } from '../src/lib/schema';
import type { WorkerEnv } from '../src/types';

// 통합 테스트는 Neon 테스트 브랜치에 대고 실행한다. TEST_DATABASE_URL 미설정 시 skip.
export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? '';
export const hasTestDb = TEST_DB_URL.length > 0;

export function testDb() {
  return makeDb(TEST_DB_URL);
}

// 텔레그램 미설정 → notifyOwner는 no-op. 테스트용 최소 env.
export const fakeEnv = {} as WorkerEnv;

type DB = ReturnType<typeof testDb>;

export async function createUser(
  db: DB,
  opts: { credits?: number; lastDailyClaimDate?: string | null } = {},
) {
  const [u] = await db
    .insert(users)
    .values({
      email: `test-${crypto.randomUUID()}@example.com`,
      credits: opts.credits ?? 0,
      lastDailyClaimDate: opts.lastDailyClaimDate ?? null,
    })
    .returning();
  return u;
}

/** 유저 소유의 story+thread+chapter 한 세트 생성(모더레이션 테스트용). */
export async function createChapterForUser(db: DB, userId: string) {
  const [story] = await db.insert(stories).values({ userId, setupAnswers: {} }).returning();
  const [thread] = await db.insert(threads).values({ userId, storyId: story.id }).returning();
  const [chapter] = await db
    .insert(chapters)
    .values({ threadId: thread.id, chapterNumber: 1, content: 'test content', status: 'ready' })
    .returning();
  return { story, thread, chapter };
}

export async function getCredits(db: DB, userId: string): Promise<number> {
  const [u] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
  return u?.credits ?? -1;
}

// FK 캐스케이드로 stories/threads/chapters/grants까지 함께 삭제됨.
export async function deleteUser(db: DB, userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
