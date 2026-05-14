#!/usr/bin/env node
/**
 * One-time script to pre-generate sample cover images via the CF cover worker.
 * Run: node scripts/generate-sample-covers.mjs
 *
 * Images are stored in R2 at covers/sample-{key}.png and never regenerated
 * once they exist (the worker checks R2 first).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
const apiKey = env.AI_GATEWAY_API_KEY;

if (!workerUrl || !apiKey) {
  console.error('Missing CF_COVER_WORKER_URL or AI_GATEWAY_API_KEY in .env.local');
  process.exit(1);
}

console.log(`Calling ${workerUrl}/sample ...`);
console.log('(First run generates images via GPT Image 2 — may take ~30s)');

const res = await fetch(`${workerUrl}/sample`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${apiKey}` },
});

if (!res.ok) {
  console.error('Worker error:', res.status, await res.text());
  process.exit(1);
}

const { cards } = await res.json();

console.log('\n✓ Done. Paste this into components/home/sample-card-stack.tsx:\n');
console.log('const SAMPLE_CARDS = [');
cards.forEach(card => {
  console.log(`  {`);
  console.log(`    genre: '${card.genre}',`);
  console.log(`    title: '${card.title.replace(/\n/g, '\\n')}',`);
  console.log(`    color: '${card.color}',`);
  console.log(`    imageUrl: '${card.imageUrl}',`);
  console.log(`  },`);
});
console.log('] as const;');
