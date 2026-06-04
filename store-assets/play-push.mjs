// Push en-US / ja-JP / ko-KR store listings + phone screenshots to Google Play
// via the Android Publisher API, then commit. Reads copy from store-copy.json
// and images from screenshots/out/android-<locale>-*.png.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const HOME = process.env.HOME;
const sa = JSON.parse(readFileSync(`${HOME}/Downloads/weave-story-498307-7037201e6747.json`, 'utf8'));
const copy = JSON.parse(readFileSync(new URL('./store-copy.json', import.meta.url))).play;
const PKG = 'com.leejahun.weavestory';
const SHOTS_DIR = new URL('./screenshots/out/', import.meta.url);

const b64u = (b) => Buffer.from(b).toString('base64url');
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const s = crypto.createSign('RSA-SHA256').update(`${h}.${c}`).sign(sa.private_key).toString('base64url');
  return `${h}.${c}.${s}`;
}
async function token() {
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt() }) });
  const j = await r.json();
  if (!j.access_token) throw new Error('token: ' + JSON.stringify(j));
  return j.access_token;
}

const AT = await token();
const H = { Authorization: `Bearer ${AT}` };
const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const upbase = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;

async function jreq(method, url, body) {
  const r = await fetch(url, { method, headers: { ...H, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${t}`);
  return t ? JSON.parse(t) : {};
}

// locale code in the store -> screenshot file prefix
const FILE_LOCALE = { 'en-US': 'en', 'ja-JP': 'ja', 'ko-KR': 'ko' };
const SHOT_ORDER = ['01-choice', '02-setup', '03-read', '04-home', '05-library'];

const edit = await jreq('POST', `${base}/edits`);
const eid = edit.id;
console.log('edit:', eid);

for (const [lang, listing] of Object.entries(copy)) {
  // 1) listing text
  await jreq('PUT', `${base}/edits/${eid}/listings/${lang}`, {
    language: lang,
    title: listing.title,
    shortDescription: listing.shortDescription,
    fullDescription: listing.fullDescription,
  });
  console.log(`listing set: ${lang}`);

  // 2) phone screenshots — clear then upload 5
  await fetch(`${base}/edits/${eid}/listings/${lang}/phoneScreenshots`, { method: 'DELETE', headers: H });
  for (const ord of SHOT_ORDER) {
    const file = new URL(`android-${FILE_LOCALE[lang]}-${ord}.png`, SHOTS_DIR);
    const bytes = readFileSync(file);
    const r = await fetch(`${upbase}/edits/${eid}/listings/${lang}/phoneScreenshots?uploadType=media`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'image/png' }, body: bytes,
    });
    if (!r.ok) throw new Error(`upload ${lang} ${ord} -> ${r.status} ${await r.text()}`);
    process.stdout.write(`  + ${lang} ${ord}\n`);
  }
}

// 3) validate then commit
await jreq('POST', `${base}/edits/${eid}:validate`);
console.log('validated ✓');
const committed = await jreq('POST', `${base}/edits/${eid}:commit`);
console.log('committed ✓', JSON.stringify(committed));
