import { eq } from 'drizzle-orm';
import { storyBibles } from '../../schema';
import type { DB } from '../../db';
import { StoryBlueprintSchema, type StoryBlueprint } from '../blueprint/blueprint-schema';

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
  desire: string | null;
  wound: string | null;
  canon: string | null;
  blueprint: StoryBlueprint | null;
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
      desire: storyBibles.desire,
      wound: storyBibles.wound,
      canon: storyBibles.canon,
      blueprint: storyBibles.blueprint,
    })
    .from(storyBibles)
    .where(eq(storyBibles.storyId, storyId))
    .limit(1);

  if (!row) return null;

  // blueprint is nullable (older stories predate Phase A) and untyped JSONB — validate
  // defensively; on any mismatch fall back to null so the builder uses legacy behavior.
  const parsedBlueprint = StoryBlueprintSchema.safeParse(row.blueprint);

  return {
    ...row,
    openThreads: Array.isArray(row.openThreads) ? row.openThreads as string[] : [],
    forbiddenPatterns: Array.isArray(row.forbiddenPatterns) ? row.forbiddenPatterns as string[] : [],
    desire: row.desire ?? null,
    wound: row.wound ?? null,
    canon: row.canon ?? null,
    blueprint: parsedBlueprint.success ? parsedBlueprint.data : null,
  };
}
