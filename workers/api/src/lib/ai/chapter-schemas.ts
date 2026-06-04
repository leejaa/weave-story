// Zod schemas for direct chapter generation, built per-language so each field's
// `describe()` guidance is localized. Zod ceilings are language-agnostic upper
// bounds (English words run longer than CJK characters); the per-language
// `describe()` text steers the actual length.
import { z } from 'zod';
import type { LangGuide } from './chapter-prompt-guides';

export function buildFirstSchema(g: LangGuide) {
  return z.object({
    title: z.string().max(80).describe(g.desc.title),
    genre: z.string().describe(g.desc.genre),
    chapterTitle: z.string().max(60).describe(g.desc.chapterTitleFirst),
    content: z.string().min(600).describe(g.desc.contentMain),
    situation: z.string().max(160).describe(g.desc.situation),
    question: z.string().max(80).describe(g.desc.question),
    choices: z.array(z.string().max(80)).length(2).describe(g.desc.choices),
  });
}

export function buildMidSchema(g: LangGuide) {
  return z.object({
    chapterTitle: z.string().max(60).describe(g.desc.chapterTitle),
    content: z.string().min(600).describe(g.desc.contentMain),
    situation: z.string().max(160).describe(g.desc.situation),
    question: z.string().max(80).describe(g.desc.question),
    choices: z.array(z.string().max(80)).length(2).describe(g.desc.choices),
  });
}

export function buildFinalSchema(g: LangGuide) {
  return z.object({
    chapterTitle: z.string().max(60).describe(g.desc.chapterTitle),
    content: z.string().min(600).describe(g.desc.contentFinal),
    situation: z.string().max(5).describe(g.desc.finalSituation),
    question: z.string().max(5).describe(g.desc.finalQuestion),
    choices: z.array(z.string()).max(0).describe(g.desc.finalChoices),
  });
}

export type FirstChapterResult = z.infer<ReturnType<typeof buildFirstSchema>>;
export type NextChapterResult = z.infer<ReturnType<typeof buildMidSchema>>;
