import { z } from 'zod';

// Story blueprint (Phase A): a one-time global plan written at story creation. It gives
// every chapter a concrete, story-specific job instead of only generic phase guidance —
// so hooks get PAID OFF on a schedule (not piled up) and the genre stays locked (no
// drift into a clue-dropping mystery). It is a flexible spine, NOT a rigid per-chapter
// script: arcs are keyed by PROGRESS fraction (chapterNumber/total), so the same plan
// works regardless of total chapter count and survives the reader's branching choices.

// A micro-arc spanning a fraction of the story. Each arc plants at most one hook and
// pays off an earlier one, giving a ~3-chapter plant→payoff cadence (length-agnostic).
export const BlueprintArcSchema = z.object({
  fromProgress: z.number().min(0).max(1),
  toProgress: z.number().min(0).max(1),
  goal: z.string().min(2).max(240), // 이 아크에서 주인공의 하위 목표(능동)
  plant: z.string().max(240).optional().default(''), // 이 아크가 새로 심는 떡밥(없으면 '')
  payoff: z.string().max(240).optional().default(''), // 이 아크가 회수하는 이전 떡밥(없으면 '')
});
export type BlueprintArc = z.infer<typeof BlueprintArcSchema>;

export const StoryBlueprintSchema = z.object({
  genre: z.string().min(2).max(80), // 단일 확정 장르(이후 불변 잠금)
  genreConventions: z.array(z.string().min(2).max(160)).min(1).max(5), // 지킬 관습
  avoid: z.array(z.string().min(2).max(160)).min(1).max(6), // 피할 것(추리·미스터리화 금지 포함)
  spine: z.string().min(4).max(300), // 주인공의 핵심 능동 목표(척추, 불변)
  centralQuestion: z.string().min(4).max(240), // 작품 전체가 답할 하나의 질문
  endingDirection: z.string().min(4).max(400), // 결말 방향(대본 아님)
  arcs: z.array(BlueprintArcSchema).min(2).max(10),
});
export type StoryBlueprint = z.infer<typeof StoryBlueprintSchema>;
