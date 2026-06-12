// Upload localized iPhone 6.7" screenshots to App Store Connect for en-US/ja/ko,
// then delete the old 6.5" set. Apple's 3-step asset flow: reserve -> PUT bytes
// -> commit (uploaded + md5 checksum).
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { asc, ascToken, APP_ID } from './asc-lib.mjs';

const SHOTS = new URL('./screenshots/out/', import.meta.url);
const ORDER = ['01-setup', '02-choice', '03-read', '04-home', '05-library'];
const FILE_LOCALE = { 'en-US': 'en', ja: 'ja', ko: 'ko', 'zh-Hant': 'zh-Hant' };
const LOCALES = ['en-US', 'ja', 'ko', 'zh-Hant'];
// App Store display types -> our screenshot file prefix
const DISPLAYS = [
  { type: 'APP_IPHONE_67', prefix: 'ios' },          // 1290x2796
  { type: 'APP_IPAD_PRO_3GEN_129', prefix: 'ipad' }, // 2048x2732
];

async function rawPut(op, bytes) {
  const headers = {};
  for (const h of op.requestHeaders || []) headers[h.name] = h.value;
  const slice = bytes.subarray(op.offset, op.offset + op.length);
  const r = await fetch(op.url, { method: op.method, headers, body: slice });
  if (!r.ok) throw new Error(`upload op ${op.url.slice(0, 60)} -> ${r.status} ${await r.text()}`);
}

async function uploadScreenshot(setId, file, bytes) {
  const fileName = file;
  const reserve = await asc('POST', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: bytes.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } },
    },
  });
  const shotId = reserve.data.id;
  const ops = reserve.data.attributes.uploadOperations || [];
  for (const op of ops) await rawPut(op, bytes);
  const md5 = crypto.createHash('md5').update(bytes).digest('hex');
  await asc('PATCH', `/v1/appScreenshots/${shotId}`, {
    data: { type: 'appScreenshots', id: shotId, attributes: { uploaded: true, sourceFileChecksum: md5 } },
  });
  return shotId;
}

// Target the editable (in-preparation) version, not a live READY_FOR_SALE one.
const EDITABLE = ['PREPARE_FOR_SUBMISSION', 'READY_FOR_DISTRIBUTION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'WAITING_FOR_REVIEW'];
const allVers = (await asc('GET', `/v1/apps/${APP_ID}/appStoreVersions?limit=10`)).data;
const v = allVers.find(x => EDITABLE.includes(x.attributes.appStoreState)) || allVers[0];
const vl = await asc('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale&limit=50`);
const byLoc = Object.fromEntries(vl.data.map(d => [d.attributes.locale, d.id]));

console.log(`target version ${v.attributes.versionString} (${v.attributes.appStoreState})`);

for (const loc of LOCALES) {
  const locId = byLoc[loc];
  if (!locId) { console.log(`! no localization for ${loc}, skipping`); continue; }

  for (const disp of DISPLAYS) {
    // remove any existing set of this display type (clean re-run)
    const sets = await asc('GET', `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?limit=50`);
    for (const s of sets.data) {
      if (s.attributes.screenshotDisplayType === disp.type) {
        await asc('DELETE', `/v1/appScreenshotSets/${s.id}`);
        console.log(`  [${loc}/${disp.type}] removed existing set`);
      }
    }

    const set = await asc('POST', '/v1/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: disp.type },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: locId } } },
      },
    });
    const setId = set.data.id;
    const shotIds = [];
    for (const ord of ORDER) {
      const file = `${disp.prefix}-${FILE_LOCALE[loc]}-${ord}.png`;
      const bytes = readFileSync(new URL(file, SHOTS));
      shotIds.push(await uploadScreenshot(setId, file, bytes));
      process.stdout.write(`  [${loc}/${disp.prefix}] + ${ord}\n`);
    }
    // pin display order
    await asc('PATCH', `/v1/appScreenshotSets/${setId}/relationships/appScreenshots`, {
      data: shotIds.map(id => ({ type: 'appScreenshots', id })),
    });
    console.log(`  [${loc}/${disp.type}] set complete (${shotIds.length})`);
  }
}

console.log('screenshots done.');
