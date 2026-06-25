import { eq } from 'drizzle-orm';
import { storyBibles, stories } from '../../schema';
import type { DB } from '../../db';
import type { StoryOutline } from './outline-schema';

// 아웃라인-우선 플로우: 아웃라인에서 story_bibles 필드를 파생해 저장하고, blueprint 컬럼에
// 전체 아웃라인 JSON을 넣는다(다음 화 렌더가 로드해 씀). stories.genre도 일치시킨다.
export async function saveStoryOutline(params: {
  db: DB;
  storyId: string;
  outline: StoryOutline;
}): Promise<void> {
  const o = params.outline;
  const protagonist = o.cast[0]
    ? `${o.cast[0].name} — ${o.cast[0].role} (원하는 것: ${o.cast[0].want})`
    : '주인공';
  const openThreads = o.beats.map((b) => b.plant).filter((p): p is string => !!p).slice(0, 4);
  const canon = `장르: ${o.genre}. 중심 아크: ${o.centralArc.dramaticQuestion}. 척추: ${o.spine}`.slice(0, 800);

  const fields = {
    logline: o.logline,
    genre: o.genre,
    tone: o.tone,
    protagonist,
    centralConflict: o.centralArc.dramaticQuestion,
    readerPromise: o.logline,
    openingThreat: o.beats[0]?.function ?? o.spine,
    openThreads,
    forbiddenPatterns: ['원 설정·장르에 없는 추리/미스터리화 금지', '아웃라인에 없는 고아 떡밥 생성 금지'],
    desire: o.spine,
    wound: null as string | null,
    canon,
    blueprint: o as unknown,
  };

  await params.db
    .insert(storyBibles)
    .values({ storyId: params.storyId, ...fields })
    .onConflictDoUpdate({ target: storyBibles.storyId, set: fields });

  await params.db
    .update(stories)
    .set({ genre: o.genre })
    .where(eq(stories.id, params.storyId));
}
