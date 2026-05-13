import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { authFetch } from '@/lib/auth/client/api';
import { SETUP_QUESTIONS, type SetupKey } from '@/constants/setup-questions';

export type SetupAnswers = Record<SetupKey, string>;

const EMPTY: SetupAnswers = { mood: '', setting: '', protagonist: '', premise: '', length: '' };

export function useSetup() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SetupAnswers>({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = SETUP_QUESTIONS[step];
  const currentAnswer = answers[currentQuestion.key];
  const isLastStep = step === SETUP_QUESTIONS.length - 1;
  const canAdvance = currentAnswer.trim().length > 0;

  const setAnswer = useCallback(
    (value: string) => {
      const key = SETUP_QUESTIONS[step].key;
      setAnswers(prev => ({ ...prev, [key]: value }));
    },
    [step],
  );

  const next = useCallback(async () => {
    if (!canAdvance) return;

    if (!isLastStep) {
      setStep(s => s + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupAnswers: answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '생성에 실패했어요');
      }
      const { threadId } = await res.json();
      router.replace(`/reading/${threadId}`);
    } catch (e: any) {
      setError(e.message ?? '오류가 발생했어요');
      setSubmitting(false);
    }
  }, [canAdvance, isLastStep, answers, router]);

  const back = useCallback(() => {
    if (step === 0) {
      router.back();
    } else {
      setStep(s => s - 1);
    }
  }, [step, router]);

  return {
    step,
    totalSteps: SETUP_QUESTIONS.length,
    currentQuestion,
    currentAnswer,
    canAdvance,
    isLastStep,
    submitting,
    error,
    setAnswer,
    next,
    back,
  };
}
