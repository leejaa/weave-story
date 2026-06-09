import { useState, useEffect, useCallback } from 'react';
import { loadStoredToken, loginWithToss, logout as doLogout } from '@/lib/auth';
import { setToken } from '@/lib/api';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading');

  // 앱 시작 시 저장된 토큰 복원
  useEffect(() => {
    const token = loadStoredToken();
    if (token) {
      setToken(token);
      setState('authenticated');
    } else {
      setState('unauthenticated');
    }
  }, []);

  const login = useCallback(async () => {
    setState('loading');
    try {
      await loginWithToss();
      setState('authenticated');
    } catch (e) {
      setState('unauthenticated');
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setState('unauthenticated');
  }, []);

  return { state, login, logout };
}
