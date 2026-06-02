import type { FirstChapterPackage } from '../drafting/first-chapter-package-schema';
import type { FirstChapterQualityScores } from '../types';
import { evaluateChapterQuality } from './chapter-quality';

export function validateFirstChapterQuality(
  firstChapterPackage: FirstChapterPackage,
): FirstChapterQualityScores {
  return evaluateChapterQuality({
    content: firstChapterPackage.story.content,
    question: firstChapterPackage.story.question,
    situation: firstChapterPackage.story.situation,
    choices: firstChapterPackage.story.choices,
    extraStakesText: [
      firstChapterPackage.bible.openingThreat,
      firstChapterPackage.bible.centralConflict,
    ],
    isFinal: false,
  });
}
