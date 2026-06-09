import type { MeResult } from '@/lib/types';

/** 데모(미인증) 모드용 내 계정 — 가입 기본 크레딧 10 반영 */
export const MOCK_ME: MeResult = {
  id: 'demo-user',
  email: 'guest@weave.story',
  name: '미리보기 독자',
  avatarUrl: null,
  credits: 10,
};
