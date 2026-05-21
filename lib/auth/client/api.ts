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
let onSignedOut: (() => void) | null = null;

export function setSignedOutCallback(cb: () => void) {
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
    await tokenStorage.clear();
    onSignedOut?.();
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

export async function signInWithApple(params: {
  identityToken: string;
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
