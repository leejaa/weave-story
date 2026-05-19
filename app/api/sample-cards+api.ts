import { db } from '@/lib/db/client';
import { sampleCards } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  const rows = await db
    .select()
    .from(sampleCards)
    .where(eq(sampleCards.isActive, true))
    .orderBy(asc(sampleCards.displayOrder));

  return Response.json(rows);
}
