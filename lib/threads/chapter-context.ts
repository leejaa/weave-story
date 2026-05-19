import type { ChapterSummaryEntry } from '@/lib/ai/story-generation';

export type PrevChapterRow = {
  chapterNumber: number;
  options: unknown;
  content: string | null;
  summary: string | null;
};

export type ChapterContext = {
  current: PrevChapterRow | undefined;
  previousChaptersSummaries: ChapterSummaryEntry[];
};

/**
 * Given all chapters up to and including `chapterNumber`, returns:
 * - `current`: the chapter the user is choosing from
 * - `previousChaptersSummaries`: summarized context for all earlier chapters
 *
 * Falls back to the first 300 chars of content when a summary is not yet generated.
 */
export function buildChapterContext(
  allPrev: PrevChapterRow[],
  chapterNumber: number,
): ChapterContext {
  const current = allPrev.find(c => c.chapterNumber === chapterNumber);
  const older = allPrev.filter(c => c.chapterNumber < chapterNumber && c.content);

  const previousChaptersSummaries = older.map(ch => ({
    chapterNumber: ch.chapterNumber,
    summary: ch.summary ?? ch.content!.slice(0, 300) + (ch.content!.length > 300 ? '…' : ''),
  }));

  return { current, previousChaptersSummaries };
}
