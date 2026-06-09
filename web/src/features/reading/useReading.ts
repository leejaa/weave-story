import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getToken, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Intervention, ThreadDetail } from '@/lib/types';
import { getThreadDetail, postChoose, type ChoiceSelection } from './api';
import { MOCK_CHAPTERS, MOCK_ESTIMATED, genChapter, makeMockThread } from './mock';

const POLL_MS = 8000;

function mockIntervention(threadId: string, chapterNumber: number, sel: ChoiceSelection): Intervention {
  const isChoice = 'choiceIndex' in sel;
  return {
    id: `iv-${chapterNumber}`,
    threadId,
    chapterNumber,
    type: isChoice ? 'choice' : 'free_input',
    choiceIndex: isChoice ? sel.choiceIndex : null,
    freeText: isChoice ? null : sel.customInput,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

export type UseReading = {
  thread: ThreadDetail | null;
  isLoading: boolean;
  choosing: boolean;
  isInsufficientCredits: boolean;
  choose: (chapterNumber: number, selection: ChoiceSelection) => void;
};

/**
 * 읽기 화면 데이터 — 기존 앱 hooks/use-thread-detail.ts 대응.
 * 인증 시: useQuery(생성 중이면 8초 폴링) + chooseMutation(캐시 갱신).
 * 미인증(데모): 로컬 목업 상태머신으로 읽기→선택→생성중→읽기→끝 루프 시뮬레이션.
 */
export function useReading(threadId: string): UseReading {
  const hasAuth = !!getToken();
  const queryClient = useQueryClient();

  // ── 실 API 경로 (미인증이면 enabled:false) ──
  const query = useQuery({
    queryKey: queryKeys.thread(threadId),
    queryFn: () => getThreadDetail(threadId),
    enabled: hasAuth,
    refetchInterval: (q) => {
      const d = q.state.data as ThreadDetail | undefined;
      if (!d) return false;
      const cur = d.chapters.find((c) => c.chapterNumber === d.currentChapter);
      return cur?.status === 'generating' ? POLL_MS : false;
    },
  });

  const mutation = useMutation({
    mutationFn: (v: { chapterNumber: number; selection: ChoiceSelection }) =>
      postChoose(threadId, v.chapterNumber, v.selection),
    onSuccess: ({ chapter, thread, intervention }) => {
      queryClient.setQueryData<ThreadDetail>(queryKeys.thread(threadId), (old) => {
        if (!old) return old;
        const rest = old.chapters.filter((c) => c.chapterNumber !== chapter?.chapterNumber);
        const chapters = chapter
          ? [...rest, chapter].sort((a, b) => a.chapterNumber - b.chapterNumber)
          : rest;
        return {
          ...old,
          ...thread,
          chapters,
          interventions: intervention ? [...old.interventions, intervention] : old.interventions,
        };
      });
    },
  });

  // ── 데모(목업) 경로 ──
  const [mock, setMock] = useState<ThreadDetail>(makeMockThread);
  const [mockChoosing, setMockChoosing] = useState(false);

  const mockChoose = (chapterNumber: number, selection: ChoiceSelection) => {
    if (mockChoosing) return;
    setMockChoosing(true);
    const isLast = chapterNumber >= MOCK_ESTIMATED;
    const progress = Math.min(chapterNumber / MOCK_ESTIMATED, 1).toFixed(3);

    setMock((m) => ({
      ...m,
      currentChapter: chapterNumber + 1,
      progress,
      interventions: [...m.interventions, mockIntervention(m.threadId, chapterNumber, selection)],
      ...(isLast
        ? { status: 'completed' }
        : { chapters: [...m.chapters, genChapter(chapterNumber + 1)] }),
    }));

    if (isLast) {
      setMockChoosing(false);
      return;
    }
    // 생성 시뮬레이션: 2.5초 후 다음 챕터를 ready 로 교체
    setTimeout(() => {
      setMock((m) => ({
        ...m,
        chapters: m.chapters.map((c) =>
          c.chapterNumber === chapterNumber + 1 ? MOCK_CHAPTERS[chapterNumber] : c,
        ),
      }));
      setMockChoosing(false);
    }, 2500);
  };

  if (hasAuth) {
    return {
      thread: query.data ?? null,
      isLoading: query.isLoading,
      choosing: mutation.isPending,
      isInsufficientCredits: mutation.error instanceof ApiError && mutation.error.status === 402,
      choose: (chapterNumber, selection) => mutation.mutate({ chapterNumber, selection }),
    };
  }

  return {
    thread: mock,
    isLoading: false,
    choosing: mockChoosing,
    isInsufficientCredits: false,
    choose: mockChoose,
  };
}
