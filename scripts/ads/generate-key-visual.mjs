#!/usr/bin/env node
// 새 콘셉트(주어진 A·B 거부 → 직접 C 창조) 대표 Key Visual 생성.
// 출력: store-assets/ads/generated/key-visual/key-visual-v{N}-{take}.png
// 사용: ENV_FILE=~/repos/agent-bot/.env.local KV_VERSION=v1 KV_TAKE=01 node scripts/ads/generate-key-visual.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { generateImage } from 'ai';
import { loadEnvFile } from './lib/load-env-file.mjs';
import { KEY_VISUAL_PROMPTS } from './prompts/key-visual-prompts.mjs';

const MODEL = 'openai/gpt-image-2';
const VERSION = process.env.KV_VERSION ?? 'v1';
const TAKE = process.env.KV_TAKE ?? '01';
const OUTPUT_DIR = resolve('store-assets/ads/generated/key-visual');
const OUTPUT_PATH = resolve(OUTPUT_DIR, `key-visual-${VERSION}-${TAKE}.png`);

await loadEnvFile(process.env.ENV_FILE);
const prompt = KEY_VISUAL_PROMPTS[VERSION];

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}
if (!prompt) {
  console.error(`Unknown key visual prompt version: ${VERSION}`);
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

if (warnings?.length > 0) console.warn('Generation warnings:', warnings);
console.log(`Saved ${OUTPUT_PATH} (${image.uint8Array.byteLength} bytes).`);
