import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postCreateStory, postCheckPrompt } from '@/lib/api/fetch';
import type { MeResult } from '@/lib/api/fetch';
import { toUserMessage } from '@/lib/api/errors';
import { useMe } from '@/hooks/use-me';
import { storyLanguage } from '@/lib/i18n';
import { trackStoryCreated } from '@/lib/analytics';

const DEFAULT_CHAPTERS = 10;

export function useStoryPrompt() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [showPaywall, setShowPaywall] = useState(false);
  // Keep the ['me'] query warm/active; credits are read from the cache at
  // submit time (below) rather than from this render's snapshot, so a freshly
  // granted purchase isn't missed due to a stale closure value.
  useMe();

  const mutation = useMutation({
    mutationFn: async () => {
      const credits = queryClient.getQueryData<MeResult>(['me'])?.credits ?? 0;
      if (credits <= 0) {
        setShowPaywall(true);
        return null;
      }

      const check = await postCheckPrompt(prompt.trim());

      if (!check.sufficient && check.questions.length > 0) {
        router.push({
          pathname: '/refine',
          params: {
            prompt: prompt.trim(),
            questions: JSON.stringify(check.questions.slice(0, 3)),
          },
        });
        return null;
      }

      return postCreateStory({ prompt: prompt.trim(), estimatedChapters: DEFAULT_CHAPTERS });
    },
    onSuccess: (result) => {
      if (result) {
        void trackStoryCreated({ length: String(DEFAULT_CHAPTERS), language: storyLanguage() });
        queryClient.invalidateQueries({ queryKey: ['me'] });
        router.replace(`/reading/${result.threadId}`);
      }
    },
  });

  const back = useCallback(() => router.back(), [router]);

  const closePaywall = useCallback(() => setShowPaywall(false), []);

  const onPaywallSuccess = useCallback(async () => {
    setShowPaywall(false);
    // Credits were just granted server-side. Force-refresh ['me'] before retrying
    // so the mutation reads the new balance instead of the stale pre-purchase one
    // (which would immediately reopen the paywall).
    await queryClient.refetchQueries({ queryKey: ['me'] });
    mutation.mutate();
  }, [queryClient, mutation]);

  return {
    prompt,
    setPrompt,
    canSubmit: prompt.trim().length > 0,
    isPending: mutation.isPending,
    error: mutation.error ? toUserMessage(mutation.error) : null,
    rawError: mutation.error,
    submit: () => mutation.mutate(),
    back,
    showPaywall,
    closePaywall,
    onPaywallSuccess,
  };
}
