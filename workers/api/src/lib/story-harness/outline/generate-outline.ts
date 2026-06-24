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
    'You author the ENTIRE story up front as a fixed spine so that every chapter is coherent, causal, and converges — the "string of pearls" model used by narrative games.',
    'CRITICAL — beats are FUNCTIONS, not fixed events. State what each chapter ACCOMPLISHES for the arc (e.g., "the protagonist uncovers that the bar owner is bound by the same contract"), never a literal scripted action. This lets any reader choice be executed literally in the prose while still hitting the same beat.',
    'There is ONE centralMystery that the WHOLE story is about. EVERY beat must advance it by a sliver (centralAdvance) AND move the PROTAGONIST\'S own stakes (protagonistStake) — side characters serve the protagonist\'s arc, they must not hijack it.',
    'LOCK THE CORE SETTING FIRST. worldRules = hard, unambiguous declarative facts about exactly what the central ability/mechanic DOES and does NOT do (e.g., "Mending a thread restores the severed BOND between a living person and a dead/estranged one — it does NOT resurrect anyone"). No vagueness. Every beat must obey these. The reader must never be confused about what the core premise literally means.',
    'Plant→payoff must form a connected web: hooks you plant are paid off by later beats. No orphan hooks.',
    'Do NOT drift genre. If the genre is not mystery, do not turn it into a clue-hunt.',
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
    'Produce the full StoryOutline:',
    '- centralMystery: the single dramatic question the whole story answers, plus its intendedAnswer (internal — the real truth that beats gradually reveal).',
    '- worldRules: 2-6 hard, unambiguous facts pinning down the core mechanic — what it literally does, its limits, and what it canNOT do. This is the spine of plausibility; lock it now so no chapter drifts.',
    '- spine: the protagonist\'s active goal driving every chapter.',
    '- cast: the protagonist + key RECURRING characters (not one-off guests). Each with want and (optional) secret tied to the central mystery.',
    '- relationships: key evolving relationships and their arc across the story.',
    `- beats: EXACTLY ${params.estimatedChapters}. Each beat = function (what the chapter accomplishes) + centralAdvance (how it moves the central mystery one sliver) + protagonistStake (how the protagonist\'s own situation/goal moves) + optional plant/payoff. Build the plant→payoff web so threads connect and resolve. Early beats plant; the back third mostly pays off.`,
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
