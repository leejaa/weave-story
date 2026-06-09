import type { ChapterOption, ThreadDetail } from '@/lib/types';
import { paginate } from './paginate';

export type ReadingPage =
  | { key: string; type: 'text'; chapterNumber: number; title: string | null; content: string; pageIndex: number; totalPages: number }
  | { key: string; type: 'choice'; chapterNumber: number; situation: string | null; question: string | null; options: ChapterOption[] }
  | { key: string; type: 'generating'; chapterNumber: number }
  | { key: string; type: 'end' };

/** 스레드를 가로 페이저용 페이지 배열로 전개 (text… → 현재 챕터면 choice → 또는 generating → end). */
export function buildPages(thread: ThreadDetail, width: number, height: number): ReadingPage[] {
  const pages: ReadingPage[] = [];
  const chapters = [...thread.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

  for (const ch of chapters) {
    if (ch.status === 'generating' || ch.status === 'failed') {
      pages.push({ key: `gen-${ch.chapterNumber}`, type: 'generating', chapterNumber: ch.chapterNumber });
      continue;
    }
    if (!ch.content) continue;

    const textPages = paginate(ch.content, width, height);
    textPages.forEach((content, i) =>
      pages.push({
        key: `t-${ch.chapterNumber}-${i}`,
        type: 'text',
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content,
        pageIndex: i,
        totalPages: textPages.length,
      }),
    );

    // 결정 지점: 현재 챕터가 ready 이고 선택지가 있으며 아직 완료 전일 때만
    const isDecisionPoint =
      ch.chapterNumber === thread.currentChapter &&
      thread.status !== 'completed' &&
      !!ch.options?.length;
    if (isDecisionPoint && ch.options) {
      pages.push({
        key: `c-${ch.chapterNumber}`,
        type: 'choice',
        chapterNumber: ch.chapterNumber,
        situation: ch.situation,
        question: ch.question,
        options: ch.options,
      });
    }
  }

  if (thread.status === 'completed') {
    pages.push({ key: 'end', type: 'end' });
  }
  return pages;
}
