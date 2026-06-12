#!/usr/bin/env node
// Color-tone variations of the A1 icon concept (quill + book + braided thread).
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';
import { loadEnvFile } from '../ads/lib/load-env-file.mjs';

const MODEL = 'openai/gpt-image-2';
const OUTPUT_DIR = resolve('store-assets/icon/generated/a1-tones');

const COMPOSITION = `Design a refined, minimalist mobile app icon for "Weave Story", a literary AI interactive-novel app.
CENTERED SINGLE MARK: an upright quill / feather pen with a delicate double-helix braided thread spiralling gently up around it, rising gracefully from a small open book at the base — drawn as one continuous, elegant fine-line illustration with subtle hand-drawn warmth and balanced negative space.
STYLE: premium, editorial, high-craft, contemporary. Instantly readable at small sizes.
RULES: no text, no letters, no words, no numbers. Full-bleed square background filling the entire frame edge to edge — do NOT draw a rounded-corner badge, border, or inner frame.`;

const TONES = [
  { name: '1-inverted-green', color: 'COLOR: warm ivory cream (#FEF9F1) line art on a deep forest-green (#2d5a3d) solid background. Calm, premium, inverted.' },
  { name: '2-green-gold', color: 'COLOR: warm antique-gold line art on a deep forest-green (#22432f) solid background. Luxe and literary.' },
  { name: '3-ink-cream', color: 'COLOR: soft ivory line art on a deep near-black charcoal (#1c1c1a) solid background. Sophisticated, high contrast.' },
  { name: '4-espresso-cream', color: 'COLOR: cream line art on a rich, deep espresso-brown (#3a2a20) solid background. Cozy and bookish.' },
  { name: '5-navy-gold', color: 'COLOR: muted soft-gold line art on a deep indigo-navy (#1e2a3a) solid background. Quiet and elegant.' },
  { name: '6-burgundy-cream', color: 'COLOR: warm cream line art on a deep muted burgundy / oxblood (#4a2329) solid background. Warm, classic, literary.' },
];

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const tone of TONES) {
  const out = resolve(OUTPUT_DIR, `a1-${tone.name}.png`);
  process.stdout.write(`Generating ${tone.name}... `);
  try {
    const { image } = await generateImage({
      model: gateway.imageModel(MODEL),
      prompt: `${COMPOSITION}\n${tone.color}`,
      size: '1024x1024',
    });
    await writeFile(out, image.uint8Array);
    console.log('saved');
  } catch (err) {
    console.log(`FAILED: ${String(err).slice(0, 120)}`);
  }
}
console.log(`\nDone → ${OUTPUT_DIR}`);
