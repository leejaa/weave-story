// Update Google Play store listing text (title/short/full) for all locales from
// store-copy.json. GET-merge-PUT to preserve any existing trailer video, then commit.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const HOME = process.env.HOME;
const sa = JSON.parse(readFileSync(`${HOME}/Downloads/weave-story-498307-7037201e6747.json`, 'utf8'));
const play = JSON.parse(readFileSync(new URL('./store-copy.json', import.meta.url))).play;
const PKG = 'com.leejahun.weavestory';

const b64u = (b) => Buffer.from(b).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const c = b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
const s = crypto.createSign('RSA-SHA256').update(`${h}.${c}`).sign(sa.private_key).toString('base64url');
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${c}.${s}` }) })).json();
const AT = tok.access_token;
if (!AT) throw new Error('token: ' + JSON.stringify(tok));
const H = { Authorization: `Bearer ${AT}`, 'Content-Type': 'application/json' };
const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;

async function j(method, url, body) {
  const r = await fetch(url, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${t}`);
  return t ? JSON.parse(t) : {};
}

const edit = await j('POST', `${base}/edits`);
const eid = edit.id;
console.log('edit', eid);

for (const [lang, copy] of Object.entries(play)) {
  // 기존 리스팅을 읽어 video 등 보존.
  let existing = {};
  try { existing = await j('GET', `${base}/edits/${eid}/listings/${lang}`); } catch { /* 신규 로케일이면 없음 */ }
  const body = {
    language: lang,
    title: copy.title,
    shortDescription: copy.shortDescription,
    fullDescription: copy.fullDescription,
    ...(existing.video ? { video: existing.video } : {}),
  };
  await j('PUT', `${base}/edits/${eid}/listings/${lang}`, body);
  console.log(`✓ listing updated: ${lang}`);
}

await j('POST', `${base}/edits/${eid}:validate`);
console.log('✓ validated');
const committed = await j('POST', `${base}/edits/${eid}:commit`);
console.log('✓ committed', JSON.stringify(committed));
