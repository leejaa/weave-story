// Shared App Store Connect API helper (ES256 JWT + fetch wrappers).
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

export const KEY_ID = 'L4FDH4F6HZ';
export const ISSUER = '095b3013-dde2-4c38-aa44-f05c10a33a93';
export const APP_ID = '6771166873';
const PEM = readFileSync(new URL('../.secrets/AuthKey_L4FDH4F6HZ.p8', import.meta.url), 'utf8');

const b64u = (b) => Buffer.from(b).toString('base64url');

export function ascToken() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const p = b64u(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 1000, aud: 'appstoreconnect-v1' }));
  const sig = crypto.createSign('SHA256').update(`${h}.${p}`).sign({ key: PEM, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${h}.${p}.${sig}`;
}

const BASE = 'https://api.appstoreconnect.apple.com';

export async function asc(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${ascToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${text}`);
  return text ? JSON.parse(text) : {};
}
