export type SetupKey = 'mood' | 'setting' | 'protagonist' | 'premise' | 'length';

export type SetupQuestion = {
  key: SetupKey;
  label: string;
  question: string;
  choices: string[];
};

export const SETUP_QUESTIONS: SetupQuestion[] = [
  {
    key: 'mood',
    label: '분위기',
    question: '어떤 분위기의 이야기인가요?',
    choices: [
      '미스터리하고 음산한',
      '따뜻하고 서정적인',
      '긴장감 넘치는 스릴러',
      '기묘하고 몽환적인',
      '로맨틱하고 감성적인',
    ],
  },
  {
    key: 'setting',
    label: '배경',
    question: '이야기가 펼쳐지는 공간은?',
    choices: [
      '안개 낀 항구 도시',
      '한적한 시골 마을',
      '첨단 기술의 미래 도시',
      '오래된 왕국',
      '이국적인 나라의 소도시',
    ],
  },
  {
    key: 'protagonist',
    label: '주인공',
    question: '주인공은 어떤 사람인가요?',
    choices: [
      '나 자신 (1인칭)',
      '비밀을 품은 탐정',
      '평범한 일상의 사람',
      '재능 있는 예술가',
      '기억을 잃은 사람',
    ],
  },
  {
    key: 'premise',
    label: '씨앗',
    question: '이야기의 씨앗은 무엇인가요?',
    choices: [
      '사라진 누군가를 찾아서',
      '우연히 발견한 오래된 비밀',
      '예기치 않은 만남',
      '돌아갈 수 없는 선택',
      '몰랐던 진실을 마주하다',
    ],
  },
  {
    key: 'length',
    label: '길이',
    question: '얼마나 긴 이야기를 원하시나요?',
    choices: [
      '단편 (5챕터)',
      '중편 (10챕터)',
      '장편 (20챕터)',
    ],
  },
];

export function parseEstimatedChapters(length: string): number {
  if (length.includes('5')) return 5;
  if (length.includes('20')) return 20;
  return 10;
}
