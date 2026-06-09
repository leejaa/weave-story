import { useState, useEffect, useCallback } from 'react';
import { restoreAuth, loginWithToss, logout as doLogout } from '@/lib/auth';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading');

  // 앱 시작 시 저장된 인증(토큰 또는 데모) 복원
  useEffect(() => {
    setState(restoreAuth() ? 'authenticated' : 'unauthenticated');
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
