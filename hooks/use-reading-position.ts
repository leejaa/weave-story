import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlatList } from 'react-native';
import type { RefObject } from 'react';
import { getSavedReadingPageKey, saveReadingPageKey } from '@/lib/reading/reading-position-storage';
import type { PageItem } from '@/lib/reading/types';

type Params = {
  threadId: string;
  pages: PageItem[];
  fallbackIndex: number;
  listWidth: number;
  listHeight: number;
  listRef: RefObject<FlatList | null>;
};

type ViewablePage = {
  item: PageItem;
  index?: number | null;
};

function clampIndex(index: number, pages: PageItem[]): number {
  if (pages.length === 0) return 0;
  return Math.max(0, Math.min(index, pages.length - 1));
}

export function useReadingPosition({
  threadId,
  pages,
  fallbackIndex,
  listWidth,
  listHeight,
  listRef,
}: Params) {
  const [savedPageKey, setSavedPageKey] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const hasScrolledToRestoreRef = useRef(false);

  useEffect(() => {
    let active = true;
    hasScrolledToRestoreRef.current = false;
    setIsRestoring(true);

    getSavedReadingPageKey(threadId)
      .then(pageKey => {
        if (!active) return;
        setSavedPageKey(pageKey);
      })
      .catch(() => {
        if (!active) return;
        setSavedPageKey(null);
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [threadId]);

  const initialIndex = useMemo(() => {
    const savedIndex = savedPageKey
      ? pages.findIndex(page => page.key === savedPageKey)
      : -1;

    return clampIndex(savedIndex >= 0 ? savedIndex : fallbackIndex, pages);
  }, [fallbackIndex, pages, savedPageKey]);

  useEffect(() => {
    if (isRestoring || hasScrolledToRestoreRef.current || pages.length === 0 || listWidth <= 0 || listHeight <= 0) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
      hasScrolledToRestoreRef.current = true;
    });
  }, [initialIndex, isRestoring, listHeight, listRef, listWidth, pages.length]);

  const handleVisiblePageChange = useCallback((viewablePages: ViewablePage[]) => {
    const firstPage = viewablePages.find(page => page.index != null)?.item ?? viewablePages[0]?.item;
    if (!firstPage) return;
    void saveReadingPageKey(threadId, firstPage.key);
  }, [threadId]);

  const handleScrollToIndexFailed = useCallback(({ index }: { index: number }) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: clampIndex(index, pages) * listWidth,
        animated: false,
      });
    });
  }, [listRef, listWidth, pages]);

  return {
    initialIndex,
    isRestoring,
    handleVisiblePageChange,
    handleScrollToIndexFailed,
  };
}
