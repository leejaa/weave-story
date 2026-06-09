import { useQuery } from '@tanstack/react-query';
import { api, getToken } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { SampleCardData } from '@/lib/types';
import { MOCK_SAMPLE_CARDS } from './cards.mock';

/**
 * 샘플카드 조회.
 * - 토큰이 있으면 실제 /api/sample-cards (Bearer 인증 필요) 호출
 * - 토큰이 없으면(아직 토스 로그인 미연동) 목업 데이터로 폴백 → 브라우저에서 UI 개발 가능
 * 실패 시에도 목업으로 폴백해 화면이 비지 않게 한다.
 */
async function fetchSampleCards(): Promise<SampleCardData[]> {
  if (!getToken()) return MOCK_SAMPLE_CARDS;
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
