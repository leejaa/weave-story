// Storyboard panel prompts for the new concept (8 shots, 30s, 9:16).
// Each panel shares the craft + character anchor; only the shot's moment changes.
// Reference look: approved key-visual-v1-01 (A·B muted/given vs C vivid/created).

const CRAFT = `Vertical 9:16 storyboard panel in the style of a contemporary illustrated novel:
transparent watercolor washes, fine expressive ink drawing, subtle paper grain, elegant realistic
adult proportions, hand-painted imperfections, restrained emotion. No text, no UI, no logos, no watermark.`;

const HERO = `The same woman is the only person with a visible face: late twenties, approachable East Asian
features, shoulder-length wavy dark brown hair, an ivory shirt and a deep forest-green cardigan.
She actively creates rather than passively chooses. She holds a forest-green ribbon bookmark.`;

export const STORYBOARD_PROMPTS = {
  S01: `${CRAFT}\n${HERO}\n
SHOT S01 — PAUSE (hook). She stands facing forward in a calm, near-abstract ivory page-like space,
lowest saturation, quiet tension before a choice. She holds the forest-green ribbon in her hands,
not yet used. Generous ivory negative space. Composition centered, slow push-in feel.`,

  S02: `${CRAFT}\n${HERO}\n
SHOT S02 — TWO GIVEN PARALLEL LIVES UNFOLD AT ONCE. To her LEFT and RIGHT, two completely different,
concrete, dramatic life-scenes open simultaneously like two living parallel universes — not the same
place in different weather, but two utterly different situations full of other people and emotion.

LEFT world (a life of dazzling spotlight): a grand golden theater / gala stage, a cheering crowd in
formal wear, warm chandelier light and a bright spotlight, an outstretched hand inviting her up onto
the stage — glamour, fame, applause.

RIGHT world (a life of stormy love and farewell): a rain-lashed night harbor, a great ship pulling
away from the dock, swinging lanterns, a lover on the deck reaching back toward her through the rain —
longing, sacrifice, departure.

Each world is a vivid, cinematic, dramatic tableau with its own distinct people and mood, yet feels
slightly "given/staged" — framed like an open story-page presented to her. From each world a thin
pale forest-green line reaches toward her hands, trying to pull her in. She stands at the CENTER on a
threshold between the two worlds, holding the forest-green ribbon, torn but not yet choosing. Other
characters may appear inside the two worlds; she remains the single consistent face we follow.`,

  S03: `${CRAFT}\n${HERO}\n
SHOT S03 — REFUSAL. Closer on her hands and face, centered. To her LEFT the dazzling golden ballroom
(an inviting hand reaching from the crowd) and to her RIGHT the rainy harbor with the departing ship
(a lover reaching back) — both pull thin pale forest-green lines toward her hands. But she withdraws
both hands and does NOT take either line. The two given worlds pause and begin to recede behind her,
framed like two open story-pages. Her expression is low, steady, and quietly determined.`,

  S04: `${CRAFT}\n${HERO}\n
SHOT S04 — SHE BEGINS TO DRAW. The two given worlds (golden ballroom, rainy harbor) are now pushed
faint to the far edges like two closing story-pages. At the center, the forest-green ribbon in her
hands unspools into a living forest-green ink line, and with her own hand she draws the first glowing
stroke into the open ivory space before her. The green comes alive and luminous — clearly her own
creation, distinct from the two given worlds. Shallow depth on her drawing hand and the ink line.`,

  S05: `${CRAFT}\n${HERO}\n
SHOT S05 — A NEW WORLD BLOOMS. From her hand-drawn forest-green ink line, a third world blooms in
vivid, living full-color watercolor with glowing deep forest-green — far more alive and saturated than
the two muted given worlds. Color and light spread along the line as the world grows. Composition
expands from narrow to wide.`,

  S06: `${CRAFT}\n${HERO}\n
SHOT S06 — PULLED IN / IMMERSION. The vivid created world fills the frame and she is drawn into it,
beginning to live inside the world she made. Sense of being gently pulled forward (dolly-in). Wonder
on her face. The forest-green is richest here.`,

  S07: `${CRAFT}\n${HERO}\n
SHOT S07 — PRODUCT REVEAL. The forest-green ink lines gather and resolve into a single open book /
app-icon-like form, settling into ivory + deep forest-green brand colors. Centered, calm, complete.
No text yet — keep clean negative space around the icon.`,

  S08: `${CRAFT}\n
SHOT S08 — END CARD LAYOUT (no text). The completed open book / app-icon form centered with a thin
forest-green ink underline beneath an empty area, on warm ivory. Leave generous clean negative space
for a headline, app name, CTA, and store badge to be overlaid later. No text, no logos in the image.`,
};
