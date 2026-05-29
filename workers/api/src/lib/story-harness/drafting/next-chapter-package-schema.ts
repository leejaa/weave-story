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
