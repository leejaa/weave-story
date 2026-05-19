import { db } from '@/lib/db/client';
import { chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateNextChapter, type ContinuationContext } from '@/lib/ai/story-generation';
import { fireSummarizeChapter } from '@/lib/ai/summarize-chapter';

type Params = {
  chapterId: string;
  genCtx: ContinuationContext;
};

/**
 * Fire-and-forget: generates the next chapter in the background, saves it, then
 * triggers async summary generation. Marks the chapter as 'failed' on error.
 */
export function fireGenerateChapter({ chapterId, genCtx }: Params): void {
  const { threadId = '?', nextChapterNumber } = genCtx;
  const tag = `[choose] bg thread=${threadId} chapter=${nextChapterNumber}`;

  ;(async () => {
    const startMs = Date.now();
    try {
      const generated = await generateNextChapter(genCtx);

      await db
        .update(chapters)
        .set({
          title: generated.chapterTitle,
          content: generated.content,
          situation: generated.situation || null,
          question: generated.question || null,
          status: 'ready',
          options: generated.choices.length > 0
            ? generated.choices.map((text, index) => ({ index, text }))
            : null,
        })
        .where(eq(chapters.id, chapterId));

      fireSummarizeChapter(chapterId, generated.content, nextChapterNumber, threadId);

      console.log(`${tag} done content=${generated.content.length} elapsed=${Date.now() - startMs}ms`);
    } catch (err) {
      console.error(`${tag} error elapsed=${Date.now() - startMs}ms`, err);
      await db.update(chapters).set({ status: 'failed' }).where(eq(chapters.id, chapterId));
    }
  })();
}
