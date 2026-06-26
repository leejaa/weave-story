import type { Chapter, ChapterOption, Intervention } from '@/lib/api/types';
import { calcCharsPerPage, paginateText } from '@/lib/reading/paginate';
import type { PageItem } from '@/lib/reading/types';

export function buildPages(
  allChapters: Chapter[],
  allInterventions: Intervention[],
  currentChapterNumber: number,
  isCompleted: boolean,
  width: number,
  listHeight: number,
  prompt?: string | null,
): { pages: PageItem[]; startIndex: number } {
  const pages: PageItem[] = [];
  let startIndex = 0;

  // 1화 앞 표지: 이 이야기를 만든 원본 프롬프트. 있으면 항상 맨 앞 한 장.
  const hasPrompt = !!prompt?.trim();
  if (hasPrompt) {
    pages.push({ key: 'prompt-cover', type: 'prompt', prompt: prompt!.trim() });
  }

  // Latest intervention per chapter (sorted by createdAt ASC so later entries win on retry)
  const ivByChapter = new Map<number, Intervention>();
  for (const iv of allInterventions) {
    ivByChapter.set(iv.chapterNumber, iv);
  }

  for (let i = 0; i < allChapters.length; i++) {
    const ch = allChapters[i];
    const isCurrentChapter = ch.chapterNumber === currentChapterNumber;

    if (isCurrentChapter) startIndex = pages.length;

    if (ch.status === 'generating') {
      pages.push({ key: `ch${ch.chapterNumber}-gen`, type: 'generating', chapterNumber: ch.chapterNumber });
      continue;
    }

    if (ch.status === 'failed') {
      // Show previous chapter's choice UI so user can retry generation
      const prevCh = allChapters[i - 1];
      const prevOptions = prevCh?.options as ChapterOption[] | null;
      if (prevCh && prevOptions?.length) {
        pages.push({
          key: `ch${ch.chapterNumber}-retry`,
          type: 'choice',
          chapterNumber: prevCh.chapterNumber,
          options: prevOptions,
          situation: prevCh.situation ?? null,
          question: prevCh.question ?? null,
        });
      }
      continue;
    }

    // 모더레이션 숨김 챕터: 본문이 없으므로(서버에서 스크럽됨) 안내 페이지로 대체.
    if (ch.moderationStatus === 'hidden') {
      pages.push({ key: `ch${ch.chapterNumber}-hidden`, type: 'hidden', chapterNumber: ch.chapterNumber });
      continue;
    }

    if (!ch.content) continue;

    const charsFirst = calcCharsPerPage(width, listHeight, true);
    const charsRest = calcCharsPerPage(width, listHeight, false);
    const textPages = paginateText(ch.content, charsFirst, charsRest);

    textPages.forEach((content, j) => {
      pages.push({
        key: `ch${ch.chapterNumber}-p${j}`,
        type: 'text',
        chapterNumber: ch.chapterNumber,
        content,
        pageIndex: j,
        totalPages: textPages.length,
        chapterTitle: ch.title,
      });
    });

    const nextCh = allChapters[i + 1];
    const iv = ivByChapter.get(ch.chapterNumber);

    if (iv && nextCh?.status === 'ready' && nextCh.content) {
      // Show what the user chose between this chapter and the next
      let choiceText: string;
      if (iv.type === 'free_input') {
        choiceText = iv.freeText ?? '';
      } else {
        const opts = (ch.options as ChapterOption[] | null) ?? [];
        choiceText = opts.find(o => o.index === iv.choiceIndex)?.text ?? '';
      }
      if (choiceText) {
        pages.push({
          key: `ch${ch.chapterNumber}-iv`,
          type: 'intervention',
          chapterNumber: ch.chapterNumber,
          text: choiceText,
        });
      }
    } else if (isCurrentChapter && (ch.options as ChapterOption[] | null)?.length) {
      // Current chapter, user hasn't chosen yet
      pages.push({
        key: `ch${ch.chapterNumber}-choice`,
        type: 'choice',
        chapterNumber: ch.chapterNumber,
        options: ch.options as ChapterOption[],
        situation: ch.situation ?? null,
        question: ch.question ?? null,
      });
    }
  }

  if (isCompleted && pages[pages.length - 1]?.type !== 'end') {
    pages.push({ key: 'end', type: 'end' });
  }

  // 아직 1화에 머무는 첫 진입에는 표지(프롬프트)부터 보여준다(저장된 위치가 우선).
  if (hasPrompt && currentChapterNumber === 1) startIndex = 0;

  return { pages, startIndex };
}
