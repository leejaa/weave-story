import { authFetch } from '@/lib/auth/client/api';
import type { ThreadWithStory, ThreadDetail, Story, Chapter } from '@/lib/api/types';


async function throwIfError(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
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
