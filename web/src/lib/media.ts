/** 공개 R2 미디어 (covers/, videos/) — 기존 앱과 동일 에셋 */
const R2 = 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev';

export const MEDIA = {
  loginVideo: `${R2}/videos/login-bg.mp4`,
  homeVideo: `${R2}/videos/home-bg.mp4`,
  setupBg: `${R2}/setup/story-prompt-paper-centered.png`,
  cover: (key: string) => `${R2}/covers/${key}.png`,
};
