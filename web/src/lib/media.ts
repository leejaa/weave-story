/** 공개 R2 미디어 (covers/, videos/) — 기존 앱과 동일 에셋 */
const R2 = 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev';

export const MEDIA = {
  loginVideo: `${R2}/videos/login-bg.mp4`,
  homeVideo: `${R2}/videos/home-bg.mp4`,
  // 로컬 포스터(빌드 번들·CF Pages 캐시) — 무거운 R2 비디오가 로드되기 전 즉시 첫 페인트.
  loginPoster: '/posters/login-bg.jpg',
  homePoster: '/posters/home-bg.jpg',
  // 카드 진입 플로우 배경 — R2 PNG(약 2MB)를 로컬 최적화 JPEG(~200KB)로 교체해 즉시 로드.
  // 번들에 포함되어 네트워크 없이 뜬다. (R2 원본은 그대로 — Expo 영향 없음)
  setupBg: '/posters/setup-bg.jpg',
  openBookScene: '/posters/open-book-scene.jpg',
  cover: (key: string) => `${R2}/covers/${key}.png`,
};
