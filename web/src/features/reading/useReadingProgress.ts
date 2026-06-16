import { useCallback, useRef } from 'react';

const storageKey = (threadId: string) => `weave_reading_page_${threadId}`;

export function useReadingProgress(threadId: string) {
  // 복원 시도 전에 save가 0을 써버리는 것을 막기 위한 guard
  const restoredRef = useRef(false);

  const getRestoredOnce = useCallback((): number | null => {
    if (restoredRef.current) return null;
    restoredRef.current = true;
    try {
      const v = localStorage.getItem(storageKey(threadId));
      return v !== null ? parseInt(v, 10) : null;
    } catch {
      return null;
    }
  }, [threadId]);

  const save = useCallback((index: number) => {
    // restoredRef가 true가 되기 전(복원 시도 전)에는 저장하지 않음
    if (!restoredRef.current) return;
    try {
      localStorage.setItem(storageKey(threadId), String(index));
    } catch {}
  }, [threadId]);

  return { getRestoredOnce, save };
}
