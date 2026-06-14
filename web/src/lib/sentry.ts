import * as Sentry from '@sentry/react';

// RN(Expo) 앱과 같은 Sentry 조직의 weave-story 프로젝트로 전송. web 에러는 태그로 구분.
// DSN은 공개 가능한(클라이언트) 키. 빌드 시 VITE_SENTRY_DSN으로 덮어쓸 수 있음.
const DSN =
  import.meta.env.VITE_SENTRY_DSN ||
  'https://de6d381577b8b0e4d93856f8932fcdb4@o4511421727047680.ingest.us.sentry.io/4511424606502912';

/** 앱 시작 시 1회 호출. 처리 안 된 에러·프로미스 거부를 자동 수집한다. 개발 모드에선 비활성. */
export function initSentry() {
  if (import.meta.env.DEV) return;
  Sentry.init({
    dsn: DSN,
    environment: 'appsintoss',
    tracesSampleRate: 0.1,
    // 한 프로젝트에 RN/web이 섞이므로 web(앱인토스) 구분 태그.
    initialScope: { tags: { app: 'appsintoss', platform: 'web' } },
  });
}

/** 로그인 후 사용자 식별(에러 추적 시 누구인지 파악). JWT sub 사용. */
export function setSentryUser(accessToken: string | null) {
  if (import.meta.env.DEV) return;
  if (!accessToken) {
    Sentry.setUser(null);
    return;
  }
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? ''));
    if (payload?.sub) Sentry.setUser({ id: String(payload.sub) });
  } catch {
    // 토큰 파싱 실패는 무시
  }
}

export { Sentry };
