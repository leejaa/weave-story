/**
 * 토스 로그인 흐름
 *
 * 실제 흐름 (토스 앱 WebView 안):
 *   1. appLogin() → { authorizationCode, referrer }
 *   2. 서버 /auth/toss → { accessToken } (서버가 mTLS로 토스 API 호출)
 *   3. accessToken을 저장 후 api.setToken()
 *
 * 브라우저 미리보기(토스 SDK 없음): 데모로 게이트만 통과.
 *   - 토큰을 만들지 않으므로 getToken()===null → 홈/읽기 등은 목업 데이터로 동작.
 *
 * TODO: 앱인토스 콘솔 승인 + mTLS 인증서 발급 후 /auth/toss 서버 연동 완성(Task 3·7).
 */

import { appLogin } from '@apps-in-toss/web-framework';
import { api, setToken, clearToken } from './api';

const TOKEN_KEY = 'ws_access_token';
const DEMO_KEY = 'ws_demo';

/** 토스 앱 WebView 환경 추정. 아니면(브라우저) 데모로 통과한다. */
function isInTossApp(): boolean {
  try {
    return typeof navigator !== 'undefined' && /toss/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}

export function saveToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  setToken(token);
}

/** 새로고침 시 인증 상태 복원: 'token'(실로그인) | 'demo'(미리보기) | null */
export function restoreAuth(): 'token' | 'demo' | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    setToken(token);
    return 'token';
  }
  if (sessionStorage.getItem(DEMO_KEY)) return 'demo';
  return null;
}

export async function loginWithToss(): Promise<void> {
  if (!isInTossApp()) {
    // 브라우저 미리보기: 토스 SDK 없음 → 데모로 게이트 통과 (토큰 없음 = 목업 모드)
    sessionStorage.setItem(DEMO_KEY, '1');
    return;
  }

  const { authorizationCode, referrer } = await appLogin();
  const { accessToken } = await api.post<{ accessToken: string }>('/auth/toss', {
    authorizationCode,
    referrer,
  });
  saveToken(accessToken);
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(DEMO_KEY);
  clearToken();
}
