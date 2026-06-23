import { useQuery } from '@tanstack/react-query';
import { fetchSampleCards } from '@/lib/api/fetch';
import { queryKeys } from '@/lib/api/query-keys';
import { storyLanguage } from '@/lib/i18n';

export function useSampleCards() {
  // 언어별로 캐시를 분리: 영구 캐시(디스크)에 다른 언어 스냅샷이 섞이지 않게 하고
  // 언어 변경 시 자동 리페치되게 한다.
  const lang = storyLanguage();
  return useQuery({
    queryKey: queryKeys.sampleCards(lang),
    queryFn: fetchSampleCards,
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
