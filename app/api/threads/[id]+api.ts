import { db } from '@/lib/db/client';
import { threads, stories, chapters } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { eq, and, asc } from 'drizzle-orm';

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
      genre: stories.genre,
      mood: stories.mood,
      coverImageUrl: stories.coverImageUrl,
      estimatedChapters: stories.estimatedChapters,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

  const allChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.threadId, threadId))
    .orderBy(asc(chapters.chapterNumber));

  return Response.json({ ...row, chapters: allChapters });
}
