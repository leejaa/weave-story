import { eq } from 'drizzle-orm';
import type { ContinuationContext } from '../../ai/story-generation';
import type { DB } from '../../db';
import { chapters, threads } from '../../schema';
import { NonRetryableStoryGenerationError } from '../errors';
import {
  NextChapterPackageSchema,
  toNextChapterResult,
  type NextChapterPackage,
} from '../drafting/next-chapter-package-schema';
import { createNextChapterPackage } from '../drafting/create-next-chapter-package';
import { validateNextChapterQuality } from '../validation/validate-next-chapter-quality';
import { startGenerationRun, finishGenerationRun } from '../logging/generation-run-logger';
import { serializeGenerationError as serializeError } from '../logging/serialize-error';
import { loadStoryBible, type StoryBibleSnapshot } from '../memory/load-story-bible';
import {
  NEXT_CHAPTER_HARNESS_MODEL,
  NEXT_CHAPTER_HARNESS_PROMPT_VERSION,
  type NextChapterHarnessResult,
} from '../types';

type Params = {
  db: DB;
  apiKey: string;
  chapterId: string;
  genCtx: ContinuationContext;
};

type ChapterIdentity = {
  storyId: string;
  threadId: string;
};

async function loadChapterIdentity(db: DB, chapterId: string): Promise<ChapterIdentity> {
  const [row] = await db
    .select({
      threadId: chapters.threadId,
      storyId: threads.storyId,
    })
    .from(chapters)
    .innerJoin(threads, eq(chapters.threadId, threads.id))
    .where(eq(chapters.id, chapterId))
    .limit(1);

  if (!row) {
    throw new NonRetryableStoryGenerationError(`chapter identity not found: ${chapterId}`);
  }

  return row;
}

function getOutputSnapshot(
  nextChapterPackage: NextChapterPackage,
  storyBible: StoryBibleSnapshot,
  usage: unknown,
): unknown {
  return {
    chapterTitle: nextChapterPackage.chapterTitle,
    contentChars: nextChapterPackage.content.length,
    situation: nextChapterPackage.situation,
    question: nextChapterPackage.question,
    choices: nextChapterPackage.choices,
    storyBible,
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
    'next chapter structured output failed schema validation after retry',
    serializeError(err),
  );
}

export async function runNextChapterHarness(params: Params): Promise<NextChapterHarnessResult> {
  const identity = await loadChapterIdentity(params.db, params.chapterId);
  const storyBible = await loadStoryBible(params.db, identity.storyId);
  const isFinal = params.genCtx.nextChapterNumber >= params.genCtx.estimatedChapters;
  const maxAttempts = 2;
  let previousIssues: string[] | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startMs = Date.now();
    const runId = await startGenerationRun({
      db: params.db,
      storyId: identity.storyId,
      threadId: identity.threadId,
      chapterId: params.chapterId,
      chapterNumber: params.genCtx.nextChapterNumber,
      stage: 'next_chapter_package',
      promptVersion: NEXT_CHAPTER_HARNESS_PROMPT_VERSION,
      model: NEXT_CHAPTER_HARNESS_MODEL,
      inputSnapshot: {
        prompt: params.genCtx.prompt,
        estimatedChapters: params.genCtx.estimatedChapters,
        previousChapterNumber: params.genCtx.previousChapterNumber,
        chosenOption: params.genCtx.chosenOption,
        nextChapterNumber: params.genCtx.nextChapterNumber,
        storyBible,
        attempt,
        previousIssues,
      },
    });

    try {
      const { nextChapterPackage, usage } = await createNextChapterPackage({
        apiKey: params.apiKey,
        genCtx: params.genCtx,
        storyBible,
        attempt,
        previousIssues,
      });

      const parsedPackage = NextChapterPackageSchema.parse(nextChapterPackage);
      const qualityScores = validateNextChapterQuality(parsedPackage, isFinal);
      const outputSnapshot = getOutputSnapshot(parsedPackage, storyBible, usage);

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
          `[harness:next] rejected attempt=${attempt} thread=${identity.threadId} chapter=${params.genCtx.nextChapterNumber} issues=${qualityScores.issues.join(' | ')}`,
        );
        continue;
      }

      if (!qualityScores.passed) {
        const error = new NonRetryableStoryGenerationError(
          'next chapter failed quality validation',
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

      await finishGenerationRun({
        db: params.db,
        runId,
        status: 'succeeded',
        outputSnapshot,
        qualityScores,
        elapsedMs: Date.now() - startMs,
      });

      console.log(
        `[harness:next] success thread=${identity.threadId} chapter=${params.genCtx.nextChapterNumber} attempt=${attempt} chars=${qualityScores.contentChars}`,
      );
      return toNextChapterResult(parsedPackage, qualityScores, attempt);
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
        previousIssues = ['structured output did not satisfy the schema; regenerate with valid chapter fields'];
        console.warn(`[harness:next] schema retry thread=${identity.threadId} chapter=${params.genCtx.nextChapterNumber} attempt=${attempt}`, serialized);
        continue;
      }

      if (isSchemaError(err)) {
        throw toNonRetryableSchemaError(err);
      }

      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('next chapter harness failed');
}
