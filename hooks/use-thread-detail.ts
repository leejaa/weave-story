import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { fetchThreadDetail, postChoose, postRetryFirstChapter } from '@/lib/api/fetch';
import { ApiError } from '@/lib/api/errors';
import type { ThreadDetail } from '@/lib/api/types';

export function useThreadDetail(threadId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.threadDetail(threadId),
    queryFn: () => fetchThreadDetail(threadId),
    // Poll every 8s while the current chapter is still generating.
    // focusManager (AppState) handles immediate refetch on app foreground.
    refetchInterval: (query) => {
      const data = query.state.data as ThreadDetail | undefined;
      if (!data) return false;
      const current = data.chapters.find(c => c.chapterNumber === data.currentChapter);
      return current?.status === 'generating' ? 8_000 : false;
    },
  });

  const chooseMutation = useMutation({
    mutationFn: ({
      chapterNumber,
      selection,
    }: {
      chapterNumber: number;
      selection: { choiceIndex: number } | { customInput: string };
    }) => postChoose(threadId, chapterNumber, selection),
    onSuccess: ({ chapter, thread, intervention }) => {
      queryClient.setQueryData<ThreadDetail>(
        queryKeys.threadDetail(threadId),
        old => {
          if (!old) return old;
          const rest = old.chapters.filter(c => c.chapterNumber !== chapter?.chapterNumber);
          const updatedChapters = chapter
            ? [...rest, chapter].sort((a, b) => a.chapterNumber - b.chapterNumber)
            : rest;
          const updatedInterventions = intervention
            ? [...(old.interventions ?? []), intervention]
            : (old.interventions ?? []);
          return { ...old, ...thread, chapters: updatedChapters, interventions: updatedInterventions };
        },
      );
    },
  });

  const choose = (
    chapterNumber: number,
    selection: { choiceIndex: number } | { customInput: string },
  ) => chooseMutation.mutateAsync({ chapterNumber, selection });

  const retryMutation = useMutation({
    mutationFn: () => postRetryFirstChapter(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threadDetail(threadId) });
    },
  });

  const isInsufficientCredits =
    chooseMutation.error instanceof ApiError && chooseMutation.error.status === 402;

  return {
    ...query,
    choosing: chooseMutation.isPending,
    choose,
    isInsufficientCredits,
    clearChooseError: chooseMutation.reset,
    retryFirstChapter: () => retryMutation.mutateAsync(),
    retrying: retryMutation.isPending,
  };
}
