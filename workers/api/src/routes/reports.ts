import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { contentReports, chapters } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import type { AppEnv } from '../types';

const VALID_REASONS = new Set(['sexual', 'violence', 'hate', 'illegal', 'other']);

export const reportsRouter = new Hono<AppEnv>();

reportsRouter.use(requireAuth);

// Report objectionable AI-generated content (Apple Guideline 1.2 / UGC).
reportsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json() as { chapterId?: unknown; reason?: unknown; detail?: unknown };
  const { chapterId, reason, detail } = body;

  if (typeof chapterId !== 'string' || typeof reason !== 'string' || !VALID_REASONS.has(reason)) {
    return c.json({ error: 'chapterId and a valid reason are required' }, 400);
  }

  const db = makeDb(c.env.DATABASE_URL);

  const [chapter] = await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.id, chapterId));
  if (!chapter) return c.json({ error: 'Chapter not found' }, 404);

  await db.insert(contentReports).values({
    reporterUserId: userId,
    chapterId,
    reason,
    detail: typeof detail === 'string' && detail.trim() ? detail.trim().slice(0, 1000) : null,
  });

  // Flag the chapter for moderation review.
  await db.update(chapters).set({ moderationStatus: 'reported' }).where(eq(chapters.id, chapterId));

  console.log(`[reports] chapter=${chapterId} reason=${reason} reporter=${userId}`);
  return c.json({ ok: true });
});
