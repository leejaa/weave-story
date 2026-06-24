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
import { generateStoryOutline } from '../outline/generate-outline';
import { saveStoryOutline } from '../outline/save-outline';
import { classifyGenre } from '../outline/classify-genre';
import type { StoryOutline } from '../outline/outline-schema';
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

function getOutputSnapshot(firstChapterPackage: FirstChapterPackage, debug: unknown, usage: unknown): unknown {
  return {
    title: firstChapterPackage.story.title,
    genre: firstChapterPackage.story.genre,
    chapterTitle: firstChapterPackage.story.chapterTitle,
    contentChars: firstChapterPackage.story.content.length,
    situation: firstChapterPackage.story.situation,
    question: firstChapterPackage.story.question,
    choices: firstChapterPackage.story.choices,
    debug, // 실제 프롬프트 + 사용 비트 (디버깅용)
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

  // Phase B — 아웃라인 우선: 1화 생성 전에 전체 아웃라인을 1회 저작한다(장르 확정 → 템플릿 픽 →
  // 아웃라인). 1화도 아웃라인 비트1을 렌더. 실패하면 outline=null → 레거시 경로로 폴백.
  let outline: StoryOutline | null = null;
  {
    const outlineStartMs = Date.now();
    const genre = params.genCtx.hintGenre?.trim()
      || (await classifyGenre(params.apiKey, params.genCtx.prompt));
    const outlineRunId = await startGenerationRun({
      db: params.db,
      storyId: params.storyId,
      threadId: params.threadId,
      chapterId: params.chapterId,
      chapterNumber: 0,
      stage: 'outline',
      promptVersion: FIRST_CHAPTER_HARNESS_PROMPT_VERSION,
      model: 'anthropic/claude-opus-4.7',
      inputSnapshot: { prompt: params.genCtx.prompt, estimatedChapters: params.genCtx.estimatedChapters, genre },
    });
    try {
      outline = await generateStoryOutline({
        db: params.db,
        apiKey: params.apiKey,
        premise: params.genCtx.prompt,
        genre,
        estimatedChapters: params.genCtx.estimatedChapters,
        language: params.genCtx.language,
      });
      await saveStoryOutline({ db: params.db, storyId: params.storyId, outline });
      await finishGenerationRun({
        db: params.db,
        runId: outlineRunId,
        status: 'succeeded',
        outputSnapshot: {
          structureName: outline.structureName,
          beats: outline.beats.length,
          centralMystery: outline.centralMystery,
          endings: outline.endings,
          outline, // 전체 아웃라인 — 디버깅·검증용
        },
        elapsedMs: Date.now() - outlineStartMs,
      });
      console.log(
        `[outline] story=${params.storyId} structure="${outline.structureName}" beats=${outline.beats.length} genre=${outline.genre} endings=${outline.endings.length}`,
      );
    } catch (err) {
      await finishGenerationRun({
        db: params.db,
        runId: outlineRunId,
        status: 'failed',
        error: serializeError(err),
        elapsedMs: Date.now() - outlineStartMs,
      });
      console.error(`[outline] generation failed non_critical — falling back to legacy story=${params.storyId}`, err);
      outline = null;
    }
  }

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
      const { firstChapterPackage, usage, debug } = await createFirstChapterPackage({
        apiKey: params.apiKey,
        genCtx: params.genCtx,
        attempt,
        previousIssues,
        outline,
      });

      const parsedPackage = FirstChapterPackageSchema.parse(firstChapterPackage);
      const qualityScores = validateFirstChapterQuality(parsedPackage);
      const outputSnapshot = getOutputSnapshot(parsedPackage, debug, usage);

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

      // 아웃라인이 있으면 story_bibles는 이미 saveStoryOutline으로 저장됨(아웃라인 파생 + blueprint=outline).
      // 아웃라인이 없을 때만(폴백) 챕터1 structure에서 추출한 bible을 저장.
      if (!outline) {
        try {
          await saveStoryBible({
            db: params.db,
            storyId: params.storyId,
            bible: parsedPackage.bible,
          });
        } catch (err) {
          console.error(`[harness:first] story bible save failed non_critical story=${params.storyId}`, err);
        }
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
