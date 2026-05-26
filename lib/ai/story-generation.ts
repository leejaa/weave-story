import { createGateway } from "@ai-sdk/gateway";
import { generateObject, generateText } from "ai";
import { z } from "zod";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY! });

// Retry once when the AI SDK rejects the response for schema mismatch.
// This handles cases where the model returns shorter content than minLength.
async function generateObjectWithRetry<T extends z.ZodTypeAny>(
  params: Parameters<typeof generateObject<T>>[0],
  tag: string,
  attempt = 1,
): Promise<Awaited<ReturnType<typeof generateObject<T>>>> {
  try {
    return await generateObject(params);
  } catch (err) {
    const isSchemaFailure =
      err instanceof Error &&
      err.message.includes("response did not match schema");
    if (attempt < 2 && isSchemaFailure) {
      console.warn(
        `${tag} schema validation failed (attempt ${attempt}/2), retrying…`,
      );
      return generateObjectWithRetry(params, tag, attempt + 1);
    }
    throw err;
  }
}

const WRITER_SYSTEM =
  "당신은 한국 문학 소설 작가입니다. 독자가 선택한 설정을 바탕으로 인터랙티브 소설 챕터를 한국어로 작성합니다. 문학적이고 감각적인 문체로, 생동감 있는 장면과 감정을 담아 작성하세요.";

// ─── Schemas ───────────────────────────────────────────────────────────────────

const FirstChapterSchema = z.object({
  title: z.string().describe("이야기 전체 제목 (시적이고 인상적인, 30자 이내)"),
  genre: z
    .string()
    .describe(
      "장르: mystery | romance | drama | thriller | folk 중 영어 소문자",
    ),
  chapterTitle: z.string().describe("챕터 1 제목 (20자 이내)"),
  content: z
    .string()
    .min(600)
    .describe(
      "【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.",
    ),
  situation: z
    .string()
    .max(80)
    .describe(
      "【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 새로운 내용 금지.",
    ),
  question: z
    .string()
    .max(30)
    .describe(
      '독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내)',
    ),
  choices: z
    .array(z.string().max(30))
    .length(2)
    .describe(
      "독자 선택지 정확히 2개 (각 25자 이내, 한국어, 구체적인 행동 묘사)",
    ),
});

// 마지막 챕터가 아닌 경우 — choices 정확히 2개 강제
const MidChapterSchema = z.object({
  chapterTitle: z.string().describe("챕터 제목 (20자 이내)"),
  content: z
    .string()
    .min(600)
    .describe(
      "【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.",
    ),
  situation: z
    .string()
    .max(80)
    .describe(
      "【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 새로운 내용 금지.",
    ),
  question: z
    .string()
    .max(30)
    .describe(
      '독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내)',
    ),
  choices: z
    .array(z.string().max(30))
    .length(2)
    .describe(
      "독자 선택지 정확히 2개 (각 25자 이내, 한국어, 구체적인 행동 묘사)",
    ),
});

// 마지막 챕터 — 선택지 없음
const FinalChapterSchema = z.object({
  chapterTitle: z.string().describe("챕터 제목 (20자 이내)"),
  content: z
    .string()
    .min(600)
    .describe(
      "【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기를 완결지으세요.",
    ),
  situation: z.string().max(5).describe("마지막 챕터이므로 빈 문자열"),
  question: z.string().max(5).describe("마지막 챕터이므로 빈 문자열"),
  choices: z
    .array(z.string())
    .max(0)
    .describe("마지막 챕터이므로 반드시 빈 배열 []"),
});

export type FirstChapterResult = z.infer<typeof FirstChapterSchema>;
export type NextChapterResult = z.infer<typeof MidChapterSchema>;

// ─── Validation helper ─────────────────────────────────────────────────────────

function validateChapterResult(
  ctx: { threadId?: string; chapterNumber: number; isFinal: boolean },
  result: {
    content: string;
    choices: string[];
    situation: string;
    question: string;
  },
) {
  const tag = `[gen] thread=${ctx.threadId ?? "?"} chapter=${ctx.chapterNumber}`;
  const issues: string[] = [];

  if (result.content.length < 1000) {
    issues.push(
      `content too short: ${result.content.length} chars (expected 2000+)`,
    );
  }
  if (!ctx.isFinal && result.choices.length !== 2) {
    issues.push(`choices count=${result.choices.length} (expected 2)`);
  }
  if (!ctx.isFinal && result.situation.length > 100) {
    issues.push(`situation too long: ${result.situation.length} chars`);
  }
  if (!ctx.isFinal && result.question.length > 40) {
    issues.push(`question too long: ${result.question.length} chars`);
  }

  if (issues.length > 0) {
    console.warn(`${tag} VALIDATION_WARN: ${issues.join(" | ")}`);
    console.warn(
      `${tag} situation="${result.situation}" question="${result.question}" choices=${JSON.stringify(result.choices)}`,
    );
  } else {
    console.log(
      `${tag} validation OK content=${result.content.length} choices=${result.choices.length}`,
    );
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SetupContext = {
  prompt: string;
  estimatedChapters: number;
};

export type ChapterSummaryEntry = { chapterNumber: number; summary: string };

export type ContinuationContext = SetupContext & {
  threadId?: string;
  previousChapterNumber: number;
  previousChapterContent: string;
  previousChaptersSummaries: ChapterSummaryEntry[]; // ch1..chN-2 summaries (oldest to newest)
  chosenOption: string;
  nextChapterNumber: number;
};

// ─── Generation functions ──────────────────────────────────────────────────────

export async function generateFirstChapter(
  ctx: SetupContext,
): Promise<FirstChapterResult> {
  const tag = `[gen] chapter=1`;
  console.log(
    `${tag} start prompt_len=${ctx.prompt.length} estimated=${ctx.estimatedChapters}`,
  );

  const { object } = await generateObjectWithRetry(
    {
      model: gateway("anthropic/claude-sonnet-4-6"),
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
    },
    tag,
  );

  console.log(
    `[gen] first chapter done title="${object.title}" genre=${object.genre} content=${object.content.length} choices=${object.choices.length}`,
  );
  validateChapterResult({ chapterNumber: 1, isFinal: false }, object);
  return object;
}

export async function generateNextChapter(
  ctx: ContinuationContext,
): Promise<NextChapterResult> {
  const isFinal = ctx.nextChapterNumber >= ctx.estimatedChapters;
  const tag = `[gen] thread=${ctx.threadId ?? "?"} chapter=${ctx.nextChapterNumber}`;

  console.log(
    `${tag} start isFinal=${isFinal} chosen="${ctx.chosenOption.slice(0, 40)}${ctx.chosenOption.length > 40 ? "…" : ""}" prevContent=${ctx.previousChapterContent.length} chars`,
  );

  if (!ctx.chosenOption.trim()) {
    console.warn(
      `${tag} WARN: chosenOption is empty — AI will generate without explicit choice context`,
    );
  }

  const summariesSection =
    ctx.previousChaptersSummaries.length > 0
      ? `[이전 챕터 요약]\n${ctx.previousChaptersSummaries.map((s) => `챕터 ${s.chapterNumber}: ${s.summary}`).join("\n")}\n\n`
      : "";

  const basePrompt = `이야기 설정: "${ctx.prompt}"
전체 챕터 수: ${ctx.estimatedChapters}챕터

${summariesSection}[챕터 ${ctx.previousChapterNumber} 내용]
${ctx.previousChapterContent}

독자의 선택: "${ctx.chosenOption}"

현재 챕터 번호: ${ctx.nextChapterNumber} / ${ctx.estimatedChapters}
${isFinal ? "\n이것이 마지막 챕터입니다. 이야기를 완결지어주세요. choices는 반드시 빈 배열 []로 반환하세요." : ""}

독자의 선택을 자연스럽게 이어받아 다음 챕터를 작성해주세요.

【반드시 지킬 것】
- content: 이야기 본문 전체를 담는 필드입니다. 반드시 2000자 이상 써주세요. 챕터의 모든 서사가 여기에 있어야 합니다.
- situation: content에서 묘사한 결정 순간을 1-2문장(60자 이내)으로만 요약하세요. 새로운 내용을 쓰지 마세요.
- content와 situation에 같은 내용을 중복으로 쓰지 마세요.
${isFinal ? "" : "- choices: 반드시 정확히 2개의 선택지를 제공하세요."}`;

  const genParams = isFinal
    ? {
        model: gateway("anthropic/claude-sonnet-4-6"),
        schema: FinalChapterSchema,
        system: WRITER_SYSTEM,
        prompt: basePrompt,
      }
    : {
        model: gateway("anthropic/claude-sonnet-4-6"),
        schema: MidChapterSchema,
        system: WRITER_SYSTEM,
        prompt: basePrompt,
      };

  const { object } = await generateObjectWithRetry(genParams, tag);

  console.log(
    `${tag} done title="${object.chapterTitle}" content=${object.content.length} choices=${object.choices.length} situation="${object.situation.slice(0, 40)}"`,
  );
  validateChapterResult(
    { threadId: ctx.threadId, chapterNumber: ctx.nextChapterNumber, isFinal },
    object,
  );

  return object as NextChapterResult;
}

// ─── Chapter summary ───────────────────────────────────────────────────────────

export async function generateChapterSummary(
  content: string,
  chapterNumber: number,
  threadId?: string,
): Promise<string> {
  const tag = `[summary] thread=${threadId ?? "?"} chapter=${chapterNumber}`;
  console.log(`${tag} start content=${content.length}`);

  const { text } = await generateText({
    model: gateway("anthropic/claude-haiku-4-5-20251001"),
    system: "당신은 소설 편집자입니다. 챕터 내용을 간결하게 요약합니다.",
    prompt: `다음 인터랙티브 소설 챕터의 핵심 사건, 인물 행동, 감정 변화를 200자 이내로 요약하세요. 이 요약은 다음 챕터 작성 시 맥락으로 사용됩니다.

[챕터 ${chapterNumber} 내용]
${content}`,
  });

  const summary = text.trim();
  console.log(`${tag} done len=${summary.length}`);
  return summary;
}
