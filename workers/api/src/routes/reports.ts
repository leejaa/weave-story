import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { contentReports, chapters, threads } from '../lib/schema';
import { requireAuth } from '../lib/auth/middleware';
import { REPORT_HIDE_THRESHOLD, countDistinctReporters, hideChapter } from '../lib/moderation/enforce';
import { isUuid } from '../lib/validation';
import type { AppEnv } from '../types';

const VALID_REASONS = new Set(['sexual', 'violence', 'hate', 'illegal', 'other']);

export const reportsRouter = new Hono<AppEnv>();

reportsRouter.use(requireAuth);

// Report objectionable AI-generated content (Apple Guideline 1.2 / UGC).
reportsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json() as { chapterId?: unknown; reason?: unknown; detail?: unknown };
  const { chapterId, reason, detail } = body;

  if (!isUuid(chapterId) || typeof reason !== 'string' || !VALID_REASONS.has(reason)) {
    return c.json({ error: 'chapterId and a valid reason are required' }, 400);
  }

  const db = makeDb(c.env.DATABASE_URL);

  // 본인 소유 챕터만 신고 가능(스토리는 비공개) — 타 유저 콘텐츠 숨김 악용 방지.
  const [chapter] = await db
    .select({ id: chapters.id })
    .from(chapters)
    .innerJoin(threads, eq(chapters.threadId, threads.id))
    .where(and(eq(chapters.id, chapterId), eq(threads.userId, userId)));
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

  // 비공개 콘텐츠라 소유자 신고 1건이면 자동 숨김 + 운영자 알림(임계값 1).
  const reporters = await countDistinctReporters(db, chapterId);
  if (reporters >= REPORT_HIDE_THRESHOLD) {
    c.executionCtx.waitUntil(
      hideChapter(c.env, db, chapterId, {
        source: 'reports',
        detail: `reporters: ${reporters} (threshold ${REPORT_HIDE_THRESHOLD})\nlatest reason: ${reason}`,
      }),
    );
  }

  return c.json({ ok: true });
});
