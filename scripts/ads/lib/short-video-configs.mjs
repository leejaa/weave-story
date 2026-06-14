import { resolve } from 'node:path';

const IMAGES_DIR = resolve('store-assets/ads/generated/shorts/images');

export const SHORT_VIDEO_CONFIGS = {
  'choice-en': {
    outputName: 'short-choice-en.mp4',
    fps: 30,
    width: 1080,
    height: 1920,
    segments: [
      { image: resolve(IMAGES_DIR, 'choice-open.png'), duration: 3.8 },
      { image: resolve(IMAGES_DIR, 'choice-reject.png'), duration: 5.6 },
      { image: resolve(IMAGES_DIR, 'choice-new-route.png'), duration: 5.6 },
    ],
    cues: [
      { start: 0.0, end: 1.3, text: 'BOTH OPTIONS\nSUCK?', yRatio: 0.14, fontSize: 92, theme: 'hook' },
      { start: 1.3, end: 3.8, text: "You don't have to\nchoose one.", yRatio: 0.18, fontSize: 60, theme: 'paper' },
      { start: 3.8, end: 7.8, text: 'Skip the route\nthey gave you.', yRatio: 0.2, fontSize: 62, theme: 'paper' },
      { start: 7.8, end: 12.0, text: 'Make your own\nstory instead.', yRatio: 0.18, fontSize: 70, theme: 'paper' },
      { start: 12.0, end: 15.0, text: 'Weave Story', yRatio: 0.84, fontSize: 50, theme: 'ribbon' },
    ],
  },
  'choice-ko': {
    outputName: 'short-choice-ko.mp4',
    fps: 30,
    width: 1080,
    height: 1920,
    segments: [
      { image: resolve(IMAGES_DIR, 'choice-open.png'), duration: 3.8 },
      { image: resolve(IMAGES_DIR, 'choice-reject.png'), duration: 5.6 },
      { image: resolve(IMAGES_DIR, 'choice-new-route.png'), duration: 5.6 },
    ],
    cues: [
      { start: 0.0, end: 1.6, text: '선택지 둘 다\n별로면?', yRatio: 0.18, fontSize: 82, theme: 'paper' },
      { start: 1.6, end: 6.2, text: '둘 중 하나\n고를 필요 없음', yRatio: 0.18, fontSize: 68, theme: 'paper' },
      { start: 6.2, end: 9.4, text: '주어진 루트 말고', yRatio: 0.2, fontSize: 64, theme: 'paper' },
      { start: 9.4, end: 12.6, text: '내가 새 루트\n만들면 됨', yRatio: 0.18, fontSize: 76, theme: 'paper' },
      { start: 12.6, end: 15.0, text: '프로필에서 확인', yRatio: 0.84, fontSize: 50, theme: 'ribbon' },
    ],
  },
  'romance-en': {
    outputName: 'short-romance-en.mp4',
    fps: 30,
    width: 1080,
    height: 1920,
    segments: [
      { image: resolve(IMAGES_DIR, 'romance-open.png'), duration: 4.2 },
      { image: resolve(IMAGES_DIR, 'romance-reject.png'), duration: 6.0 },
      { image: resolve(IMAGES_DIR, 'romance-new-route.png'), duration: 4.8 },
    ],
    cues: [
      { start: 0.0, end: 1.3, text: 'HATE THEIR\nROUTE?', yRatio: 0.14, fontSize: 88, theme: 'hook' },
      { start: 1.3, end: 4.0, text: "Then don't follow\ntheir route.", yRatio: 0.18, fontSize: 58, theme: 'paper' },
      { start: 4.0, end: 8.2, text: 'Take the story\nwhere you want it.', yRatio: 0.2, fontSize: 58, theme: 'paper' },
      { start: 8.2, end: 12.2, text: 'Build the chemistry\nyou want.', yRatio: 0.18, fontSize: 60, theme: 'paper' },
      { start: 12.2, end: 15.0, text: 'Weave Story', yRatio: 0.84, fontSize: 50, theme: 'ribbon' },
    ],
  },
  'romance-ko': {
    outputName: 'short-romance-ko.mp4',
    fps: 30,
    width: 1080,
    height: 1920,
    segments: [
      { image: resolve(IMAGES_DIR, 'romance-open.png'), duration: 4.2 },
      { image: resolve(IMAGES_DIR, 'romance-reject.png'), duration: 6.0 },
      { image: resolve(IMAGES_DIR, 'romance-new-route.png'), duration: 4.8 },
    ],
    cues: [
      { start: 0.0, end: 1.8, text: '서브남 루트가\n없으면', yRatio: 0.18, fontSize: 78, theme: 'paper' },
      { start: 1.8, end: 4.2, text: '없는 전개에\n맞출 필요 없음', yRatio: 0.18, fontSize: 66, theme: 'paper' },
      { start: 4.2, end: 7.4, text: '주어진 감정선 말고', yRatio: 0.2, fontSize: 62, theme: 'paper' },
      { start: 7.4, end: 10.2, text: '내가 원하는 쪽으로', yRatio: 0.2, fontSize: 62, theme: 'paper' },
      { start: 10.2, end: 13.2, text: '내 감정선은\n내가 만든다', yRatio: 0.18, fontSize: 76, theme: 'paper' },
      { start: 13.2, end: 15.0, text: '너라면 어떤 루트?', yRatio: 0.84, fontSize: 50, theme: 'ribbon' },
    ],
  },
};
