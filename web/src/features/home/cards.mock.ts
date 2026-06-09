import type { SampleCardData } from '@/lib/types';

const R2 = 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers';

/**
 * 개발용 목업 샘플카드 — 실제 ko 로케일 카피 + 실제 R2 커버 이미지 사용.
 * 토스 로그인(Task 3) 연동 후 useSampleCards 가 실제 /api/sample-cards 로 교체한다.
 * 색상/키 출처: workers/cover-image/src/index.ts, locales/ko/home.json
 */
export const MOCK_SAMPLE_CARDS: SampleCardData[] = [
  { genre: 'ROFAN', key: 'card-rofan', genreLabel: '로판', title: '공작이\n나를 선택했다', color: '#1a2540',
    prompt: '환생해서 들어간 소설 속 세계. 원작에서 냉혹한 빌런이었던 공작이 어째서인지 나에게만 다정하다.' },
  { genre: 'ROMANCE', key: 'card-romance', genreLabel: '로맨스', title: '당신과의\n계약 결혼', color: '#4a1e2a',
    prompt: '서로의 필요에 의해 시작된 계약 결혼. 감정은 없기로 했지만, 함께하는 시간이 길어질수록 마음이 흔들린다.' },
  { genre: 'FANTASY', key: 'card-fantasy', genreLabel: '판타지', title: '무능력자가\n세계 최강이었다', color: '#0d2818',
    prompt: '아무 능력도 없다며 무시당해온 사람. 하지만 숨겨진 고대의 각성이 시작되고 세계의 균형이 흔들린다.' },
  { genre: 'WUXIA', key: 'card-wuxia', genreLabel: '무협', title: '강호의\n마지막 검객', color: '#2d0808',
    prompt: '강호에서 사라진 지 10년. 스승의 죽음 뒤에 숨겨진 진실을 쫓아 다시 검을 든다.' },
  { genre: 'MYSTERY', key: 'card-mystery', genreLabel: '미스터리', title: '사라진 화가의\n마지막 그림', color: '#18182a',
    prompt: '저명한 화가가 마지막 작품을 완성하던 날 밤 흔적도 없이 사라졌다. 그 그림 속에 단서가 있다.' },
  { genre: 'HISTORICAL', key: 'card-historical', genreLabel: '역사극', title: '조선의\n여자 포도청', color: '#0f2010',
    prompt: '조선 시대, 신분을 숨기고 포도청에 들어간 여인. 사대부 가문의 연쇄 실종 사건을 파헤친다.' },
  { genre: 'MODERN_FANTASY', key: 'card-modern-fantasy', genreLabel: '현대판타지', title: '죽은 자와\n대화하는 가게', color: '#160a25',
    prompt: '서울 골목 끝, 간판도 없는 작은 가게. 이 가게의 주인은 세상을 떠난 이들의 마지막 말을 전한다.' },
  { genre: 'SF', key: 'card-sf', genreLabel: 'SF', title: '마지막\n지구인', color: '#050e1a',
    prompt: '인류 멸망 후 홀로 살아남은 우주비행사. 이름도 없는 별에서 다시 집으로 돌아가는 여정을 시작한다.' },
  { genre: 'ACTION', key: 'card-action', genreLabel: '액션', title: '랭크 없는\n헌터', color: '#1a1205',
    prompt: '전 세계에 던전이 열리고 각성자들이 생겨난 세상. 아무 등급도 받지 못한 자가 최강을 향해 나아간다.' },
  { genre: 'THRILLER', key: 'card-thriller', genreLabel: '스릴러', title: '완벽한\n거짓말', color: '#0a0f1a',
    prompt: '10년 전 사건의 유일한 생존자. 기억이 없어 혐의를 벗었지만, 기억이 돌아오기 시작한다.' },
].map((c, i): SampleCardData => ({
  id: c.genre.toLowerCase(),
  genre: c.genre,
  genreLabel: c.genreLabel,
  title: c.title,
  color: c.color,
  imageUrl: `${R2}/${c.key}.png`,
  prompt: c.prompt,
  displayOrder: i,
}));
