import type { ChapterSummaryEntry } from '../ai/story-generation';

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

export function buildChapterContext(allPrev: PrevChapterRow[], chapterNumber: number): ChapterContext {
  const current = allPrev.find(c => c.chapterNumber === chapterNumber);
  const older = allPrev.filter(c => c.chapterNumber < chapterNumber && c.content);

  const previousChaptersSummaries = older.map(ch => ({
    chapterNumber: ch.chapterNumber,
    summary: ch.summary ?? ch.content!.slice(0, 300) + (ch.content!.length > 300 ? '…' : ''),
  }));

  return { current, previousChaptersSummaries };
}
