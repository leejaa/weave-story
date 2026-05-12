import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client/api';
import type { ThreadWithStory } from '@/lib/api/types';

export function useThreads() {
  const [threads, setThreads] = useState<ThreadWithStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/threads')
      .then(r => r.json())
      .then(setThreads)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { threads, loading, error };
}
