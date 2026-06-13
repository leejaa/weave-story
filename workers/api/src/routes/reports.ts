import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { contentReports, chapters } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { REPORT_HIDE_THRESHOLD, countDistinctReporters, hideChapter } from '../lib/moderation/enforce';
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

  // Flag the chapter for moderation review (이미 hidden이면 덮어쓰지 않음).
  await db
    .update(chapters)
    .set({ moderationStatus: 'reported' })
    .where(and(eq(chapters.id, chapterId), eq(chapters.moderationStatus, 'ok')));

  console.log(`[reports] chapter=${chapterId} reason=${reason} reporter=${userId}`);

  // 서로 다른 사용자 N명 이상이 신고하면 자동 숨김 + 운영자 알림.
  const reporters = await countDistinctReporters(db, chapterId);
  if (reporters >= REPORT_HIDE_THRESHOLD) {
    c.executionCtx.waitUntil(
      hideChapter(c.env, db, chapterId, {
        source: 'reports',
        detail: `distinct reporters: ${reporters} (threshold ${REPORT_HIDE_THRESHOLD})\nlatest reason: ${reason}`,
      }),
    );
  }

  return c.json({ ok: true });
});
