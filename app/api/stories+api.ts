import { db } from '@/lib/db/client';
import { stories, threads, chapters } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { generateFirstChapter } from '@/lib/ai/story-generation';
import { enqueueCoverJob } from '@/lib/queue/cover-queue';
import { eq, asc } from 'drizzle-orm';

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

  if (!prompt?.trim()) {
    return Response.json({ error: 'prompt required' }, { status: 400 });
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

  // Fire-and-forget — generate first chapter in background
  ;(async () => {
    try {
      const generated = await generateFirstChapter({ prompt: prompt.trim(), estimatedChapters });

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

      // Enqueue cover image generation — runs independently in CF Worker
      await enqueueCoverJob({
        storyId: story.id,
        title: generated.title,
        genre: generated.genre,
        prompt: prompt.trim(),
      });
    } catch (err) {
      console.error('[POST /api/stories] background generation failed:', err);
      await db
        .update(chapters)
        .set({ status: 'failed' })
        .where(eq(chapters.id, pendingChapter.id));
      await db
        .update(stories)
        .set({ status: 'failed' })
        .where(eq(stories.id, story.id));
    }
  })();

  return Response.json({ threadId: thread.id }, { status: 201 });
}
