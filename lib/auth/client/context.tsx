import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signInWithApple, signInWithGoogle, signInWithDemo, setSignedOutCallback, deleteAccount, logout } from './api';
import { clearStaleTokensOnFreshInstall } from './install-guard';
import { tokenStorage } from './storage';
import { trackLogin, identifyUser } from '@/lib/analytics';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  // 세션 만료로 비자발적 로그아웃된 경우 true (로그인 화면 안내용). 재로그인 시 해제.
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setSignedOutCallback((reason) => {
      if (reason === 'expired') setSessionExpired(true);
      setState('unauthenticated');
    });
    clearStaleTokensOnFreshInstall()
      .then(() => tokenStorage.getRefreshToken())
      .then((token) => setState(token ? 'authenticated' : 'unauthenticated'));
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const handleAppleSignIn = useCallback(async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) throw new Error('No identity token from Apple');

    await signInWithApple({
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      fullName: credential.fullName,
    });

    setState('authenticated');
    void trackLogin('apple');
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle();
    setState('authenticated');
    void trackLogin('google');
  }, []);

  const handleDemoSignIn = useCallback(async (code: string) => {
    await signInWithDemo(code);
    setState('authenticated');
    void trackLogin('demo');
  }, []);

  const signOut = useCallback(async () => {
    await logout(); // 서버 세션 폐기 + 로컬 토큰 정리
    setState('unauthenticated');
    void identifyUser(null);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    await deleteAccount();
    setState('unauthenticated');
  }, []);

  // 로그인에 성공하면 만료 안내를 해제한다(모든 로그인 경로 커버).
  useEffect(() => {
    if (state === 'authenticated') setSessionExpired(false);
  }, [state]);

  return (
    <AuthContext.Provider
      value={{ state, sessionExpired, clearSessionExpired, signInWithApple: handleAppleSignIn, signInWithGoogle: handleGoogleSignIn, signInWithDemo: handleDemoSignIn, signOut, deleteAccount: handleDeleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
