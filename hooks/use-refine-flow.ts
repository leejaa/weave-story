import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { postCreateStory } from '@/lib/api/fetch';
import { toUserMessage } from '@/lib/api/errors';

const DEFAULT_CHAPTERS = 10;

export function useRefineFlow(originalPrompt: string, questions: string[]) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => Array(questions.length).fill(''));

  const mutation = useMutation({
    mutationFn: (finalPrompt: string) =>
      postCreateStory({ prompt: finalPrompt, estimatedChapters: DEFAULT_CHAPTERS }),
    onSuccess: ({ threadId }) => {
      router.replace(`/reading/${threadId}`);
    },
  });

  const isLastStep = step === questions.length - 1;

  const setCurrentAnswer = useCallback(
    (text: string) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = text;
        return next;
      });
    },
    [step],
  );

  const proceed = useCallback(() => {
    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }

    const qaPairs = questions
      .map((q, i) => {
        const a = answers[i]?.trim();
        return a ? `${q} → ${a}` : null;
      })
      .filter(Boolean)
      .join('\n');

    const finalPrompt = qaPairs
      ? `${originalPrompt}\n\n추가 정보:\n${qaPairs}`
      : originalPrompt;

    mutation.mutate(finalPrompt);
  }, [isLastStep, step, questions, answers, originalPrompt, mutation]);

  const back = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  }, [step, router]);

  return {
    step,
    totalSteps: questions.length,
    question: questions[step] ?? '',
    answer: answers[step] ?? '',
    setAnswer: setCurrentAnswer,
    isLastStep,
    isPending: mutation.isPending,
    error: mutation.error ? toUserMessage(mutation.error) : null,
    rawError: mutation.error,
    proceed,
    back,
  };
}
