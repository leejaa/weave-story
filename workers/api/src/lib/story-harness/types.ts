import type { FirstChapterResult, NextChapterResult } from '../ai/story-generation';

export const FIRST_CHAPTER_HARNESS_PROMPT_VERSION = 'first-chapter-harness@2026-06-25-D';
export const FIRST_CHAPTER_HARNESS_MODEL = 'anthropic/claude-opus-4.7';
export const NEXT_CHAPTER_HARNESS_PROMPT_VERSION = 'next-chapter-harness@2026-06-25-D';
export const NEXT_CHAPTER_HARNESS_MODEL = 'anthropic/claude-opus-4.7';

export type FirstChapterQualityScores = {
  passed: boolean;
  issues: string[];
  contentChars: number;
  paragraphCount: number;
  choiceImpactScore: number;
  choiceDistinctScore: number;
  stakesKeywordHits: number;
};

export type FirstChapterHarnessResult = FirstChapterResult & {
  qualityScores: FirstChapterQualityScores;
  harnessAttempts: number;
};

export type NextChapterQualityScores = {
  passed: boolean;
  issues: string[];
  contentChars: number;
  paragraphCount: number;
  choiceImpactScore: number;
  choiceDistinctScore: number;
  stakesKeywordHits: number;
};

export type NextChapterHarnessResult = NextChapterResult & {
  qualityScores: NextChapterQualityScores;
  harnessAttempts: number;
};
