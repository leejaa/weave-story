import { db } from '@/lib/db/client';
import { threads, stories, chapters } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { eq, desc, ne, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      threadId: threads.id,
      status: threads.status,
      currentChapter: threads.currentChapter,
      progress: threads.progress,
      lastReadAt: threads.lastReadAt,
      storyId: stories.id,
      title: stories.title,
      genre: stories.genre,
      mood: stories.mood,
      coverImageUrl: stories.coverImageUrl,
      estimatedChapters: stories.estimatedChapters,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(eq(threads.userId, userId))
    .orderBy(desc(threads.lastReadAt));

  return Response.json(rows);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { storyId } = await request.json();
  if (!storyId) return Response.json({ error: 'storyId required' }, { status: 400 });

  const [thread] = await db
    .insert(threads)
    .values({ userId, storyId })
    .returning();

  // Copy chapter 1 from any existing thread for this story so the user has a starting point
  const [sourceThread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(and(eq(threads.storyId, storyId), ne(threads.id, thread.id)))
    .limit(1);

  if (sourceThread) {
    const [ch1] = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.threadId, sourceThread.id), eq(chapters.chapterNumber, 1)))
      .limit(1);

    if (ch1) {
      await db.insert(chapters).values({
        threadId: thread.id,
        chapterNumber: 1,
        title: ch1.title,
        content: ch1.content,
        imageUrl: ch1.imageUrl,
        options: ch1.options as any,
      });
    }
  }

  return Response.json(thread, { status: 201 });
}
