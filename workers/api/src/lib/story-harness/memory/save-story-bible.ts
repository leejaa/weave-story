import { storyBibles } from '../../schema';
import type { DB } from '../../db';
import type { StoryBibleLite } from '../drafting/first-chapter-package-schema';

type Params = {
  db: DB;
  storyId: string;
  bible: StoryBibleLite;
};

export async function saveStoryBible({ db, storyId, bible }: Params): Promise<void> {
  await db
    .insert(storyBibles)
    .values({
      storyId,
      logline: bible.logline,
      genre: bible.genre,
      tone: bible.tone,
      protagonist: bible.protagonist,
      centralConflict: bible.centralConflict,
      readerPromise: bible.readerPromise,
      openingThreat: bible.openingThreat,
      openThreads: bible.openThreads,
      forbiddenPatterns: bible.forbiddenPatterns,
      desire: bible.desire ?? null,
      wound: bible.wound ?? null,
      canon: bible.canon ?? null,
    })
    .onConflictDoUpdate({
      target: storyBibles.storyId,
      set: {
        logline: bible.logline,
        genre: bible.genre,
        tone: bible.tone,
        protagonist: bible.protagonist,
        centralConflict: bible.centralConflict,
        readerPromise: bible.readerPromise,
        openingThreat: bible.openingThreat,
        openThreads: bible.openThreads,
        forbiddenPatterns: bible.forbiddenPatterns,
        desire: bible.desire ?? null,
        wound: bible.wound ?? null,
        canon: bible.canon ?? null,
      },
    });
}
