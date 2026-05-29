import { eq } from 'drizzle-orm';
import { generationRuns } from '../../schema';
import type { DB } from '../../db';

type RunStatus = 'started' | 'succeeded' | 'rejected' | 'failed';

type StartGenerationRunParams = {
  db: DB;
  storyId: string;
  threadId: string;
  chapterId: string;
  chapterNumber: number;
  stage: string;
  promptVersion: string;
  model: string;
  inputSnapshot: unknown;
};

type FinishGenerationRunParams = {
  db: DB;
  runId: string | null;
  status: RunStatus;
  outputSnapshot?: unknown;
  qualityScores?: unknown;
  error?: unknown;
  elapsedMs: number;
};

export async function startGenerationRun(params: StartGenerationRunParams): Promise<string | null> {
  try {
    const [run] = await params.db
      .insert(generationRuns)
      .values({
        storyId: params.storyId,
        threadId: params.threadId,
        chapterId: params.chapterId,
        chapterNumber: params.chapterNumber,
        stage: params.stage,
        promptVersion: params.promptVersion,
        model: params.model,
        status: 'started',
        inputSnapshot: params.inputSnapshot,
      })
      .returning({ id: generationRuns.id });

    return run.id;
  } catch (err) {
    console.error('[generation-run] start failed non_critical', err);
    return null;
  }
}

export async function finishGenerationRun(params: FinishGenerationRunParams): Promise<void> {
  if (!params.runId) return;

  try {
    await params.db
      .update(generationRuns)
      .set({
        status: params.status,
        outputSnapshot: params.outputSnapshot,
        qualityScores: params.qualityScores,
        error: params.error,
        elapsedMs: params.elapsedMs,
        completedAt: new Date(),
      })
      .where(eq(generationRuns.id, params.runId));
  } catch (err) {
    console.error(`[generation-run] finish failed non_critical run=${params.runId}`, err);
  }
}
