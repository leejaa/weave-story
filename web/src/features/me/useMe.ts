import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/api';
import type { MeResult } from '@/lib/types';
import { getMe } from './api';
import { MOCK_ME } from './mock';

export type UseMe = {
  me: MeResult | null;
  isLoading: boolean;
};

/**
 * 내 계정/크레딧 — 기존 앱 hooks/use-me.ts 대응.
 * 인증 시: useQuery(GET /api/me, 5분 staleTime). 미인증(데모): 로컬 목업.
 */
export function useMe(): UseMe {
  const hasAuth = !!getToken();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: hasAuth,
    staleTime: 5 * 60 * 1000,
  });

  if (hasAuth) {
    return { me: query.data ?? null, isLoading: query.isLoading };
  }

  return { me: MOCK_ME, isLoading: false };
}
