// English harness prompts (mirrors the Korean craft directives).
// Also serves as the fallback harness for any language not natively supported
// (e.g. Indonesian, Spanish). In that case `outputLanguage` is set on args and
// a language override instruction is prepended so the model writes in that language.
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';
import { langDisplayName } from '../../../ai/story-lang';
import { narrativePhase, type NarrativePhase } from '../narrative-phase';

// Per-arc-phase (act) pacing guidance — see narrative-phase.ts.
const EN_PHASE: Record<NarrativePhase, string> = {
  setup: 'This is the setup (act 1). Ground the world, the characters, and the protagonist\'s desire and wound, and plant the seed of the central conflict. Do not reveal every secret yet.',
  rising: 'This is the rising action (act 2). Escalate the conflict and the stakes. Add new obstacles, relational tension, and competing interests; let the protagonist\'s desire and wound begin to collide.',
  turn: 'This is the turn (midpoint). Raise the crisis with a reversal or an exposed secret. From here, hold back major new threads and start converging the conflicts already opened.',
  resolution: 'This is the convergence toward the climax. Begin paying off open threads; do not introduce new characters or subplots. Drive tension to just before the climax.',
  final: 'This is the final chapter. Deliver the climax and resolve the central conflict. Pay off the protagonist\'s desire and wound emotionally, tie up remaining threads, and close with resonance.',
};

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
    'Combine literary prose with web-fiction hooks.',
  ].join('\n'),
  firstStructureSystem: [
    'You are a web-fiction editor working in English.',
    'Read the given first chapter body and accurately extract the story bible and the reader choices.',
    'Do not invent events not in the body; use the choice pressure created by the final scene of the body.',
  ].join('\n'),
  nextDraftSystem: [
    'You are a serialized author on a web-fiction editorial team, writing in English.',
    'Carry over the previous chapter and the reader\'s choice, and write the next chapter where the cost of that choice surfaces as real events.',
    'Do not merely reference the chosen option — develop it into a result that immediately shakes power, relationships, secrets, or survival.',
    'The action the reader chose or typed MUST actually happen in the body. Do not block or nullify it — develop the world it changes, creatively.',
  ].join('\n'),
  nextStructureSystem: [
    'You are a web-fiction editor working in English.',
    'Read the given chapter body and accurately extract the reader choices that lead into the next chapter.',
    'Do not invent events not in the body; use the choice pressure created by the final scene of the body.',
  ].join('\n'),
  buildFirstDraft: ({ prompt, estimatedChapters, attempt, previousIssues, outputLanguage, hintGenre }) => {
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
      '- Within the first 3 paragraphs, break the protagonist\'s ordinary life or safety with an event.',
      '- If the prompt specifies a premise-transition event (death, reincarnation, regression, transmigration, etc.), that event MUST actually happen within this first chapter. Do not end the chapter as a "prologue" that only shows the before-state.',
      '- Genre lock: do NOT add mystery, noir, detective, or thriller elements not present in the original prompt. Maintain the genre and tone the prompt establishes.',
      '- The protagonist must not merely be surprised or wait — they should hold dangerous information or face a dangerous choice.',
      '- End the body at a decision moment that shakes at least one of: power, relationships, secrets, survival, false accusation, a contract, betrayal.',
      '- Do not end on a trivial reaction like "answers calmly" or "pretends not to know."',
      '',
      '[Length and format — very important]',
      '- content must be between 2600 and 3200 words of English. Under ~1600 words is a failure.',
      '- 18–24 paragraphs, each separated by a blank line.',
      '- Each paragraph runs 2–4 sentences. Do not summarize scenes; show them as real events.',
      '- This response writes ONLY the body (content) and the title fields. Choices are made in the next step.',
      '- Never put a choice list or a question to the reader inside the body (no "[Choice]", "Options", "①/②", "A)/B)"). End the body as narrative prose only.',
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
      '- choices: exactly 2. Each has text (a concrete action) and consequence (a hint of the outcome).',
      '',
      '[Choices must stake something high]',
      '- Each of the two choices must stake a clear danger or loss — a secret, a life, betrayal, evidence, identity, revenge, survival, a contract.',
      '- consequence must name the concrete threat or what stands to be lost.',
      '- The two choices must point in different directions; passive reactions like "stay calm / play dumb / wait" are forbidden.',
      '- Do not invent new events outside the body.',
    ].join('\n');
  },
  buildNextDraft: (a) => {
    const phase: NarrativePhase = a.isFinal ? 'final' : narrativePhase(a.nextChapterNumber, a.estimatedChapters);
    const recap = a.recap?.trim()
      ? a.recap.trim()
      : (a.previousChaptersSummaries.length > 0
          ? a.previousChaptersSummaries.map(s => `Chapter ${s.chapterNumber}: ${s.summary}`).join('\n')
          : 'No summary');
    const retry = a.previousIssues?.length ? `\n\n[Problems from the previous result you MUST fix]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      langOverride(a.outputLanguage),
      bibleSection(a.storyBible),
      '',
      `[User's original premise]\n${a.prompt}`,
      `Total chapters: ${a.estimatedChapters}`,
      `Chapter to write now: ${a.nextChapterNumber}`,
      `Generation attempt: ${a.attempt}/2`,
      retry,
      `[Story so far]\n${recap}`,
      `[Previous chapter ${a.previousChapterNumber} body]\n${a.previousChapterContent}`,
      `[Reader's choice]\n${a.chosenOption}`,
      '',
      '[The reader\'s chosen action MUST actually happen — most important]',
      '- The action written in "Reader\'s choice" above must literally occur within the first 1–2 paragraphs of the body.',
      '- Do not let it be merely attempted and then blocked, pre-empted by another character, or turned into a "tried but failed."',
      '- If the action is decisive (e.g., killing someone), it actually happens to that target; then branch the story through the new problems it creates — a corpse, exposure risk, a power vacuum, a clue lost or gained.',
      a.choiceKind === 'free_input'
        ? '- This action was typed directly by the reader. Carry it out as literally as possible.'
        : '- Carry out the action exactly as the option states; do not silently swap it for a different action.',
      '- However, if the action is physically impossible or breaks the established world, do not ignore it — execute the closest version that honors the reader\'s intent.',
      '',
      '[Narrative phase — this chapter\'s role]',
      EN_PHASE[phase],
      '',
      '[Next-chapter principles]',
      '- Within the first 2 paragraphs, show the result that changed because of the reader\'s choice.',
      '- The cost of the choice must alter at least one of: relationships, evidence, power, survival risk.',
      '- Do not re-explain prior emotions and events; push forward with new pressure.',
      '- Do not summarize scenes; develop through action, dialogue, and discovery.',
      a.isFinal ? '- This is the final chapter. Bring the story to a close in the body.' : '- End the body at a decision moment that calls for the next choice.',
      '',
      '[Length and format — very important]',
      '- content must be between 2500 and 3200 words of English. Under ~1600 words is a failure.',
      '- 18–24 paragraphs, each separated by a blank line.',
      '- This response writes ONLY the body (content) and the title. Choices are made in the next step.',
      '- Never put a choice list or a question to the reader inside the body (no "[Choice]", "Options", "①/②", "A)/B)"). End the body as narrative prose only.',
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
      '- choices: exactly 2. Each has text (a concrete action) and consequence (a hint of the outcome).',
      '',
      '[Choices must stake something high]',
      '- Each of the two choices must stake a clear danger or loss — a secret, a life, betrayal, evidence, identity, revenge, survival, a contract.',
      '- consequence must name the concrete threat or what stands to be lost.',
      '- The two choices must point in different directions; passive reactions like "stay calm / play dumb / wait" are forbidden.',
      '- Do not invent new events outside the body.',
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal, outputLanguage }) =>
    [
      langOverride(outputLanguage),
      'Below is the chapter body so far. It is too short — keep writing to extend it.',
      '─────────────',
      currentContent,
      '─────────────',
      '[Continuation rules — very important]',
      '- Do not start a new chapter. Continue naturally from the last scene of the body above.',
      '- Do not repeat or re-output anything already written. Output only the new body that follows.',
      `- Write at least ${Math.max(deficitChars, 600)} more characters. Do not summarize — develop through action, dialogue, and discovery.`,
      '- Separate each paragraph with a blank line.',
      isFinal
        ? '- This is the final chapter. Let the continuation bring the story to a natural close.'
        : '- End the continuation on a decision moment that demands the next choice.',
    ].join('\n'),
};
