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
import { stripTrailingChoiceBlock } from './strip-choice-block';
import { harnessGuide } from './harness-prompts';
import { FIRST_CHAPTER_HARNESS_MODEL } from '../types';
import type { StoryOutline } from '../outline/outline-schema';
import { beatForChapter } from '../outline/format-outline';

// Bodies under this length get a continuation pass instead of failing/regenerating.
// CJK-oriented floor (chars); English bodies run far longer in chars so they never trip it.
// Lowered 4500→1800 for the web-fiction concept (short, fast chapters ~1,800–2,800 chars).
const EXTEND_TARGET = 1800;

type Params = {
  apiKey: string;
  genCtx: SetupContext;
  attempt: number;
  previousIssues?: string[];
  outline?: StoryOutline | null;
};

type GenerateResult = {
  firstChapterPackage: FirstChapterPackage;
  usage: unknown;
  debug: {
    draftSystem: string;
    draftPrompt: string;
    structurePrompt: string;
    beatIndex: number | null;
    beatFunction: string | null;
    mode: 'outline' | 'legacy';
  };
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

  const beat = params.outline ? beatForChapter(params.outline, 1) : null;

  // Step 1 — write the chapter body (the only long field).
  const draftPrompt = g.buildFirstDraft({
    prompt: params.genCtx.prompt,
    estimatedChapters: params.genCtx.estimatedChapters,
    attempt: params.attempt,
    previousIssues: params.previousIssues,
    outputLanguage: params.genCtx.outputLanguage,
    hintGenre: params.genCtx.hintGenre,
    outline: params.outline ?? null,
    beat,
  });
  const draft = await generateStructured({
    model,
    system: g.firstDraftSystem,
    prompt: draftPrompt,
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
          g.buildExtend({ currentContent: current, deficitChars, isFinal: false, outputLanguage: params.genCtx.outputLanguage }),
      });
  const draftBody = { ...draft.output, content: stripTrailingChoiceBlock(extended.content) };

  // Step 2 — derive bible + decision UI from the finished body (all short fields).
  const structurePrompt = g.buildFirstStructure({
    prompt: params.genCtx.prompt,
    estimatedChapters: params.genCtx.estimatedChapters,
    content: draftBody.content,
    previousIssues: params.previousIssues,
    hintGenre: params.genCtx.hintGenre,
  });
  const structure = await generateStructured({
    model,
    system: g.firstStructureSystem,
    prompt: structurePrompt,
    schema: ChapterStructureSchema,
  });

  return {
    firstChapterPackage: assemble(draftBody, structure.output),
    usage: { draft: draft.usage, extend: extended.usages, structure: structure.usage },
    debug: {
      draftSystem: g.firstDraftSystem,
      draftPrompt,
      structurePrompt,
      beatIndex: beat?.index ?? null,
      beatFunction: beat?.function ?? null,
      mode: params.outline && beat ? 'outline' : 'legacy',
    },
  };
}
