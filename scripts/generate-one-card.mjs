#!/usr/bin/env node
/**
 * Generates a single sample card image directly (bypassing the CF Worker).
 * Uses: @ai-sdk/gateway + wrangler r2 object put
 *
 * Usage: node scripts/generate-one-card.mjs <card-key>
 * Example: node scripts/generate-one-card.mjs card-historical
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { createGateway } from '@ai-sdk/gateway';
import { generateImage } from 'ai';
import { neon } from '@neondatabase/serverless';

const envPath = resolve(process.cwd(), '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const R2_PUBLIC_URL = env.R2_PUBLIC_URL || 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev';
const R2_BUCKET = 'weave-story-media';

const CARDS = {
  'card-historical': {
    genre: 'HISTORICAL',
    genreLabel: '역사극',
    title: '조선의\n여자 포도청',
    color: '#0f2010',
    storyPrompt: '조선 시대, 신분을 숨기고 포도청에 들어간 여인. 사대부 가문의 연쇄 실종 사건을 쫓다 왕실의 깊은 음모에 발을 들이게 된다.',
    imagePrompt: 'Book cover illustration. Joseon dynasty Seoul night, stone lanterns, a woman in dark hanbok, ornate palace gate, historical drama. Painterly, deep jade and ink, no text.',
  },
};

const key = process.argv[2];
if (!key || !CARDS[key]) {
  console.error(`Usage: node scripts/generate-one-card.mjs <key>`);
  console.error(`Available keys: ${Object.keys(CARDS).join(', ')}`);
  process.exit(1);
}

const card = CARDS[key];
console.log(`Generating image for ${card.genreLabel} (${key})...`);

const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });
const { image } = await generateImage({
  model: gateway.imageModel('openai/gpt-image-2'),
  prompt: card.imagePrompt,
  size: '1024x1024',
});

console.log(`Image generated (${image.uint8Array.byteLength} bytes). Uploading to R2...`);

const tmpFile = `/tmp/${key}.png`;
writeFileSync(tmpFile, image.uint8Array);

try {
  execSync(
    `npx wrangler r2 object put ${R2_BUCKET}/covers/${key}.png --file ${tmpFile} --content-type image/png --remote`,
    { stdio: 'inherit' },
  );
} finally {
  unlinkSync(tmpFile);
}

const imageUrl = `${R2_PUBLIC_URL}/covers/${key}.png`;
console.log(`\nUploaded: ${imageUrl}`);

console.log('Updating DB...');
const sql = neon(env.DATABASE_URL);
await sql`
  UPDATE sample_cards
  SET image_url = ${imageUrl}
  WHERE genre = ${card.genre}
`;
console.log(`✓ Done — ${card.genreLabel} image updated.`);
