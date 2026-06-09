import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { postCreateStory } from './api';

/** 데모(미인증) 상태에서 생성 시도 시 던지는 마커 에러 */
class DemoUnavailableError extends Error {}

function messageFor(error: unknown): string {
  if (error instanceof DemoUnavailableError) {
    return '미리보기에서는 실제 이야기 생성을 체험할 수 없어요. 토스 로그인 연동 후 가능해요.';
  }
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
export function useStorySetup(initialPrompt = '') {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prompt, setPromptState] = useState(initialPrompt);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!getToken()) throw new DemoUnavailableError();
      return postCreateStory({ prompt: prompt.trim(), estimatedChapters: 10, language: 'ko' });
    },
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
