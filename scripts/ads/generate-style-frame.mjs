#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { generateImage } from 'ai';
import { loadEnvFile } from './lib/load-env-file.mjs';
import { STYLE_FRAME_PROMPTS } from './prompts/style-frame-prompts.mjs';

const MODEL = 'openai/gpt-image-2';
const PROMPT_VERSION = process.env.STYLE_FRAME_PROMPT_VERSION ?? 'v2';
const TAKE_NUMBER = process.env.STYLE_FRAME_TAKE ?? '01';
const OUTPUT_DIR = resolve('store-assets/ads/generated/style-frame');
const OUTPUT_PATH = resolve(
  OUTPUT_DIR,
  `style-frame-${PROMPT_VERSION}-${TAKE_NUMBER}.png`,
);

await loadEnvFile(process.env.ENV_FILE);
const prompt = STYLE_FRAME_PROMPTS[PROMPT_VERSION];

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY in the process environment.');
  process.exit(1);
}

if (!prompt) {
  console.error(`Unknown style frame prompt version: ${PROMPT_VERSION}`);
  process.exit(1);
}

console.log(`Generating ${OUTPUT_PATH} with ${MODEL}...`);

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
const { image, warnings } = await generateImage({
  model: gateway.imageModel(MODEL),
  prompt,
  size: '1024x1536',
});

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(OUTPUT_PATH, image.uint8Array);

if (warnings.length > 0) {
  console.warn('Generation warnings:', warnings);
}

console.log(`Saved ${OUTPUT_PATH} (${image.uint8Array.byteLength} bytes).`);
