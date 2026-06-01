import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const FirstChapterSchema = z.object({
  title: z.string().describe('이야기 전체 제목 (시적이고 인상적인, 30자 이내)'),
  genre: z.string().describe('장르: mystery | romance | drama | thriller | folk 중 영어 소문자'),
  chapterTitle: z.string().describe('챕터 1 제목 (20자 이내)'),
  content: z.string().min(600).describe(
    '【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.',
  ),
  situation: z.string().max(80).describe('【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 새로운 내용 금지.'),
  question: z.string().max(30).describe('독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내)'),
  choices: z.array(z.string().max(30)).length(2).describe('독자 선택지 정확히 2개 (각 25자 이내, 한국어, 구체적인 행동 묘사)'),
});

const MidChapterSchema = z.object({
  chapterTitle: z.string().describe('챕터 제목 (20자 이내)'),
  content: z.string().min(600).describe(
    '【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.',
  ),
  situation: z.string().max(80).describe('【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 새로운 내용 금지.'),
  question: z.string().max(30).describe('독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내)'),
  choices: z.array(z.string().max(30)).length(2).describe('독자 선택지 정확히 2개 (각 25자 이내, 한국어, 구체적인 행동 묘사)'),
});

const FinalChapterSchema = z.object({
  chapterTitle: z.string().describe('챕터 제목 (20자 이내)'),
  content: z.string().min(600).describe(
    '【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기를 완결지으세요.',
  ),
  situation: z.string().max(5).describe('마지막 챕터이므로 빈 문자열'),
  question: z.string().max(5).describe('마지막 챕터이므로 빈 문자열'),
  choices: z.array(z.string()).max(0).describe('마지막 챕터이므로 반드시 빈 배열 []'),
});

export type FirstChapterResult = z.infer<typeof FirstChapterSchema>;
export type NextChapterResult = z.infer<typeof MidChapterSchema>;

export type SetupContext = {
  prompt: string;
  estimatedChapters: number;
};

export type ChapterSummaryEntry = { chapterNumber: number; summary: string };

export type ContinuationContext = SetupContext & {
  threadId?: string;
  previousChapterNumber: number;
  previousChapterContent: string;
  previousChaptersSummaries: ChapterSummaryEntry[];
  chosenOption: string;
  nextChapterNumber: number;
};

const WRITER_SYSTEM =
  '당신은 한국 문학 소설 작가입니다. 독자가 선택한 설정을 바탕으로 인터랙티브 소설 챕터를 한국어로 작성합니다. 문학적이고 감각적인 문체로, 생동감 있는 장면과 감정을 담아 작성하세요.';

async function generateStructuredWithRetry<T extends z.ZodTypeAny>(
  params: Parameters<typeof generateText>[0] & { schema: T },
  tag: string,
  attempt = 1,
): Promise<z.infer<T>> {
  try {
    const { schema, ...generateParams } = params;
    const result = await generateText({
      ...generateParams,
      output: Output.object({ schema }),
    });
    return result.output;
  } catch (err) {
    const isSchemaFailure =
      err instanceof Error &&
      (err.message.includes('response did not match schema') ||
        err.message.includes('No output generated') ||
        err.message.includes('No object generated'));
    if (attempt < 2 && isSchemaFailure) {
      console.warn(`${tag} schema validation failed (attempt ${attempt}/2), retrying…`);
      return generateStructuredWithRetry(params, tag, attempt + 1);
    }
    throw err;
  }
}

function validateChapterResult(
  ctx: { threadId?: string; chapterNumber: number; isFinal: boolean },
  result: { content: string; choices: string[]; situation: string; question: string },
) {
  const tag = `[gen] thread=${ctx.threadId ?? '?'} chapter=${ctx.chapterNumber}`;
  const issues: string[] = [];
  if (result.content.length < 1000) issues.push(`content too short: ${result.content.length} chars`);
  if (!ctx.isFinal && result.choices.length !== 2) issues.push(`choices count=${result.choices.length}`);
  if (issues.length > 0) {
    console.warn(`${tag} VALIDATION_WARN: ${issues.join(' | ')}`);
  } else {
    console.log(`${tag} validation OK content=${result.content.length}`);
  }
}

export async function generateFirstChapter(ctx: SetupContext, apiKey: string): Promise<FirstChapterResult> {
  const gateway = createGateway({ apiKey });
  const tag = `[gen] chapter=1`;
  console.log(`${tag} start prompt_len=${ctx.prompt.length} estimated=${ctx.estimatedChapters}`);

  const object = await generateStructuredWithRetry({
    model: gateway('anthropic/claude-sonnet-4-6'),
    schema: FirstChapterSchema,
    system: WRITER_SYSTEM,
    prompt: `독자가 원하는 이야기:\n"${ctx.prompt}"\n\n전체 챕터 수: ${ctx.estimatedChapters}챕터\n\n위 설정을 바탕으로 이야기의 첫 챕터를 작성해주세요.\n\n【반드시 지킬 것】\n- content: 반드시 2000자 이상 써주세요.\n- situation: content에서 묘사한 결정 순간을 1-2문장(60자 이내)으로만 요약하세요.`,
  }, tag);

  validateChapterResult({ chapterNumber: 1, isFinal: false }, object);
  return object;
}

export async function generateNextChapter(ctx: ContinuationContext, apiKey: string): Promise<NextChapterResult> {
  const gateway = createGateway({ apiKey });
  const isFinal = ctx.nextChapterNumber >= ctx.estimatedChapters;
  const tag = `[gen] thread=${ctx.threadId ?? '?'} chapter=${ctx.nextChapterNumber}`;

  const summariesSection = ctx.previousChaptersSummaries.length > 0
    ? `[이전 챕터 요약]\n${ctx.previousChaptersSummaries.map(s => `챕터 ${s.chapterNumber}: ${s.summary}`).join('\n')}\n\n`
    : '';

  const basePrompt = `이야기 설정: "${ctx.prompt}"\n전체 챕터 수: ${ctx.estimatedChapters}챕터\n\n${summariesSection}[챕터 ${ctx.previousChapterNumber} 내용]\n${ctx.previousChapterContent}\n\n독자의 선택: "${ctx.chosenOption}"\n\n현재 챕터 번호: ${ctx.nextChapterNumber} / ${ctx.estimatedChapters}\n${isFinal ? '\n이것이 마지막 챕터입니다. choices는 반드시 빈 배열 []로 반환하세요.' : ''}\n\n【반드시 지킬 것】\n- content: 반드시 2000자 이상 써주세요.\n- situation: 1-2문장(60자 이내)으로만 요약하세요.`;

  const object = isFinal
    ? await generateStructuredWithRetry({
        model: gateway('anthropic/claude-sonnet-4-6'),
        schema: FinalChapterSchema,
        system: WRITER_SYSTEM,
        prompt: basePrompt,
      }, tag)
    : await generateStructuredWithRetry({
        model: gateway('anthropic/claude-sonnet-4-6'),
        schema: MidChapterSchema,
        system: WRITER_SYSTEM,
        prompt: basePrompt,
      }, tag);
  validateChapterResult({ threadId: ctx.threadId, chapterNumber: ctx.nextChapterNumber, isFinal }, object);
  return object as NextChapterResult;
}

export async function generateChapterSummary(
  content: string,
  chapterNumber: number,
  threadId: string,
  apiKey: string,
): Promise<string> {
  const gateway = createGateway({ apiKey });
  const { text } = await generateText({
    model: gateway('anthropic/claude-haiku-4-5-20251001'),
    system: '당신은 소설 편집자입니다. 챕터 내용을 간결하게 요약합니다.',
    prompt: `다음 인터랙티브 소설 챕터의 핵심 사건, 인물 행동, 감정 변화를 200자 이내로 요약하세요.\n\n[챕터 ${chapterNumber} 내용]\n${content}`,
  });
  console.log(`[summary] thread=${threadId} chapter=${chapterNumber} len=${text.trim().length}`);
  return text.trim();
}
