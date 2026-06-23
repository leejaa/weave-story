import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { getActiveReadingThreadId } from '@/lib/reading/last-reading-storage';

// 콜드 스타트당 한 번만 실행되도록 막는 모듈 플래그. 백그라운드 복귀(웜 스타트)에서는
// 모듈이 재로딩되지 않아 effect 가 다시 돌지 않으므로 이어읽기가 중복 발동하지 않는다.
let launchResumeHandled = false;

/**
 * 인증이 끝난 직후 콜드 스타트에서 한 번 호출. 리더 화면에 머문 상태로 종료된 기록이
 * 있으면(use-active-reading 가 남긴 값) 그 스레드 리더로 보낸다. 리더에 들어가면
 * use-reading-position 이 읽던 페이지로 복원한다. 뒤로가기 시 홈으로 돌아온다.
 */
export function useResumeReading(enabled: boolean): void {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || launchResumeHandled || startedRef.current) return;
    startedRef.current = true;
    launchResumeHandled = true;
    void getActiveReadingThreadId().then(threadId => {
      if (threadId) {
        router.push(`/reading/${threadId}`);
      }
    });
  }, [enabled, router]);
}
