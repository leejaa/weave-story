import { createGateway } from '@ai-sdk/gateway';
import { type StoryLang, langDisplayName } from '../../ai/story-lang';
import { generateStructured } from '../drafting/structured-generation';
import { StoryOutlineSchema, type StoryOutline } from './outline-schema';
import { pickStructureTemplate } from './pick-structure';
import type { GenreRegister } from './pick-register';
import type { DB } from '../../db';

// 전체 아웃라인은 작품 전체 일관성을 좌우하므로 최상위 모델로 1회 저작.
const OUTLINE_MODEL = 'anthropic/claude-opus-4.7';

// 장르 레지스터(정서 프로파일)를 프롬프트 블록으로. 최우선 앵커.
function registerBlock(genre: string, register: GenreRegister | null): string {
  if (!register) {
    return [
      `[Genre]\n${genre}`,
      'Stay faithful to this genre\'s most-loved feel. Keep hooks SIMPLE and EMOTIONAL (not puzzles). Do NOT drift into mystery/thriller (escalating dread, secret-hunting as the engine) unless the genre is literally MYSTERY.',
    ].join('\n');
  }
  return [
    `[Genre register — THE TARGET FEEL: ${genre} / ${register.registerName}]`,
    `Emotional core to deliver: ${register.emotionalCore}`,
    register.touchstones.length ? `Touchstones (the feel to evoke, do not copy): ${register.touchstones.join(', ')}` : '',
    register.onMoves.length ? `On-genre moves (lean into these): ${register.onMoves.join(' · ')}` : '',
    register.offMoves.length ? `Off-genre moves (AVOID — these break the feel): ${register.offMoves.join(' · ')}` : '',
  ].filter(Boolean).join('\n');
}

export async function generateStoryOutline(params: {
  db: DB;
  apiKey: string;
  premise: string;
  genre: string;
  register: GenreRegister | null;
  estimatedChapters: number;
  language: StoryLang;
}): Promise<StoryOutline> {
  const template = await pickStructureTemplate(params.db, params.genre);
  const gateway = createGateway({ apiKey: params.apiKey });
  const langName = langDisplayName(params.language);

  const system = [
    'You are a master story architect for a choice-driven interactive serial.',
    `Write ALL human-readable values in ${langName} (structural field names stay English). Be concrete and use plain, easy language.`,
    // 1) 최우선: 정서/장르 레지스터
    'TOP PRIORITY: this story\'s HEART is its emotionalCore — the FEELING it leaves and the MESSAGE it carries — delivered in the given genre register. Decide the emotionalCore FIRST, then derive EVERYTHING (arc, beats, hooks, episodes, climax) to serve it. Stay inside the register; never drift into another genre\'s feel.',
    // 2) 고정 뼈대 / 기능 비트
    'Author the ENTIRE story up front as a fixed skeleton (plot, 기승전결, characters, relationships, ending) so every chapter is coherent and converges — the "string of pearls". Per-chapter generation only adds flesh; it never invents new structure. Beats are FUNCTIONS (what a chapter accomplishes), not scripted events, so any reader choice can play out while still hitting the beat.',
    // 3) 단일 아크 (정서를 섬김)
    'ONE central arc = a single throughline that SERVES the emotionalCore. Every beat advances it one step (arcAdvance) and moves the protagonist\'s own stake (protagonistStake). This single thread keeps the story from scattering.',
    // 4) 단순함 + 떡밥
    'KEEP IT SIMPLE AND READABLE (top constraint alongside the emotional core): cast ≤ 4, worldRules ≤ 3 (only what is strictly needed; realistic premises may have NONE — no mythology/lore building), few simultaneous threads, ONE clear climax. Hooks must be SIMPLE and EMOTIONAL — they create anticipation for the emotional payoff, NOT intellectual puzzles. Do NOT make hooks mysterious/complex, and do not add a new mystery each beat. Minimal plant→payoff, every plant paid off.',
    // 5) 인과
    'CAUSAL TIGHTNESS (don\'t add elements — tighten what exists). For the major hooks and pivotal decisions, give a convincing causal reason (cause → so → therefore) so the reader is persuaded. Record these in causalAnchors. This is about being convincing, not about prescribing wording.',
  ].join(' ');

  // 템플릿은 '느슨한 골격'으로 강등 — emotionalCore/레지스터와 충돌하면 무시.
  const templateBlock = template
    ? [
        `[Optional loose backbone: ${template.name}] (use ONLY if it fits the emotional core; if it pulls toward off-genre moves like dread/ordeal/secret-hunting, IGNORE it — the emotional core and register WIN.)`,
        template.description,
        ...template.beats.map((b, i) => `  ${i + 1}. ${b.function} (${b.pacing})`),
      ].join('\n')
    : '';

  const prompt = [
    registerBlock(params.genre, params.register),
    '',
    `[Reader's premise]\n${params.premise}`,
    `[Total chapters]\n${params.estimatedChapters} — produce EXACTLY ${params.estimatedChapters} beats, index 1..${params.estimatedChapters}, one per chapter, in order.`,
    templateBlock ? `\n${templateBlock}` : '',
    '',
    'Produce the full StoryOutline. Order of thinking: emotionalCore FIRST, then everything derives from it. Keep it SIMPLE and genre-faithful:',
    '- emotionalCore: { feeling (the core emotion/experience to leave the reader), message (the theme this story says) } — true to the register above and the premise.',
    '- centralArc: { dramaticQuestion (the single goal/question that DELIVERS the emotionalCore — fit the genre register, NOT a mystery unless genre is MYSTERY), throughline (how it develops start→end) }.',
    '- causalAnchors: 2-5 major hooks/decisions a reader would question, each with a convincing causal "why" (cause → so → therefore), not a label.',
    '- worldRules: 0-3 only; leave empty for realistic premises. No lore building.',
    '- spine: the protagonist\'s active goal driving every chapter.',
    '- cast: protagonist + at most 3 key recurring characters (≤4). Simple, clear roles.',
    '- relationships: ≤4 key evolving relationships and their arc.',
    `- beats: EXACTLY ${params.estimatedChapters}. Each = function + arcAdvance + protagonistStake + optional plant/payoff (sparingly). Clean 기승전결 that builds the EMOTION toward one climax; deepen what exists instead of piling on new elements.`,
    '- endings: 2-3 endings, each keyed to an accumulated reader-choice leaning (condition).',
  ].filter(Boolean).join('\n');

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
