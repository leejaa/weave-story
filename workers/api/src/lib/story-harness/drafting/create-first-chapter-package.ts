import { createGateway } from '@ai-sdk/gateway';
import type { z } from 'zod';
import type { SetupContext } from '../../ai/story-generation';
import {
  ChapterDraftSchema,
  ChapterStructureSchema,
  type ChapterStructure,
  type FirstChapterPackage,
} from './first-chapter-package-schema';
import { generateStructured, clamp } from './structured-generation';
import { FIRST_CHAPTER_HARNESS_MODEL } from '../types';

type Params = {
  apiKey: string;
  genCtx: SetupContext;
  attempt: number;
  previousIssues?: string[];
};

type GenerateResult = {
  firstChapterPackage: FirstChapterPackage;
  usage: unknown;
};

const DRAFT_SYSTEM = [
  '당신은 한국 웹소설 편집부의 수석 작가입니다.',
  '독자가 모바일에서 첫 화를 읽자마자 계속 넘기고 싶도록, 사건을 빠르게 열고 강한 선택 압박을 만듭니다.',
  '문학적인 문장과 웹소설식 후킹을 함께 사용합니다.',
].join('\n');

const STRUCTURE_SYSTEM = [
  '당신은 한국 웹소설 편집자입니다.',
  '주어진 첫 화 본문을 읽고, 작품 설정집과 독자 선택지를 정확하게 추출합니다.',
  '본문에 없는 새 사건을 만들지 않고, 본문의 마지막 장면이 만든 선택 압박을 그대로 사용합니다.',
].join('\n');

function buildDraftPrompt({ genCtx, attempt, previousIssues }: Params): string {
  const retrySection = previousIssues?.length
    ? `\n\n[이전 결과에서 반드시 고칠 문제]\n${previousIssues.map(issue => `- ${issue}`).join('\n')}\n`
    : '';

  return [
    `독자가 원하는 이야기:\n"${genCtx.prompt}"`,
    `전체 챕터 수: ${genCtx.estimatedChapters}챕터`,
    `생성 시도: ${attempt}/2`,
    retrySection,
    '[첫 화 설계 원칙]',
    '- 첫 3문단 안에 독자의 일상/안전을 깨는 사건을 발생시킵니다.',
    '- 주인공은 단순히 놀라거나 기다리지 않고, 위험한 정보를 쥐거나 위험한 선택 앞에 서야 합니다.',
    '- 본문의 마지막은 권력, 관계, 비밀, 생존, 누명, 계약, 배신 중 최소 하나를 흔드는 결정의 순간에서 멈춥니다.',
    '- "침착하게 대답한다", "모른 척한다"처럼 사소한 반응으로 끝내지 않습니다.',
    '',
    '[분량과 형식 — 매우 중요]',
    '- content는 반드시 한국어 2600자 이상, 3400자 이하로 씁니다. 2000자 미만이면 실패입니다.',
    '- 10-14문단, 각 문단은 빈 줄로 구분합니다.',
    '- 각 문단은 2-4문장으로 충분히 전개합니다. 장면을 요약하지 말고 실제 사건으로 보여주세요.',
    '- 이번 응답은 오직 본문(content)과 제목 필드만 작성합니다. 선택지는 다음 단계에서 만듭니다.',
  ].join('\n');
}

function buildStructurePrompt(genCtx: SetupContext, content: string, previousIssues?: string[]): string {
  const retrySection = previousIssues?.length
    ? `\n[이전 시도에서 지적된 문제 — 이번엔 반드시 고치세요]\n${previousIssues.map(issue => `- ${issue}`).join('\n')}\n`
    : '';

  return [
    `독자가 원래 원한 이야기:\n"${genCtx.prompt}"`,
    `전체 챕터 수: ${genCtx.estimatedChapters}챕터`,
    '',
    '아래는 방금 작성된 첫 화 본문입니다. 이 본문을 근거로 설정집과 선택지를 만드세요.',
    '─────────────',
    content,
    '─────────────',
    retrySection,
    '[추출 규칙]',
    '- bible: 본문과 일관된 작품 설정집. 각 필드는 간결하게 채웁니다.',
    '- situation: 본문이 끝나는 결정 순간을 1-2문장(120자 이내)으로 요약합니다. 대사를 넣지 마세요.',
    '- question: 독자에게 던지는 한 줄 질문(80자 이내)입니다.',
    '- choices: 정확히 2개. 각 항목은 text(구체적 행동)와 consequence(결과 암시)를 가집니다.',
    '',
    '[선택지는 반드시 높은 대가를 건다]',
    '- 두 선택지 각각이 비밀·목숨·배신·증거·정체·복수·생존·계약 같은 분명한 위험이나 손실을 걸어야 합니다.',
    '- consequence에는 그 선택이 부를 구체적 위협이나 잃을 것을 명시합니다.',
    '- 두 선택지는 서로 다른 방향이어야 하고, "침착하게/모른 척/기다린다" 같은 소극적 반응은 금지합니다.',
    '- 본문 밖의 새로운 사건을 만들지 마세요.',
  ].join('\n');
}

// ─── Code-side normalization ─────────────────────────────────────────────────
// Clamp cosmetic over-length and extra choices so the assembled package always
// satisfies FirstChapterPackageSchema without a hard failure.

function assemble(
  draft: z.infer<typeof ChapterDraftSchema>,
  structure: ChapterStructure,
): FirstChapterPackage {
  const choices = structure.choices.slice(0, 2).map(ch => ({
    text: clamp(ch.text, 120),
    consequence: clamp(ch.consequence, 300),
  }));

  return {
    bible: structure.bible,
    story: {
      title: clamp(draft.title, 80),
      genre: clamp(draft.genre, 80),
      chapterTitle: clamp(draft.chapterTitle, 80),
      situation: clamp(structure.situation, 300),
      question: clamp(structure.question, 180),
      choices,
      content: draft.content.trim(),
    },
  };
}

export async function createFirstChapterPackage(params: Params): Promise<GenerateResult> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const model = gateway(FIRST_CHAPTER_HARNESS_MODEL);

  // Step 1 — write the chapter body (the only long field).
  const draft = await generateStructured({
    model,
    system: DRAFT_SYSTEM,
    prompt: buildDraftPrompt(params),
    schema: ChapterDraftSchema,
  });

  // Step 2 — derive bible + decision UI from the finished body (all short fields).
  const structure = await generateStructured({
    model,
    system: STRUCTURE_SYSTEM,
    prompt: buildStructurePrompt(params.genCtx, draft.output.content, params.previousIssues),
    schema: ChapterStructureSchema,
  });

  return {
    firstChapterPackage: assemble(draft.output, structure.output),
    usage: { draft: draft.usage, structure: structure.usage },
  };
}
