import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { sampleCards } from '../lib/schema';
import type { AppEnv } from '../types';

export const sampleCardsRouter = new Hono<AppEnv>();

sampleCardsRouter.get('/', async (c) => {
  const db = makeDb(c.env.DATABASE_URL);
  const rows = await db
    .select()
    .from(sampleCards)
    .where(eq(sampleCards.isActive, true))
    .orderBy(asc(sampleCards.displayOrder));

  return c.json(rows);
});
