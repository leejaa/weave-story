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
    // 웹앱(앱인토스)은 한국어 전용 → ko 프롬프트 풀을 받는다.
    const rows = await api.get<SampleCardData[]>('/api/sample-cards?lang=ko');
    return rows.length ? rows : MOCK_SAMPLE_CARDS;
  } catch {
    return MOCK_SAMPLE_CARDS;
  }
}

export function useSampleCards() {
  return useQuery({
    queryKey: queryKeys.sampleCards('ko'),
    queryFn: fetchSampleCards,
    staleTime: 30 * 60 * 1000,
    // placeholderData: 첫 페인트에 목업을 보여주되 "실데이터 없음"으로 취급 → 즉시 실 API 호출 후 교체.
    // (initialData는 staleTime 동안 신선한 실데이터로 간주돼 fetch를 막아 MOCK에 고정되는 버그가 있었음)
    placeholderData: MOCK_SAMPLE_CARDS,
  });
}
