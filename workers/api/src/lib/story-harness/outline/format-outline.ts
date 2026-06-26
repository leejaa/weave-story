import type { StoryOutline, OutlineBeat } from './outline-schema';

// 아웃라인을 프롬프트 블록으로 렌더. 구조 라벨은 중립 영어, 값은 이미 스토리 언어(생성 시).

// n화의 비트(서수 매핑). 범위를 벗어나면 마지막 비트로 클램프.
export function beatForChapter(outline: StoryOutline, chapterNumber: number): OutlineBeat | null {
  if (!outline.beats?.length) return null;
  const byIndex = outline.beats.find((b) => b.index === chapterNumber);
  if (byIndex) return byIndex;
  const i = Math.min(Math.max(chapterNumber, 1), outline.beats.length) - 1;
  return outline.beats[i] ?? null;
}

// 매 화 항상 주입되는 불변 척추(중심 미스터리 + spine + 인물/관계).
export function formatOutlineSpine(outline: StoryOutline): string {
  const lines: string[] = [];
  // 심장 — 매 화 이 정서/메시지를 전달하도록 가장 먼저 박는다. (레거시 아웃라인엔 없을 수 있어 가드)
  if (outline.emotionalCore?.feeling) {
    lines.push(`- EMOTIONAL CORE (deliver THIS every chapter; the whole story serves it): feeling=${outline.emotionalCore.feeling} | message=${outline.emotionalCore.message}`);
  }
  lines.push(
    `- tone/feel to hold (stay in this register; do NOT drift to mystery/thriller dread or secret-hunting unless the genre is mystery): ${outline.tone}`,
    `- genre (locked): ${outline.genre}`,
    `- logline: ${outline.logline}`,
    `- spine (protagonist's active goal — every chapter serves this): ${outline.spine}`,
    `- central arc (the ONE goal/question the whole story is about — advance it, do NOT turn it into a mystery/investigation unless the genre is mystery): ${outline.centralArc.dramaticQuestion}`,
    `- arc throughline (INTERNAL — how it develops; reveal only what this chapter's beat needs, never dump): ${outline.centralArc.throughline}`,
  );
  if (outline.causalAnchors?.length) {
    lines.push(`- CAUSAL ANCHORS (the established "why"s behind the major hooks/decisions — stay consistent with these and keep them convincing; never contradict them): ${outline.causalAnchors.map((a) => `· ${a.hook} ⇐ ${a.why}`).join(' | ')}`);
  }
  if (outline.worldRules?.length) {
    lines.push(`- WORLD RULES (the few hard facts; never contradict; do NOT add new ones): ${outline.worldRules.map(r => `· ${r}`).join(' ')}`);
  }
  if (outline.cast?.length) {
    lines.push(`- cast: ${outline.cast.map((c) => `${c.name}(${c.role}; wants: ${c.want}${c.secret ? `; secret: ${c.secret}` : ''})`).join(' | ')}`);
  }
  if (outline.relationships?.length) {
    lines.push(`- relationships: ${outline.relationships.map((r) => `${r.between}: ${r.dynamic} → ${r.arc}`).join(' | ')}`);
  }
  return lines.join('\n');
}

// 이번 화가 달성해야 할 기능 비트.
export function formatBeat(beat: OutlineBeat): string {
  const lines = [
    `- this chapter's FUNCTION (accomplish this; the reader's chosen action is the ROUTE to it): ${beat.function}`,
    `- advance the central arc one step: ${beat.arcAdvance}`,
    `- move the PROTAGONIST'S own stake: ${beat.protagonistStake}`,
  ];
  if (beat.payoff) lines.push(`- pay off this earlier thread: ${beat.payoff}`);
  if (beat.plant) lines.push(`- you may plant this (only if it connects to the central web): ${beat.plant}`);
  return lines.join('\n');
}

// 마지막 화: 누적 선택 성향(leanings)으로 결말 하나를 고르도록.
export function formatEndings(outline: StoryOutline, leanings: string): string {
  return [
    `[Accumulated reader leanings]\n${leanings || '(없음/중립)'}`,
    '[Choose ONE ending that the accumulated leanings point to, and bring the story to a close on it]',
    ...outline.endings.map((e) => `- (${e.id}) when ${e.condition}: ${e.shape}`),
  ].join('\n');
}
