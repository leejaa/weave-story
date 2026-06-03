import { authFetch } from '@/lib/auth/client/api';
import { throwIfError } from '@/lib/api/errors';
import type { SampleCardData, ThreadWithStory, ThreadDetail, Story, Chapter, Intervention } from '@/lib/api/types';

export type MeResult = { id: string; email: string | null; name: string | null; avatarUrl: string | null; credits: number };

export async function fetchMe(): Promise<MeResult> {
  const res = await authFetch('/api/me');
  await throwIfError(res);
  return res.json();
}

export async function fetchSampleCards(): Promise<SampleCardData[]> {
  const res = await authFetch('/api/sample-cards');
  await throwIfError(res);
  return res.json();
}

export async function fetchThreads(): Promise<ThreadWithStory[]> {
  const res = await authFetch('/api/threads');
  await throwIfError(res);
  return res.json();
}

export async function fetchThreadDetail(threadId: string): Promise<ThreadDetail> {
  const res = await authFetch(`/api/threads/${threadId}`);
  await throwIfError(res);
  return res.json();
}

export async function fetchStories(): Promise<Story[]> {
  const res = await authFetch('/api/stories');
  await throwIfError(res);
  return res.json();
}

export type ChooseResult = {
  chapter: Chapter | null;
  thread: Pick<ThreadDetail, 'currentChapter' | 'progress' | 'status'>;
  intervention: Intervention | null;
};

export async function postChoose(
  threadId: string,
  chapterNumber: number,
  selection: { choiceIndex: number } | { customInput: string },
): Promise<ChooseResult> {
  const res = await authFetch(`/api/threads/${threadId}/choose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterNumber, ...selection }),
  });
  await throwIfError(res);
  return res.json();
}

export type CheckPromptResult = {
  sufficient: boolean;
  questions: string[];
};

export type ReportReason = 'sexual' | 'violence' | 'hate' | 'illegal' | 'other';

export async function postReport(params: {
  chapterId: string;
  reason: ReportReason;
  detail?: string;
}): Promise<void> {
  const res = await authFetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  await throwIfError(res);
}

export async function postRetryFirstChapter(threadId: string): Promise<{ ok: true }> {
  const res = await authFetch(`/api/threads/${threadId}/retry-first-chapter`, { method: 'POST' });
  await throwIfError(res);
  return res.json();
}

export async function postCheckPrompt(prompt: string): Promise<CheckPromptResult> {
  const res = await authFetch('/api/stories/check-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  await throwIfError(res);
  return res.json();
}

export async function postCreateStory(params: {
  prompt: string;
  estimatedChapters: number;
}): Promise<{ threadId: string }> {
  const res = await authFetch('/api/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  await throwIfError(res);
  return res.json();
}

export async function postGrantCredits(params: {
  productId: string;
  transactionId: string;
  purchaseToken?: string;
  platform?: 'ios' | 'android';
}): Promise<{ credits: number; alreadyGranted?: boolean }> {
  const res = await authFetch('/api/purchases/grant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  await throwIfError(res);
  return res.json();
}
