import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth/client/api';
import type { ThreadDetail, Chapter } from '@/lib/api/types';

export function useThreadDetail(threadId: string) {
  const [data, setData] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authFetch(`/api/threads/${threadId}`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [threadId]);

  const choose = useCallback(
    async (chapterNumber: number, choiceIndex: number): Promise<Chapter | null> => {
      setChoosing(true);
      try {
        const res = await authFetch(`/api/threads/${threadId}/choose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterNumber, choiceIndex }),
        });
        const { chapter, thread } = await res.json();
        setData(prev =>
          prev ? { ...prev, ...thread, chapter: chapter ?? null } : prev,
        );
        return chapter ?? null;
      } finally {
        setChoosing(false);
      }
    },
    [threadId],
  );

  return { data, loading, error, choosing, choose };
}
