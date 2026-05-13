import { createGateway } from '@ai-sdk/gateway';
import { generateObject } from 'ai';
import { z } from 'zod';

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY! });

const WRITER_SYSTEM =
  '당신은 한국 문학 소설 작가입니다. 독자가 선택한 설정을 바탕으로 인터랙티브 소설 챕터를 한국어로 작성합니다. 문학적이고 감각적인 문체로, 생동감 있는 장면과 감정을 담아 작성하세요.';

const FirstChapterSchema = z.object({
  title: z.string().describe('이야기 전체 제목 (시적이고 인상적인, 30자 이내)'),
  genre: z.string().describe('장르: mystery | romance | drama | thriller | folk 중 영어 소문자'),
  chapterTitle: z.string().describe('챕터 1 제목 (20자 이내)'),
  content: z.string().describe('【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.'),
  situation: z.string().describe('【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 새로운 내용 금지.'),
  question: z.string().describe('독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내)'),
  choices: z.array(z.string()).length(2).describe('독자 선택지 2개 (각 25자 이내, 한국어, 구체적인 행동 묘사)'),
});

const NextChapterSchema = z.object({
  chapterTitle: z.string().describe('챕터 제목 (20자 이내)'),
  content: z.string().describe('【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.'),
  situation: z.string().describe('【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 마지막 챕터면 빈 문자열.'),
  question: z.string().describe('독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내). 마지막 챕터면 빈 문자열.'),
  choices: z.array(z.string()).describe('다음 선택지 2개 (각 25자 이내). 마지막 챕터면 빈 배열'),
});

export type FirstChapterResult = z.infer<typeof FirstChapterSchema>;
export type NextChapterResult = z.infer<typeof NextChapterSchema>;

export type SetupContext = {
  prompt: string;
  estimatedChapters: number;
};

export async function generateFirstChapter(ctx: SetupContext): Promise<FirstChapterResult> {
  const { object } = await generateObject({
    model: gateway('anthropic/claude-sonnet-4-6'),
    schema: FirstChapterSchema,
    system: WRITER_SYSTEM,
    prompt: `독자가 원하는 이야기:
"${ctx.prompt}"

전체 챕터 수: ${ctx.estimatedChapters}챕터

위 설정을 바탕으로 이야기의 첫 챕터를 작성해주세요. 독자가 즉시 이야기에 빠져들 수 있도록 강렬한 첫 장면으로 시작하세요.

【반드시 지킬 것】
- content: 이야기 본문 전체를 담는 필드입니다. 반드시 2000자 이상 써주세요. 챕터의 모든 서사가 여기에 있어야 합니다.
- situation: content에서 묘사한 결정 순간을 1-2문장(60자 이내)으로만 요약하세요. 새로운 내용을 쓰지 마세요.
- content와 situation에 같은 내용을 중복으로 쓰지 마세요.`,
  });
  return object;
}

export type ContinuationContext = SetupContext & {
  previousChapterNumber: number;
  previousChapterContent: string;
  chosenOption: string;
  nextChapterNumber: number;
};

export async function generateNextChapter(ctx: ContinuationContext): Promise<NextChapterResult> {
  const isFinal = ctx.nextChapterNumber >= ctx.estimatedChapters;

  const { object } = await generateObject({
    model: gateway('anthropic/claude-sonnet-4-6'),
    schema: NextChapterSchema,
    system: WRITER_SYSTEM,
    prompt: `이야기 설정: "${ctx.prompt}"
전체 챕터 수: ${ctx.estimatedChapters}챕터

[챕터 ${ctx.previousChapterNumber} 내용]
${ctx.previousChapterContent}

독자의 선택: "${ctx.chosenOption}"

현재 챕터 번호: ${ctx.nextChapterNumber} / ${ctx.estimatedChapters}
${isFinal ? '\n이것이 마지막 챕터입니다. 이야기를 완결지어주세요. choices는 빈 배열로 반환하세요.' : ''}

독자의 선택을 자연스럽게 이어받아 다음 챕터를 작성해주세요.

【반드시 지킬 것】
- content: 이야기 본문 전체를 담는 필드입니다. 반드시 2000자 이상 써주세요. 챕터의 모든 서사가 여기에 있어야 합니다.
- situation: content에서 묘사한 결정 순간을 1-2문장(60자 이내)으로만 요약하세요. 새로운 내용을 쓰지 마세요.
- content와 situation에 같은 내용을 중복으로 쓰지 마세요.`,
  });
  return object;
}
