import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { postCreateStory } from '@/lib/api/fetch';

const DEFAULT_CHAPTERS = 10;

export function useStoryPrompt() {
  const router = useRouter();
  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const [prompt, setPrompt] = useState(initialPrompt ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      postCreateStory({ prompt: prompt.trim(), estimatedChapters: DEFAULT_CHAPTERS }),
    onSuccess: ({ threadId }) => {
      router.replace(`/reading/${threadId}`);
    },
  });

  const back = useCallback(() => router.back(), [router]);

  return {
    prompt,
    setPrompt,
    canSubmit: prompt.trim().length > 0,
    isPending: mutation.isPending,
    error: mutation.error?.message ?? null,
    submit: () => mutation.mutate(),
    back,
  };
}
