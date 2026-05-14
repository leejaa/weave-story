export const SAMPLE_CARDS = [
  {
    genre: 'ROMANCE',
    title: '마지막 편지가\n남긴 향기',
    color: '#2d5a3d',
    imageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/sample-romance.png',
  },
  {
    genre: 'MYSTERY',
    title: '열두 번의\n목요일',
    color: '#2a3d5a',
    imageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/sample-mystery.png',
  },
  {
    genre: 'FANTASY',
    title: '달빛 아래\n세 번째 문',
    color: '#3d2a5a',
    imageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/sample-fantasy.png',
  },
] as const;

export type SampleCard = (typeof SAMPLE_CARDS)[number];

export const CARD_COUNT = SAMPLE_CARDS.length;
export const SWIPE_THRESHOLD = 90;
export const STACK_OFFSET = 18;
// Scale at each depth: 0 = front, 1 = middle, 2 = back
export const STACK_SCALES = [1.0, 0.96, 0.93] as const;
// How much of screen height the card stack may occupy
export const STACK_HEIGHT_BUDGET = 0.50;
