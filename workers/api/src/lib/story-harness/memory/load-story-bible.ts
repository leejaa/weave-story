import { eq } from 'drizzle-orm';
import { storyBibles } from '../../schema';
import type { DB } from '../../db';
import { StoryBlueprintSchema, type StoryBlueprint } from '../blueprint/blueprint-schema';
import { StoryOutlineSchema, type StoryOutline } from '../outline/outline-schema';

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
  // Phase B: 전체 아웃라인(신규 스토리). 없으면 null → Phase A blueprint 또는 레거시 폴백.
  outline: StoryOutline | null;
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

  // blueprint 컬럼은 untyped JSONB. Phase B 아웃라인을 먼저 시도하고, 아니면 Phase A blueprint,
  // 둘 다 아니면 null(레거시 폴백). 신규=outline, 구버전=blueprint.
  const parsedOutline = StoryOutlineSchema.safeParse(row.blueprint);
  const parsedBlueprint = parsedOutline.success ? null : StoryBlueprintSchema.safeParse(row.blueprint);

  return {
    ...row,
    openThreads: Array.isArray(row.openThreads) ? row.openThreads as string[] : [],
    forbiddenPatterns: Array.isArray(row.forbiddenPatterns) ? row.forbiddenPatterns as string[] : [],
    desire: row.desire ?? null,
    wound: row.wound ?? null,
    canon: row.canon ?? null,
    outline: parsedOutline.success ? parsedOutline.data : null,
    blueprint: parsedBlueprint && parsedBlueprint.success ? parsedBlueprint.data : null,
  };
}
