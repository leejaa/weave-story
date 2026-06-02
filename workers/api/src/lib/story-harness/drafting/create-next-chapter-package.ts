import { createGateway } from '@ai-sdk/gateway';
import type { ContinuationContext } from '../../ai/story-generation';
import { NEXT_CHAPTER_HARNESS_MODEL } from '../types';
import type { StoryBibleSnapshot } from '../memory/load-story-bible';
import {
  NextChapterDraftSchema,
  NextChapterStructureSchema,
  type NextChapterDraft,
  type NextChapterStructure,
  type NextChapterPackage,
} from './next-chapter-package-schema';
import { generateStructured, clamp } from './structured-generation';

type Params = {
  apiKey: string;
  genCtx: ContinuationContext;
  storyBible: StoryBibleSnapshot;
  attempt: number;
  previousIssues?: string[];
};

type GenerateResult = {
  nextChapterPackage: NextChapterPackage;
  usage: unknown;
};

const DRAFT_SYSTEM = [
  '당신은 한국 웹소설 편집부의 연재 작가입니다.',
  '이전 챕터와 독자의 선택을 이어 받아, 선택의 대가가 실제 사건으로 드러나는 다음 화를 씁니다.',
  '독자가 고른 선택을 단순히 언급하지 말고 권력, 관계, 비밀, 생존 위험 중 하나를 즉시 흔드는 결과로 전개하세요.',
].join('\n');

const STRUCTURE_SYSTEM = [
  '당신은 한국 웹소설 편집자입니다.',
  '주어진 챕터 본문을 읽고, 다음 화로 이어지는 독자 선택지를 정확하게 추출합니다.',
  '본문에 없는 새 사건을 만들지 않고, 본문의 마지막 장면이 만든 선택 압박을 그대로 사용합니다.',
].join('\n');

function buildStoryBibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\n아직 저장된 story bible이 없습니다. 사용자 설정과 이전 챕터를 기준으로 연속성을 유지하세요.';
  }

  return [
    '[Story Bible]',
    `로그라인: ${storyBible.logline}`,
    `장르: ${storyBible.genre}`,
    `톤: ${storyBible.tone}`,
    `주인공: ${storyBible.protagonist}`,
    `중심 갈등: ${storyBible.centralConflict}`,
    `독자 약속: ${storyBible.readerPromise}`,
    `오프닝 위협: ${storyBible.openingThreat}`,
    storyBible.openThreads.length
      ? `[열린 떡밥]\n${storyBible.openThreads.map(thread => `- ${thread}`).join('\n')}`
      : '',
    storyBible.forbiddenPatterns.length
      ? `[금지 패턴]\n${storyBible.forbiddenPatterns.map(pattern => `- ${pattern}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n');
}

function buildDraftPrompt({ genCtx, storyBible, attempt, previousIssues }: Params, isFinal: boolean): string {
  const summariesSection = genCtx.previousChaptersSummaries.length > 0
    ? genCtx.previousChaptersSummaries.map(s => `챕터 ${s.chapterNumber}: ${s.summary}`).join('\n')
    : '요약 없음';
  const retrySection = previousIssues?.length
    ? `\n\n[이전 결과에서 반드시 고칠 문제]\n${previousIssues.map(issue => `- ${issue}`).join('\n')}\n`
    : '';

  return [
    buildStoryBibleSection(storyBible),
    '',
    `[사용자 원 설정]\n${genCtx.prompt}`,
    `전체 챕터 수: ${genCtx.estimatedChapters}`,
    `현재 작성할 챕터: ${genCtx.nextChapterNumber}`,
    `생성 시도: ${attempt}/2`,
    retrySection,
    `[이전 챕터 요약]\n${summariesSection}`,
    `[직전 챕터 ${genCtx.previousChapterNumber} 본문]\n${genCtx.previousChapterContent}`,
    `[독자의 선택]\n${genCtx.chosenOption}`,
    '',
    '[다음 화 작성 원칙]',
    '- 첫 2문단 안에 독자의 선택 때문에 달라진 결과를 보여주세요.',
    '- 선택의 대가가 인물 관계, 증거, 권력, 생존 위험 중 최소 하나를 바꿔야 합니다.',
    '- 이전 챕터의 감정과 사건을 반복 설명하지 말고, 새 압박으로 밀어붙입니다.',
    '- 장면은 요약하지 말고 행동, 대화, 발견으로 전개합니다.',
    isFinal
      ? '- 마지막 챕터입니다. 본문에서 이야기를 완결지으세요.'
      : '- 본문의 마지막은 다음 선택을 부르는 결정의 순간에서 멈춥니다.',
    '',
    '[분량과 형식 — 매우 중요]',
    '- content는 반드시 한국어 2400자 이상, 3400자 이하로 씁니다. 2000자 미만이면 실패입니다.',
    '- 9-14문단, 각 문단은 빈 줄로 구분합니다.',
    '- 이번 응답은 오직 본문(content)과 제목만 작성합니다. 선택지는 다음 단계에서 만듭니다.',
  ].join('\n');
}

function buildStructurePrompt(genCtx: ContinuationContext, content: string, previousIssues?: string[]): string {
  const retrySection = previousIssues?.length
    ? `\n[이전 시도에서 지적된 문제 — 이번엔 반드시 고치세요]\n${previousIssues.map(issue => `- ${issue}`).join('\n')}\n`
    : '';

  return [
    `독자가 원래 원한 이야기:\n"${genCtx.prompt}"`,
    `현재 챕터: ${genCtx.nextChapterNumber} / 전체 ${genCtx.estimatedChapters}`,
    '',
    '아래는 방금 작성된 챕터 본문입니다. 이 본문을 근거로 다음 화로 이어지는 선택지를 만드세요.',
    '─────────────',
    content,
    '─────────────',
    retrySection,
    '[추출 규칙]',
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

function assemble(draft: NextChapterDraft, structure: NextChapterStructure | null): NextChapterPackage {
  const base = {
    chapterTitle: clamp(draft.chapterTitle, 80),
    content: draft.content.trim(),
  };

  if (!structure) {
    // Final chapter — no decision UI.
    return { ...base, situation: '', question: '', choices: [] };
  }

  const choices = structure.choices.slice(0, 2).map(ch => ({
    text: clamp(ch.text, 120),
    consequence: clamp(ch.consequence, 300),
  }));

  return {
    ...base,
    situation: clamp(structure.situation, 300),
    question: clamp(structure.question, 180),
    choices,
  };
}

export async function createNextChapterPackage(params: Params): Promise<GenerateResult> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const model = gateway(NEXT_CHAPTER_HARNESS_MODEL);
  const isFinal = params.genCtx.nextChapterNumber >= params.genCtx.estimatedChapters;

  // Step 1 — write the chapter body (the only long field).
  const draft = await generateStructured({
    model,
    system: DRAFT_SYSTEM,
    prompt: buildDraftPrompt(params, isFinal),
    schema: NextChapterDraftSchema,
  });

  // Step 2 — derive the decision UI from the body. Skipped for the final chapter.
  if (isFinal) {
    return {
      nextChapterPackage: assemble(draft.output, null),
      usage: { draft: draft.usage },
    };
  }

  const structure = await generateStructured({
    model,
    system: STRUCTURE_SYSTEM,
    prompt: buildStructurePrompt(params.genCtx, draft.output.content, params.previousIssues),
    schema: NextChapterStructureSchema,
  });

  return {
    nextChapterPackage: assemble(draft.output, structure.output),
    usage: { draft: draft.usage, structure: structure.usage },
  };
}
