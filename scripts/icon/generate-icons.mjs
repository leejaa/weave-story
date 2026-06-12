#!/usr/bin/env node
// One-off: generate app-icon concept samples with GPT Image 2 via AI Gateway.
// Saves PNGs locally; upload to Blob is done separately. Not committed.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';
import { loadEnvFile } from '../ads/lib/load-env-file.mjs';

const MODEL = 'openai/gpt-image-2';
const OUTPUT_DIR = resolve('store-assets/icon/generated');

const BASE = `Design a premium, minimalist mobile app icon for "Weave Story", a literary AI interactive-novel app.
COLOR: a single deep forest-green (#2d5a3d) mark on a warm ivory cream (#FEF9F1) flat background.
STYLE: refined, elegant, contemporary, high-craft editorial. Clean confident vector strokes with subtle hand-drawn warmth. Generous balanced negative space. Instantly readable at small sizes.
RULES: no text, no letters, no words, no numbers. Full-bleed square background filling the entire frame edge to edge — do NOT draw a rounded-corner badge, border, or inner frame (the OS rounds the corners). Centered, single iconic symbol.`;

const ICONS = [
  {
    name: 'A1-thread-flow',
    symbol: 'SYMBOL: one single continuous flowing thread / ink line that loops and weaves elegantly into a calm, balanced form, suggesting a story being woven from one unbroken line.',
  },
  {
    name: 'A2-woven-knot',
    symbol: 'SYMBOL: a few fine threads interlacing into one small, elegant woven knot at the center — restrained and graceful, like a single point where stories cross.',
  },
  {
    name: 'B-refined-branch',
    symbol: 'SYMBOL: a refined branching line that splits gently into two or three paths, with tiny rounded dots at the branch tips — drawn as fine, confident, slightly organic strokes (a story splitting into choices). Much more elegant and intentional than a clip-art tree.',
  },
  {
    name: 'C-book-thread',
    symbol: 'SYMBOL: a softly stylized open book from which a single thread of ink flows upward and curls into a graceful loop — blending reading and weaving into one quiet mark.',
  },
  {
    name: 'D-monogram-W',
    symbol: 'SYMBOL: an elegant monogram of the letter W formed from a single continuous woven thread or ribbon with a subtle over-under weave, as a refined logographic mark.',
  },
];

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=/path/to/.env.local).');
  process.exit(1);
}

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const icon of ICONS) {
  const out = resolve(OUTPUT_DIR, `icon-${icon.name}.png`);
  process.stdout.write(`Generating ${icon.name}... `);
  try {
    const { image, warnings } = await generateImage({
      model: gateway.imageModel(MODEL),
      prompt: `${BASE}\n${icon.symbol}`,
      size: '1024x1024',
    });
    await writeFile(out, image.uint8Array);
    console.log(`saved (${image.uint8Array.byteLength} bytes)${warnings?.length ? ' [warnings]' : ''}`);
  } catch (err) {
    console.log(`FAILED: ${String(err).slice(0, 120)}`);
  }
}
console.log(`\nDone → ${OUTPUT_DIR}`);
