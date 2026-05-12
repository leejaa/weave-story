import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signInWithApple } from './api';
import { tokenStorage } from './storage';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    tokenStorage.getRefreshToken().then((token) => {
      setState(token ? 'authenticated' : 'unauthenticated');
    });
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
      fullName: credential.fullName,
    });

    setState('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setState('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ state, signInWithApple: handleAppleSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
