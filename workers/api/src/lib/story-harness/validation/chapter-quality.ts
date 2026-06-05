// Shared chapter quality evaluation for the first chapter and every subsequent
// chapter. Previously this logic was duplicated across two near-identical files.
//
// Design principle: only OBJECTIVE, structural problems gate generation — wrong
// paragraph/choice counts, exact-duplicate or passive choices. Body LENGTH is no longer a
// gate: a short body is grown by the continuation pass (extend-chapter-body), not rejected
// here. The "stakes"/"distinctness" scores are computed for telemetry but are NOT gates.

const MIN_PARAGRAPHS = 8;

// Passive/reactive choice phrasings the product explicitly wants to avoid.
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

// Stakes vocabulary — used ONLY to compute the recorded choiceImpactScore signal.
const STAKES_KEYWORDS = [
  '비밀', '정체', '계약', '약점', '증거', '배신', '배반', '협박', '거래', '누명',
  '살인', '죽음', '죽이', '목숨', '추방', '감금', '인질', '왕실', '가문', '금지',
  '폭로', '함정', '도망', '탈출', '추격', '복수', '음모', '반역', '처형', '처단',
  '결투', '포위', '위협', '발각', '진실', '운명', '파멸', '생존', '위험',
  '구한다', '지킨다', '빼앗', '훔치', '맞서', '잡히',
];

export type ChapterQualityScores = {
  passed: boolean;
  issues: string[];
  contentChars: number;
  paragraphCount: number;
  choiceImpactScore: number;
  choiceDistinctScore: number;
  stakesKeywordHits: number;
};

export type ChapterQualityInput = {
  content: string;
  question: string;
  situation: string;
  choices: { text: string; consequence: string }[];
  // Extra strings scanned for stakes keywords (e.g. bible.openingThreat) — telemetry only.
  extraStakesText?: string[];
  isFinal: boolean;
};

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

// Exact-duplicate detection only (one choice equal to or containing the other) —
// a real defect, unlike the fuzzy distinctness score.
function areDuplicateChoices(first: string, second: string): boolean {
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function countKeywordHits(value: string): number {
  return STAKES_KEYWORDS.filter(keyword => value.includes(keyword)).length;
}

function hasTrivialPattern(value: string): boolean {
  return TRIVIAL_PATTERNS.some(pattern => value.includes(pattern));
}

export function evaluateChapterQuality(input: ChapterQualityInput): ChapterQualityScores {
  const content = input.content.trim();
  const contentChars = content.length;
  const paragraphCount = countParagraphs(content);

  const choiceTexts = input.choices.map(choice => choice.text);
  const choiceConsequences = input.choices.map(choice => choice.consequence);
  const choiceField = [input.question, ...choiceTexts, ...choiceConsequences].join('\n');
  const stakesKeywordHits = countKeywordHits(
    [input.situation, choiceField, ...(input.extraStakesText ?? [])].join('\n'),
  );
  const choiceDistinctScore = input.isFinal ? 1 : getDistinctScore(choiceTexts[0] ?? '', choiceTexts[1] ?? '');
  const choiceImpactScore = input.isFinal ? 1 : Math.min(1, stakesKeywordHits / 4);

  const issues: string[] = [];

  // Objective structural gates only. Body length is handled by the continuation pass, not here.
  if (paragraphCount < MIN_PARAGRAPHS) {
    issues.push(`content needs at least ${MIN_PARAGRAPHS} paragraphs, got ${paragraphCount}`);
  }

  if (input.isFinal) {
    if (input.choices.length > 0) {
      issues.push('final chapter must not include choices');
    }
  } else {
    if (input.choices.length !== 2) {
      issues.push(`non-final chapter needs exactly 2 choices, got ${input.choices.length}`);
    }
    if (hasTrivialPattern(input.question)) {
      issues.push(`question is too reactive or trivial: "${input.question}"`);
    }
    choiceTexts.forEach((choice, index) => {
      if (hasTrivialPattern(choice)) {
        issues.push(`choice ${index + 1} is too passive or trivial: "${choice}"`);
      }
    });
    if (choiceTexts.length === 2 && areDuplicateChoices(choiceTexts[0], choiceTexts[1])) {
      issues.push('the two choices are duplicates');
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
