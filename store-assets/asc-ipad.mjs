// Replace the iPad 12.9" (APP_IPAD_PRO_3GEN_129) screenshots for en-US/ja/ko
// with the new design, pulling the version from review first and resubmitting.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { asc, APP_ID } from './asc-lib.mjs';

const SHOTS = new URL('./screenshots/out/', import.meta.url);
const ORDER = ['01-choice', '02-setup', '03-read', '04-home', '05-library'];
const FILE_LOCALE = { 'en-US': 'en', ja: 'ja', ko: 'ko' };
const DISPLAY = 'APP_IPAD_PRO_3GEN_129';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function rawPut(op, bytes) {
  const headers = {};
  for (const h of op.requestHeaders || []) headers[h.name] = h.value;
  const r = await fetch(op.url, { method: op.method, headers, body: bytes.subarray(op.offset, op.offset + op.length) });
  if (!r.ok) throw new Error(`upload op -> ${r.status} ${await r.text()}`);
}
async function uploadShot(setId, file, bytes) {
  const reserve = await asc('POST', '/v1/appScreenshots', {
    data: { type: 'appScreenshots', attributes: { fileName: file, fileSize: bytes.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } } },
  });
  const id = reserve.data.id;
  for (const op of reserve.data.attributes.uploadOperations || []) await rawPut(op, bytes);
  const md5 = crypto.createHash('md5').update(bytes).digest('hex');
  await asc('PATCH', `/v1/appScreenshots/${id}`, { data: { type: 'appScreenshots', id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
  return id;
}

async function versionState() {
  return (await asc('GET', `/v1/apps/${APP_ID}/appStoreVersions?limit=1`)).data[0];
}

// 1) pull from review
let v = await versionState();
console.log('start state:', v.attributes.appStoreState);
if (v.attributes.appStoreState === 'WAITING_FOR_REVIEW' || v.attributes.appStoreState === 'IN_REVIEW') {
  try {
    const sub = await asc('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionSubmission`);
    if (sub.data?.id) { await asc('DELETE', `/v1/appStoreVersionSubmissions/${sub.data.id}`); console.log('deleted submission ✓'); }
  } catch (e) { console.log('submission delete note:', String(e).slice(0, 120)); }
  for (let i = 0; i < 6; i++) { await sleep(2000); v = await versionState(); if (!['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(v.attributes.appStoreState)) break; }
  console.log('state after pull:', v.attributes.appStoreState);
}

// 2) replace iPad set per locale
const vl = await asc('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale&limit=50`);
const byLoc = Object.fromEntries(vl.data.map(d => [d.attributes.locale, d.id]));
for (const loc of ['en-US', 'ja', 'ko']) {
  const locId = byLoc[loc];
  if (!locId) { console.log(`! no localization ${loc}`); continue; }
  const sets = await asc('GET', `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?limit=50`);
  for (const s of sets.data) if (s.attributes.screenshotDisplayType === DISPLAY) { await asc('DELETE', `/v1/appScreenshotSets/${s.id}`); console.log(`  [${loc}] removed old iPad set`); }
  const set = await asc('POST', '/v1/appScreenshotSets', {
    data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: DISPLAY },
      relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: locId } } } },
  });
  const ids = [];
  for (const ord of ORDER) {
    const file = `ipad-${FILE_LOCALE[loc]}-${ord}.png`;
    ids.push(await uploadShot(set.data.id, file, readFileSync(new URL(file, SHOTS))));
    process.stdout.write(`  [${loc}] + ${ord}\n`);
  }
  await asc('PATCH', `/v1/appScreenshotSets/${set.data.id}/relationships/appScreenshots`, { data: ids.map(id => ({ type: 'appScreenshots', id })) });
  console.log(`  [${loc}] iPad set done (${ids.length})`);
}

// 3) resubmit
const created = await asc('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: APP_ID } } } } });
const subId = created.data.id;
await asc('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: subId } }, appStoreVersion: { data: { type: 'appStoreVersions', id: v.id } } } } });
await asc('PATCH', `/v1/reviewSubmissions/${subId}`, { data: { type: 'reviewSubmissions', id: subId, attributes: { submitted: true } } });
const after = await versionState();
console.log('RESUBMITTED ✓ state:', after.attributes.appStoreState);
