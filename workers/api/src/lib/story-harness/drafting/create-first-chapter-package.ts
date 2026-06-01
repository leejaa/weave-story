import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import type { SetupContext } from '../../ai/story-generation';
import { FirstChapterPackageSchema, type FirstChapterPackage } from './first-chapter-package-schema';
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

const FIRST_CHAPTER_SYSTEM = [
  '당신은 한국 웹소설 편집부의 수석 작가입니다.',
  '독자가 모바일에서 첫 화를 읽자마자 계속 넘기고 싶도록, 사건을 빠르게 열고 강한 선택 압박을 만듭니다.',
  '문학적인 문장과 웹소설식 후킹을 함께 사용하되, 선택지는 사소한 반응이 아니라 다음 전개를 바꾸는 행동이어야 합니다.',
].join('\n');

function buildPrompt({ genCtx, attempt, previousIssues }: Params): string {
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
    '- 마지막 선택지는 권력, 관계, 비밀, 생존, 누명, 계약, 배신 중 최소 하나를 흔들어야 합니다.',
    '- "침착하게 대답한다", "모른 척한다", "상황을 파악한다"처럼 사소한 반응형 선택지는 금지합니다.',
    '- 두 선택지 모두 매력적이어야 하고, 각각 명확한 손실 가능성과 다음 챕터 방향을 가져야 합니다.',
    '',
    '[분량과 형식]',
    '- content는 반드시 한국어 2600자 이상, 3400자 이하로 씁니다. 2000자 미만이면 실패입니다.',
    '- 10-14문단, 각 문단은 빈 줄로 구분합니다.',
    '- 각 문단은 2-4문장으로 충분히 전개합니다. 장면을 요약하지 말고 실제 사건으로 보여주세요.',
    '- situation/question/choices에는 본문 밖 새 사건을 만들지 말고, 본문 마지막 장면의 압박을 요약합니다.',
    '- choices.text는 독자가 실제로 누르고 싶을 만큼 구체적인 행동이어야 합니다.',
  ].join('\n');
}

export async function createFirstChapterPackage(params: Params): Promise<GenerateResult> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const result = await generateText({
    model: gateway(FIRST_CHAPTER_HARNESS_MODEL),
    output: Output.object({ schema: FirstChapterPackageSchema }),
    system: FIRST_CHAPTER_SYSTEM,
    prompt: buildPrompt(params),
  });

  return {
    firstChapterPackage: result.output,
    usage: result.usage,
  };
}
