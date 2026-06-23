import { eq } from 'drizzle-orm';
import { storyBibles, stories } from '../../schema';
import type { DB } from '../../db';
import type { StoryBlueprint } from './blueprint-schema';

// Persist the blueprint onto the (already-inserted) story_bibles row, and reconcile the
// story's genre label to the blueprint's single locked genre. (The draft and structure
// steps can disagree on the genre label; the blueprint is the single source of truth.)
export async function saveStoryBlueprint(params: {
  db: DB;
  storyId: string;
  blueprint: StoryBlueprint;
}): Promise<void> {
  await params.db
    .update(storyBibles)
    .set({ blueprint: params.blueprint })
    .where(eq(storyBibles.storyId, params.storyId));

  await params.db
    .update(stories)
    .set({ genre: params.blueprint.genre })
    .where(eq(stories.id, params.storyId));
}
