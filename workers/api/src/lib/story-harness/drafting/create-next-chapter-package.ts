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
import { harnessGuide } from './harness-prompts';

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
      chosenOption: params.genCtx.chosenOption,
      attempt: params.attempt,
      previousIssues: params.previousIssues,
      isFinal,
    }),
    schema: NextChapterDraftSchema,
  });

  // Step 2 — derive the decision UI from the body. Skipped for the final chapter.
  if (isFinal) {
    return {
      nextChapterPackage: assemble(draft.output, null),
      usage: { draft: draft.usage },
    };
  }

  const structure = await generateStructured({
    model,
    system: g.nextStructureSystem,
    prompt: g.buildNextStructure({
      prompt: params.genCtx.prompt,
      estimatedChapters: params.genCtx.estimatedChapters,
      nextChapterNumber: params.genCtx.nextChapterNumber,
      content: draft.output.content,
      previousIssues: params.previousIssues,
    }),
    schema: NextChapterStructureSchema,
  });

  return {
    nextChapterPackage: assemble(draft.output, structure.output),
    usage: { draft: draft.usage, structure: structure.usage },
  };
}
