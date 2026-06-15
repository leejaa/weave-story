// Orchestrates direct (non-harness) chapter generation. Language primitives,
// per-language prompt data and the zod schemas live in sibling modules and are
// assembled here.
import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { type StoryLang, normalizeStoryLang } from './story-lang';
import { GUIDES } from './chapter-prompt-guides';
import {
  buildFirstSchema,
  buildMidSchema,
  buildFinalSchema,
  type FirstChapterResult,
  type NextChapterResult,
} from './chapter-schemas';

// Re-exported so existing importers (routes, harness, jobs) keep a single entry point.
export { normalizeStoryLang };
export type { StoryLang, FirstChapterResult, NextChapterResult };

export type SetupContext = {
  prompt: string;
  estimatedChapters: number;
  language: StoryLang;
  // Actual output language detected from the prompt (e.g. 'id', 'es'). When set
  // and different from `language`, the harness instructs the model to write in
  // this language instead of the harness's native language.
  outputLanguage?: string;
};

export type ChapterSummaryEntry = { chapterNumber: number; summary: string };

export type ContinuationContext = SetupContext & {
  threadId?: string;
  previousChapterNumber: number;
  previousChapterContent: string;
  previousChaptersSummaries: ChapterSummaryEntry[];
  chosenOption: string;
  // How the reader picked: a menu option vs free-typed text. Free input gets the strongest
  // "execute literally" treatment in the prompt. Optional for backward-compat with old jobs.
  choiceKind?: 'choice' | 'free_input';
  nextChapterNumber: number;
};

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
  const g = GUIDES[ctx.language];
  const tag = `[gen] chapter=1`;
  console.log(`${tag} start lang=${ctx.language} prompt_len=${ctx.prompt.length} estimated=${ctx.estimatedChapters}`);

  const object = await generateStructuredWithRetry({
    model: gateway('anthropic/claude-sonnet-4-6'),
    schema: buildFirstSchema(g),
    system: g.writerSystem,
    prompt: g.firstPrompt(ctx.prompt, ctx.estimatedChapters),
  }, tag);

  validateChapterResult({ chapterNumber: 1, isFinal: false }, object);
  return object;
}

export async function generateNextChapter(ctx: ContinuationContext, apiKey: string): Promise<NextChapterResult> {
  const gateway = createGateway({ apiKey });
  const g = GUIDES[ctx.language];
  const isFinal = ctx.nextChapterNumber >= ctx.estimatedChapters;
  const tag = `[gen] thread=${ctx.threadId ?? '?'} chapter=${ctx.nextChapterNumber}`;

  const summaries = ctx.previousChaptersSummaries.length > 0
    ? `${g.summariesLabel}\n${ctx.previousChaptersSummaries.map(s => g.summaryLine(s.chapterNumber, s.summary)).join('\n')}\n\n`
    : '';

  const prompt = g.nextPrompt({
    prompt: ctx.prompt,
    chapters: ctx.estimatedChapters,
    summaries,
    prevNumber: ctx.previousChapterNumber,
    prevContent: ctx.previousChapterContent,
    chosen: ctx.chosenOption,
    nextNumber: ctx.nextChapterNumber,
    isFinal,
  });

  const object = isFinal
    ? await generateStructuredWithRetry({
        model: gateway('anthropic/claude-sonnet-4-6'),
        schema: buildFinalSchema(g),
        system: g.writerSystem,
        prompt,
      }, tag)
    : await generateStructuredWithRetry({
        model: gateway('anthropic/claude-sonnet-4-6'),
        schema: buildMidSchema(g),
        system: g.writerSystem,
        prompt,
      }, tag);
  validateChapterResult({ threadId: ctx.threadId, chapterNumber: ctx.nextChapterNumber, isFinal }, object);
  return object as NextChapterResult;
}

export async function generateChapterSummary(
  content: string,
  chapterNumber: number,
  threadId: string,
  apiKey: string,
  language: StoryLang = 'en',
): Promise<string> {
  const gateway = createGateway({ apiKey });
  const g = GUIDES[language];
  const { text } = await generateText({
    model: gateway('anthropic/claude-haiku-4-5-20251001'),
    system: g.summarySystem,
    prompt: g.summaryPrompt(content, chapterNumber),
  });
  console.log(`[summary] thread=${threadId} chapter=${chapterNumber} len=${text.trim().length}`);
  return text.trim();
}
