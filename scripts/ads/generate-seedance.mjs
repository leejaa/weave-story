#!/usr/bin/env node
// 스토리보드 키프레임(blob URL) → Seedance i2v 영상 클립 생성.
// 출력: store-assets/ads/generated/video/clip-{SHOT}.mp4
// 사용: ENV_FILE=~/repos/agent-bot/.env.local SB_SHOT=S01 node scripts/ads/generate-seedance.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { experimental_generateVideo as generateVideo } from 'ai';
import { loadEnvFile } from './lib/load-env-file.mjs';

const MODEL = 'bytedance/seedance-v1.5-pro';
const DURATION = Number(process.env.SB_DURATION ?? 5);
const SHOT = process.env.SB_SHOT ?? 'S01';
const OUTPUT_DIR = resolve('store-assets/ads/generated/video');

// 승인된 스토리보드 패널 blob URL (키프레임)
const KEYFRAMES = {
  S01: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S01-01-dLKp6j1fVE0EJTlElb57hbjcQ6Avvz.png',
  S02: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/kf-S02-JHCxryr5OBgWZZLgFNpquxr52LMuYJ.png',
  S03: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S03-01-i3VWh2RZPUayXmFDwxB9ih6Kj8vaEX.png',
  S04: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S04-01-b0W19Pkmcpvh9m9rEIzuIjvgAucEw3.png',
  S05: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S05-01-i60H9iAu7o7aA4zQNOHs56QlS9NDvL.png',
  S06: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S06-01-mmxbxL8xkRSqlfQdKSqIA8721fp2tb.png',
  S07: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S07-01-ObYt7vrubNK2IpHqNbSMgCEiomK38N.png',
  S08: 'https://1enydyathth4pu27.public.blob.vercel-storage.com/ads/storyboard-S08-01-ARoyseDSZhFKJ7hPsuUQUyNxVlt3iz.png',
};

// 숏별 움직임 프롬프트 (동작 + 카메라). 작화는 키프레임이 고정하므로 모션만 지시.
const MOTION = {
  S01: 'Subtle and calm. Very slow gentle push-in. The woman breathes softly and the forest-green ribbon in her hands sways slightly. Faint watercolor shimmer. Quiet, contemplative. No new objects appear.',
  S02: 'The two parallel worlds gently come alive at once: on the left, warm chandelier light flickers and the formal crowd sways; on the right, rain falls and the ship lanterns swing as the ship drifts. Thin pale lines drift toward her hands. She glances between the two worlds. Soft painterly watercolor motion.',
  S03: 'She slowly withdraws both raised hands, refusing the two pale lines reaching toward her. The two worlds pause and gently recede. Calm, steady, determined. Minimal camera movement.',
  S04: 'The forest-green ribbon unspools and becomes a glowing ink line as she draws it forward with her hand. Tiny pine trees and watercolor bloom along the drawn line. The green glows and comes alive. Gentle, focused motion.',
  S05: 'From her drawn ink line a vivid green world blooms outward: mountains, flowing waterfalls, opening blossoms, drifting birds. Color and light spread richly across the page. Camera slowly widens. A sense of wonder.',
  S06: 'Slow dolly forward, as if being drawn into the vivid green world she created. Her hair and clothes flutter gently; waterfalls and light move around her. Immersive, awe-struck. Continuous forward motion.',
  S07: 'The forest-green ink lines gather and resolve into a single open book and app icon, settling calmly into place with a soft glow. Gentle settle, camera steadies to center.',
  S08: 'Calm hold. The book and icon glow softly with a subtle shimmer; gentle watercolor drift in the background. Serene and still, leaving open space.',
};

await loadEnvFile(process.env.ENV_FILE);
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error('Missing AI_GATEWAY_API_KEY (pass ENV_FILE=...).');
  process.exit(1);
}
const image = KEYFRAMES[SHOT];
const text = MOTION[SHOT];
if (!image || !text) { console.error('Unknown shot:', SHOT); process.exit(1); }

console.log(`Generating ${SHOT} clip (${DURATION}s) with ${MODEL}...`);
const t0 = Date.now();
const result = await generateVideo({
  model: MODEL,
  prompt: { image, text },
  duration: DURATION,
  providerOptions: { bytedance: { pollTimeoutMs: 900000, watermark: false } },
});

await mkdir(OUTPUT_DIR, { recursive: true });
const out = resolve(OUTPUT_DIR, `clip-${SHOT}.mp4`);
await writeFile(out, result.videos[0].uint8Array);
console.log(`Saved ${out} (${result.videos[0].uint8Array.byteLength} bytes) in ${Math.round((Date.now()-t0)/1000)}s.`);
if (result.warnings?.length) console.warn('warnings:', result.warnings);
