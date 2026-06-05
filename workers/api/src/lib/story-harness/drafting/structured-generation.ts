import { generateText, Output } from 'ai';
import type { LanguageModel } from 'ai';
import type { z } from 'zod';

// Shared structured-output generation for the story harness. The AI SDK throws when
// the model output fails Zod validation; rather than failing the whole generation we
// re-prompt the SAME step once with the exact validation message fed back, so the
// model fixes only what was wrong.

export function extractSchemaIssue(err: unknown): string | null {
  let cause: unknown = err;
  for (let i = 0; i < 4 && cause != null; i += 1) {
    const c = cause as { name?: string; message?: string; cause?: unknown };
    if (c?.name === 'ZodError' && typeof c.message === 'string') return c.message;
    cause = c?.cause;
  }
  return null;
}

export function isSchemaError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes('response did not match schema') ||
      err.message.includes('No object generated') ||
      extractSchemaIssue(err) != null)
  );
}

// Without an explicit output cap the gateway applies a low default and truncates the draft
// mid-body — Korean chapter bodies (2400–3400 chars, plus any reasoning tokens) are
// token-dense, so a short cap cuts the JSON off before it satisfies the schema and the whole
// chapter fails. Give generous headroom: the 8000-char content ceiling is ~16k tokens, and a
// high cap also keeps the body from being starved if the model spends tokens on reasoning.
const MAX_OUTPUT_TOKENS = 16000;

export async function generateStructured<T extends z.ZodTypeAny>(opts: {
  model: LanguageModel;
  system: string;
  prompt: string;
  schema: T;
}): Promise<{ output: z.infer<T>; usage: unknown }> {
  try {
    const r = await generateText({
      model: opts.model,
      system: opts.system,
      prompt: opts.prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      output: Output.object({ schema: opts.schema }),
    });
    return { output: r.output, usage: r.usage };
  } catch (err) {
    if (!isSchemaError(err)) throw err;
    const issue = extractSchemaIssue(err) ?? '출력이 요구된 형식과 길이를 만족하지 않았습니다.';
    const repaired = await generateText({
      model: opts.model,
      system: opts.system,
      prompt: `${opts.prompt}\n\n[직전 출력이 형식 검증에 실패했습니다. 아래 문제를 반드시 고쳐 같은 형식으로 다시 작성하세요]\n${issue}`,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      output: Output.object({ schema: opts.schema }),
    });
    return { output: repaired.output, usage: repaired.usage };
  }
}

// Clamp cosmetic over-length so an assembled package satisfies the strict downstream
// schema without a hard failure.
export const clamp = (s: string, max: number): string => {
  const t = s.trim();
  return t.length > max ? t.slice(0, max).trimEnd() : t;
};
