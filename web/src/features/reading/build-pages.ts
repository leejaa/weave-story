import type { ChapterOption, Intervention, ThreadDetail } from '@/lib/types';
import { paginate } from './paginate';

export type ReadingPage =
  | { key: string; type: 'text'; chapterNumber: number; title: string | null; content: string; pageIndex: number; totalPages: number }
  | { key: string; type: 'entry'; chapterNumber: number; situation: string | null; question: string | null }
  | { key: string; type: 'choice'; chapterNumber: number; situation: string | null; question: string | null; options: ChapterOption[] }
  | { key: string; type: 'intervention'; chapterNumber: number; text: string }
  | { key: string; type: 'generating'; chapterNumber: number }
  | { key: string; type: 'error'; chapterNumber: number }
  | { key: string; type: 'end' };

function interventionText(thread: ThreadDetail, iv: Intervention): string {
  if (iv.type === 'free_input') return iv.freeText ?? '';
  const ch = thread.chapters.find((c) => c.chapterNumber === iv.chapterNumber);
  return ch?.options?.find((o) => o.index === iv.choiceIndex)?.text ?? '';
}

/**
 * 스레드를 가로 페이저용 페이지 배열로 전개:
 *   각 챕터 [text…] → (과거 선택했으면) intervention 구분선 / (현재 결정 지점이면) entry + choice
 *   생성 중이면 generating, 실패면 error, 완료면 마지막에 end.
 */
export function buildPages(thread: ThreadDetail, width: number, height: number): ReadingPage[] {
  const pages: ReadingPage[] = [];
  const chapters = [...thread.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const ivByChapter = new Map(thread.interventions.map((iv) => [iv.chapterNumber, iv]));

  for (const ch of chapters) {
    if (ch.status === 'failed') {
      pages.push({ key: `err-${ch.chapterNumber}`, type: 'error', chapterNumber: ch.chapterNumber });
      continue;
    }
    if (ch.status === 'generating') {
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

    const iv = ivByChapter.get(ch.chapterNumber);
    const isDecisionPoint =
      ch.chapterNumber === thread.currentChapter &&
      thread.status !== 'completed' &&
      !!ch.options?.length;

    if (iv) {
      // 이미 선택한 과거 챕터 → "당신의 선택" 구분선
      pages.push({
        key: `iv-${ch.chapterNumber}`,
        type: 'intervention',
        chapterNumber: ch.chapterNumber,
        text: interventionText(thread, iv),
      });
    } else if (isDecisionPoint && ch.options) {
      pages.push({ key: `e-${ch.chapterNumber}`, type: 'entry', chapterNumber: ch.chapterNumber, situation: ch.situation, question: ch.question });
      pages.push({ key: `c-${ch.chapterNumber}`, type: 'choice', chapterNumber: ch.chapterNumber, situation: ch.situation, question: ch.question, options: ch.options });
    }
  }

  if (thread.status === 'completed') {
    pages.push({ key: 'end', type: 'end' });
  }
  return pages;
}
