import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client/api';
import type { Story } from '@/lib/api/types';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/stories')
      .then(r => r.json())
      .then(setStories)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { stories, loading, error };
}
