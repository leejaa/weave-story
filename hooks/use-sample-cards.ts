import { useQuery } from '@tanstack/react-query';
import { fetchSampleCards } from '@/lib/api/fetch';
import { queryKeys } from '@/lib/api/query-keys';

export function useSampleCards() {
  return useQuery({
    queryKey: queryKeys.sampleCards(),
    queryFn: fetchSampleCards,
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
