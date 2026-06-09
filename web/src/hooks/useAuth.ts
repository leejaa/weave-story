import { useState, useEffect, useCallback } from 'react';
import { restoreAuth, loginWithToss, loginWithDemo, logout as doLogout } from '@/lib/auth';

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

  // 'loading' 으로 전환하지 않는다 → LoginPage 가 마운트된 채로 자체 로딩/에러를 관리(실패 시 에러 유지).
  const loginDemo = useCallback(async (code: string) => {
    await loginWithDemo(code); // 실패 시 throw → LoginPage 가 에러 표시
    setState('authenticated');
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setState('unauthenticated');
  }, []);

  return { state, login, loginDemo, logout };
}
