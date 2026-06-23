import { createGateway } from '@ai-sdk/gateway';
import type { ContinuationContext } from '../../ai/story-generation';
import { NEXT_CHAPTER_HARNESS_MODEL } from '../types';
import type { StoryBibleSnapshot } from '../memory/load-story-bible';
import {
  NextChapterDraftSchema,
  NextChapterStructureSchema,
  type NextChapterDraft,
  type NextChapterStructure,
  type NextChapterPackage,
} from './next-chapter-package-schema';
import { generateStructured, clamp } from './structured-generation';
import { extendChapterBody } from './extend-chapter-body';
import { stripTrailingChoiceBlock } from './strip-choice-block';
import { harnessGuide } from './harness-prompts';

// Bodies under this length get a continuation pass instead of failing/regenerating.
// CJK-oriented floor (chars); English bodies run far longer in chars so they never trip it.
// Lowered 4500→1800 for the web-fiction concept (short, fast chapters ~1,800–2,800 chars).
const EXTEND_TARGET = 1800;

type Params = {
  apiKey: string;
  genCtx: ContinuationContext;
  storyBible: StoryBibleSnapshot;
  attempt: number;
  previousIssues?: string[];
};

type GenerateResult = {
  nextChapterPackage: NextChapterPackage;
  usage: unknown;
};

function assemble(draft: NextChapterDraft, structure: NextChapterStructure | null): NextChapterPackage {
  const base = {
    chapterTitle: clamp(draft.chapterTitle, 80),
    content: draft.content.trim(),
  };

  if (!structure) {
    // Final chapter — no decision UI.
    return { ...base, situation: '', question: '', choices: [] };
  }

  const choices = structure.choices.slice(0, 2).map(ch => ({
    text: clamp(ch.text, 120),
    consequence: clamp(ch.consequence, 300),
  }));

  return {
    ...base,
    situation: clamp(structure.situation, 300),
    question: clamp(structure.question, 180),
    choices,
  };
}

export async function createNextChapterPackage(params: Params): Promise<GenerateResult> {
  const gateway = createGateway({ apiKey: params.apiKey });
  const model = gateway(NEXT_CHAPTER_HARNESS_MODEL);
  const isFinal = params.genCtx.nextChapterNumber >= params.genCtx.estimatedChapters;
  const g = harnessGuide(params.genCtx.language);

  // Step 1 — write the chapter body (the only long field).
  const draft = await generateStructured({
    model,
    system: g.nextDraftSystem,
    prompt: g.buildNextDraft({
      storyBible: params.storyBible,
      prompt: params.genCtx.prompt,
      estimatedChapters: params.genCtx.estimatedChapters,
      nextChapterNumber: params.genCtx.nextChapterNumber,
      previousChapterNumber: params.genCtx.previousChapterNumber,
      previousChapterContent: params.genCtx.previousChapterContent,
      previousChaptersSummaries: params.genCtx.previousChaptersSummaries,
      storyState: params.genCtx.storyState,
      chosenOption: params.genCtx.chosenOption,
      choiceKind: params.genCtx.choiceKind,
      attempt: params.attempt,
      previousIssues: params.previousIssues,
      isFinal,
      outputLanguage: params.genCtx.outputLanguage,
    }),
    schema: NextChapterDraftSchema,
  });

  // Step 1b — if the body came in short, keep writing the same scene and append, rather than
  // failing or regenerating the whole chapter (which tends to come back short again).
  const extended = draft.output.content.length >= EXTEND_TARGET
    ? { content: draft.output.content, usages: [] as unknown[] }
    : await extendChapterBody({
        model,
        system: g.nextDraftSystem,
        content: draft.output.content,
        targetChars: EXTEND_TARGET,
        buildExtendPrompt: (current, deficitChars) =>
          g.buildExtend({ currentContent: current, deficitChars, isFinal, outputLanguage: params.genCtx.outputLanguage }),
      });
  const draftBody: NextChapterDraft = {
    ...draft.output,
    content: stripTrailingChoiceBlock(extended.content),
  };

  // Step 2 — derive the decision UI from the body. Skipped for the final chapter.
  if (isFinal) {
    return {
      nextChapterPackage: assemble(draftBody, null),
      usage: { draft: draft.usage, extend: extended.usages },
    };
  }

  const structure = await generateStructured({
    model,
    system: g.nextStructureSystem,
    prompt: g.buildNextStructure({
      prompt: params.genCtx.prompt,
      estimatedChapters: params.genCtx.estimatedChapters,
      nextChapterNumber: params.genCtx.nextChapterNumber,
      content: draftBody.content,
      previousIssues: params.previousIssues,
    }),
    schema: NextChapterStructureSchema,
  });

  return {
    nextChapterPackage: assemble(draftBody, structure.output),
    usage: { draft: draft.usage, extend: extended.usages, structure: structure.usage },
  };
}
