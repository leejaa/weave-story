import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signInWithApple, signInWithGoogle, signInWithDemo, setSignedOutCallback, deleteAccount } from './api';
import { clearStaleTokensOnFreshInstall } from './install-guard';
import { tokenStorage } from './storage';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    setSignedOutCallback(() => setState('unauthenticated'));
    clearStaleTokensOnFreshInstall()
      .then(() => tokenStorage.getRefreshToken())
      .then((token) => setState(token ? 'authenticated' : 'unauthenticated'));
  }, []);

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
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle();
    setState('authenticated');
  }, []);

  const handleDemoSignIn = useCallback(async (code: string) => {
    await signInWithDemo(code);
    setState('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setState('unauthenticated');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    await deleteAccount();
    setState('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider
      value={{ state, signInWithApple: handleAppleSignIn, signInWithGoogle: handleGoogleSignIn, signInWithDemo: handleDemoSignIn, signOut, deleteAccount: handleDeleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
