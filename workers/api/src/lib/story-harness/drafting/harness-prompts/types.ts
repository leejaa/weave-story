// Shared shapes for the per-language harness prompt builders (draft + structure
// stages, for the first chapter and every subsequent chapter).
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';

export type FirstDraftArgs = {
  prompt: string;
  estimatedChapters: number;
  attempt: number;
  previousIssues?: string[];
};

export type FirstStructureArgs = {
  prompt: string;
  estimatedChapters: number;
  content: string;
  previousIssues?: string[];
};

export type NextDraftArgs = {
  storyBible: StoryBibleSnapshot;
  prompt: string;
  estimatedChapters: number;
  nextChapterNumber: number;
  previousChapterNumber: number;
  previousChapterContent: string;
  previousChaptersSummaries: { chapterNumber: number; summary: string }[];
  chosenOption: string;
  attempt: number;
  previousIssues?: string[];
  isFinal: boolean;
};

export type NextStructureArgs = {
  prompt: string;
  estimatedChapters: number;
  nextChapterNumber: number;
  content: string;
  previousIssues?: string[];
};

export type HarnessGuide = {
  firstDraftSystem: string;
  firstStructureSystem: string;
  nextDraftSystem: string;
  nextStructureSystem: string;
  buildFirstDraft: (a: FirstDraftArgs) => string;
  buildFirstStructure: (a: FirstStructureArgs) => string;
  buildNextDraft: (a: NextDraftArgs) => string;
  buildNextStructure: (a: NextStructureArgs) => string;
};
