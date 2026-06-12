#!/usr/bin/env node
// Remaining illustrated backdrops (#2,3,5,6) matching the locked storybook tone.
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

const SCENES = [
  { name: '2-create-blank-page', scene: 'SCENE: a blank, inviting ivory book page at the center with a single forest-green ink thread just beginning to form and gently curl across it — the quiet moment before a story is written, full of possibility. Soft watercolor blooms and delicate botanical ink framing the edges; the very center stays open and clean.' },
  { name: '3-choice-railway', scene: 'SCENE: a rainy old railway platform at dusk in soft watercolor — warm rose-coral lantern glow against cool blue-gray rain — with a forest-green ink thread that splits into two gently diverging paths, suggesting a moment of choice. Atmospheric and romantic, edges framed, center calm.' },
  { name: '5-worlds-gathered', scene: 'SCENE: several dreamy watercolor worlds gathered like floating illustrated pages — a rainy railway, a teal-and-gold floating city, an indigo old study, a misty forest, a golden desert — all connected by one weaving forest-green ink thread, suggesting many genres and lives. Arranged around the edges so the center-lower stays open.' },
  { name: '6-cta-converge', scene: 'SCENE: a single forest-green ink thread gracefully converging and gathering toward a warm, open book resting at the center-bottom, lit by soft golden-rose light — a calm, inviting, hopeful close. Generous open, glowing space in the upper and middle area.' },
];

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const s of SCENES) {
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
