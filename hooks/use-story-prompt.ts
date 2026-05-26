import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postCreateStory, postCheckPrompt } from '@/lib/api/fetch';
import { toUserMessage } from '@/lib/api/errors';
import { useMe } from '@/hooks/use-me';

const DEFAULT_CHAPTERS = 10;

export function useStoryPrompt() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [showPaywall, setShowPaywall] = useState(false);
  const { data: me } = useMe();

  const canCreateStory = (me?.credits ?? 0) > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!canCreateStory) {
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
        queryClient.invalidateQueries({ queryKey: ['me'] });
        router.replace(`/reading/${result.threadId}`);
      }
    },
  });

  const back = useCallback(() => router.back(), [router]);

  const closePaywall = useCallback(() => setShowPaywall(false), []);

  const onPaywallSuccess = useCallback(() => {
    setShowPaywall(false);
    mutation.mutate();
  }, [mutation]);

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
