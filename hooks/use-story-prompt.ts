import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { postCreateStory, postCheckPrompt } from '@/lib/api/fetch';
import { toUserMessage } from '@/lib/api/errors';

const DEFAULT_CHAPTERS = 10;

export function useStoryPrompt() {
  const router = useRouter();
  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const [prompt, setPrompt] = useState(initialPrompt ?? '');

  const mutation = useMutation({
    mutationFn: async () => {
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
        router.replace(`/reading/${result.threadId}`);
      }
    },
  });

  const back = useCallback(() => router.back(), [router]);

  return {
    prompt,
    setPrompt,
    canSubmit: prompt.trim().length > 0,
    isPending: mutation.isPending,
    error: mutation.error ? toUserMessage(mutation.error) : null,
    rawError: mutation.error,
    submit: () => mutation.mutate(),
    back,
  };
}
