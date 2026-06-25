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

  // 장르가 미스터리/스릴러 계열이 아니면 수사·추리·복수 골격 템플릿을 배제한다.
  // (따뜻한/일상/로맨스 전제가 "회귀 복수 아크" 같은 골격에 걸려 수사물로 변질되는 것 방지.)
  const isMysteryGenre = /MYSTERY|THRILLER|CRIME|미스터리|추리|스릴러|범죄/i.test(genre);
  const INVESTIGATION_RE = /복수|수사|추리|범인|미스터리|whodunit|revenge|mystery|detective|investigat/i;
  const nonInvestigation = matches.filter((r) => !INVESTIGATION_RE.test(`${r.name} ${r.description}`));
  const fit = isMysteryGenre ? matches : (nonInvestigation.length ? nonInvestigation : matches);

  const pool = fit.length ? fit : rows;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  return {
    name: pick.name,
    description: pick.description,
    beats: Array.isArray(pick.beats) ? (pick.beats as PlotStructureTemplate['beats']) : [],
    endingShapes: Array.isArray(pick.endingShapes) ? (pick.endingShapes as PlotStructureTemplate['endingShapes']) : [],
  };
}
