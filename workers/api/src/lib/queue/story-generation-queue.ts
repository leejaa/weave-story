import type { StoryGenerationJob } from './story-generation-jobs';

export async function enqueueStoryGenerationJob(
  queue: Queue<StoryGenerationJob>,
  job: StoryGenerationJob,
): Promise<void> {
  console.log(
    `[story-generation:enqueue] type=${job.type} job=${job.jobId} chapter=${job.chapterId}`,
  );
  await queue.send(job);
}
