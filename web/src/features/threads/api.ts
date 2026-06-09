import { api } from '@/lib/api';
import type { ThreadListItem } from '@/lib/types';

/** 내 이야기 목록 — 기존 앱 lib/api/fetch.ts fetchThreads 대응 */
export function getThreads() {
  return api.get<ThreadListItem[]>('/api/threads');
}
