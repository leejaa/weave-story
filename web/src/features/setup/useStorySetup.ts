import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { postCreateStory } from './api';

/** 데모(미인증)에서 보여줄 목업 스레드 id */
const DEMO_THREAD_ID = 'mock-rofan';

function messageFor(error: unknown): string {
  if (error instanceof ApiError && error.status === 402) {
    return '크레딧이 부족해요. 충전 후 다시 시도해주세요.';
  }
  return '이야기 생성에 실패했어요. 잠시 후 다시 시도해주세요.';
}

/**
 * 셋업 화면 비즈니스 로직 — 기존 앱 hooks/use-story-prompt.ts 대응.
 * 생성은 useMutation 으로 통일: 성공 시 threads 캐시 무효화 + /reading/:id 이동.
 * 생성 API는 Bearer 인증 필요. 미연동 상태(토큰 없음)에서는 데모 안내.
 */
export function useStorySetup(initialPrompt = '', hintGenre?: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prompt, setPromptState] = useState(initialPrompt);

  const mutation = useMutation({
    mutationFn: () => postCreateStory({ prompt: prompt.trim(), estimatedChapters: 10, language: 'ko', hintGenre }),
    onSuccess: ({ threadId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads() });
      navigate(`/reading/${threadId}`);
    },
  });

  const setPrompt = (value: string) => {
    if (mutation.isError) mutation.reset(); // 입력을 고치면 에러 해제
    setPromptState(value);
  };

  const canSubmit = prompt.trim().length > 0;

  const submit = () => {
    if (!canSubmit || mutation.isPending) return;
    // 데모(미인증): 실제 생성 대신 목업 읽기 화면으로 이동해 전체 플로우 체험
    if (!getToken()) {
      navigate(`/reading/${DEMO_THREAD_ID}`);
      return;
    }
    mutation.mutate();
  };

  return {
    prompt,
    setPrompt,
    canSubmit,
    isPending: mutation.isPending,
    error: mutation.isError ? messageFor(mutation.error) : null,
    submit,
  };
}
