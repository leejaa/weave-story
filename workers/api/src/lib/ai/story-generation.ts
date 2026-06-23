// Story generation support: shared chapter types + the structured story-state memo.
// Direct (non-harness) chapter generation was removed 2026-06-23 — the harness
// pipeline (story-harness/) is now the sole generation path. The per-language
// GUIDES prompts and zod chapter schemas that only the direct path used were
// deleted along with it.
//
// Memory model (2026-06-23 refactor): the lossy free-text recap was replaced by a
// STRUCTURED story state (threads.story_state JSONB). Each chapter, Haiku reads the
// prior state + the just-finished chapter and emits an updated, schema-validated
// StoryState. This gives the next-chapter prompt a precise spine (drive), open
// loops, character states, and the consequence of the last choice — instead of one
// 1,200-char blob that drifted and lost the through-line.
import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { type StoryLang, normalizeStoryLang, langDisplayName } from './story-lang';

// Re-exported so existing importers (routes, harness, jobs) keep a single entry point.
export { normalizeStoryLang };
export type { StoryLang };

// Chapter result shapes the harness pipeline produces and persists. First
// chapters additionally carry the story-level title/genre.
export type FirstChapterResult = {
  title: string;
  genre: string;
  chapterTitle: string;
  content: string;
  situation: string;
  question: string;
  choices: string[];
};

export type NextChapterResult = {
  chapterTitle: string;
  content: string;
  situation: string;
  question: string;
  choices: string[];
};

// ─── Structured story state (threads.story_state) ────────────────────────────
// The spine that keeps a choice-driven serial coherent without pretending to be a
// pre-outlined novel. `drive` is the protagonist's CURRENT active goal — every
// chapter should advance or threaten it. The rest tracks what must not be dropped
// or contradicted across chapters.
export type StoryState = {
  drive: string; // 주인공의 현재 능동적 목표(척추)
  openLoops: string[]; // 열린 떡밥(미해결)
  characterStates: { name: string; state: string }[]; // 인물 상태/관계
  lastEvent: string; // 직전 화에서 벌어진 사건
  lastChoiceConsequence: string; // 직전 선택이 부른 결과
  locationTime: string; // 현재 위치/시점
};

const StoryStateSchema = z.object({
  drive: z.string().min(2).max(300),
  openLoops: z.array(z.string().min(2).max(240)).max(8),
  characterStates: z
    .array(z.object({ name: z.string().min(1).max(80), state: z.string().min(1).max(240) }))
    .max(10),
  lastEvent: z.string().min(2).max(400),
  lastChoiceConsequence: z.string().max(400),
  locationTime: z.string().max(200),
});

export type SetupContext = {
  prompt: string;
  estimatedChapters: number;
  language: StoryLang;
  // Actual output language detected from the prompt (e.g. 'id', 'es'). When set
  // and different from `language`, the harness instructs the model to write in
  // this language instead of the harness's native language.
  outputLanguage?: string;
  // Genre hint from the sample card the user picked (e.g. 'FANTASY', 'ROMANCE').
  // Used in harness prompts to prevent genre drift and anchor tone/style.
  hintGenre?: string;
};

export type ChapterSummaryEntry = { chapterNumber: number; summary: string };

export type ContinuationContext = SetupContext & {
  threadId?: string;
  previousChapterNumber: number;
  previousChapterContent: string;
  previousChaptersSummaries: ChapterSummaryEntry[];
  // 구조적 진행 상태(threads.story_state). 있으면 챕터별 요약 나열 대신 사용.
  storyState?: StoryState | null;
  // 불변 캐논(story_bibles.canon) — 상태 갱신 시 모순 방지 가드레일.
  canon?: string | null;
  chosenOption: string;
  // How the reader picked: a menu option vs free-typed text. Free input gets the strongest
  // "execute literally" treatment in the prompt. Optional for backward-compat with old jobs.
  choiceKind?: 'choice' | 'free_input';
  nextChapterNumber: number;
};

// Renders a StoryState into a compact, model-readable block for prompts. Kept here
// (not in the per-language guides) so every language injects the same structure.
// Labels are neutral English structural keys (the model reads them fine regardless of
// the output language); the VALUES are already in the story's language.
export function formatStoryState(state: StoryState | null | undefined): string | null {
  if (!state) return null;
  const lines: string[] = [];
  if (state.drive) lines.push(`- drive (protagonist's current goal): ${state.drive}`);
  if (state.locationTime) lines.push(`- location/time: ${state.locationTime}`);
  if (state.lastEvent) lines.push(`- last event: ${state.lastEvent}`);
  if (state.lastChoiceConsequence) lines.push(`- consequence of last choice: ${state.lastChoiceConsequence}`);
  if (state.characterStates?.length) {
    lines.push(`- character states: ${state.characterStates.map(c => `${c.name}(${c.state})`).join('; ')}`);
  }
  if (state.openLoops?.length) {
    lines.push(`- open loops: ${state.openLoops.map(l => `· ${l}`).join(' ')}`);
  }
  return lines.length ? lines.join('\n') : null;
}

/**
 * 구조적 진행 상태 갱신. 이전 상태 + 방금 완성된 챕터(+직전 선택) → 갱신된 StoryState.
 * 캐논과 모순 금지. 열린 떡밥 회수/추가, 인물 상태, drive(능동 목표), 직전 선택의 결과를 추적.
 * 챕터당 1콜(Haiku) — 기존 recap 콜을 대체.
 */
export async function updateStoryState(params: {
  prevState: StoryState | null;
  chapterContent: string;
  chosenOption?: string | null;
  canon: string | null;
  chapterNumber: number;
  estimatedChapters: number;
  threadId: string;
  apiKey: string;
  language: StoryLang;
}): Promise<StoryState> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const langName = langDisplayName(params.language);
  const system = [
    'You maintain a STRUCTURED state object for a choice-driven serialized interactive novel.',
    `Write all field values in ${langName}. Be concise and factual — a writer\'s memo, not prose.`,
    'NEVER contradict the CANON. Preserve established facts.',
    'drive = the protagonist\'s CURRENT active goal driving the story forward (update it as the goal evolves).',
    'openLoops = unresolved hooks/mysteries still in play; drop ones that got resolved this chapter, add new ones.',
    'characterStates = key characters and their current condition/relationship.',
    'lastEvent = the concrete event that happened in the just-finished chapter.',
    'lastChoiceConsequence = how the reader\'s last choice directly caused/shaped this chapter (empty for chapter 1).',
    'locationTime = where/when the story currently stands.',
  ].join(' ');
  const prompt = [
    params.canon ? `[CANON — must never be contradicted]\n${params.canon}` : '',
    params.prevState ? `[Previous state]\n${JSON.stringify(params.prevState, null, 2)}` : '',
    params.chosenOption ? `[Reader\'s last choice that led into this chapter]\n${params.chosenOption}` : '',
    `[Just-finished chapter ${params.chapterNumber}/${params.estimatedChapters}]\n${params.chapterContent}`,
    'Produce the UPDATED structured state reflecting the chapter above.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const { output } = await generateText({
    model: gateway('anthropic/claude-haiku-4-5-20251001'),
    system,
    prompt,
    maxOutputTokens: 2000,
    output: Output.object({ schema: StoryStateSchema }),
  });

  console.log(
    `[state] thread=${params.threadId} chapter=${params.chapterNumber} loops=${output.openLoops.length} chars=${output.characterStates.length}`,
  );
  return output;
}
