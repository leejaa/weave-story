import { useCallback, useMemo } from 'react';
import { useThreadDetail } from '@/hooks/use-thread-detail';
import type { ChapterOption } from '@/lib/api/types';

export function useReadingChoice(threadId: string, chapterNumberParam?: string | string[]) {
  const detail = useThreadDetail(threadId);
  const chooseChapter = detail.choose;
  const chapterNumber = Number(Array.isArray(chapterNumberParam) ? chapterNumberParam[0] : chapterNumberParam);

  const chapter = useMemo(() => {
    if (!detail.data) return null;
    const requested = Number.isFinite(chapterNumber)
      ? detail.data.chapters.find(ch => ch.chapterNumber === chapterNumber)
      : null;
    return requested ?? detail.data.chapters.find(ch => ch.chapterNumber === detail.data.currentChapter) ?? null;
  }, [chapterNumber, detail.data]);

  const options = useMemo(
    () => (chapter?.options ?? []) as ChapterOption[],
    [chapter?.options],
  );

  const choose = useCallback(
    async (
      selectedChapterNumber: number,
      selection: { choiceIndex: number } | { customInput: string },
    ) => {
      await chooseChapter(selectedChapterNumber, selection);
    },
    [chooseChapter],
  );

  return {
    ...detail,
    chapter,
    options,
    choose,
  };
}
