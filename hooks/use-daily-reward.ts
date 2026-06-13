import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postClaimDailyReward, type MeResult } from '@/lib/api/fetch';

/** 일일 보상 수령. 성공 시 ['me'] 캐시의 credits·dailyClaimable을 즉시 갱신. */
export function useDailyReward() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: postClaimDailyReward,
    onSuccess: (result) => {
      queryClient.setQueryData<MeResult>(['me'], (old) =>
        old ? { ...old, credits: result.credits, dailyClaimable: result.dailyClaimable } : old,
      );
    },
  });

  return {
    claim: () => mutation.mutateAsync(),
    claiming: mutation.isPending,
  };
}
