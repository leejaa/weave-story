import type { SetupContext } from '../../ai/story-generation';
import type { DB } from '../../db';
import { NonRetryableStoryGenerationError } from '../errors';
import {
  FirstChapterPackageSchema,
  toFirstChapterResult,
  type FirstChapterPackage,
} from '../drafting/first-chapter-package-schema';
import { createFirstChapterPackage } from '../drafting/create-first-chapter-package';
import { validateFirstChapterQuality } from '../validation/validate-first-chapter-quality';
import { startGenerationRun, finishGenerationRun } from '../logging/generation-run-logger';
import { serializeGenerationError as serializeError } from '../logging/serialize-error';
import { saveStoryBible } from '../memory/save-story-bible';
import {
  FIRST_CHAPTER_HARNESS_MODEL,
  FIRST_CHAPTER_HARNESS_PROMPT_VERSION,
  type FirstChapterHarnessResult,
} from '../types';

type Params = {
  db: DB;
  apiKey: string;
  storyId: string;
  threadId: string;
  chapterId: string;
  genCtx: SetupContext;
};

function getOutputSnapshot(firstChapterPackage: FirstChapterPackage, usage: unknown): unknown {
  return {
    title: firstChapterPackage.story.title,
    genre: firstChapterPackage.story.genre,
    chapterTitle: firstChapterPackage.story.chapterTitle,
    contentChars: firstChapterPackage.story.content.length,
    situation: firstChapterPackage.story.situation,
    question: firstChapterPackage.story.question,
    choices: firstChapterPackage.story.choices,
    bible: firstChapterPackage.bible,
    usage,
  };
}

function isSchemaError(err: unknown): boolean {
  return err instanceof Error && (
    err.message.includes('response did not match schema') ||
    err.message.includes('No object generated') ||
    err.message.includes('invalid_type')
  );
}

function toNonRetryableSchemaError(err: unknown): NonRetryableStoryGenerationError {
  return new NonRetryableStoryGenerationError(
    'first chapter structured output failed schema validation after retry',
    serializeError(err),
  );
}

export async function runFirstChapterHarness(params: Params): Promise<FirstChapterHarnessResult> {
  // One more retry than before: with the token cap fixed, failures are rare, so the extra
  // attempt is a cheap safety net for the occasional short/invalid draft.
  const maxAttempts = 3;
  let previousIssues: string[] | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startMs = Date.now();
    const runId = await startGenerationRun({
      db: params.db,
      storyId: params.storyId,
      threadId: params.threadId,
      chapterId: params.chapterId,
      chapterNumber: 1,
      stage: 'first_chapter_package',
      promptVersion: FIRST_CHAPTER_HARNESS_PROMPT_VERSION,
      model: FIRST_CHAPTER_HARNESS_MODEL,
      inputSnapshot: {
        prompt: params.genCtx.prompt,
        estimatedChapters: params.genCtx.estimatedChapters,
        attempt,
        previousIssues,
      },
    });

    try {
      const { firstChapterPackage, usage } = await createFirstChapterPackage({
        apiKey: params.apiKey,
        genCtx: params.genCtx,
        attempt,
        previousIssues,
      });

      const parsedPackage = FirstChapterPackageSchema.parse(firstChapterPackage);
      const qualityScores = validateFirstChapterQuality(parsedPackage);
      const outputSnapshot = getOutputSnapshot(parsedPackage, usage);

      if (!qualityScores.passed && attempt < maxAttempts) {
        previousIssues = qualityScores.issues;
        await finishGenerationRun({
          db: params.db,
          runId,
          status: 'rejected',
          outputSnapshot,
          qualityScores,
          elapsedMs: Date.now() - startMs,
        });
        console.warn(
          `[harness:first] rejected attempt=${attempt} story=${params.storyId} issues=${qualityScores.issues.join(' | ')}`,
        );
        continue;
      }

      if (!qualityScores.passed) {
        const error = new NonRetryableStoryGenerationError(
          'first chapter failed quality validation',
          qualityScores,
        );
        await finishGenerationRun({
          db: params.db,
          runId,
          status: 'failed',
          outputSnapshot,
          qualityScores,
          error: serializeError(error),
          elapsedMs: Date.now() - startMs,
        });
        throw error;
      }

      try {
        await saveStoryBible({
          db: params.db,
          storyId: params.storyId,
          bible: parsedPackage.bible,
        });
      } catch (err) {
        console.error(`[harness:first] story bible save failed non_critical story=${params.storyId}`, err);
      }

      await finishGenerationRun({
        db: params.db,
        runId,
        status: 'succeeded',
        outputSnapshot,
        qualityScores,
        elapsedMs: Date.now() - startMs,
      });

      console.log(
        `[harness:first] success story=${params.storyId} attempt=${attempt} chars=${qualityScores.contentChars} paragraphs=${qualityScores.paragraphCount}`,
      );
      return toFirstChapterResult(parsedPackage, qualityScores, attempt);
    } catch (err) {
      lastError = err;
      const serialized = serializeError(err);
      await finishGenerationRun({
        db: params.db,
        runId,
        status: 'failed',
        error: serialized,
        elapsedMs: Date.now() - startMs,
      });

      if (err instanceof NonRetryableStoryGenerationError) {
        throw err;
      }

      if (attempt < maxAttempts && isSchemaError(err)) {
        previousIssues = ['structured output did not satisfy the schema; regenerate with valid length and fields'];
        console.warn(`[harness:first] schema retry story=${params.storyId} attempt=${attempt}`, serialized);
        continue;
      }

      if (isSchemaError(err)) {
        throw toNonRetryableSchemaError(err);
      }

      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('first chapter harness failed');
}
