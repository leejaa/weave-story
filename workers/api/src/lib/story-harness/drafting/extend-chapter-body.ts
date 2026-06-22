import { generateText } from 'ai';
import type { LanguageModel } from 'ai';

const MAX_OUTPUT_TOKENS = 24000;
const MAX_CONTENT_CHARS = 20000;

// When a generated chapter body lands under the target length, ask the model to CONTINUE the
// same scene and append the new prose — instead of failing the chapter or regenerating it
// whole (which tends to come back short again). Best-effort: appends up to `maxRounds` times
// and returns whatever length it reaches (never throws on shortness).
export async function extendChapterBody(opts: {
  model: LanguageModel;
  system: string;
  content: string;
  targetChars: number;
  maxRounds?: number;
  buildExtendPrompt: (current: string, deficitChars: number) => string;
}): Promise<{ content: string; usages: unknown[] }> {
  let content = opts.content.trim();
  const usages: unknown[] = [];
  const maxRounds = opts.maxRounds ?? 3;

  for (let round = 0; round < maxRounds && content.length < opts.targetChars; round += 1) {
    const deficit = opts.targetChars - content.length;
    const r = await generateText({
      model: opts.model,
      system: opts.system,
      prompt: opts.buildExtendPrompt(content, deficit),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const added = r.text.trim();
    usages.push(r.usage);
    if (!added) break; // model returned nothing to append — stop rather than spin.
    content = `${content}\n\n${added}`.trim();
    if (content.length >= MAX_CONTENT_CHARS) break;
  }

  return { content: content.slice(0, MAX_CONTENT_CHARS).trimEnd(), usages };
}
