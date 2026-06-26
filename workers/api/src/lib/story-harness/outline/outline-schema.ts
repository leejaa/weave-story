import { z } from 'zod';

// Phase B — 사전 저작 전체 아웃라인. 생성 시 1회 저작되어 story_bibles.blueprint(재사용 컬럼)에
// 저장되고, 매 화는 이 아웃라인의 "기능 비트"를 렌더한다. 즉흥 생성 대신 고정 척추를 따른다.
//
// 핵심: beat는 "사건"이 아니라 "기능"이다 — 독자가 무엇을 고르든 그 선택대로 본문은 실제로
// 벌어지되(선택 실행 보장) 같은 기능 비트로 수렴한다. 그래서 선택과 충돌하지 않는다.

// 한 챕터가 달성할 기능 비트. beats.length === estimatedChapters (서수 매핑: beats[n-1] = n화).
export const OutlineBeatSchema = z.object({
  index: z.number().int().min(1),
  function: z.string().min(4).max(300), // 이 화가 서사적으로 달성하는 것(사건 아님)
  arcAdvance: z.string().min(2).max(300), // 중심 아크(목표/갈등)를 한 걸음 어떻게 전진시키나
  protagonistStake: z.string().min(2).max(300), // 주인공 본인 처지/목표가 어떻게 움직이나
  plant: z.string().max(240).optional().default(''), // 이 화가 심는 떡밥(있으면)
  payoff: z.string().max(240).optional().default(''), // 이 화가 회수하는 이전 떡밥(있으면)
});
export type OutlineBeat = z.infer<typeof OutlineBeatSchema>;

export const StoryOutlineSchema = z.object({
  genre: z.string().min(2).max(80),
  tone: z.string().min(2).max(200),
  logline: z.string().min(10).max(300),
  // 뼈대의 심장 — 이 이야기가 전하려는 감성·메시지·주제. 장르 레지스터(emotionalCore)에서
  // 출발해 전제에 맞게 구체화한다. centralArc·비트·떡밥·클라이맥스는 전부 여기서 파생/봉사한다.
  emotionalCore: z.object({
    feeling: z.string().min(4).max(220), // 독자에게 남길 핵심 정서/경험
    message: z.string().min(4).max(220), // 이 이야기가 말하려는 주제/메시지
  }),
  structureName: z.string().min(2).max(120), // 사용한 plot_structures 템플릿명
  spine: z.string().min(4).max(300), // 주인공의 능동 목표(불변 척추)
  // 중심 아크 — 작품 전체를 관통하는 "하나의 줄기". 장르중립: 미스터리(폭로)가 아니라
  // 고른 장르에 맞는 목표/갈등. 모든 비트가 이 질문을 한 걸음씩 전진시켜 응집을 만든다.
  centralArc: z.object({
    dramaticQuestion: z.string().min(4).max(300), // 이 이야기가 답하려는 하나의 극적 질문/목표
    throughline: z.string().min(4).max(400), // 그 질문이 처음→끝 어떻게 전개되는지(내부 설계)
  }),
  // 인과 앵커 — 독자가 "왜 그랬지?"라고 물을 만한 '주요 떡밥·핵심 행동/상태'와, 그것이
  // 필연인 인과 사슬(원인→현재까지 어떻게 이어져→그래서 이 행동/상태가 당연). 요소를 늘리는 게
  // 아니라 '있는 중요 요소'의 개연성을 뼈대에서 못 박는 층. 매 화 렌더·심사에 주입되어 지켜진다.
  causalAnchors: z.array(z.object({
    hook: z.string().min(4).max(200), // 정당화가 필요한 주요 떡밥/행동/상태(예: "서래가 본체로 안 돌아가려 함")
    why: z.string().min(12).max(500), // 그것이 납득되는 인과 사슬(원인→경위→그래서 필연). 라벨 금지, 사슬로.
  })).max(5).optional().default([]),
  // 핵심 설정 규칙 — 명확성에 꼭 필요한 최소 단정문만(신화·설정 폭주 금지). 0~3개.
  // 현실 배경 장르는 비어 있을 수 있다. 매 화 렌더에 주입되어 일관되게 지켜진다.
  worldRules: z.array(z.string().min(4).max(240)).max(3).optional().default([]),
  cast: z.array(z.object({
    name: z.string().min(1).max(80),
    role: z.string().min(2).max(120),
    want: z.string().min(2).max(200),
    secret: z.string().max(240).optional().default(''),
  })).min(1).max(4),
  relationships: z.array(z.object({
    between: z.string().min(2).max(120),
    dynamic: z.string().min(2).max(200),
    arc: z.string().min(2).max(240),
  })).max(4).optional().default([]),
  beats: z.array(OutlineBeatSchema).min(3).max(50),
  endings: z.array(z.object({
    id: z.string().min(1).max(40),
    condition: z.string().min(2).max(240), // 어떤 누적 선택 성향일 때 이 결말로 수렴
    shape: z.string().min(4).max(400),
  })).min(2).max(3),
});
export type StoryOutline = z.infer<typeof StoryOutlineSchema>;
