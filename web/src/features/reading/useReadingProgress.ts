import { useCallback, useRef } from 'react';

const storageKey = (threadId: string) => `weave_reading_page_${threadId}`;

export function useReadingProgress(threadId: string) {
  const restoredRef = useRef(false);

  const getRestoredOnce = useCallback((): number | null => {
    if (restoredRef.current) return null;
    restoredRef.current = true;
    try {
      const v = sessionStorage.getItem(storageKey(threadId));
      return v !== null ? parseInt(v, 10) : null;
    } catch {
      return null;
    }
  }, [threadId]);

  const save = useCallback((index: number) => {
    try {
      sessionStorage.setItem(storageKey(threadId), String(index));
    } catch {}
  }, [threadId]);

  return { getRestoredOnce, save };
}
