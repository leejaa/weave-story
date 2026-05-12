import { db } from '@/lib/db/client';
import { threads, stories, chapters, interventions } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { eq, and } from 'drizzle-orm';

function extractThreadId(url: string): string | null {
  const match = url.match(/\/api\/threads\/([^/]+)\/choose/);
  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const threadId = extractThreadId(request.url);
  if (!threadId) return Response.json({ error: 'Not found' }, { status: 404 });

  const { chapterNumber, choiceIndex } = await request.json();
  if (typeof chapterNumber !== 'number' || typeof choiceIndex !== 'number') {
    return Response.json({ error: 'chapterNumber and choiceIndex required' }, { status: 400 });
  }

  const [threadRow] = await db
    .select({
      id: threads.id,
      currentChapter: threads.currentChapter,
      estimatedChapters: stories.estimatedChapters,
    })
    .from(threads)
    .innerJoin(stories, eq(threads.storyId, stories.id))
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)));

  if (!threadRow) return Response.json({ error: 'Not found' }, { status: 404 });
  if (threadRow.currentChapter !== chapterNumber) {
    return Response.json({ error: 'Chapter mismatch' }, { status: 409 });
  }

  await db.insert(interventions).values({
    threadId,
    chapterNumber,
    type: 'choice',
    choiceIndex,
  });

  const nextChapterNumber = chapterNumber + 1;
  const [nextChapter] = await db
    .select()
    .from(chapters)
    .where(
      and(
        eq(chapters.threadId, threadId),
        eq(chapters.chapterNumber, nextChapterNumber),
      ),
    );

  const isLast = nextChapterNumber > threadRow.estimatedChapters;
  const newProgress = Math.min(
    (nextChapterNumber - 1) / threadRow.estimatedChapters,
    1,
  ).toFixed(3);
  const newStatus = isLast || !nextChapter ? 'completed' : 'active';

  const [updatedThread] = await db
    .update(threads)
    .set({
      currentChapter: nextChapterNumber,
      progress: newProgress,
      lastReadAt: new Date(),
      status: newStatus,
      ...(newStatus === 'completed' ? { finishedAt: new Date() } : {}),
    })
    .where(eq(threads.id, threadId))
    .returning({
      currentChapter: threads.currentChapter,
      progress: threads.progress,
      status: threads.status,
    });

  return Response.json({ chapter: nextChapter ?? null, thread: updatedThread });
}
