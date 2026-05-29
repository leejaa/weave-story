import type { ContinuationContext, SetupContext } from '../ai/story-generation';

type StoryGenerationJobBase = {
  jobId: string;
  enqueuedAt: string;
};

export type FirstChapterGenerationJob = StoryGenerationJobBase & {
  type: 'first-chapter';
  storyId: string;
  threadId: string;
  chapterId: string;
  genCtx: SetupContext;
};

export type NextChapterGenerationJob = StoryGenerationJobBase & {
  type: 'next-chapter';
  chapterId: string;
  genCtx: ContinuationContext;
};

export type StoryGenerationJob = FirstChapterGenerationJob | NextChapterGenerationJob;

function createJobId(type: StoryGenerationJob['type'], id: string): string {
  return `${type}:${id}:${Date.now()}`;
}

export function createFirstChapterGenerationJob(params: {
  storyId: string;
  threadId: string;
  chapterId: string;
  genCtx: SetupContext;
}): FirstChapterGenerationJob {
  return {
    type: 'first-chapter',
    jobId: createJobId('first-chapter', params.chapterId),
    enqueuedAt: new Date().toISOString(),
    ...params,
  };
}

export function createNextChapterGenerationJob(params: {
  chapterId: string;
  genCtx: ContinuationContext;
}): NextChapterGenerationJob {
  return {
    type: 'next-chapter',
    jobId: createJobId('next-chapter', params.chapterId),
    enqueuedAt: new Date().toISOString(),
    ...params,
  };
}
