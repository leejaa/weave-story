import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  setActiveReadingThreadId,
  clearActiveReadingThreadId,
} from '@/lib/reading/last-reading-storage';

// 리더 화면이 포커스되면 "이 스레드를 읽는 중"으로 표시하고, 화면을 떠나면 해제한다.
// 백그라운드 전환 시에는 blur 가 발생하지 않으므로(cleanup 은 네비게이션 이동에서만 실행),
// 앱이 리더 상태로 종료되면 표시가 남아 다음 실행에서 이어읽기로 복귀한다.
export function useActiveReading(threadId: string | undefined): void {
  useFocusEffect(
    useCallback(() => {
      if (!threadId) return;
      void setActiveReadingThreadId(threadId);
      return () => {
        void clearActiveReadingThreadId();
      };
    }, [threadId]),
  );
}
