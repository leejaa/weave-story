import { createGateway } from '@ai-sdk/gateway';
import { type StoryLang, langDisplayName } from '../../ai/story-lang';
import { generateStructured } from '../drafting/structured-generation';
import { StoryOutlineSchema, type StoryOutline } from './outline-schema';
import { pickStructureTemplate } from './pick-structure';
import type { DB } from '../../db';

// 전체 아웃라인은 작품 전체 일관성을 좌우하므로 최상위 모델로 1회 저작.
const OUTLINE_MODEL = 'anthropic/claude-opus-4.7';

export async function generateStoryOutline(params: {
  db: DB;
  apiKey: string;
  premise: string;
  genre: string;
  estimatedChapters: number;
  language: StoryLang;
}): Promise<StoryOutline> {
  const template = await pickStructureTemplate(params.db, params.genre);
  const gateway = createGateway({ apiKey: params.apiKey });
  const langName = langDisplayName(params.language);

  const system = [
    'You are a master story architect for a choice-driven interactive serial.',
    `Write ALL human-readable values in ${langName} (structural field names stay English). Be concrete.`,
    'You author the ENTIRE story up front as a fixed skeleton (plot, 기승전결 arc, plausibility, characters, relationships, ending) so that every chapter is coherent, causal, and converges — the "string of pearls" model. Per-chapter generation only adds flesh to this fixed skeleton; it must never invent new structure.',
    'CRITICAL — beats are FUNCTIONS, not fixed events. State what each chapter ACCOMPLISHES for the arc, never a literal scripted action. This lets any reader choice be executed literally in the prose while still hitting the same beat.',
    'ONE central arc = a SINGLE throughline that the whole story is about. EVERY beat advances this arc by one step (arcAdvance) AND moves the PROTAGONIST\'S own stake (protagonistStake). This single-thread focus is what keeps the story from scattering.',
    'The central arc is the goal/conflict that FITS THE GIVEN GENRE — it is NOT a mystery. Do NOT frame it as "who did it / uncover the hidden truth" unless the given genre is literally MYSTERY. For romance it is "will they end up together", for healing/slice-of-life it is "will the protagonist mend what is broken", etc. Honor the given genre faithfully; NEVER turn a non-mystery premise into a detective/investigation plot.',
    'KEEP IT SIMPLE AND READABLE. This is the top priority. Few characters (cast ≤ 4), few or no world rules (≤ 3, only what is strictly needed for clarity — NO mythology/lore escalation), few simultaneous open threads. Prefer a clean, elegant structure with steady hooks and ONE clear climax over a complex web. Plain, easy language everywhere.',
    'worldRules (optional, ≤3) = only the few hard facts needed so the reader is never confused about the premise. A realistic/contemporary premise may have NONE. Do NOT invent guilds, prophecies, factions, or secret histories unless the premise truly requires them.',
    'Plant→payoff should be MINIMAL and connected: only plant a hook if a later beat pays it off. No orphan hooks. Do not keep adding new mysteries each beat.',
  ].join(' ');

  const templateBlock = template
    ? [
        `[Structure template to follow: ${template.name}]`,
        template.description,
        'Functional stages of this structure (use as the structural backbone; distribute/expand across the chapters):',
        ...template.beats.map((b, i) => `  ${i + 1}. ${b.function} — ${b.purpose} (${b.pacing})`),
        template.endingShapes.length
          ? `Ending archetypes for this structure:\n${template.endingShapes.map((e) => `  - ${e.shape} (when: ${e.condition})`).join('\n')}`
          : '',
      ].filter(Boolean).join('\n')
    : '[Structure template]\nNo template available — use a sound 3-act / 기승전결 backbone.';

  const prompt = [
    `[Reader's premise]\n${params.premise}`,
    `[Genre]\n${params.genre}`,
    `[Total chapters]\n${params.estimatedChapters} — produce EXACTLY ${params.estimatedChapters} beats, index 1..${params.estimatedChapters}, one per chapter, in order.`,
    '',
    templateBlock,
    '',
    'Produce the full StoryOutline (keep everything SIMPLE and genre-faithful):',
    '- centralArc: the single dramatic question/goal the whole story is about (fit the GIVEN genre; NOT a mystery unless genre is MYSTERY), plus throughline (internal — how that question develops from start to finish).',
    '- worldRules: 0-3 only. The few hard facts needed so the premise is never confusing. Leave empty for realistic/contemporary premises. No mythology/lore building.',
    '- spine: the protagonist\'s active goal driving every chapter.',
    '- cast: the protagonist + at most 3 more KEY recurring characters (≤4 total). Simple, clear roles. secret is optional and should be rare.',
    '- relationships: ≤4 key evolving relationships and their arc.',
    `- beats: EXACTLY ${params.estimatedChapters}. Each beat = function (what the chapter accomplishes) + arcAdvance (how it moves the central arc one step) + protagonistStake (how the protagonist\'s own situation/goal moves) + optional plant/payoff (use sparingly). Shape a clean 기승전결: setup → rising hooks → climax → resolution. Avoid piling on new elements; deepen what exists.`,
    '- endings: 2-3 endings, each keyed to an accumulated reader-choice leaning (condition).',
  ].join('\n');

  const { output } = await generateStructured({
    model: gateway(OUTLINE_MODEL),
    system,
    prompt,
    schema: StoryOutlineSchema,
  });

  // 템플릿명 보정(모델이 임의 변경했을 수 있으니 실제 사용 템플릿명으로 고정).
  if (template) output.structureName = template.name;
  return output;
}
