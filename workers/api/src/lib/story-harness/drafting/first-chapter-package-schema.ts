import { z } from 'zod';
import type { FirstChapterResult } from '../../ai/story-generation';
import type { FirstChapterQualityScores } from '../types';

const StoryBibleLiteSchema = z.object({
  logline: z.string().min(10).max(300),
  genre: z.string().min(2).max(80),
  tone: z.string().min(4).max(180),
  protagonist: z.string().min(4).max(220),
  centralConflict: z.string().min(10).max(360),
  readerPromise: z.string().min(10).max(360),
  openingThreat: z.string().min(10).max(300),
  openThreads: z.array(z.string().min(4).max(240)).min(1).max(8),
  forbiddenPatterns: z.array(z.string().min(2).max(180)).min(1).max(8),
  desire: z.string().min(4).max(200).optional(),
  wound: z.string().min(4).max(200).optional(),
});

const HighImpactChoiceSchema = z.object({
  text: z.string().min(4).max(120),
  consequence: z.string().min(4).max(300),
});

// ─── Two-step generation schemas ─────────────────────────────────────────────
// A single model call can't reliably produce a long `content` AND precise short
// fields together: whichever sits last in the JSON gets neglected (overflowing
// neighbours when content is in the middle, or a too-short body when content is
// last). So we split generation into two focused calls, each with one job.

// Step 1 — write the chapter body. The only long field; nothing competes with it.
// No length floor on the body here: a short body is grown by the continuation pass
// (extend-chapter-body), not fixed by failing the schema. min(1) only guards an empty string.
export const ChapterDraftSchema = z.object({
  title: z.string().min(2).max(80),
  genre: z.string().min(2).max(80),
  chapterTitle: z.string().min(2).max(80),
  content: z.string().min(1).max(20000),
});

// Step 2 — derive the story bible + decision UI FROM the finished body. All short
// fields, so structured output is reliable here. The length maxes are deliberately
// LOOSE (and choices allows 2+): cosmetic over-length and extra choices are clamped
// in code afterward instead of hard-failing the whole generation. Only genuine
// structural problems (e.g. fewer than 2 choices) fall through to a repair retry.
export const ChapterStructureSchema = z.object({
  bible: StoryBibleLiteSchema,
  situation: z.string().min(4).max(600),
  question: z.string().min(4).max(400),
  choices: z
    .array(
      z.object({
        text: z.string().min(4).max(300),
        consequence: z.string().min(4).max(600),
      }),
    )
    .min(2)
    .max(6),
});

export type ChapterDraft = z.infer<typeof ChapterDraftSchema>;
export type ChapterStructure = z.infer<typeof ChapterStructureSchema>;

export const FirstChapterPackageSchema = z.object({
  bible: StoryBibleLiteSchema,
  story: z.object({
    title: z.string().min(2).max(80),
    genre: z.string().min(2).max(80),
    chapterTitle: z.string().min(2).max(80),
    situation: z.string().min(4).max(300),
    question: z.string().min(4).max(180),
    choices: z.array(HighImpactChoiceSchema).length(2),
    // No length floor: a short body is grown by the continuation pass, never hard-failed here.
    content: z.string().min(1).max(20000),
  }),
});

export type FirstChapterPackage = z.infer<typeof FirstChapterPackageSchema>;
export type StoryBibleLite = z.infer<typeof StoryBibleLiteSchema>;

export function toFirstChapterResult(
  firstChapterPackage: FirstChapterPackage,
  qualityScores: FirstChapterQualityScores,
  harnessAttempts: number,
): FirstChapterResult & { qualityScores: FirstChapterQualityScores; harnessAttempts: number } {
  return {
    title: firstChapterPackage.story.title,
    genre: firstChapterPackage.story.genre,
    chapterTitle: firstChapterPackage.story.chapterTitle,
    content: firstChapterPackage.story.content.trim(),
    situation: firstChapterPackage.story.situation.trim(),
    question: firstChapterPackage.story.question.trim(),
    choices: firstChapterPackage.story.choices.map(choice => choice.text.trim()),
    qualityScores,
    harnessAttempts,
  };
}
