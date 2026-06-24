import { eq } from 'drizzle-orm';
import { plotStructures } from '../../schema';
import type { DB } from '../../db';

// 플롯 구조 템플릿(골격). 아웃라인 생성기가 이 골격을 받아 작품별 비트 시트로 인스턴스화한다.
export type PlotStructureTemplate = {
  name: string;
  description: string;
  beats: { function: string; purpose: string; pacing: string }[];
  endingShapes: { shape: string; condition: string }[];
};

// 장르에 맞는 활성 템플릿 중 하나를 랜덤 픽. 호환 템플릿이 없으면 활성 전체에서 랜덤.
// 랜덤은 인덱스 기반(스크립트 호출 시점에 무작위) — 다양성 확보. 없으면 null.
export async function pickStructureTemplate(
  db: DB,
  genre: string,
): Promise<PlotStructureTemplate | null> {
  const rows = await db
    .select({
      name: plotStructures.name,
      description: plotStructures.description,
      applicableGenres: plotStructures.applicableGenres,
      beats: plotStructures.beats,
      endingShapes: plotStructures.endingShapes,
    })
    .from(plotStructures)
    .where(eq(plotStructures.isActive, true));

  if (!rows.length) return null;

  const matches = rows.filter((r) => {
    const genres = Array.isArray(r.applicableGenres) ? (r.applicableGenres as string[]) : [];
    return genres.includes('ANY') || genres.includes(genre);
  });
  const pool = matches.length ? matches : rows;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  return {
    name: pick.name,
    description: pick.description,
    beats: Array.isArray(pick.beats) ? (pick.beats as PlotStructureTemplate['beats']) : [],
    endingShapes: Array.isArray(pick.endingShapes) ? (pick.endingShapes as PlotStructureTemplate['endingShapes']) : [],
  };
}
