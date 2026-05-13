import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { fetchStories } from '@/lib/api/fetch';

export function useStories() {
  return useQuery({
    queryKey: queryKeys.stories(),
    queryFn: fetchStories,
  });
}
