# Secrets, Env & Credentials — Source of Truth

Last updated: 2026-06-04

> **No secret VALUES live in this file.** It records *what* each secret is, *where*
> it lives, and *how to regenerate it* if a local machine is lost. The real
> disaster-recovery insurance is (a) all runtime secrets are on Cloudflare, and
> (b) the regeneration runbook below.

## TL;DR recovery posture

- **Production is self-sufficient.** Every secret the deployed Worker needs is set
  as a **Cloudflare Worker secret** (encrypted at rest). If this laptop dies, the
  live app keeps working.
- **Cloudflare secrets are write-only** — you cannot export their values. So a few
  local-only items (the signing key *files* and `JWT_SECRET`'s value) can't be
  "downloaded back". They are all **regenerable** (see runbook) — losing them means
  rotating, not permanent loss.
- Keep the irreplaceable **key files** (`.p8`, Play SA `.json`) in a password
  manager / secure vault as well.
- A **private R2 backup** of the key files + `.env.local` also exists (§F).

---

## A. Cloudflare Worker secrets (`weave-story-api`)

Set via `cd workers/api && npx wrangler secret put <NAME>`. List names with
`npx wrangler secret list`. **All required secrets below are currently set ✓.**

| Secret | Purpose | Regenerate from |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection (prod branch) | Neon console → project `weavy-story` → Connection string |
| `JWT_SECRET` | Signs app session JWTs | Rotate: generate random, `wrangler secret put` (invalidates existing sessions) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway (story generation) | Vercel AI Gateway dashboard → new key |
| `CF_COVER_WORKER_URL` | Cover-image worker endpoint | Internal URL (non-secret-ish) |
| `APPLE_IAP_KEY_ID` / `APPLE_IAP_ISSUER_ID` / `APPLE_IAP_PRIVATE_KEY` | App Store Server API (verify iOS purchases) | ASC → Users and Access → Integrations → In-App Purchase key (new `.p8`) |
| `GOOGLE_PLAY_SA_CLIENT_EMAIL` / `GOOGLE_PLAY_SA_PRIVATE_KEY` | Play Developer API (verify Android purchases) | GCP → service account `play-publisher@weave-story-498307` → new JSON key |
| `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID` | Google Sign-In token verification | GCP project `weave-story-496101` → OAuth clients |
| `DEMO_LOGIN_CODE` | Review-only demo login (`/api/auth/demo`) | Any chosen code; rotate freely |
| `REVENUECAT_SECRET_KEY` | RevenueCat REST API | RevenueCat dashboard → API keys |

**Sign in with Apple revocation** (set 2026-06-04): `APPLE_SIGNIN_TEAM_ID` =
`UYGG4AXKH5`, `APPLE_SIGNIN_KEY_ID` = `GTT3835T92`, `APPLE_SIGNIN_PRIVATE_KEY` =
contents of the "Sign in with Apple" key `~/Downloads/AuthKey_GTT3835T92.p8`
(also in R2 backup `asc-keys/`). Used to revoke Apple tokens on account deletion
(Guideline 5.1.1(v)). Regenerate: developer.apple.com → Keys → new key with
Sign in with Apple enabled for App ID `com.leejahun.weavestory`.

**Non-secret Worker vars** (`workers/api/wrangler.toml [vars]`): `USE_STORY_HARNESS="true"`.

---

## B. Local files (NOT in git — `.secrets/` and `*.p8` are gitignored)

| File | What | If lost |
|---|---|---|
| `.secrets/AuthKey_L4FDH4F6HZ.p8` | ASC API key **L4FDH4F6HZ** (App Manager) — used by store-listing scripts & EAS | Regenerate in ASC → Integrations; revoke old |
| `~/Downloads/AuthKey_TN83PW567A.p8` | ASC API key **TN83PW567A** (App Manager, "Screenshot Upload") | same |
| `~/Downloads/weave-story-498307-7037201e6747.json` | Play **service-account** JSON key (Android Publisher) | GCP → SA → new key |
| `.secrets/fcm-v1-service-account.json` | **FCM V1** service-account key (Firebase `weave-story-app`) — Android push; uploaded to EAS | Firebase console → `weave-story-app` → Project settings → Service accounts → Generate new private key |
| `.secrets/AuthKey_D7J7X6ZD28.p8` | **APNs** auth key **D7J7X6ZD28** (Sandbox & Production, Team Scoped) — iOS push; uploaded to EAS push key | developer.apple.com → Keys → new key with APNs (downloadable once); max 2 APNs keys/account |
| `google-services.json` (repo root, **committed**) | Firebase Android config (sender id) — embedded in build via `android.googleServicesFile` | `firebase apps:sdkconfig ANDROID <appId> --project weave-story-app` |
| `.env.local` | Local dev env (see §C) | Recreate from this doc + consoles |

> **Recommendation:** copy the three key files into a password manager / secure
> vault. They are regenerable but having a backup avoids the round-trip.

---

## C. `.env.local` (local dev only)

`EXPO_PUBLIC_*` values are **public** (shipped in the client bundle). The rest
mirror Worker secrets for local `wrangler dev`.

Public (safe to recreate from consoles):
- `EXPO_PUBLIC_API_URL` = `https://weave-story-api.leejahun0.workers.dev`
- `EXPO_PUBLIC_SENTRY_DSN` = Sentry project DSN
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = GCP OAuth client IDs (project `weave-story-496101`, number `857705716385`)

Secret mirrors (also in Cloudflare): `AI_GATEWAY_API_KEY`, `DATABASE_URL`,
`JWT_SECRET`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID`, `CF_COVER_WORKER_URL`,
`REVENUECAT_SECRET_KEY`.

EAS build/runtime env is managed separately via `eas env` (profile `development`/`production`).

---

## D. Account & resource identifiers (non-secret — the real recovery keys)

| Thing | Value |
|---|---|
| Bundle / package id | `com.leejahun.weavestory` |
| App Store Connect app id | `6771166873` |
| ASC API issuer id | `095b3013-dde2-4c38-aa44-f05c10a33a93` |
| ASC API keys (role) | `L4FDH4F6HZ` (App Manager), `TN83PW567A` (App Manager), `7FSD2K8YN9` (Admin/EAS), `24TH9PJCKY` & `WRSN9DTHRT` (RevenueCat) |
| Google Play service account | `play-publisher@weave-story-498307.iam.gserviceaccount.com` (GCP project `weave-story-498307`) |
| Play **developer** account (active) | `8687266146434394437` (개인/personal), owner **leejahun9@gmail.com** — Chrome account index `/u/2/`. App id `4975060960175249342`. Closed-test track "Alpha" `4699889486794816408`. |
| Play dev account (terminated, ignore) | `8563905342234584322` owned by `leejahun0@gmail.com` — terminated 2026-01-23, unrelated to this app |
| GCP OAuth project | `weave-story-496101` (number `857705716385`) |
| Android OAuth client SHA-1 (Play app signing) | `D4:2C:84:5B:0C:79:B1:BE:92:F3:EE:DE:4F:64:45:3C:71:83:8E:AD` |
| Firebase project (Android push / FCM V1) | `weave-story-app` (project number `56897545987`), owner **leejahun0@gmail.com**. Android app id `1:56897545987:android:e6f8508ca3a80c0b54eb36`. |
| iOS Push (APNs) | Bundle id `com.leejahun.weavestory` has **Push Notifications** capability enabled (bundleId res `WD7G98ZV7A`); provisioning profile regenerated → `J5S8462XRC`. APNs **auth key D7J7X6ZD28** (Sandbox & Production) uploaded as the EAS push key. |
| EAS push credentials | Android **FCM V1** SA key uploaded (`eas credentials -p android` → Google Service Account → FCM V1). iOS APNs key via EAS. Expo project `bb0fb2c3-b94d-4ac0-80ba-fac5164c72fa`. |
| Neon project / prod branch | `cold-water-79857133` (`weavy-story`) / `br-cool-butterfly-aow77oep` |
| Cloudflare Worker | `weave-story-api` (`https://weave-story-api.leejahun0.workers.dev`) |
| R2 covers bucket (public) | `pub-3b97af20ccef4afb950d53316d0100f7.r2.dev/covers/` |
| Korean business reg. no. (사업자등록번호) | `1502302302` |
| Support / Privacy URLs | `…/support`, `…/privacy` on the Worker |

---

## E. Re-deploy / re-set runbook (after local loss)

1. `git clone` the repo (everything code lives in git).
2. Recreate `.env.local` from §C (pull values from Neon / GCP / Vercel / RevenueCat consoles).
3. Regenerate the three key files in §B from Apple / Google consoles if not in your vault.
4. Worker secrets already live on Cloudflare — re-set only if rotated:
   `cd workers/api && npx wrangler secret put <NAME>`.
5. Deploy: `cd workers/api && npx wrangler deploy`. Client OTA: `eas update --branch production --platform ios|android`.

---

## F. Private R2 backup of key files (`weave-story-secrets-backup`)

A **private** R2 bucket (no public domain — do **not** make it public) holds plaintext
copies of the local-only credentials, so they survive a lost laptop. Created 2026-06-04.

| Key in bucket | What |
|---|---|
| `env/.env.local` | Local dev env (incl. `JWT_SECRET`, `DATABASE_URL`, API keys) |
| `asc-keys/AuthKey_<KEYID>.p8` | App Store Connect API keys (L4FDH4F6HZ, TN83PW567A in active use; others archived) |
| `play/weave-story-498307-7037201e6747.json` | Google Play service-account JSON |
| `push/fcm-v1-service-account.json` | Firebase **FCM V1** service-account key (Android push) |
| `push/google-services.json` | Firebase Android config (also committed in repo) |
| `push/AuthKey_D7J7X6ZD28.p8` | **APNs** auth key (iOS push) |
| `README.txt` | Manifest |

**Restore a file:**
```bash
cd workers/api
npx wrangler r2 object get weave-story-secrets-backup/<key> --file <dest> --remote
# e.g. ...get weave-story-secrets-backup/env/.env.local --file ../../.env.local --remote
```
**List / manage:** Cloudflare dashboard → R2 → `weave-story-secrets-backup` (account-private).
