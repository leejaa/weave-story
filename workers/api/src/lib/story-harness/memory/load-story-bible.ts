import { eq } from 'drizzle-orm';
import { storyBibles } from '../../schema';
import type { DB } from '../../db';

export type StoryBibleSnapshot = {
  logline: string;
  genre: string;
  tone: string;
  protagonist: string;
  centralConflict: string;
  readerPromise: string;
  openingThreat: string;
  openThreads: string[];
  forbiddenPatterns: string[];
} | null;

export async function loadStoryBible(db: DB, storyId: string): Promise<StoryBibleSnapshot> {
  const [row] = await db
    .select({
      logline: storyBibles.logline,
      genre: storyBibles.genre,
      tone: storyBibles.tone,
      protagonist: storyBibles.protagonist,
      centralConflict: storyBibles.centralConflict,
      readerPromise: storyBibles.readerPromise,
      openingThreat: storyBibles.openingThreat,
      openThreads: storyBibles.openThreads,
      forbiddenPatterns: storyBibles.forbiddenPatterns,
    })
    .from(storyBibles)
    .where(eq(storyBibles.storyId, storyId))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    openThreads: Array.isArray(row.openThreads) ? row.openThreads as string[] : [],
    forbiddenPatterns: Array.isArray(row.forbiddenPatterns) ? row.forbiddenPatterns as string[] : [],
  };
}
