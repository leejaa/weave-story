import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { fetchThreads } from '@/lib/api/fetch';

export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads(),
    queryFn: fetchThreads,
  });
}
