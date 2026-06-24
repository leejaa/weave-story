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
  centralAdvance: z.string().min(2).max(300), // 중심 미스터리를 한 조각 어떻게 전진시키나
  protagonistStake: z.string().min(2).max(300), // 주인공 본인 처지/목표가 어떻게 움직이나
  plant: z.string().max(240).optional().default(''), // 이 화가 심는 떡밥(있으면)
  payoff: z.string().max(240).optional().default(''), // 이 화가 회수하는 이전 떡밥(있으면)
});
export type OutlineBeat = z.infer<typeof OutlineBeatSchema>;

export const StoryOutlineSchema = z.object({
  genre: z.string().min(2).max(80),
  tone: z.string().min(2).max(200),
  logline: z.string().min(10).max(300),
  structureName: z.string().min(2).max(120), // 사용한 plot_structures 템플릿명
  spine: z.string().min(4).max(300), // 주인공의 능동 목표(불변 척추)
  centralMystery: z.object({
    question: z.string().min(4).max(300), // 작품 전체를 관통하는 하나의 극적 질문
    intendedAnswer: z.string().min(4).max(500), // 내부용: 결국 밝혀질 답(독자에 직접 노출 X)
  }),
  cast: z.array(z.object({
    name: z.string().min(1).max(80),
    role: z.string().min(2).max(120),
    want: z.string().min(2).max(200),
    secret: z.string().max(240).optional().default(''),
  })).min(1).max(6),
  relationships: z.array(z.object({
    between: z.string().min(2).max(120),
    dynamic: z.string().min(2).max(200),
    arc: z.string().min(2).max(240),
  })).max(6).optional().default([]),
  beats: z.array(OutlineBeatSchema).min(3).max(50),
  endings: z.array(z.object({
    id: z.string().min(1).max(40),
    condition: z.string().min(2).max(240), // 어떤 누적 선택 성향일 때 이 결말로 수렴
    shape: z.string().min(4).max(400),
  })).min(2).max(3),
});
export type StoryOutline = z.infer<typeof StoryOutlineSchema>;
