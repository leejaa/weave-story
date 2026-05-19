import { db } from '@/lib/db/client';
import { chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateChapterSummary } from '@/lib/ai/story-generation';

/**
 * Fire-and-forget: generates a summary for the given chapter and stores it.
 * Call without await — failures are logged but never propagate.
 */
export function fireSummarizeChapter(
  chapterId: string,
  content: string,
  chapterNumber: number,
  threadId: string,
): void {
  ;(async () => {
    try {
      const summary = await generateChapterSummary(content, chapterNumber, threadId);
      await db.update(chapters).set({ summary }).where(eq(chapters.id, chapterId));
    } catch (err) {
      console.error(`[summary] failed chapter=${chapterNumber} thread=${threadId}`, err);
    }
  })();
}
