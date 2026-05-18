export const SAMPLE_CARDS = [
  {
    genre: 'ROMANCE',
    title: '마지막 편지가\n남긴 향기',
    color: '#2d5a3d',
    imageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/sample-romance.png',
    prompt:
      '오래된 다락방에서 발견한 누렇게 바랜 편지 한 통. 발신인은 수십 년 전 세상을 떠난 사람이었다. 그 편지에 배인 희미한 향기를 따라가다 마주치게 되는 조용하고 애틋한 사랑 이야기.',
  },
  {
    genre: 'MYSTERY',
    title: '열두 번의\n목요일',
    color: '#2a3d5a',
    imageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/sample-mystery.png',
    prompt:
      '매주 목요일 같은 카페 창가에 홀로 앉아 아무것도 주문하지 않는 낯선 사람. 열두 번의 목요일이 지나도록 그 자리를 지키는 이유를 추적하다 드러나는 예상치 못한 진실.',
  },
  {
    genre: 'FANTASY',
    title: '달빛 아래\n세 번째 문',
    color: '#3d2a5a',
    imageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/sample-fantasy.png',
    prompt:
      '보름달이 뜨는 밤에만 나타나는 낡은 골목 끝의 세 번째 문. 문 너머는 현실과 다른 세계로 이어진다는 전설이 있다. 처음 그 문을 열게 된 날부터 두 세계 사이에서 펼쳐지는 이야기.',
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
