import type { Chapter, ThreadDetail } from '@/lib/types';

const THREAD_ID = 'mock-rofan';
const STORY_ID = 'mock-story';
const ESTIMATED = 3;

function ch(n: number, data: Partial<Chapter>): Chapter {
  return {
    id: `mock-ch-${n}`,
    threadId: THREAD_ID,
    chapterNumber: n,
    title: null,
    content: null,
    imageUrl: null,
    options: null,
    situation: null,
    question: null,
    status: 'ready',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...data,
  };
}

/** 데모용으로 미리 써둔 3개 챕터 본문(읽기→선택 루프 시연). */
export const MOCK_CHAPTERS: Chapter[] = [
  ch(1, {
    title: '제1장 · 장미와 가시',
    content:
      '공작의 서재는 늦은 오후의 빛으로 가득했다. 그는 창가에 서서 오래도록 정원을 바라보고 있었고, 나는 문턱에서 차마 더 다가서지 못한 채 그의 등을 응시했다. 원작 속에서 그는 모두가 두려워하던 냉혹한 빌런이었다. 그런데 어째서인지, 이 세계의 그는 나에게만 다정했다.\n\n「두려운가?」 그가 돌아보지 않고 물었다. 목소리에는 익숙한 냉기 대신, 처음 듣는 낮은 떨림이 배어 있었다. 나는 대답 대신 한 걸음을 내디뎠다. 마룻바닥이 작게 울렸고, 그 소리에 그가 천천히 고개를 돌렸다.\n\n그의 눈은 내가 알던 소설 속 묘사보다 훨씬 깊고 외로웠다. 「오늘 밤, 나와 함께 가 주겠소?」 그가 손을 내밀었다. 그 손을 잡는 순간 이야기는 원작에서 완전히 벗어나 버릴 것이다.',
    situation: '공작이 들고 있던 장미를 탁자에 내려놓고 나를 바라보았다.',
    question: '그의 손을 잡을 것인가?',
    options: [
      { index: 0, text: '망설임 없이 그의 손을 잡는다' },
      { index: 1, text: '왜 하필 나냐고 먼저 묻는다' },
      { index: 2, text: '정중히 거절하고 돌아선다' },
    ],
  }),
  ch(2, {
    title: '제2장 · 달빛 아래의 약속',
    content:
      '마차는 어둠을 가르며 북쪽 별궁으로 향했다. 공작은 맞은편에 앉아 줄곧 창밖만 바라보았지만, 그의 시선이 이따금 나에게 머무는 것을 나는 느낄 수 있었다. 「당신은 나를 두려워하지 않는 유일한 사람이오.」 마침내 그가 입을 열었다.\n\n별궁에 도착하자 그는 내 손을 잡아 마차에서 내려 주었다. 달빛이 그의 은빛 머리칼 위로 부서졌다. 「내가 왜 당신을 선택했는지 궁금하지 않소?」 그가 물었다. 나는 고개를 끄덕였다. 진실이 무엇이든, 이제는 알아야 했다.',
    situation: '공작이 별궁의 문 앞에서 걸음을 멈추고 나를 돌아보았다.',
    question: '그의 진심을 어떻게 마주할 것인가?',
    options: [
      { index: 0, text: '먼저 그의 손을 꼭 잡아 준다' },
      { index: 1, text: '원작의 결말을 알고 있다고 고백한다' },
      { index: 2, text: '아무 말 없이 그의 눈을 바라본다' },
    ],
  }),
  ch(3, {
    title: '제3장 · 새로 쓰이는 이야기',
    content:
      '「나는 당신이 정해진 운명대로 죽기를 바라지 않소.」 공작의 목소리가 밤공기 속에 낮게 가라앉았다. 그 한마디에, 내가 알던 비극적인 결말이 산산이 부서지는 것을 느꼈다. 이 이야기는 더 이상 원작이 아니었다.\n\n나는 그의 뺨에 손을 얹었다. 「그렇다면, 우리 함께 새로운 결말을 써요.」 그가 처음으로 웃었다. 그 미소는 어떤 문장으로도 옮길 수 없을 만큼 환했다. 우리의 이야기는 이제 막 시작되고 있었다.',
    situation: '공작이 당신의 손을 자신의 뺨에 마주 댄 채 눈을 감았다.',
    question: '이 이야기를 어떻게 끝맺을 것인가?',
    options: [
      { index: 0, text: '그에게 입맞춤한다' },
      { index: 1, text: '함께 떠나자고 제안한다' },
      { index: 2, text: '영원히 곁에 있겠다고 약속한다' },
    ],
  }),
];

/** 생성 중 상태의 빈 챕터 (데모 폴링 시뮬레이션용) */
export function genChapter(n: number): Chapter {
  return ch(n, { status: 'generating' });
}

/** 초기 스레드 — 1장만 ready 로 노출, 나머지는 선택 시 차례로 공개 */
export function makeMockThread(): ThreadDetail {
  return {
    threadId: THREAD_ID,
    status: 'active',
    currentChapter: 1,
    progress: '0.000',
    lastReadAt: '2026-01-01T00:00:00.000Z',
    storyId: STORY_ID,
    title: '공작이 나를 선택했다',
    genre: 'ROFAN',
    mood: '설렘',
    coverImageUrl: 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/card-rofan.png',
    estimatedChapters: ESTIMATED,
    prompt: '몰락 직전의 백작가 영애로 빙의했는데, 첫날부터 냉혈한 공작이 나를 약혼자로 지목했다.',
    chapters: [MOCK_CHAPTERS[0]],
    interventions: [],
  };
}

export const MOCK_ESTIMATED = ESTIMATED;
