/**
 * 토스 로그인 흐름
 *
 * 실제 흐름:
 *   1. appLogin() → { authorizationCode, referrer }
 *   2. 서버 /auth/toss → { accessToken } (서버가 mTLS로 토스 API 호출)
 *   3. accessToken을 localStorage에 저장 후 api.setToken()
 *
 * TODO: 앱인토스 콘솔 등록 + mTLS 인증서 발급 후 실 구현으로 교체
 */

import { appLogin } from '@apps-in-toss/web-framework';
import { api, setToken, clearToken } from './api';

const TOKEN_KEY = 'ws_access_token';

export function loadStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  setToken(token);
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  clearToken();
}

export async function loginWithToss(): Promise<string> {
  const { authorizationCode, referrer } = await appLogin();

  const { accessToken } = await api.post<{ accessToken: string }>('/auth/toss', {
    authorizationCode,
    referrer,
  });

  saveToken(accessToken);
  return accessToken;
}

export function logout() {
  removeToken();
}
