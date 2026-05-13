export type Archetype = {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
};

export const ARCHETYPES: Archetype[] = [
  {
    id: 'magic-school',
    emoji: '🧙',
    label: '마법학교',
    prompt: '마법학교에서 숨겨진 능력을 발견한 평범한 학생의 이야기. 비밀스러운 교수, 위험한 금지 구역, 그리고 고대 예언이 얽힌 운명.',
  },
  {
    id: 'victorian-detective',
    emoji: '🔍',
    label: '빅토리안 추리',
    prompt: '19세기 런던을 배경으로 한 날카로운 탐정 이야기. 안개 낀 골목, 기묘한 사건, 그리고 예측 불가한 반전.',
  },
  {
    id: 'post-apocalypse',
    emoji: '🌆',
    label: '포스트 아포칼립스',
    prompt: '문명이 무너진 세계에서 살아남기 위해 싸우는 생존자들의 이야기. 신뢰와 배신, 희망과 절망이 교차하는 여정.',
  },
  {
    id: 'romantic-historical',
    emoji: '🌹',
    label: '로맨틱 시대극',
    prompt: '화려한 궁중을 배경으로 한 신분을 초월한 금지된 사랑 이야기. 음모와 질투 속에서 피어나는 진심.',
  },
  {
    id: 'space-opera',
    emoji: '🚀',
    label: '스페이스 오페라',
    prompt: '광활한 우주를 무대로 펼쳐지는 영웅들의 서사시적 모험. 전쟁, 동맹, 그리고 인류의 운명을 건 선택.',
  },
  {
    id: 'folk-horror',
    emoji: '🌾',
    label: '민속 호러',
    prompt: '한국의 깊은 산골 마을을 배경으로 오래된 전설이 살아 움직이는 이야기. 어둠이 깔리면 드러나는 진실.',
  },
];
