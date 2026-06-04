import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { StoryLang } from './story-lang';
import { PROMPT_CHECK_SYSTEM } from './prompt-check-prompts';

const PromptCheckSchema = z.object({
  sufficient: z.boolean().describe(
    'true if the prompt has enough specificity (at least 2 of: character, setting, conflict/goal)',
  ),
  questions: z.array(z.string()).max(3).describe(
    'Up to 3 follow-up questions, written in the same language as the system instruction. Empty array if sufficient.',
  ),
});

export type PromptCheckResult = z.infer<typeof PromptCheckSchema>;

export async function checkPromptSpecificity(
  prompt: string,
  apiKey: string,
  language: StoryLang = 'en',
): Promise<PromptCheckResult> {
  const gateway = createGateway({ apiKey });
  const { output } = await generateText({
    model: gateway('anthropic/claude-haiku-4-5-20251001'),
    output: Output.object({ schema: PromptCheckSchema }),
    system: PROMPT_CHECK_SYSTEM[language],
    prompt: `Evaluate the following story prompt:\n\n"${prompt}"`,
  });
  return output;
}
