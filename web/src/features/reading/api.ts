import { api } from '@/lib/api';
import type { Chapter, Intervention, ThreadDetail } from '@/lib/types';

/** 스레드 상세 — 폴링 대상 (chapters[].status: generating|ready|failed) */
export function getThreadDetail(threadId: string) {
  return api.get<ThreadDetail>(`/api/threads/${threadId}`);
}

export type ChoiceSelection = { choiceIndex: number } | { customInput: string };

export type ChooseResult = {
  chapter: Chapter | null; // 다음 챕터 (status: generating). 마지막이면 null
  thread: Pick<ThreadDetail, 'currentChapter' | 'progress' | 'status'>;
  intervention: Intervention | null;
};

/** 선택/직접입력 → 다음 챕터 생성 시작 (POST /api/threads/:id/choose) */
export function postChoose(threadId: string, chapterNumber: number, selection: ChoiceSelection) {
  return api.post<ChooseResult>(`/api/threads/${threadId}/choose`, { chapterNumber, ...selection });
}
