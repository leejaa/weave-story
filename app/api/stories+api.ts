import { db } from '@/lib/db/client';
import { stories } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(stories)
    .orderBy(asc(stories.createdAt));

  return Response.json(rows);
}
