import { Hono } from 'hono';
import { and, asc, eq } from 'drizzle-orm';
import { makeDb } from '../lib/db';
import { sampleCards, samplePrompts } from '../lib/schema';
import { normalizeStoryLang } from '../lib/ai/story-lang';
import type { AppEnv } from '../types';

export const sampleCardsRouter = new Hono<AppEnv>();

// 샘플카드 + 카드별 랜덤 프롬프트 풀. 프롬프트는 DB(sample_prompts)가 단일 소스이며
// ?lang 으로 언어를 고른다(미지정/미지원 → en). 카드에 해당 언어 풀이 없으면 카드 기본
// prompt 하나로 폴백한다. 클라는 응답의 prompts[] 에서 탭마다 랜덤 1개를 고른다.
sampleCardsRouter.get('/', async (c) => {
  const db = makeDb(c.env.DATABASE_URL);
  const lang = normalizeStoryLang(c.req.query('lang'));

  const [cards, prompts] = await Promise.all([
    db
      .select()
      .from(sampleCards)
      .where(eq(sampleCards.isActive, true))
      .orderBy(asc(sampleCards.displayOrder)),
    db
      .select({ genre: samplePrompts.genre, title: samplePrompts.title, body: samplePrompts.body })
      .from(samplePrompts)
      .where(and(eq(samplePrompts.lang, lang), eq(samplePrompts.isActive, true)))
      .orderBy(asc(samplePrompts.genre), asc(samplePrompts.sortOrder)),
  ]);

  // 장르별 {title, body} 쌍 풀. 제목은 body와 한 쌍이며, 없으면(구 데이터) 카드 기본 제목으로 폴백.
  const poolByGenre = new Map<string, { title: string | null; body: string }[]>();
  for (const p of prompts) {
    const list = poolByGenre.get(p.genre) ?? [];
    list.push({ title: p.title ?? null, body: p.body });
    poolByGenre.set(p.genre, list);
  }

  const rows = cards.map((card) => {
    const pool = poolByGenre.get(card.genre) ?? [];
    const samples = pool.length > 0
      ? pool.map((s) => ({ title: s.title ?? card.title, body: s.body }))
      : [{ title: card.title, body: card.prompt }];
    // prompts[]는 구버전 클라 호환용(본문만). samples[]는 신버전(제목+본문 쌍).
    return { ...card, samples, prompts: samples.map((s) => s.body) };
  });

  return c.json(rows);
});
