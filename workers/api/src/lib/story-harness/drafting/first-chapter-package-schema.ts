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
});

const HighImpactChoiceSchema = z.object({
  text: z.string().min(4).max(120),
  consequence: z.string().min(4).max(300),
});

export const FirstChapterPackageSchema = z.object({
  bible: StoryBibleLiteSchema,
  story: z.object({
    title: z.string().min(2).max(80),
    genre: z.string().min(2).max(80),
    chapterTitle: z.string().min(2).max(80),
    content: z.string().min(600).max(8000),
    situation: z.string().min(4).max(300),
    question: z.string().min(4).max(180),
    choices: z.array(HighImpactChoiceSchema).length(2),
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
