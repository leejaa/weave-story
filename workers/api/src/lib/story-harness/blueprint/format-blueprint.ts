import type { StoryBlueprint, BlueprintArc } from './blueprint-schema';

// Render the blueprint into model-readable prompt blocks. Following the formatStoryState
// precedent: structural labels are neutral English (the model reads them fine), VALUES are
// already in the story's language. Per-language builders add the localized section header.

export function formatBlueprintSpine(bp: StoryBlueprint): string {
  return [
    `- spine (protagonist's core active goal, fixed): ${bp.spine}`,
    `- central question (the whole story answers this): ${bp.centralQuestion}`,
    `- ending direction: ${bp.endingDirection}`,
  ].join('\n');
}

export function formatGenreLock(bp: StoryBlueprint): string {
  const lines = [`- genre (LOCKED — do not drift): ${bp.genre}`];
  if (bp.genreConventions?.length) lines.push(`- conventions to keep: ${bp.genreConventions.join('; ')}`);
  if (bp.avoid?.length) lines.push(`- avoid: ${bp.avoid.join('; ')}`);
  return lines.join('\n');
}

// Pick the arc whose progress range contains `progress`; fall back to the nearest by midpoint.
export function currentArc(bp: StoryBlueprint, progress: number): BlueprintArc | null {
  if (!bp.arcs?.length) return null;
  const inRange = bp.arcs.find(a => progress >= a.fromProgress && progress <= a.toProgress);
  if (inRange) return inRange;
  return bp.arcs.reduce((best, a) => {
    const mid = (a.fromProgress + a.toProgress) / 2;
    const bestMid = (best.fromProgress + best.toProgress) / 2;
    return Math.abs(mid - progress) < Math.abs(bestMid - progress) ? a : best;
  });
}

export function formatArc(arc: BlueprintArc): string {
  const lines = [`- this chapter's arc goal: ${arc.goal}`];
  if (arc.plant) lines.push(`- hook this arc may PLANT: ${arc.plant}`);
  if (arc.payoff) lines.push(`- hook this arc must PAY OFF: ${arc.payoff}`);
  return lines.join('\n');
}
