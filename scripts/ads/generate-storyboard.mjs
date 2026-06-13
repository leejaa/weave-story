#!/usr/bin/env node
// 새 콘셉트 스토리보드 패널 생성(숏 단위).
// 출력: store-assets/ads/generated/storyboard/storyboard-{SHOT}-{take}.png
// 사용: ENV_FILE=~/repos/agent-bot/.env.local SB_SHOT=S01 SB_TAKE=01 node scripts/ads/generate-storyboard.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGateway } from '@ai-sdk/gateway';
import { generateImage } from 'ai';
import { loadEnvFile } from './lib/load-env-file.mjs';
import { STORYBOARD_PROMPTS } from './prompts/storyboard-prompts.mjs';

const MODEL = 'openai/gpt-image-2';
const SHOT = process.env.SB_SHOT ?? 'S01';
const TAKE = process.env.SB_TAKE ?? '01';
const OUTPUT_DIR = resolve('store-assets/ads/generated/storyboard');
const OUTPUT_PATH = resolve(OUTPUT_DIR, `storyboard-${SHOT}-${TAKE}.png`);

await loadEnvFile(process.env.ENV_FILE);
const prompt = STORYBOARD_PROMPTS[SHOT];

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}
if (!prompt) {
  console.error(`Unknown storyboard shot: ${SHOT}`);
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
