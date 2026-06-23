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

// The KIND of event a chapter should deliver. The arc phase (above) controls pacing/escalation;
// this rotates the *type* of beat so consecutive chapters don't all feel like the same scene
// (the "every chapter floats in place" failure). Per-language guides map each beat to a hint.
export type EventBeat =
  | 'confrontation'
  | 'revelation'
  | 'externalThreat'
  | 'allianceShift'
  | 'reversal'
  | 'costSurfaces';

const EVENT_BEAT_CYCLE: EventBeat[] = [
  'confrontation',
  'revelation',
  'externalThreat',
  'allianceShift',
  'reversal',
  'costSurfaces',
];

// Rotates through the beat cycle by chapter number. Chapter 1 isn't routed here (it has its own
// opening template), so the cycle is anchored on the continuation chapters.
export function chapterEventBeat(chapterNumber: number): EventBeat {
  const idx = ((chapterNumber - 2) % EVENT_BEAT_CYCLE.length + EVENT_BEAT_CYCLE.length) % EVENT_BEAT_CYCLE.length;
  return EVENT_BEAT_CYCLE[idx];
}

// Hook accounting — ORTHOGONAL to EventBeat (which controls scene texture). This controls
// whether a chapter may open a new loop or must close one, fixing the monotonic pile-up:
// every chapter used to be REQUIRED to leave a new hook with no symmetric requirement to
// resolve one. Per-language builders map each directive to a localized instruction.
//   - plant_ok  : early game — a new hook is allowed (but must still develop the story).
//   - payoff_due: must clearly RESOLVE ≥1 open loop in the body; a new hook only after that.
//   - converge  : late game — NO new hooks, only resolve.
export type HookDirective = 'plant_ok' | 'payoff_due' | 'converge';

export function hookDirective(
  chapterNumber: number,
  totalChapters: number,
  openLoopCount: number,
): HookDirective {
  const progress = totalChapters > 0 ? chapterNumber / totalChapters : 1;
  if (progress > 0.8) return 'converge';
  // Force a payoff on a ~3-chapter cadence, or whenever loops have built up, or past the
  // midpoint — so the middle stops being pure accumulation.
  if (openLoopCount >= 5 || progress > 0.45 || chapterNumber % 3 === 0) return 'payoff_due';
  return 'plant_ok';
}
