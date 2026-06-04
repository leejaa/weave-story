// English harness prompts (mirrors the Korean craft directives).
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\nNo saved story bible yet. Keep continuity from the user premise and previous chapters.';
  }
  return [
    '[Story Bible]',
    `Logline: ${storyBible.logline}`,
    `Genre: ${storyBible.genre}`,
    `Tone: ${storyBible.tone}`,
    `Protagonist: ${storyBible.protagonist}`,
    `Central conflict: ${storyBible.centralConflict}`,
    `Reader promise: ${storyBible.readerPromise}`,
    `Opening threat: ${storyBible.openingThreat}`,
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
  ].join('\n'),
  nextStructureSystem: [
    'You are a web-fiction editor working in English.',
    'Read the given chapter body and accurately extract the reader choices that lead into the next chapter.',
    'Do not invent events not in the body; use the choice pressure created by the final scene of the body.',
  ].join('\n'),
  buildFirstDraft: ({ prompt, estimatedChapters, attempt, previousIssues }) => {
    const retry = previousIssues?.length ? `\n\n[Problems from the previous result you MUST fix]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `The story the reader wants:\n"${prompt}"`,
      `Total chapters: ${estimatedChapters}`,
      `Generation attempt: ${attempt}/2`,
      retry,
      '[First-chapter design principles]',
      '- Within the first 3 paragraphs, break the protagonist\'s ordinary life or safety with an event.',
      '- The protagonist must not merely be surprised or wait — they should hold dangerous information or face a dangerous choice.',
      '- End the body at a decision moment that shakes at least one of: power, relationships, secrets, survival, false accusation, a contract, betrayal.',
      '- Do not end on a trivial reaction like "answers calmly" or "pretends not to know."',
      '',
      '[Length and format — very important]',
      '- content must be between 1100 and 1600 words of English. Under ~600 words is a failure.',
      '- 10–14 paragraphs, each separated by a blank line.',
      '- Each paragraph runs 2–4 sentences. Do not summarize scenes; show them as real events.',
      '- This response writes ONLY the body (content) and the title fields. Choices are made in the next step.',
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[Problems noted in the previous attempt — fix them this time]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `The story the reader originally wanted:\n"${prompt}"`,
      `Total chapters: ${estimatedChapters}`,
      '',
      'Below is the first chapter body just written. Build the story bible and choices grounded in this body.',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[Extraction rules]',
      '- bible: a story bible consistent with the body. Fill each field concisely.',
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
    const summaries = a.previousChaptersSummaries.length > 0
      ? a.previousChaptersSummaries.map(s => `Chapter ${s.chapterNumber}: ${s.summary}`).join('\n')
      : 'No summary';
    const retry = a.previousIssues?.length ? `\n\n[Problems from the previous result you MUST fix]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      bibleSection(a.storyBible),
      '',
      `[User's original premise]\n${a.prompt}`,
      `Total chapters: ${a.estimatedChapters}`,
      `Chapter to write now: ${a.nextChapterNumber}`,
      `Generation attempt: ${a.attempt}/2`,
      retry,
      `[Previous chapter summaries]\n${summaries}`,
      `[Previous chapter ${a.previousChapterNumber} body]\n${a.previousChapterContent}`,
      `[Reader's choice]\n${a.chosenOption}`,
      '',
      '[Next-chapter principles]',
      '- Within the first 2 paragraphs, show the result that changed because of the reader\'s choice.',
      '- The cost of the choice must alter at least one of: relationships, evidence, power, survival risk.',
      '- Do not re-explain prior emotions and events; push forward with new pressure.',
      '- Do not summarize scenes; develop through action, dialogue, and discovery.',
      a.isFinal ? '- This is the final chapter. Bring the story to a close in the body.' : '- End the body at a decision moment that calls for the next choice.',
      '',
      '[Length and format — very important]',
      '- content must be between 1000 and 1600 words of English. Under ~600 words is a failure.',
      '- 9–14 paragraphs, each separated by a blank line.',
      '- This response writes ONLY the body (content) and the title. Choices are made in the next step.',
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
};
