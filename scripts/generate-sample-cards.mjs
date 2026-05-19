#!/usr/bin/env node
/**
 * Generates sample card cover images via the CF cover worker,
 * then seeds (upserts) the sample_cards table in the DB.
 *
 * Run: node scripts/generate-sample-cards.mjs
 *
 * Images are stored in R2 at covers/card-{key}.png.
 * Re-running is safe — R2 checks cache and DB upserts by genre.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

const workerUrl = env.CF_COVER_WORKER_URL;
const apiKey    = env.AI_GATEWAY_API_KEY;
const dbUrl     = env.DATABASE_URL;

if (!workerUrl || !apiKey || !dbUrl) {
  console.error('Missing CF_COVER_WORKER_URL, AI_GATEWAY_API_KEY, or DATABASE_URL in .env.local');
  process.exit(1);
}

const CARD_KEYS = [
  'card-romance',
  'card-rofan',
  'card-fantasy',
  'card-wuxia',
  'card-mystery',
  'card-historical',
  'card-modern-fantasy',
  'card-sf',
];

console.log(`Generating ${CARD_KEYS.length} sample card images (one at a time)...`);
console.log('Each GPT Image 2 call takes ~15–30s.\n');

const cards = [];
for (const key of CARD_KEYS) {
  process.stdout.write(`  ${key} ... `);
  let card;
  try {
    const res = await fetch(`${workerUrl}/sample-cards/${key}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(240_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    card = await res.json();
    console.log(card.imageUrl ? '✓' : '✗ (no image)');
  } catch (err) {
    console.log(`✗ (${err.message}) — skipping`);
    continue;
  }
  cards.push(card);
}

console.log(`\nSeeding DB...`);

const sql = neon(dbUrl);

for (let i = 0; i < cards.length; i++) {
  const card = cards[i];
  await sql`
    INSERT INTO sample_cards (genre, genre_label, title, color, image_url, prompt, display_order, is_active)
    VALUES (
      ${card.genre},
      ${card.genreLabel},
      ${card.title.replace(/\\n/g, '\n')},
      ${card.color},
      ${card.imageUrl},
      ${card.storyPrompt},
      ${i},
      true
    )
    ON CONFLICT (genre)
    DO UPDATE SET
      genre_label   = EXCLUDED.genre_label,
      title         = EXCLUDED.title,
      color         = EXCLUDED.color,
      image_url     = EXCLUDED.image_url,
      prompt        = EXCLUDED.prompt,
      display_order = EXCLUDED.display_order,
      is_active     = EXCLUDED.is_active
  `;
  console.log(`  ✓ ${card.genreLabel} — ${card.title.replace(/\n/g, ' ')}`);
}

console.log('\n✓ Done. Run the app and the cards will load from DB.');
