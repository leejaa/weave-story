// Assembles the per-language harness prompt guides into a single lookup.
import type { StoryLang } from '../../../ai/story-lang';
import type { HarnessGuide } from './types';
import { KO } from './ko';
import { EN } from './en';
import { JA } from './ja';
import { ZH_HANT } from './zh-hant';

const GUIDES: Record<StoryLang, HarnessGuide> = { ko: KO, en: EN, ja: JA, 'zh-Hant': ZH_HANT };

export function harnessGuide(lang: StoryLang): HarnessGuide {
  return GUIDES[lang];
}

export type { HarnessGuide } from './types';
