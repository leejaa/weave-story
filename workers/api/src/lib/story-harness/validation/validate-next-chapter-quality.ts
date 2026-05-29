import type { NextChapterPackage } from '../drafting/next-chapter-package-schema';
import type { NextChapterQualityScores } from '../types';

const MIN_CONTENT_CHARS = 2000;
const MIN_PARAGRAPHS = 8;

const TRIVIAL_PATTERNS = [
  '침착하게',
  '상황을 파악',
  '모른 척',
  '대답한다',
  '반응한다',
  '어떻게 반응',
  '어떻게 대답',
  '기다린다',
  '생각한다',
];

const STAKES_KEYWORDS = [
  '비밀',
  '정체',
  '계약',
  '약점',
  '증거',
  '배신',
  '협박',
  '거래',
  '누명',
  '살인',
  '죽음',
  '목숨',
  '추방',
  '감금',
  '왕실',
  '가문',
  '금지',
  '폭로',
  '함정',
  '도망',
  '구한다',
  '빼앗',
  '훔치',
  '맞서',
];

function countParagraphs(content: string): number {
  return content.trim().split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

function getDistinctScore(first: string, second: string): number {
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (!a || !b) return 0;
  if (a === b || a.includes(b) || b.includes(a)) return 0;

  const aChars = new Set([...a]);
  const bChars = new Set([...b]);
  const shared = [...aChars].filter(char => bChars.has(char)).length;
  const union = new Set([...aChars, ...bChars]).size;
  return union === 0 ? 0 : 1 - shared / union;
}

function countKeywordHits(value: string): number {
  return STAKES_KEYWORDS.filter(keyword => value.includes(keyword)).length;
}

function hasTrivialPattern(value: string): boolean {
  return TRIVIAL_PATTERNS.some(pattern => value.includes(pattern));
}

export function validateNextChapterQuality(
  nextChapterPackage: NextChapterPackage,
  isFinal: boolean,
): NextChapterQualityScores {
  const content = nextChapterPackage.content.trim();
  const contentChars = content.length;
  const paragraphCount = countParagraphs(content);
  const choiceTexts = nextChapterPackage.choices.map(choice => choice.text);
  const choiceConsequences = nextChapterPackage.choices.map(choice => choice.consequence);
  const choiceField = [nextChapterPackage.question, ...choiceTexts, ...choiceConsequences].join('\n');
  const stakesKeywordHits = countKeywordHits([nextChapterPackage.situation, choiceField].join('\n'));
  const choiceDistinctScore = isFinal ? 1 : getDistinctScore(choiceTexts[0] ?? '', choiceTexts[1] ?? '');
  const choiceImpactScore = isFinal ? 1 : Math.min(1, stakesKeywordHits / 4);
  const issues: string[] = [];

  if (contentChars < MIN_CONTENT_CHARS) {
    issues.push(`content must be at least ${MIN_CONTENT_CHARS} chars, got ${contentChars}`);
  }
  if (paragraphCount < MIN_PARAGRAPHS) {
    issues.push(`content needs at least ${MIN_PARAGRAPHS} paragraphs, got ${paragraphCount}`);
  }
  if (isFinal) {
    if (nextChapterPackage.choices.length > 0) {
      issues.push('final chapter must not include choices');
    }
  } else {
    if (nextChapterPackage.choices.length !== 2) {
      issues.push(`non-final chapter needs exactly 2 choices, got ${nextChapterPackage.choices.length}`);
    }
    if (hasTrivialPattern(nextChapterPackage.question)) {
      issues.push(`question is too reactive or trivial: "${nextChapterPackage.question}"`);
    }
    choiceTexts.forEach((choice, index) => {
      if (hasTrivialPattern(choice)) {
        issues.push(`choice ${index + 1} is too passive or trivial: "${choice}"`);
      }
    });
    if (choiceDistinctScore < 0.35) {
      issues.push(`choices are too similar, distinctScore=${choiceDistinctScore.toFixed(2)}`);
    }
    if (choiceImpactScore < 0.5) {
      issues.push(`choices need stronger stakes, impactScore=${choiceImpactScore.toFixed(2)}`);
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    contentChars,
    paragraphCount,
    choiceImpactScore,
    choiceDistinctScore,
    stakesKeywordHits,
  };
}
