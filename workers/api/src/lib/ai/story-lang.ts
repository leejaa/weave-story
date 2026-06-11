// The set of languages a story can be generated in. Shared primitive used by
// the prompt guides, schemas, routes and the harness.
export type StoryLang = 'en' | 'ja' | 'ko' | 'zh-Hant';

export function normalizeStoryLang(input: unknown): StoryLang {
  return input === 'ja' || input === 'ko' || input === 'zh-Hant' ? input : 'en';
}
