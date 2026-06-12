#!/usr/bin/env node
// Micro-variations of tone #3 (ivory line on ink-black) to converge on a final icon.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';
import { loadEnvFile } from '../ads/lib/load-env-file.mjs';

const MODEL = 'openai/gpt-image-2';
const OUTPUT_DIR = resolve('store-assets/icon/generated/3-refine');

const BASE = `Design a refined, premium mobile app icon for "Weave Story", a literary AI interactive-novel app.
CENTERED SINGLE MARK: an upright quill / feather pen with a delicate double-helix braided thread spiralling gently up around it, rising gracefully from a small open book at the base — one continuous, elegant fine-line illustration with subtle hand-drawn warmth and balanced negative space.
STYLE: editorial, high-craft, contemporary, instantly readable at small sizes.
RULES: no text, no letters, no words, no numbers. Full-bleed square background filling the entire frame edge to edge — do NOT draw a rounded-corner badge, border, or inner frame.`;

const VARIANTS = [
  { name: '1-cleaner', spec: 'COLOR: soft ivory cream line on a deep near-black charcoal (#1c1c1a) background. REFINE: cleaner, more refined and confident even line work; slightly more open, graceful book.' },
  { name: '2-bolder', spec: 'COLOR: soft ivory cream line on a deep near-black charcoal (#1c1c1a) background. REFINE: slightly bolder, thicker line weight so the mark stays crisp and legible at very small sizes.' },
  { name: '3-gold-thread', spec: 'COLOR: ivory cream quill and book, with the braided spiralling thread rendered in warm antique gold, on a deep near-black charcoal (#1c1c1a) background — an elegant two-tone accent.' },
  { name: '4-green-thread', spec: 'COLOR: ivory cream quill and book, with the braided spiralling thread rendered in deep forest green (#2d5a3d), on a deep near-black charcoal (#1c1c1a) background — a subtle brand accent.' },
  { name: '5-warm-charcoal', spec: 'COLOR: warm ivory line on a warm deep charcoal (#1a1816, very dark warm grey-black) background — softer and more premium than pure black.' },
  { name: '6-minimal', spec: 'COLOR: soft ivory cream line on a deep near-black charcoal (#1c1c1a) background. REFINE: more minimal and iconic — reduce the quill and book to their essential elegant lines, less internal detail, maximum clarity, balance and breathing room.' },
];

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const v of VARIANTS) {
  const out = resolve(OUTPUT_DIR, `r3-${v.name}.png`);
  process.stdout.write(`Generating ${v.name}... `);
  try {
    const { image } = await generateImage({
      model: gateway.imageModel(MODEL),
      prompt: `${BASE}\n${v.spec}`,
      size: '1024x1024',
    });
    await writeFile(out, image.uint8Array);
    console.log('saved');
  } catch (err) {
    console.log(`FAILED: ${String(err).slice(0, 120)}`);
  }
}
console.log(`\nDone → ${OUTPUT_DIR}`);
