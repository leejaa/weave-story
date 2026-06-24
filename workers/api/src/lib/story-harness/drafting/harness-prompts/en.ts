// English harness prompts (mirrors the Korean craft directives).
// Also serves as the fallback harness for any language not natively supported
// (e.g. Indonesian, Spanish). In that case `outputLanguage` is set on args and
// a language override instruction is prepended so the model writes in that language.
//
// Concept (2026-06-23 refactor): not a "consistent long novel" but a thin spine
// (the protagonist's active goal) where every chapter delivers a concrete event
// that is the direct consequence of the prior choice, leaves a fresh hook, and reads
// fast. See ko.ts for the canonical commentary.
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';
import { langDisplayName } from '../../../ai/story-lang';
import { formatStoryState } from '../../../ai/story-generation';
import { narrativePhase, chapterEventBeat, hookDirective, type NarrativePhase, type EventBeat, type HookDirective } from '../narrative-phase';
import { currentArc, formatBlueprintSpine, formatGenreLock, formatArc } from '../../blueprint/format-blueprint';
import { renderFirstDraftPrompt, renderNextDraftPrompt } from './render-outline-prompt';

// Per-arc-phase (act) pacing guidance — see narrative-phase.ts.
const EN_PHASE: Record<NarrativePhase, string> = {
  setup: 'This is the setup (act 1). Ground the world, the characters, and the protagonist\'s desire and wound, and plant the seed of the central conflict. Do not reveal every secret yet.',
  rising: 'This is the rising action (act 2). Escalate the conflict and the stakes, but DEVELOP and start paying off the threads already opened. Do not keep stacking new mysteries; let the protagonist\'s desire and wound collide.',
  turn: 'This is the turn (midpoint). Raise the crisis with a reversal or an exposed secret. From here, hold back major new threads and start converging the conflicts already opened.',
  resolution: 'This is the convergence toward the climax. Begin paying off open threads; do not introduce new characters or subplots. Drive tension to just before the climax.',
  final: 'This is the final chapter. Deliver the climax and resolve the central conflict. Pay off the protagonist\'s desire and wound emotionally, tie up remaining threads, and close with resonance.',
};

// The KIND of event this chapter should deliver — rotated so consecutive chapters don't feel the same.
const EN_EVENT_BEAT: Record<EventBeat, string> = {
  confrontation: 'confrontation — a deferred conflict finally erupts head-on.',
  revelation: 'revelation — a hidden fact, identity, or clue comes to light.',
  externalThreat: 'external threat — an out-of-control threat (an enemy, an incident, time pressure) bears down.',
  allianceShift: 'shift in alliances — an ally/enemy alignment flips or a new player cuts in.',
  reversal: 'reversal — the situation turns out the opposite of what the protagonist expected.',
  costSurfaces: 'cost surfaces — the fallout/price of an earlier choice lands concretely.',
};

// Hook accounting directive — orthogonal to EventBeat. Stops the monotonic pile-up.
const EN_HOOK_DIRECTIVE: Record<HookDirective, string> = {
  plant_ok: 'Hook accounting: you may plant about one new hook. But the body must actually advance via this chapter\'s event — do not just drop hooks and stop.',
  payoff_due: 'Hook accounting (important): this chapter must CLEARLY RESOLVE at least one open loop within the body (the reader should feel they got an answer). Do not add new hooks without resolving one. A new hook is allowed only AFTER a payoff, and only one, directly tied to what you just resolved.',
  converge: 'Hook accounting (converge): do NOT add any new hooks; focus only on resolving open loops. Pull the scattered threads into one direction.',
};

// Readability-first prose guardrail — curbs the alignment-model mannerisms (antithesis spam, telling, abstract monologue).
const EN_PROSE_GUARDRAIL = [
  '[Prose guardrail — readability first]',
  '- Do not overuse antithesis/parallelism ("not X but Y", "the more ... the more ..."). Once or twice per chapter is plenty.',
  '- Do not pile on abstract interior monologue or conceptual narration; show through action, dialogue, and the senses (show, don\'t tell).',
  '- Do not repeat the same metaphor/motif (light, shadow, heartbeat, temperature, etc.).',
  '- Vary sentence length. Mix in short, sharp sentences to build rhythm.',
  '- Use dialogue actively to move the scene.',
].join('\n');

// Length/format — short, fast web fiction. (draft stage)
const EN_LENGTH = [
  '[Length and format]',
  '- content must be between 1,000 and 1,600 words of English. Keep it tight and event-driven; do not pad.',
  '- 8–14 paragraphs, each separated by a blank line. Do not let any paragraph run too long.',
  '- Do not summarize scenes; show them as real events through action and dialogue.',
  '- This response writes ONLY the body (content) and the title fields. Choices are made in the next step.',
  '- Never put a choice list or a question to the reader inside the body (no "[Choice]", "Options", "①/②", "A)/B)"). End the body as narrative prose only.',
].join('\n');

// Causal choice rules — structure stage.
const EN_CHOICE_RULES = [
  '[Choice rules — causal and active]',
  '- choices: exactly 2. Each has text (a concrete action) and consequence (a hint of the outcome).',
  '- Both choices must be the protagonist\'s ACTIVE response to this chapter\'s event.',
  '- The two choices must lead to clearly DIFFERENT next events (different directions, different risks, different outcomes).',
  '- Forbid "observe/avoid/retreat" choices that fail to move the situation forward (stay calm, play dumb, wait, think it over).',
  '- consequence must name the concrete threat or what stands to be lost.',
  '- Do not invent events outside the body. Do not include dialogue in situation.',
].join('\n');

function langOverride(outputLanguage?: string): string {
  if (!outputLanguage || outputLanguage === 'en') return '';
  const name = langDisplayName(outputLanguage);
  return `CRITICAL: Write every field — title, chapterTitle, genre, content, choices, all text — entirely in ${name}. Do not use English anywhere.\n\n`;
}

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\nNo saved story bible yet. Keep continuity from the user premise and previous chapters.';
  }
  return [
    storyBible.canon ? `[CANON — must never be contradicted (keep core mechanics like death/reincarnation and the genre intact)]\n${storyBible.canon}\n` : '',
    '[Story Bible]',
    `Logline: ${storyBible.logline}`,
    `Genre: ${storyBible.genre}`,
    `Tone: ${storyBible.tone}`,
    `Protagonist: ${storyBible.protagonist}`,
    `Central conflict: ${storyBible.centralConflict}`,
    `Reader promise: ${storyBible.readerPromise}`,
    `Opening threat: ${storyBible.openingThreat}`,
    storyBible.desire ? `Protagonist's desire: ${storyBible.desire}` : '',
    storyBible.wound ? `Protagonist's wound/fear: ${storyBible.wound}` : '',
    storyBible.openThreads.length ? `[Open threads]\n${storyBible.openThreads.map(t => `- ${t}`).join('\n')}` : '',
    storyBible.forbiddenPatterns.length ? `[Forbidden patterns]\n${storyBible.forbiddenPatterns.map(p => `- ${p}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

export const EN: HarnessGuide = {
  firstDraftSystem: [
    'You are a lead author on a serialized web-fiction editorial team, writing in English.',
    'Open events fast and create strong choice pressure so the reader keeps turning pages from the very first chapter on mobile.',
    'Make it read fast above all — show through scene, action, and dialogue rather than conceptual narration.',
  ].join('\n'),
  firstStructureSystem: [
    'You are a web-fiction editor working in English.',
    'Read the given first chapter body and accurately extract the story bible and the reader choices.',
    'Do not invent events not in the body; use the choice pressure created by the final scene of the body.',
  ].join('\n'),
  nextDraftSystem: [
    'You are a serialized author on a web-fiction editorial team, writing in English.',
    'Carry over the previous chapter and the reader\'s choice, and write the next chapter where the cost of that choice surfaces as a real event.',
    'Every chapter must contain one concrete event that changes the situation as the direct consequence of the last choice. Do not circle in place or fill the chapter with interior rumination.',
    'The action the reader chose or typed MUST actually happen in the body. Do not block or nullify it — develop the world it changes.',
  ].join('\n'),
  nextStructureSystem: [
    'You are a web-fiction editor working in English.',
    'Read the given chapter body and accurately extract the reader choices that lead into the next chapter.',
    'Do not invent events not in the body; use the choice pressure created by the final scene of the body.',
  ].join('\n'),
  buildFirstDraft: (a) => {
    if (a.outline && a.beat) return langOverride(a.outputLanguage) + renderFirstDraftPrompt(a, { guardrail: EN_PROSE_GUARDRAIL, length: EN_LENGTH });
    const { prompt, estimatedChapters, attempt, previousIssues, outputLanguage, hintGenre } = a;
    const retry = previousIssues?.length ? `\n\n[Problems from the previous result you MUST fix]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreHint = hintGenre ? `\n[Selected genre: ${hintGenre}]\nMaintain the tone and style of this genre. Do not add mystery, noir, or thriller elements that are absent from this genre.\n` : '';
    return [
      langOverride(outputLanguage),
      `The story the reader wants:\n"${prompt}"`,
      `Total chapters: ${estimatedChapters}`,
      `Generation attempt: ${attempt}/2`,
      retry,
      genreHint,
      '[Narrative phase — this chapter\'s role]',
      EN_PHASE.setup,
      '',
      '[First-chapter design principles]',
      '- Within the first 2–3 paragraphs, break the protagonist\'s ordinary life or safety with an event. Do not drag out the setup.',
      '- If the prompt specifies a premise-transition event (death, reincarnation, regression, transmigration, etc.), that event MUST actually happen within this first chapter. Do not end the chapter as a "prologue" that only shows the before-state.',
      '- Genre lock: do NOT add mystery, noir, detective, or thriller elements not present in the original prompt.',
      '- Plant the seed of an active goal (drive) that will pull the story forward. The protagonist wants something and moves, rather than merely being surprised or waiting.',
      '- End the body at a decision moment (a hook) that shakes at least one of: power, relationships, secrets, survival, false accusation, a contract, betrayal.',
      '- Do not end on a trivial reaction like "answers calmly" or "pretends not to know."',
      '',
      EN_PROSE_GUARDRAIL,
      '',
      EN_LENGTH,
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues, hintGenre }) => {
    const retry = previousIssues?.length ? `\n[Problems noted in the previous attempt — fix them this time]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreNote = hintGenre ? `\n[User-selected genre: ${hintGenre}]\nbible.genre should default to this genre.\n` : '';
    return [
      `The story the reader originally wanted:\n"${prompt}"`,
      `Total chapters: ${estimatedChapters}`,
      '',
      'Below is the first chapter body just written. Build the story bible and choices grounded in this body.',
      '─────────────',
      content,
      '─────────────',
      retry,
      genreNote,
      '[Extraction rules]',
      '- bible: a story bible consistent with the body. Fill each field concisely.',
      '- bible.desire: what the protagonist truly wants in this story (beyond survival). 1–2 sentences from the body.',
      '- bible.wound: the protagonist\'s emotional scar or deepest fear. 1–2 sentences from what the body reveals or implies.',
      '- bible.canon: the immutable core premise from the user\'s original prompt, with NO reinterpretation. Preserve core mechanics (death/reincarnation/possession/disappearance) and the genre exactly as written (e.g. do NOT turn "reincarnation" into "possession", or "death" into "disappearance"). 3–5 short declarative facts, under ~200 chars.',
      '- bible.genre: write only the genre(s) clearly present in the prompt and body. Do NOT add "mystery", "noir", or "thriller" unless explicitly in the original prompt.',
      '- bible.tone: extract the actual tone from the prompt and body. Do not layer in "cold and dark" or "mysterious" atmosphere that is absent from the source.',
      '- bible.forbidden_patterns must include "adding mystery/noir/thriller subplots not in the original premise."',
      '- situation: summarize the decision moment where the body ends in 1–2 sentences. Do not include dialogue.',
      '- question: a single-line question posed to the reader.',
      '',
      EN_CHOICE_RULES,
    ].join('\n');
  },
  buildNextDraft: (a) => {
    if (a.outline && a.beat) return langOverride(a.outputLanguage) + renderNextDraftPrompt(a, { guardrail: EN_PROSE_GUARDRAIL, length: EN_LENGTH });
    const phase: NarrativePhase = a.isFinal ? 'final' : narrativePhase(a.nextChapterNumber, a.estimatedChapters);
    const beat = EN_EVENT_BEAT[chapterEventBeat(a.nextChapterNumber)];
    const stateText = formatStoryState(a.storyState)
      ?? (a.previousChaptersSummaries.length > 0
          ? a.previousChaptersSummaries.map(s => `Chapter ${s.chapterNumber}: ${s.summary}`).join('\n')
          : 'None');
    const retry = a.previousIssues?.length ? `\n\n[Problems from the previous result you MUST fix]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';

    // Blueprint (if present) + hook accounting. Falls back to legacy behavior when absent (older stories).
    const bp = a.storyBible?.blueprint ?? null;
    const progress = a.estimatedChapters > 0 ? a.nextChapterNumber / a.estimatedChapters : 1;
    const directive = hookDirective(a.nextChapterNumber, a.estimatedChapters, a.storyState?.openLoops?.length ?? 0);
    const arc = bp ? currentArc(bp, progress) : null;
    const oldestLoops = (a.storyState?.openLoops ?? []).slice(0, 2);
    const blueprintSection = bp
      ? [
          '',
          '[Story blueprint — global plan (never deviate)]',
          formatBlueprintSpine(bp),
          '',
          '[Genre lock]',
          formatGenreLock(bp),
          '- Keep this story\'s genre to the end. Unless the genre IS mystery/detective, do not drift into mystery/procedural conventions of endlessly dropping clues or withholding information.',
          ...(arc ? ['', '[This chapter\'s role — blueprint arc]', formatArc(arc)] : []),
        ].join('\n')
      : '';
    const hookSection = [
      '',
      '[Hook accounting — strict]',
      EN_HOOK_DIRECTIVE[a.isFinal ? 'converge' : directive],
      oldestLoops.length
        ? `- Currently open loops (oldest first): ${oldestLoops.map(l => `"${l}"`).join(', ')}. When you resolve, close the oldest first.`
        : '',
      progress > 0.45 && !a.isFinal
        ? '- From here on, do not open more loops than you close (the total number of unresolved loops must not grow).'
        : '',
    ].filter(Boolean).join('\n');

    return [
      langOverride(a.outputLanguage),
      bibleSection(a.storyBible),
      blueprintSection,
      '',
      `[User's original premise]\n${a.prompt}`,
      `Total chapters: ${a.estimatedChapters}`,
      `Chapter to write now: ${a.nextChapterNumber}`,
      `Generation attempt: ${a.attempt}/2`,
      retry,
      `[Current story state]\n${stateText}`,
      `[Previous chapter ${a.previousChapterNumber} body]\n${a.previousChapterContent}`,
      `[Reader's choice]\n${a.chosenOption}`,
      '',
      '[The reader\'s chosen action MUST actually happen — most important]',
      '- The action written in "Reader\'s choice" above must literally occur within the first 1–2 paragraphs of the body.',
      '- Do not let it be merely attempted and then blocked, pre-empted by another character, or turned into a "tried but failed."',
      a.choiceKind === 'free_input'
        ? '- This action was typed directly by the reader. Carry it out as literally as possible.'
        : '- Carry out the action exactly as the option states; do not silently swap it for a different action.',
      '- However, if the action is physically impossible or breaks the established world, do not ignore it — execute the closest version that honors the reader\'s intent.',
      '',
      '[This chapter\'s event — most important]',
      '- This chapter must contain ONE concrete event that changes the situation as the direct consequence of the last choice. Do not fill it with interior rumination, recap, or circling in place.',
      '- That event must change the state of at least one of: power, relationships, secrets, survival, location — versus the previous chapter.',
      '- Advance one step toward the drive (the protagonist\'s current goal), or threaten it anew.',
      `- Vary the KIND of event where possible (do not repeat the same kind as the previous chapter): ${beat}`,
      hookSection,
      a.isFinal
        ? '- This is the final chapter. Bring the story to a close in the body.'
        : '- End the body on a decision moment that calls for the next choice. The closing hook must obey "Hook accounting" above — it must be a planned question from the blueprint or one that arises naturally from the loop you just resolved; do not add an unrelated new mystery each chapter.',
      '',
      '[Narrative phase — this chapter\'s role]',
      EN_PHASE[phase],
      '',
      EN_PROSE_GUARDRAIL,
      '',
      EN_LENGTH,
    ].join('\n');
  },
  buildNextStructure: ({ prompt, estimatedChapters, nextChapterNumber, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[Problems noted in the previous attempt — fix them this time]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `The story the reader originally wanted:\n"${prompt}"`,
      `Current chapter: ${nextChapterNumber} / ${estimatedChapters} total`,
      '',
      'Below is the chapter body just written. Build the choices that lead into the next chapter, grounded in this body.',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[Extraction rules]',
      '- situation: summarize the decision moment where the body ends in 1–2 sentences. Do not include dialogue.',
      '- question: a single-line question posed to the reader.',
      '',
      EN_CHOICE_RULES,
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal, outputLanguage }) =>
    [
      langOverride(outputLanguage),
      'Below is the chapter body so far. It is a little short — keep writing to extend it.',
      '─────────────',
      currentContent,
      '─────────────',
      '[Continuation rules]',
      '- Do not start a new chapter. Continue naturally from the last scene of the body above.',
      '- Do not repeat or re-output anything already written. Output only the new body that follows.',
      `- Write roughly ${Math.max(deficitChars, 400)} more characters. Do not summarize — develop through action, dialogue, and discovery.`,
      '- Separate each paragraph with a blank line.',
      isFinal
        ? '- This is the final chapter. Let the continuation bring the story to a natural close.'
        : '- End the continuation on a fresh hook and a decision moment that demands the next choice.',
    ].join('\n'),
};
