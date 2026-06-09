import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { SampleCardData } from '@/lib/types';
import { MOCK_SAMPLE_CARDS } from './cards.mock';

/**
 * 샘플카드 조회.
 * /api/sample-cards 는 백엔드에서 공개(인증 불필요)이므로 토큰 유무와 관계없이 실서버를 호출한다.
 * 네트워크 실패 시에만 목업으로 폴백해 화면이 비지 않게 한다.
 */
async function fetchSampleCards(): Promise<SampleCardData[]> {
  try {
    const rows = await api.get<SampleCardData[]>('/api/sample-cards');
    return rows.length ? rows : MOCK_SAMPLE_CARDS;
  } catch {
    return MOCK_SAMPLE_CARDS;
  }
}

export function useSampleCards() {
  return useQuery({
    queryKey: queryKeys.sampleCards(),
    queryFn: fetchSampleCards,
    staleTime: 30 * 60 * 1000,
    initialData: MOCK_SAMPLE_CARDS, // 첫 페인트부터 카드가 보이도록
  });
}
