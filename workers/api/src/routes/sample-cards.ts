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
      .select({ genre: samplePrompts.genre, body: samplePrompts.body })
      .from(samplePrompts)
      .where(and(eq(samplePrompts.lang, lang), eq(samplePrompts.isActive, true)))
      .orderBy(asc(samplePrompts.genre), asc(samplePrompts.sortOrder)),
  ]);

  const poolByGenre = new Map<string, string[]>();
  for (const p of prompts) {
    const list = poolByGenre.get(p.genre) ?? [];
    list.push(p.body);
    poolByGenre.set(p.genre, list);
  }

  const rows = cards.map((card) => {
    const pool = poolByGenre.get(card.genre);
    return { ...card, prompts: pool && pool.length > 0 ? pool : [card.prompt] };
  });

  return c.json(rows);
});
