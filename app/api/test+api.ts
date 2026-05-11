import { db } from '@/lib/db/client';
import { testItems } from '@/lib/db/schema';

export async function GET() {
  const items = await db.select().from(testItems);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const [item] = await db.insert(testItems).values({ name }).returning();
  return Response.json({ item }, { status: 201 });
}
