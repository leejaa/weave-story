import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, ApiError } from '@/lib/api';
import { postCreateStory } from './api';

/**
 * 셋업 화면 비즈니스 로직 — 기존 앱 hooks/use-story-prompt.ts 대응.
 * 생성 API는 Bearer 인증 필요. 아직 토스 로그인 미연동이라 토큰 없으면 데모 안내.
 */
export function useStorySetup(initialPrompt = '') {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = prompt.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || isPending) return;
    setError(null);

    if (!getToken()) {
      setError('미리보기에서는 실제 이야기 생성을 체험할 수 없어요. 토스 로그인 연동 후 가능해요.');
      return;
    }

    setIsPending(true);
    try {
      const { threadId } = await postCreateStory({
        prompt: prompt.trim(),
        estimatedChapters: 10,
        language: 'ko',
      });
      navigate(`/reading/${threadId}`);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 402
          ? '크레딧이 부족해요. 충전 후 다시 시도해주세요.'
          : '이야기 생성에 실패했어요. 잠시 후 다시 시도해주세요.',
      );
      setIsPending(false);
    }
  };

  return { prompt, setPrompt, canSubmit, isPending, error, submit };
}
