import { createGateway } from '@ai-sdk/gateway';
import { type StoryLang, langDisplayName } from '../../ai/story-lang';
import { generateStructured } from '../drafting/structured-generation';
import { StoryBlueprintSchema, type StoryBlueprint } from './blueprint-schema';
import type { StoryBibleLite } from '../drafting/first-chapter-package-schema';

// One call per story, right after the bible/canon is created. Uses the top-tier body model
// because the plan quality governs every downstream chapter. Output values are in the story
// language; structural keys stay English (schema field names).
const BLUEPRINT_MODEL = 'anthropic/claude-opus-4.7';

export async function generateStoryBlueprint(params: {
  apiKey: string;
  bible: StoryBibleLite;
  prompt: string;
  estimatedChapters: number;
  language: StoryLang;
}): Promise<StoryBlueprint> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const langName = langDisplayName(params.language);

  const system = [
    'You are a serialized-fiction story architect.',
    `Write ALL field values in ${langName}. Be concise and concrete — a planning memo, not prose.`,
    'You design the GLOBAL plan for a choice-driven interactive serial so that hooks are PAID OFF on a schedule (not endlessly piled up) and the genre stays consistent.',
    'genre = ONE primary genre, taken faithfully from the bible/prompt. Do NOT relabel a fantasy/horror/romance premise as "mystery/detective" — a hidden element does not make it a mystery.',
    'avoid = things that would betray the genre; ALWAYS include "do not drift into a clue-dropping detective/mystery subplot that only withholds information" unless the genre genuinely IS mystery.',
    'spine = the protagonist\'s core ACTIVE goal driving the whole story (not "find out what is going on").',
    'arcs = micro-arcs covering progress 0.0→1.0 with no gaps. Each arc states the protagonist\'s sub-goal; it may PLANT at most one hook and should PAY OFF an earlier hook within 1–2 arcs. Aim for a payoff roughly every ~3 chapters. Later arcs only close threads; do not introduce major new mysteries past the midpoint.',
    'The plan is a flexible spine, not a rigid script — keep arc goals directional so the reader\'s choices still matter.',
  ].join(' ');

  const prompt = [
    `[Reader's original premise]\n${params.prompt}`,
    `[Total chapters]\n${params.estimatedChapters} (arcs are keyed by PROGRESS fraction, so stay length-agnostic)`,
    '[Story bible just created]',
    `logline: ${params.bible.logline}`,
    `genre: ${params.bible.genre}`,
    `tone: ${params.bible.tone}`,
    `protagonist: ${params.bible.protagonist}`,
    `central conflict: ${params.bible.centralConflict}`,
    `reader promise: ${params.bible.readerPromise}`,
    `opening threat: ${params.bible.openingThreat}`,
    params.bible.desire ? `desire: ${params.bible.desire}` : '',
    params.bible.wound ? `wound: ${params.bible.wound}` : '',
    params.bible.canon ? `canon (immutable): ${params.bible.canon}` : '',
    'Produce the global story blueprint with a plant→payoff schedule across the arcs.',
  ]
    .filter(Boolean)
    .join('\n');

  const { output } = await generateStructured({
    model: gateway(BLUEPRINT_MODEL),
    system,
    prompt,
    schema: StoryBlueprintSchema,
  });
  return output;
}
