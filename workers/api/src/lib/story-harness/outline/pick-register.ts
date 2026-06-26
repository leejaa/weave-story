import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import { genreProfiles } from '../../schema';
import type { DB } from '../../db';

// 장르별 "정서 레지스터". DB(genre_profiles)에서 로드 → 생성 시 하나를 골라
// emotionalCore·톤·템플릿·렌더·judge의 기준으로 쓴다.
export type GenreRegister = {
  id: string;
  genre: string;
  registerName: string;
  emotionalCore: string;
  touchstones: string[];
  onMoves: string[];
  offMoves: string[];
};

export type RegisterPickMode = 'fit' | 'random';

const asArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export async function loadRegisters(db: DB, genre: string): Promise<GenreRegister[]> {
  const rows = await db
    .select()
    .from(genreProfiles)
    .where(and(eq(genreProfiles.genre, genre), eq(genreProfiles.isActive, true)))
    .orderBy(asc(genreProfiles.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    genre: r.genre,
    registerName: r.registerName,
    emotionalCore: r.emotionalCore,
    touchstones: asArr(r.touchstones),
    onMoves: asArr(r.onMoves),
    offMoves: asArr(r.offMoves),
  }));
}

// 그 장르의 활성 레지스터 중 하나를 선택. 0개 → null, 1개 → 그대로,
// 여러개 → mode에 따라 LLM 적합 선택(기본) 또는 랜덤. 비치명적(실패 시 첫 번째).
export async function pickRegister(params: {
  db: DB;
  apiKey: string;
  genre: string;
  premise: string;
  mode?: RegisterPickMode;
}): Promise<GenreRegister | null> {
  const { db, apiKey, genre, premise, mode = 'fit' } = params;
  const registers = await loadRegisters(db, genre);
  if (registers.length === 0) return null;
  if (registers.length === 1) return registers[0];

  if (mode === 'random') {
    return registers[Math.floor(Math.random() * registers.length)];
  }

  // fit: 전제에 가장 어울리는 레지스터를 haiku로 1회 선택.
  try {
    const gateway = createGateway({ apiKey });
    const list = registers
      .map((r, i) => `${i}. ${r.registerName} — ${r.emotionalCore}`)
      .join('\n');
    const { output } = await generateText({
      model: gateway('anthropic/claude-haiku-4-5-20251001'),
      system: 'Pick the ONE emotional register whose feeling best fits the premise. Reply with its index only.',
      prompt: `Premise:\n${premise}\n\nRegisters:\n${list}`,
      maxOutputTokens: 200,
      output: Output.object({ schema: z.object({ index: z.number().int().min(0).max(registers.length - 1) }) }),
    });
    return registers[output.index] ?? registers[0];
  } catch {
    return registers[0];
  }
}
