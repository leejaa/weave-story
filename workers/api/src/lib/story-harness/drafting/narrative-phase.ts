// Maps a chapter's position within the planned arc to a 기승전결 (setup → rising → turn →
// resolution → final) phase. The per-language prompt builders use this to give the model
// pacing guidance for *this* chapter's role in the whole story, instead of only a raw
// "chapter N / M" number — which otherwise leaves the middle saggy and crams the entire
// climax + resolution into the final chapter (an abrupt "cliff" rather than an arc).
export type NarrativePhase = 'setup' | 'rising' | 'turn' | 'resolution' | 'final';

/**
 * Phase boundaries by progress = chapterNumber / totalChapters:
 *   setup ≤ 0.25 < rising ≤ 0.55 < turn ≤ 0.80 < resolution < 1.0, and the last chapter = final.
 */
export function narrativePhase(chapterNumber: number, totalChapters: number): NarrativePhase {
  if (totalChapters <= 1 || chapterNumber >= totalChapters) return 'final';
  const progress = chapterNumber / totalChapters;
  if (progress <= 0.25) return 'setup';
  if (progress <= 0.55) return 'rising';
  if (progress <= 0.8) return 'turn';
  return 'resolution';
}
