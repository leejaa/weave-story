// The set of languages a story can be generated in. Shared primitive used by
// the prompt guides, schemas, routes and the harness.
export type StoryLang = 'en' | 'ja' | 'ko' | 'zh-Hant';

export function normalizeStoryLang(input: unknown): StoryLang {
  return input === 'ja' || input === 'ko' || input === 'zh-Hant' ? input : 'en';
}

// Human-readable names for non-harness languages (used in output language override instructions).
const LANG_NAMES: Record<string, string> = {
  id: 'Indonesian (Bahasa Indonesia)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  pt: 'Portuguese (Português)',
  de: 'German (Deutsch)',
  ar: 'Arabic (العربية)',
  hi: 'Hindi (हिन्दी)',
  th: 'Thai (ภาษาไทย)',
  vi: 'Vietnamese (Tiếng Việt)',
  tr: 'Turkish (Türkçe)',
  ru: 'Russian (Русский)',
  it: 'Italian (Italiano)',
  nl: 'Dutch (Nederlands)',
};

export function langDisplayName(lang: string): string {
  return LANG_NAMES[lang] ?? lang;
}

// Detect the language of a prompt string. Returns an IETF language tag.
// Uses character-based detection for CJK/Arabic scripts and word-frequency
// heuristics for Latin-script languages.
export function detectPromptLanguage(prompt: string): string {
  if (!prompt || prompt.trim().length < 5) return 'en';

  // Korean: Hangul syllables or jamo
  if (/[가-힣ᄀ-ᇿ㄰-㆏]/.test(prompt)) return 'ko';

  // Japanese: Hiragana or Katakana
  if (/[぀-ゟ゠-ヿ]/.test(prompt)) return 'ja';

  // Chinese: CJK Unified Ideographs (no kana → Chinese)
  if (/[一-鿿]/.test(prompt)) return 'zh-Hant';

  // Arabic script
  if (/[؀-ۿ]/.test(prompt)) return 'ar';

  // Devanagari (Hindi/Marathi/Sanskrit)
  if (/[ऀ-ॿ]/.test(prompt)) return 'hi';

  // Thai
  if (/[฀-๿]/.test(prompt)) return 'th';

  // Latin-script languages: word frequency heuristics
  const words = prompt.toLowerCase().split(/[\s,\.!?;:]+/).filter(Boolean);
  const hit = (set: Set<string>) => words.filter(w => set.has(w)).length;

  const ID = new Set(['yang', 'dan', 'di', 'ini', 'itu', 'dengan', 'untuk', 'dari', 'tidak', 'ada', 'saya', 'ke', 'pada', 'adalah', 'akan', 'juga', 'sudah', 'bisa', 'kami', 'mereka', 'karena', 'setelah', 'seperti', 'ketika']);
  const ES = new Set(['que', 'una', 'los', 'las', 'por', 'como', 'pero', 'cuando', 'muy', 'sobre', 'también', 'así', 'sin', 'desde', 'entre', 'está', 'esta', 'esto']);
  const FR = new Set(['que', 'les', 'une', 'est', 'il', 'elle', 'pas', 'pour', 'son', 'dans', 'sur', 'avec', 'mais', 'bien', 'vous', 'nous', 'tout', 'plus', 'même', 'aussi']);
  const PT = new Set(['que', 'uma', 'não', 'com', 'para', 'por', 'está', 'foi', 'seu', 'sua', 'mais', 'como', 'mas', 'depois', 'isso', 'esse', 'essa', 'quando']);
  const DE = new Set(['die', 'der', 'und', 'ist', 'des', 'den', 'das', 'mit', 'nicht', 'ein', 'eine', 'auf', 'von', 'sie', 'sich', 'auch', 'war', 'nach', 'aber']);
  const IT = new Set(['che', 'una', 'con', 'per', 'non', 'sono', 'come', 'sul', 'più', 'anche', 'questo', 'questa', 'quando', 'già', 'dopo', 'quello', 'molto']);
  const RU = new Set(['что', 'это', 'как', 'все', 'так', 'его', 'ему', 'она', 'они', 'нет', 'уже', 'или', 'был', 'то', 'же', 'вот', 'раз', 'тут']);

  const scores: [string, number][] = [
    ['id', hit(ID)], ['es', hit(ES)], ['fr', hit(FR)], ['pt', hit(PT)],
    ['de', hit(DE)], ['it', hit(IT)], ['ru', hit(RU)],
  ];
  const [bestLang, bestScore] = scores.reduce((a, b) => b[1] > a[1] ? b : a, ['en', 0]);
  if (bestScore >= 2) return bestLang;

  return 'en';
}

// Maps any detected language to the best available harness language.
export function languageToHarnessLang(lang: string): StoryLang {
  if (lang === 'ko') return 'ko';
  if (lang === 'ja') return 'ja';
  if (lang === 'zh-Hant' || lang === 'zh') return 'zh-Hant';
  return 'en';
}
