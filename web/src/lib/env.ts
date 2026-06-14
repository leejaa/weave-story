/**
 * 실행 환경 감지 — 토스 WebView / 플랫폼 판별 (auth·부트스트랩 공용).
 * safe-area 보정, 결제 SDK 게이트 등에서 사용한다.
 */

/** 토스 앱 WebView 환경 추정. 아니면(브라우저) 데모로 통과한다. */
export function isInTossApp(): boolean {
  try {
    return typeof navigator !== 'undefined' && /toss/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}

/** 안드로이드 단말 추정. */
export function isAndroid(): boolean {
  try {
    return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}

/**
 * 문서 루트에 환경 클래스 부착 — CSS safe-area 보정용. 최초 페인트 전에 호출한다.
 *
 * 안드로이드 토스 WebView는 시스템 내비게이션을 웹뷰 *바깥* 별도 바로 렌더하는데도
 * env(safe-area-inset-bottom)이 유령 값을 보고해 하단 탭바 아래 공백이 과도해진다.
 * `toss-android` 클래스로 tokens.css 에서 하단 인셋을 0으로 보정한다.
 * (iOS 토스는 홈 인디케이터 때문에 인셋이 실제로 필요하므로 보정 대상에서 제외)
 */
export function applyEnvClasses(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isInTossApp()) {
    root.classList.add('toss');
    if (isAndroid()) root.classList.add('toss-android');
  }
}
