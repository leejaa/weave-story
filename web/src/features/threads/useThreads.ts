import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ThreadListItem } from '@/lib/types';
import { getThreads } from './api';
import { MOCK_THREADS } from './mock';

export type UseThreads = {
  threads: ThreadListItem[];
  isLoading: boolean;
};

/**
 * 내 이야기 목록 — 기존 앱 hooks/use-threads.ts 대응.
 * 인증 시: useQuery(GET /api/threads). 미인증(데모): 로컬 목업 목록.
 */
export function useThreads(): UseThreads {
  const hasAuth = !!getToken();

  const query = useQuery({
    queryKey: queryKeys.threads(),
    queryFn: getThreads,
    enabled: hasAuth,
  });

  if (hasAuth) {
    return { threads: query.data ?? [], isLoading: query.isLoading };
  }

  return { threads: MOCK_THREADS, isLoading: false };
}
