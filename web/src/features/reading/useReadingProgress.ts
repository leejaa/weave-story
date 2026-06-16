import { useCallback, useRef } from 'react';

const storageKey = (threadId: string) => `weave_reading_page_${threadId}`;

function readSavedIndex(threadId: string): number | null {
  try {
    const v = localStorage.getItem(storageKey(threadId));
    return v !== null ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}

export function useReadingProgress(threadId: string) {
  // 마운트 시점에 동기적으로 읽어 targetIndex useState 초기값으로 쓴다.
  // 이렇게 해야 ReadingPager의 첫 렌더가 이미 올바른 페이지에서 시작하여
  // "0페이지 → savedPage 애니메이션" 플리커가 사라진다.
  const initialIndexRef = useRef<number | null | 'unread'>('unread');
  if (initialIndexRef.current === 'unread') {
    initialIndexRef.current = readSavedIndex(threadId);
  }

  const restoredRef = useRef(false);

  const getRestoredOnce = useCallback((): number | null => {
    if (restoredRef.current) return null;
    restoredRef.current = true;
    const v = initialIndexRef.current;
    return typeof v === 'number' ? v : null;
  }, []);

  const save = useCallback((index: number) => {
    if (!restoredRef.current) return;
    try {
      localStorage.setItem(storageKey(threadId), String(index));
    } catch {}
  }, [threadId]);

  return {
    initialIndex: typeof initialIndexRef.current === 'number' ? initialIndexRef.current : null,
    getRestoredOnce,
    save,
  };
}
