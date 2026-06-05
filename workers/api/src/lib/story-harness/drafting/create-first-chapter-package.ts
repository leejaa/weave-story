import { createGateway } from '@ai-sdk/gateway';
import type { z } from 'zod';
import type { SetupContext } from '../../ai/story-generation';
import {
  ChapterDraftSchema,
  ChapterStructureSchema,
  type ChapterStructure,
  type FirstChapterPackage,
} from './first-chapter-package-schema';
import { generateStructured, clamp } from './structured-generation';
import { extendChapterBody } from './extend-chapter-body';
import { harnessGuide } from './harness-prompts';
import { FIRST_CHAPTER_HARNESS_MODEL } from '../types';

// Bodies under this length get a continuation pass instead of failing/regenerating.
const EXTEND_TARGET = 2000;

type Params = {
  apiKey: string;
  genCtx: SetupContext;
  attempt: number;
  previousIssues?: string[];
};

type GenerateResult = {
  firstChapterPackage: FirstChapterPackage;
  usage: unknown;
};

// ─── Code-side normalization ─────────────────────────────────────────────────
// Clamp cosmetic over-length and extra choices so the assembled package always
// satisfies FirstChapterPackageSchema without a hard failure.

function assemble(
  draft: z.infer<typeof ChapterDraftSchema>,
  structure: ChapterStructure,
): FirstChapterPackage {
  const choices = structure.choices.slice(0, 2).map(ch => ({
    text: clamp(ch.text, 120),
    consequence: clamp(ch.consequence, 300),
  }));

  return {
    bible: structure.bible,
    story: {
      title: clamp(draft.title, 80),
      genre: clamp(draft.genre, 80),
      chapterTitle: clamp(draft.chapterTitle, 80),
      situation: clamp(structure.situation, 300),
      question: clamp(structure.question, 180),
      choices,
      content: draft.content.trim(),
    },
  };
}

export async function createFirstChapterPackage(params: Params): Promise<GenerateResult> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const model = gateway(FIRST_CHAPTER_HARNESS_MODEL);
  const g = harnessGuide(params.genCtx.language);

  // Step 1 — write the chapter body (the only long field).
  const draft = await generateStructured({
    model,
    system: g.firstDraftSystem,
    prompt: g.buildFirstDraft({
      prompt: params.genCtx.prompt,
      estimatedChapters: params.genCtx.estimatedChapters,
      attempt: params.attempt,
      previousIssues: params.previousIssues,
    }),
    schema: ChapterDraftSchema,
  });

  // Step 1b — if the body came in short, keep writing the same scene and append, rather than
  // failing or regenerating the whole chapter (which tends to come back short again).
  const extended = draft.output.content.length >= EXTEND_TARGET
    ? { content: draft.output.content, usages: [] as unknown[] }
    : await extendChapterBody({
        model,
        system: g.firstDraftSystem,
        content: draft.output.content,
        targetChars: EXTEND_TARGET,
        buildExtendPrompt: (current, deficitChars) =>
          g.buildExtend({ currentContent: current, deficitChars, isFinal: false }),
      });
  const draftBody = { ...draft.output, content: extended.content };

  // Step 2 — derive bible + decision UI from the finished body (all short fields).
  const structure = await generateStructured({
    model,
    system: g.firstStructureSystem,
    prompt: g.buildFirstStructure({
      prompt: params.genCtx.prompt,
      estimatedChapters: params.genCtx.estimatedChapters,
      content: draftBody.content,
      previousIssues: params.previousIssues,
    }),
    schema: ChapterStructureSchema,
  });

  return {
    firstChapterPackage: assemble(draftBody, structure.output),
    usage: { draft: draft.usage, extend: extended.usages, structure: structure.usage },
  };
}
