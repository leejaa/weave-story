#!/usr/bin/env node
// Sample illustrated backdrops for the storybook-immersive App Store screenshots (direction C).
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';
import { loadEnvFile } from '../ads/lib/load-env-file.mjs';

const MODEL = 'openai/gpt-image-2';
const OUTPUT_DIR = resolve('store-assets/screenshots/bg-generated');

const BASE = `A vertical (portrait) atmospheric BACKDROP illustration for a premium literary app's App Store screenshot.
MEDIUM: soft transparent watercolor washes with fine forest-green ink line work and subtle hand-painted paper texture — a contemporary illustrated-novel, dreamy and refined.
PALETTE: warm ivory cream (#FEF9F1) base, deep forest-green (#2d5a3d) ink thread as the through-line.
COMPOSITION (critical): keep the UPPER THIRD calm, soft and uncluttered (a headline will sit there), and leave gentle, open negative space in the CENTER-LOWER area (a phone mockup will be placed there). The illustration frames the edges and breathes in the middle.
RULES: no text, no letters, no words, no UI, no phone, no device, no frame border. Just the painterly world.`;

const SAMPLES = [
  { name: '1-hook-thread-worlds', scene: 'SCENE: a single delicate forest-green ink thread rises and branches gently into three faint, dreamy glimpses of different lives blooming from one page — a rose-coral rainy railway platform, a teal-and-gold floating city, and an indigo-and-sepia old study — all softly watercolored and connected by the one thread.' },
  { name: '4-immersion-floating-city', scene: 'SCENE: a vast teal-and-gold floating city drifting across soft watercolor mist and clouds, seen from a calm distance — immersive, wondrous, with a thin forest-green ink thread weaving through the air toward it.' },
];

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const s of SAMPLES) {
  const out = resolve(OUTPUT_DIR, `bg-${s.name}.png`);
  process.stdout.write(`Generating ${s.name}... `);
  try {
    const { image } = await generateImage({
      model: gateway.imageModel(MODEL),
      prompt: `${BASE}\n${s.scene}`,
      size: '1024x1536',
    });
    await writeFile(out, image.uint8Array);
    console.log('saved');
  } catch (err) {
    console.log(`FAILED: ${String(err).slice(0, 140)}`);
  }
}
console.log(`\nDone → ${OUTPUT_DIR}`);
