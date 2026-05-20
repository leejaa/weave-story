import { db } from '@/lib/db/client';
import { stories, threads, chapters, users } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { generateFirstChapter } from '@/lib/ai/story-generation';
import { fireSummarizeChapter } from '@/lib/ai/summarize-chapter';
import { enqueueCoverJob } from '@/lib/queue/cover-queue';
import { eq, asc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(stories)
    .where(eq(stories.userId, userId))
    .orderBy(asc(stories.createdAt));

  return Response.json(rows);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const prompt = body?.prompt as string | undefined;
  const estimatedChapters = typeof body?.estimatedChapters === 'number' ? body.estimatedChapters : 10;
  const hasPremium = body?.hasPremium === true;

  if (!prompt?.trim()) {
    return Response.json({ error: 'prompt required' }, { status: 400 });
  }

  if (!hasPremium) {
    const [userRow] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    if (!userRow || userRow.credits <= 0) {
      return Response.json({ error: 'insufficient_credits' }, { status: 402 });
    }
    await db.update(users).set({ credits: sql`${users.credits} - 1` }).where(eq(users.id, userId));
  }

  const setupAnswers = { prompt: prompt.trim() };

  const [story] = await db
    .insert(stories)
    .values({ userId, setupAnswers, estimatedChapters, status: 'generating' })
    .returning();

  const [thread] = await db
    .insert(threads)
    .values({ userId, storyId: story.id })
    .returning();

  const [pendingChapter] = await db
    .insert(chapters)
    .values({ threadId: thread.id, chapterNumber: 1, status: 'generating', content: null })
    .returning();

  console.log(`[stories] bg:start story=${story.id} thread=${thread.id} prompt_len=${prompt.trim().length}`);

  // Fire-and-forget — generate first chapter in background
  ;(async () => {
    const startMs = Date.now();
    let generated: Awaited<ReturnType<typeof generateFirstChapter>>;
    try {
      generated = await generateFirstChapter({ prompt: prompt.trim(), estimatedChapters });

      await db
        .update(stories)
        .set({ title: generated.title, genre: generated.genre, status: 'ready' })
        .where(eq(stories.id, story.id));

      await db
        .update(chapters)
        .set({
          title: generated.chapterTitle,
          content: generated.content,
          situation: generated.situation,
          question: generated.question,
          options: generated.choices.map((text, index) => ({ index, text })),
          status: 'ready',
        })
        .where(eq(chapters.id, pendingChapter.id));

      console.log(`[stories] bg:done story=${story.id} title="${generated.title}" genre=${generated.genre} content=${generated.content.length} elapsed=${Date.now() - startMs}ms`);

      fireSummarizeChapter(pendingChapter.id, generated.content, 1, thread.id);
    } catch (err) {
      console.error(`[stories] bg:error story=${story.id} elapsed=${Date.now() - startMs}ms`, err);
      await db
        .update(chapters)
        .set({ status: 'failed' })
        .where(eq(chapters.id, pendingChapter.id));
      await db
        .update(stories)
        .set({ status: 'failed' })
        .where(eq(stories.id, story.id));
      return;
    }

    // Cover image is non-critical — queue failure must not mark the story as failed
    try {
      await enqueueCoverJob({
        storyId: story.id,
        title: generated.title,
        genre: generated.genre,
        prompt: prompt.trim(),
      });
    } catch (err) {
      console.error('[POST /api/stories] cover job enqueue failed (non-critical):', err);
    }
  })();

  return Response.json({ threadId: thread.id }, { status: 201 });
}
