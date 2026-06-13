import Constants from 'expo-constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { tokenStorage } from './storage';

function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (!__DEV__) return '';
  // In dev client / Expo Go, hostUri is the Metro server address (e.g. "192.168.x.x:8081")
  const host = Constants.expoConfig?.hostUri ?? 'localhost:8081';
  return `http://${host}`;
}

const BASE_URL = resolveBaseUrl();

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

let refreshPromise: Promise<string | null> | null = null;
let onSignedOut: ((reason?: 'expired') => void) | null = null;

export function setSignedOutCallback(cb: (reason?: 'expired') => void) {
  onSignedOut = cb;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (res.status === 401) {
    // 리프레시 토큰이 만료/폐기됨 → 비자발적 로그아웃. 로그인 화면에서 사유를 안내한다.
    await tokenStorage.clear();
    onSignedOut?.('expired');
    return null;
  }

  if (!res.ok) {
    // Transient server/network error — don't wipe tokens, let the caller handle it
    throw new Error(`Refresh failed: ${res.status}`);
  }

  const { accessToken, refreshToken: newRefreshToken } = await res.json();
  await tokenStorage.setAccessToken(accessToken);
  await tokenStorage.setRefreshToken(newRefreshToken);
  return accessToken;
}

// Deduplicates concurrent refresh calls
async function getValidAccessToken(): Promise<string | null> {
  const token = await tokenStorage.getAccessToken();

  if (token) {
    // Check if expired (exp claim in JWT payload)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now() + 10_000) return token;
    } catch {
      // malformed token — refresh
    }
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${input}`, { ...init, headers });

  if (res.status === 401) {
    // Token rejected by server — force refresh once
    refreshPromise = null;
    const newToken = await refreshAccessToken();
    if (!newToken) return res;
    headers.set('Authorization', `Bearer ${newToken}`);
    return fetch(`${BASE_URL}${input}`, { ...init, headers });
  }

  return res;
}

// 로그아웃: 서버 세션(리프레시 토큰)을 폐기한 뒤 로컬 토큰을 지운다.
// 서버 폐기는 best-effort — 오프라인이어도 로컬은 항상 정리한다.
export async function logout(): Promise<void> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (refreshToken) {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // 네트워크 오류는 무시 — 로컬 토큰은 아래에서 정리된다.
    }
  }
  await tokenStorage.clear();
}

export async function deleteAccount(): Promise<void> {
  const res = await authFetch('/api/me', { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Account deletion failed');
  }
  await tokenStorage.clear();
}

export async function signInWithApple(params: {
  identityToken: string;
  authorizationCode?: string | null;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Apple sign-in failed');
  }

  const { accessToken, refreshToken } = await res.json();
  await tokenStorage.setAccessToken(accessToken);
  await tokenStorage.setRefreshToken(refreshToken);
}

// Review-only: sign in with a code (no OAuth) so store reviewers can access
// the app. Calls the code-gated /api/auth/demo endpoint.
export async function signInWithDemo(code: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Demo sign-in failed');
  }

  const { accessToken, refreshToken } = await res.json();
  await tokenStorage.setAccessToken(accessToken);
  await tokenStorage.setRefreshToken(refreshToken);
}

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  if (!data?.idToken) throw new Error('No ID token from Google');

  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: data.idToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Google sign-in failed');
  }

  const { accessToken, refreshToken } = await res.json();
  await tokenStorage.setAccessToken(accessToken);
  await tokenStorage.setRefreshToken(refreshToken);
}
