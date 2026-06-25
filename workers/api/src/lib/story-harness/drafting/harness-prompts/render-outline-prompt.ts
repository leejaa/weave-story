// Phase B — 아웃라인 비트 렌더 프롬프트(4개 언어 공유). 구조 지시는 중립 영어,
// 출력 언어는 각 언어의 system 프롬프트가 강제하고, 주입 값은 이미 스토리 언어다.
// 각 언어 빌더는 자기 GUARDRAIL/LENGTH 상수만 넘겨 위임한다.
import type { FirstDraftArgs, NextDraftArgs } from './types';
import { formatOutlineSpine, formatBeat, formatEndings } from '../../outline/format-outline';

type LangBlocks = { guardrail: string; length: string };

// 1화: 아웃라인 비트1을 렌더(빠른 도입 + 척추·중심미스터리 씨앗 + 강한 선택 압박).
export function renderFirstDraftPrompt(a: FirstDraftArgs, L: LangBlocks): string {
  const o = a.outline!;
  const beat = a.beat!;
  return [
    '[Story outline — the fixed spine of the WHOLE story (never deviate)]',
    formatOutlineSpine(o),
    '',
    "[Chapter 1's BEAT — accomplish this FUNCTION in this chapter]",
    formatBeat(beat),
    '',
    `[Reader's premise]\n${a.prompt}`,
    '',
    '[First-chapter rules]',
    '- Break the ordinary world within the first 2-3 paragraphs; do not drag the intro.',
    "- Plant the seed of the protagonist's spine and the central arc/goal, but do NOT explain everything up front.",
    '- The protagonist is ACTIVE — wants something and moves, not merely reacts.',
    '- Stay faithful to the GIVEN genre and tone; do NOT turn it into a mystery/investigation unless the genre is mystery.',
    '- Use ONLY the characters, places, and rules in the outline — do NOT invent new named entities or settings.',
    '- End on strong choice pressure (a decision moment), not a trivial reaction.',
    '',
    L.guardrail,
    '',
    L.length,
  ].join('\n');
}

// 2화+: 직전 선택을 실제로 실행하면서 이번 비트의 "기능"으로 수렴. 중심미스터리/주인공 척추 전진.
export function renderNextDraftPrompt(a: NextDraftArgs, L: LangBlocks): string {
  const o = a.outline!;
  const beat = a.beat!;
  const leanings = a.previousChaptersSummaries.length
    ? a.previousChaptersSummaries.map((s) => `${s.chapterNumber}: ${s.summary}`).join('\n')
    : '(없음)';
  return [
    '[Story outline — the fixed spine of the WHOLE story (never deviate)]',
    formatOutlineSpine(o),
    '',
    `[This chapter (${a.nextChapterNumber})'s BEAT — accomplish this FUNCTION]`,
    formatBeat(beat),
    '',
    `[Previous chapter ${a.previousChapterNumber} body]\n${a.previousChapterContent}`,
    `[Reader's choice]\n${a.chosenOption}`,
    '',
    '[MOST IMPORTANT — execute the choice, then converge to the beat]',
    "- The reader's chosen action MUST actually happen in the first 1-2 paragraphs (never blocked or nullified). It is the ROUTE to this beat.",
    "- Whatever the choice, accomplish THIS beat's function within this chapter.",
    '- Advance the central arc only by the step the beat specifies — never dump everything. ALSO move the protagonist\'s OWN stake forward.',
    '- Use ONLY characters/places/rules already in the outline. Do NOT introduce any new named character, place, faction, world rule, or mystery. Deepen what exists instead of adding.',
    '- Stay faithful to the GIVEN genre/tone; do NOT drift into a mystery/investigation plot unless the genre is mystery. A side character\'s sub-story must NOT hijack the protagonist\'s spine.',
    a.choiceKind === 'free_input'
      ? '- This action was typed by the reader — carry it out as literally as possible.'
      : '',
    a.isFinal
      ? `\n[Final chapter — resolve the story]\n${formatEndings(o, leanings)}`
      : '- End on a decision moment that calls for the next choice. Any closing hook must derive from THIS beat or the central arc — no unrelated new thread.',
    '',
    L.guardrail,
    '',
    L.length,
  ].filter(Boolean).join('\n');
}
