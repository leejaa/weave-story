export type ParticleItem = {
  label: string;
};

export type GenreParticleSet = {
  centerEmoji: string;
  particles: ParticleItem[];
};

const SYM = ['✦', '◈', '✧', '◇', '❋', '✦', '◈', '✧'];

const GENRE_PARTICLES: Record<string, GenreParticleSet> = {
  romance: {
    centerEmoji: '🌸',
    particles: [
      { label: '💌' }, { label: '🌙' }, { label: '✉️' }, { label: '🌹' },
      { label: '운명' }, { label: '설레임' }, { label: '첫사랑' }, { label: '이별' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  rofan: {
    centerEmoji: '👑',
    particles: [
      { label: '💎' }, { label: '🌹' }, { label: '🏰' }, { label: '🥂' },
      { label: '전생' }, { label: '공작' }, { label: '각성' }, { label: '환생' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  fantasy: {
    centerEmoji: '⚡',
    particles: [
      { label: '⚔️' }, { label: '🏔️' }, { label: '✨' }, { label: '🐉' },
      { label: '각성' }, { label: '마법' }, { label: '용사' }, { label: '소환' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  wuxia: {
    centerEmoji: '🗡️',
    particles: [
      { label: '🌊' }, { label: '🏯' }, { label: '🌄' }, { label: '🍃' },
      { label: '검기' }, { label: '강호' }, { label: '복수' }, { label: '의협' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  mystery: {
    centerEmoji: '🕯️',
    particles: [
      { label: '🔍' }, { label: '🌒' }, { label: '🗝️' }, { label: '🪬' },
      { label: '단서' }, { label: '진실' }, { label: '비밀' }, { label: '음모' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  historical: {
    centerEmoji: '📜',
    particles: [
      { label: '🏯' }, { label: '🌿' }, { label: '⚔️' }, { label: '🪔' },
      { label: '충의' }, { label: '역모' }, { label: '왕실' }, { label: '복수' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  modern_fantasy: {
    centerEmoji: '🌃',
    particles: [
      { label: '👁️' }, { label: '🌀' }, { label: '✨' }, { label: '🌧️' },
      { label: '각성' }, { label: '이계' }, { label: '능력' }, { label: '비밀' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  sf: {
    centerEmoji: '🛸',
    particles: [
      { label: '🌌' }, { label: '⭐' }, { label: '🔭' }, { label: '🤖' },
      { label: '생존' }, { label: '탈출' }, { label: '미래' }, { label: '우주' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  horror: {
    centerEmoji: '🌑',
    particles: [
      { label: '👁️' }, { label: '🌫️' }, { label: '🕸️' }, { label: '🩸' },
      { label: '공포' }, { label: '어둠' }, { label: '저주' }, { label: '탈출' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  action: {
    centerEmoji: '🔥',
    particles: [
      { label: '💥' }, { label: '⚡' }, { label: '🏆' }, { label: '⚔️' },
      { label: '전투' }, { label: '각성' }, { label: '무기' }, { label: '승리' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
  thriller: {
    centerEmoji: '🌀',
    particles: [
      { label: '🔪' }, { label: '🌑' }, { label: '👁️' }, { label: '🪤' },
      { label: '추격' }, { label: '음모' }, { label: '반전' }, { label: '비밀' },
      ...SYM.map((s) => ({ label: s })),
    ],
  },
};

const DEFAULT_SET: GenreParticleSet = {
  centerEmoji: '📖',
  particles: [
    { label: '✨' }, { label: '🌟' }, { label: '💫' }, { label: '🌙' },
    { label: '이야기' }, { label: '선택' }, { label: '운명' }, { label: '여정' },
    ...SYM.map((s) => ({ label: s })),
  ],
};

export function getGenreParticles(genre: string | null | undefined): GenreParticleSet {
  if (!genre) return DEFAULT_SET;
  return GENRE_PARTICLES[genre.toLowerCase()] ?? DEFAULT_SET;
}
