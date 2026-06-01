import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import type { ContinuationContext } from '../../ai/story-generation';
import { NEXT_CHAPTER_HARNESS_MODEL } from '../types';
import type { StoryBibleSnapshot } from '../memory/load-story-bible';
import { NextChapterPackageSchema, type NextChapterPackage } from './next-chapter-package-schema';

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

const NEXT_CHAPTER_SYSTEM = [
  '당신은 한국 웹소설 편집부의 연재 작가입니다.',
  '이전 챕터와 독자의 선택을 이어 받아, 선택의 대가가 실제 사건으로 드러나는 다음 화를 씁니다.',
  '독자가 고른 선택을 단순히 언급하지 말고 권력, 관계, 비밀, 생존 위험 중 하나를 즉시 흔드는 결과로 전개하세요.',
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

function buildPrompt({ genCtx, storyBible, attempt, previousIssues }: Params): string {
  const isFinal = genCtx.nextChapterNumber >= genCtx.estimatedChapters;
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
      ? '- 마지막 챕터입니다. 이야기를 완결하고 choices는 빈 배열로 반환합니다.'
      : '- 마지막 20%에서 다음 선택 압박을 만듭니다. 두 choices 모두 다음 챕터 방향을 바꿔야 합니다.',
    '',
    '[분량과 형식]',
    '- content는 반드시 한국어 2400자 이상, 3400자 이하로 씁니다. 2000자 미만이면 실패입니다.',
    '- 9-14문단, 각 문단은 빈 줄로 구분합니다.',
    '- 마지막 챕터가 아니라면 choices는 정확히 2개입니다.',
    '- choices.text는 구체적인 행동이어야 하며 단순 반응/대답/기다림은 금지합니다.',
  ].join('\n');
}

export async function createNextChapterPackage(params: Params): Promise<GenerateResult> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const result = await generateText({
    model: gateway(NEXT_CHAPTER_HARNESS_MODEL),
    output: Output.object({ schema: NextChapterPackageSchema }),
    system: NEXT_CHAPTER_SYSTEM,
    prompt: buildPrompt(params),
  });

  return {
    nextChapterPackage: result.output,
    usage: result.usage,
  };
}
