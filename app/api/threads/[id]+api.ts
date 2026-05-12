import { db } from '@/lib/db/client';
import { threads, stories, chapters } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { eq, and, inArray } from 'drizzle-orm';

function extractThreadId(url: string): string | null {
  const match = url.match(/\/api\/threads\/([^/]+)/);
  return match?.[1] ?? null;
}

export async function GET(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const threadId = extractThreadId(request.url);
  if (!threadId) return Response.json({ error: 'Not found' }, { status: 404 });

  const [row] = await db
    .select({
      threadId: threads.id,
      status: threads.status,
      currentChapter: threads.currentChapter,
      progress: threads.progress,
      lastReadAt: threads.lastReadAt,
      storyId: stories.id,
      title: stories.title,
      slug: stories.slug,
      genre: stories.genre,
      mood: stories.mood,
      coverImageUrl: stories.coverImageUrl,
      estimatedChapters: stories.estimatedChapters,
      description: stories.description,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

  let [chapter] = await db
    .select()
    .from(chapters)
    .where(
      and(
        eq(chapters.threadId, threadId),
        eq(chapters.chapterNumber, row.currentChapter),
      ),
    );

  // Fallback: find the same chapter number from any other thread for this story
  if (!chapter) {
    const storyThreads = await db
      .select({ id: threads.id })
      .from(threads)
      .where(eq(threads.storyId, row.storyId));

    const otherIds = storyThreads.map(t => t.id).filter(id => id !== threadId);

    if (otherIds.length > 0) {
      [chapter] = await db
        .select()
        .from(chapters)
        .where(
          and(
            inArray(chapters.threadId, otherIds),
            eq(chapters.chapterNumber, row.currentChapter),
          ),
        )
        .limit(1);
    }
  }

  return Response.json({ ...row, chapter: chapter ?? null });
}
