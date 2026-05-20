import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { getAuthUserId } from '@/lib/auth/server';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, avatarUrl: users.avatarUrl, credits: users.credits })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(user);
}
