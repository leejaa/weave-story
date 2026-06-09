import { api } from '@/lib/api';
import type { MeResult } from '@/lib/types';

/** 내 계정/크레딧 — 기존 앱 lib/api/fetch.ts fetchMe 대응 */
export function getMe() {
  return api.get<MeResult>('/api/me');
}

/** 회원 탈퇴 — 계정·스토리·크레딧 영구 삭제 (DELETE /api/me) */
export function deleteMe() {
  return api.delete<{ ok: true }>('/api/me');
}
