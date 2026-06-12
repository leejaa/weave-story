#!/usr/bin/env node
// Final candidates: gold-thread accent (concept 3) + clean bold lines (concept 2).
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';
import { loadEnvFile } from '../ads/lib/load-env-file.mjs';

const MODEL = 'openai/gpt-image-2';
const OUTPUT_DIR = resolve('store-assets/icon/generated/final');

const BASE = `Design the final, premium mobile app icon for "Weave Story", a literary AI interactive-novel app.
CENTERED SINGLE MARK: an upright quill / feather pen with a delicate double-helix thread spiralling gently up around it, rising gracefully from a small open book at the base.
COLOR: the quill and the open book are drawn in soft ivory cream; the spiralling thread is warm antique gold; all on a deep near-black charcoal (#1c1c1a) background — an elegant two-tone accent where the gold thread is the eye-catching highlight.
RULES: no text, no letters, no words, no numbers. Full-bleed square background filling the entire frame edge to edge — do NOT draw a rounded-corner badge, border, or inner frame. Designed to stay crisp and legible at very small sizes.`;

const VARIANTS = [
  { name: '1-bold-clean', spec: 'EXECUTION: confident, slightly bold and very clean line work (not thin/fragile); refined and balanced; minimal internal clutter so it reads instantly at small sizes.' },
  { name: '2-elegant', spec: 'EXECUTION: elegant fine-line illustration with graceful curves and a beautifully detailed feather, premium editorial craft, balanced negative space.' },
  { name: '3-flat-icon', spec: 'EXECUTION: flatter, more iconic and simplified — reduce shading and detail, treat it as a clean two-tone logo mark, maximum clarity and silhouette strength.' },
  { name: '4-prominent-gold', spec: 'EXECUTION: confident clean lines; make the gold spiralling thread a touch thicker and more prominent so the gold weave is the clear focal accent against the ivory quill.' },
];

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const v of VARIANTS) {
  const out = resolve(OUTPUT_DIR, `final-${v.name}.png`);
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
