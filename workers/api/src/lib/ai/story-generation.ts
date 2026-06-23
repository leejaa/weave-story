// Story generation support: shared chapter types + the rolling recap memo.
// Direct (non-harness) chapter generation was removed 2026-06-23 — the harness
// pipeline (story-harness/) is now the sole generation path. The per-language
// GUIDES prompts and zod chapter schemas that only the direct path used were
// deleted along with it.
import { createGateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';
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
  // 롤링 진행 메모(threads.recap) — "지금까지의 이야기". 있으면 챕터별 요약 나열 대신 사용.
  recap?: string | null;
  // 불변 캐논(story_bibles.canon) — recap 갱신 시 모순 방지 가드레일.
  canon?: string | null;
  chosenOption: string;
  // How the reader picked: a menu option vs free-typed text. Free input gets the strongest
  // "execute literally" treatment in the prompt. Optional for backward-compat with old jobs.
  choiceKind?: 'choice' | 'free_input';
  nextChapterNumber: number;
};

const RECAP_MAX_CHARS = 1200;

/**
 * 롤링 "지금까지의 이야기" 메모 갱신. 이전 recap + 방금 완성된 챕터 → 갱신 메모.
 * 캐논과 모순 금지, 열린 떡밥·인물 상태·아크 위치를 추적하며 길이 제한. 챕터당 1콜(Haiku) — 기존 챕터별 요약 콜을 대체.
 */
export async function generateStoryRecap(params: {
  prevRecap: string | null;
  chapterContent: string;
  canon: string | null;
  chapterNumber: number;
  estimatedChapters: number;
  threadId: string;
  apiKey: string;
  language: StoryLang;
}): Promise<string> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const langName = langDisplayName(params.language);
  const system = [
    'You maintain a running "story so far" memo for a serialized interactive novel.',
    `Write the memo in ${langName}. Output ONLY the memo text (no preamble).`,
    `Keep it under ${RECAP_MAX_CHARS} characters — a concise, factual writer's memo, not prose.`,
    'Preserve established facts; NEVER contradict the CANON. Drop resolved threads, keep open threads,',
    'track key character states/relationships and the narrative arc position (setup/rising/turn/resolution).',
  ].join(' ');
  const prompt = [
    params.canon ? `[CANON — must never be contradicted]\n${params.canon}` : '',
    params.prevRecap ? `[Existing memo so far]\n${params.prevRecap}` : '',
    `[Just-finished chapter ${params.chapterNumber}/${params.estimatedChapters}]\n${params.chapterContent}`,
    'Update the running "story so far" memo to reflect the chapter above. Output only the updated memo.',
  ].filter(Boolean).join('\n\n');
  const { text } = await generateText({
    model: gateway('anthropic/claude-haiku-4-5-20251001'),
    system,
    prompt,
    maxOutputTokens: 2000,
  });
  const recap = text.trim();
  console.log(`[recap] thread=${params.threadId} chapter=${params.chapterNumber} len=${recap.length}`);
  return recap.slice(0, RECAP_MAX_CHARS * 2);
}
