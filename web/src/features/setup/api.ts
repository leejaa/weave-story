import { api } from '@/lib/api';
import type { CreateStoryRequest, CreateStoryResponse } from '@/lib/types';

/** 이야기 생성 → 첫 챕터 비동기 생성 시작. 201 { threadId }. 크레딧 1 차감(서버). */
export function postCreateStory(payload: CreateStoryRequest) {
  return api.post<CreateStoryResponse>('/api/stories', payload);
}
