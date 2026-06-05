import { z } from 'zod';
import type { NextChapterResult } from '../../ai/story-generation';
import type { NextChapterQualityScores } from '../types';

const NextChapterChoiceSchema = z.object({
  text: z.string().min(4).max(120),
  consequence: z.string().min(4).max(300),
});

export const NextChapterPackageSchema = z.object({
  chapterTitle: z.string().min(2).max(80),
  content: z.string().min(600).max(8000),
  situation: z.string().min(0).max(300),
  question: z.string().min(0).max(180),
  choices: z.array(NextChapterChoiceSchema).max(2),
});

export type NextChapterPackage = z.infer<typeof NextChapterPackageSchema>;

// ─── Two-step generation schemas (mirrors the first-chapter harness) ──────────
// Step 1 writes the chapter body (the only long field). The hard min here is a loose floor
// (not the real 2000-char quality bar): a draft that lands a bit short still validates and
// flows to the soft quality gate, which re-runs it with feedback — instead of hard-throwing
// at the schema and killing the chapter. Genuinely-truncated bodies still fail and retry.
export const NextChapterDraftSchema = z.object({
  chapterTitle: z.string().min(2).max(80),
  content: z.string().min(1200).max(8000),
});

// Step 2 derives the decision UI from the finished body (non-final chapters only).
// Loose maxes + 2+ choices; cosmetic over-length and extra choices are clamped in code.
export const NextChapterStructureSchema = z.object({
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

export type NextChapterDraft = z.infer<typeof NextChapterDraftSchema>;
export type NextChapterStructure = z.infer<typeof NextChapterStructureSchema>;

export function toNextChapterResult(
  nextChapterPackage: NextChapterPackage,
  qualityScores: NextChapterQualityScores,
  harnessAttempts: number,
): NextChapterResult & { qualityScores: NextChapterQualityScores; harnessAttempts: number } {
  return {
    chapterTitle: nextChapterPackage.chapterTitle,
    content: nextChapterPackage.content.trim(),
    situation: nextChapterPackage.situation.trim(),
    question: nextChapterPackage.question.trim(),
    choices: nextChapterPackage.choices.map(choice => choice.text.trim()),
    qualityScores,
    harnessAttempts,
  };
}
