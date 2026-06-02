import type { NextChapterPackage } from '../drafting/next-chapter-package-schema';
import type { NextChapterQualityScores } from '../types';
import { evaluateChapterQuality } from './chapter-quality';

export function validateNextChapterQuality(
  nextChapterPackage: NextChapterPackage,
  isFinal: boolean,
): NextChapterQualityScores {
  return evaluateChapterQuality({
    content: nextChapterPackage.content,
    question: nextChapterPackage.question,
    situation: nextChapterPackage.situation,
    choices: nextChapterPackage.choices,
    isFinal,
  });
}
