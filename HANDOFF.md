# Weave Story Handoff

Last updated: 2026-06-04

> **Secrets / env / credentials:** see [`SECRETS_AND_ENV.md`](./SECRETS_AND_ENV.md)
> for the full inventory, locations, and regeneration runbook. All required
> Cloudflare Worker secrets are set (production is self-sufficient if local is lost).

## 2026-06-04 — Multilingual launch (en / ja / ko)

English is the **primary** language; the app supports **en / ja / ko**.

- **Store listings (both stores) localized to en/ja/ko** via API:
  - **Google Play**: en-US / ja-JP / ko-KR listings + 5 phone screenshots each — committed (live).
  - **App Store**: pulled v1.0 from review, added ja/ko name·subtitle·description·keywords·promo·privacy·support, uploaded en/ja/ko **6.7″** screenshots (removed old 6.5″), **resubmitted** (WAITING_FOR_REVIEW). iPad 12.9″ set kept on en (ja/ko inherit).
  - Copy source of truth: `store-assets/store-copy.json`.
- **Screenshots are generated**, not hand-made: `store-assets/screenshots/` (`build.mjs` → `render.sh`, headless Chrome). 30 PNGs = iOS+Android × en/ja/ko × 5. Generated binaries are gitignored; re-run to recreate.
- **Story generation now follows the user's locale** (was hardcoded Korean). Language flows client → `/api/stories` → `stories.language` (new column) → prompts. Per-language guides for direct generation + the story harness (KO unchanged); `prompt-check` returns questions in the locale. Code split for role separation: `lib/ai/story-lang.ts`, `chapter-prompt-guides.ts`, `chapter-schemas.ts`, `prompt-check-prompts.ts`, `story-harness/drafting/harness-prompts/{ko,en,ja}.ts`.
- **Hardcoded Korean UI strings localized**: `lib/api/errors.ts`, `chapter-ribbon`, `chapter-error-page`, `error-box` → i18n keys (`common.errors/actions`, `reading.nowReading/chapterError`).
- **Deployed**: DB migration (`stories.language`, existing rows backfilled `ko`) → EAS OTA (iOS+Android, channel `production`) → `wrangler deploy`.
- **Dead code flagged for removal**: `components/setup-step.tsx`, `hooks/use-setup.ts`, `components/home/shelf-stage.tsx` (legacy setup flow, no importers).

### Verify still pending
- Create one **English** story in-app (after OTA applies) and confirm the chapter text is English (server defaults to `en` when no locale sent; old rows backfilled `ko`).

## Project

- Path: `/Users/leegibbeum/repos/weave-story`
- App: Expo / React Native app using Expo Router
- Product: AI interactive web-novel app where a user creates a custom story, reads chapters, and chooses the next direction.
- Important global rule: keep logic and UI separated by responsibility. When touching mixed-responsibility code in the task area, split it into hooks/services/presentational components as part of the work.

## Current High-Level State

The app has recently gone through a large UX and story-generation iteration:

- The "New Story" tab was redesigned around a bookstore / book cover selection concept.
- Sample story covers were regenerated in a modern Korean web-novel bestseller style.
- The selected sample cover transitions to a separate open-book preview screen.
- The setup screen was redesigned with paper / fountain-pen mood.
- Chapter generation loading UI was simplified so the main loading happens on the reading/chapter page, not twice.
- Story generation backend was refactored toward a low-cost "story harness" for first-chapter generation.
- Additional chapter generation and reading-position behavior were reviewed and improved.
- IAP setup is now the active next milestone.

## Current Git State

`main` HEAD is `5d6296d` ("i18n: multilingual story generation + localize UI strings"),
pushed to `origin/main`. IAP (iOS + Android) and the multilingual launch are done and
deployed; see the 2026-06-04 section above.

Note: `build/app.ipa` is a tracked build artifact that often shows as modified — it is
intentionally left out of feature commits. `.secrets/` and `*.p8` are gitignored.
`store-assets/` generated binaries (screenshots/covers/fonts/pages) are gitignored.

Always run `git status --short` before editing. Do not revert user changes unless explicitly asked.

## Key App Store / IAP Status

App Store Connect Business page:

```text
https://appstoreconnect.apple.com/business/atb/65213491-168c-45ae-8624-c75e81079304
```

Latest observed status after user completed compliance items:

- Digital Services Act compliance: completed.
- Paid Apps Agreement: active.
- Free Apps Agreement: active.
- Bank account `LEE JAHUN (9047)`: active.
- U.S. tax forms:
  - `U.S. Certificate of Foreign Status of Beneficial Owner`: active.
  - `U.S. Form W-8BEN`: active.
- Korea tax form: pending.

This means IAP product lookup should be tested again. If product loading still fails, likely next causes are product status, product id mismatch, bundle id mismatch, sandbox tester/device setup, or build environment.

### Product IDs In Code

Defined in `/Users/leegibbeum/repos/weave-story/lib/purchases/config.ts`:

```ts
export const PRODUCT_IDS = {
  creditsStarter: 'com.leejahun.weavestory.credits_starter_3',
  creditsValue: 'com.leejahun.weavestory.credits_value_10',
} as const;
```

Credit mapping:

```ts
creditsStarter -> 3 credits
creditsValue -> 10 credits
```

### IAP Code Entry Points

- `/Users/leegibbeum/repos/weave-story/lib/purchases/config.ts`
- `/Users/leegibbeum/repos/weave-story/lib/purchases/context.tsx`
- `/Users/leegibbeum/repos/weave-story/lib/purchases/provider-wrapper.tsx`
- `/Users/leegibbeum/repos/weave-story/components/ui/paywall-modal.tsx`

`PurchasesProvider` uses `expo-iap`:

- `useIAP`
- `fetchProducts({ skus, type: 'in-app' })`
- `requestPurchase({ type: 'in-app', request: { apple: { sku } } })`
- `finishTransaction({ purchase, isConsumable: true })`

It also logs IAP connection/product events to Sentry.

### Test Account / Credits

The user was testing with:

```text
leejahun0@gmail.com
```

Credits for matching Neon DB users were previously set to `0` to force the paywall/IAP path. Re-check DB before assuming the account is still at zero credits.

## App Store Connect Notes

The user directly completed the Korea business contact flow and EU DSA flow in App Store Connect.

Earlier automation using the Codex Chrome Extension could open the Korea business contact modal and fill the email, but the next step rendered as an empty modal. The user later completed it manually, and the warning disappeared.

If browser automation is needed again, use Chrome extension control only. The user explicitly said not to use Computer Use for this work.

Chrome extension bootstrap that previously worked:

```js
var setupMod = await import('/Users/leegibbeum/.codex/plugins/cache/openai-bundled/chrome/26.527.60818/scripts/browser-client.mjs');
await setupMod.setupBrowserRuntime({ globals: globalThis });
var browser = await agent.browsers.get('extension');
await browser.nameSession('App Store compliance');
var tabs = await browser.user.openTabs();
var info = tabs.find(t => (t.title || '').includes('App Store Connect') || (t.url || '').includes('appstoreconnect.apple.com')) || tabs[0];
var ascTab = await browser.user.claimTab(info);
```

Do not inspect cookies, local storage, profiles, passwords, or session stores.

## Recent UX Work Summary

### New Story Tab

Important files:

- `/Users/leegibbeum/repos/weave-story/app/(tabs)/index.tsx`
- `/Users/leegibbeum/repos/weave-story/app/book-preview.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-shelf.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-cover-gallery.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-launch-cover.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-launch-transition.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-preview-screen.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-preview-page.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/open-book-scene.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/open-book-page-text.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/sample-book-cover.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/cover-title-text.tsx`
- `/Users/leegibbeum/repos/weave-story/lib/sample-covers/constants.ts`

Current direction:

- The main list should feel like a modern large bookstore bestseller display.
- Background should be lighter, simple, and harmonized with the bottom nav.
- Sample covers should stand out more than the background.
- Cover title font moved away from plain default, tried `Gugi`, settled on `Jua`, then slightly reduced size.
- The old bottom "new story start" CTA on the home tab was removed because it created awkward whitespace.
- Tapping a sample book opens a separate open-book preview route/screen.
- The open-book preview no longer has a visible "start story" button. Tapping anywhere on the preview moves to setup/start flow.

### Removed / Avoided 3D Direction

A Three / R3F spike was tried and rejected for product direction.

Removed earlier:

- `app/book-3d-spike.tsx`
- `components/dev/book-3d/book-scene.tsx`
- `components/dev/book-3d/book-model.tsx`
- `book-3d-spike` route in `app/_layout.tsx`
- home dev button for `3D Book Spike`

Packages removed earlier:

- `@react-three/fiber`
- `expo-gl`
- `three`
- `@types/three`

Current product direction is hybrid 2.5D:

- High-quality generated bitmap backgrounds.
- RN views/images for tappable books and UI.
- Reanimated-based transitions if reintroduced.
- Video/image sequence can be considered later for premium book-opening animation.

## Setup Screen UX

Important files:

- `/Users/leegibbeum/repos/weave-story/app/setup.tsx`
- `/Users/leegibbeum/repos/weave-story/components/setup/story-prompt-screen.tsx`
- `/Users/leegibbeum/repos/weave-story/components/setup/story-prompt-background.tsx`
- `/Users/leegibbeum/repos/weave-story/components/setup/story-prompt-header.tsx`
- `/Users/leegibbeum/repos/weave-story/components/setup/story-prompt-input-field.tsx`
- `/Users/leegibbeum/repos/weave-story/components/setup/story-prompt-submit-button.tsx`
- `/Users/leegibbeum/repos/weave-story/components/setup/use-story-prompt-layout.ts`
- `/Users/leegibbeum/repos/weave-story/components/setup/story-prompt-types.ts`

Current direction:

- Paper / fountain-pen mood.
- Text input should feel naturally placed on paper, not inside a heavy textbox.
- The paper area was moved upward because it felt too low.
- Input text uses the `Jua` font style.
- Button tone should sit naturally on the paper background rather than look like a separate heavy block.

## Reading / Chapter UI

Important files:

- `/Users/leegibbeum/repos/weave-story/app/reading/[id].tsx`
- `/Users/leegibbeum/repos/weave-story/app/reading-choice/[id].tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/reading-choice-screen.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/text-page.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/intervention-page.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/choice-entry-page.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/choice-page.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/generating-page.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/use-choice-input-scroll.ts`
- `/Users/leegibbeum/repos/weave-story/lib/reading/build-pages.ts`
- `/Users/leegibbeum/repos/weave-story/lib/reading/paginate.ts`
- `/Users/leegibbeum/repos/weave-story/lib/reading/reading-position-storage.ts`

Recent concerns:

- Situation-choice free input was being hidden by the keyboard.
- Several keyboard-avoidance attempts were made; the desired behavior is: when the input focuses, scroll so the input remains visible above the keyboard.
- Reading position should persist so that leaving and re-entering a story resumes on the same page.
- Chapter page indicator dots were considered visually dated and were changed toward a more understated progress/ribbon style.

If continuing here, verify on a real device because keyboard behavior is platform-sensitive.

## Loading UI

Important files:

- `/Users/leegibbeum/repos/weave-story/components/ui/story-loader.tsx`
- `/Users/leegibbeum/repos/weave-story/components/ui/story-loader-ambient.tsx`
- `/Users/leegibbeum/repos/weave-story/components/reading/generating-page.tsx`

Current behavior:

- The app should not show two separate story-generation loading screens.
- After tapping story start, it should go directly to the reading/chapter page.
- The single loading experience should appear there while the chapter is being generated.
- The current visual direction is more atmospheric and story/book-like than the first Lottie attempt.
- The text "당신의 책을 펼치고 있어요" was adjusted because gold text blended into the background.

## Story Generation / Backend Harness

Important files:

- `/Users/leegibbeum/repos/weave-story/lib/ai/story-generation.ts`
- `/Users/leegibbeum/repos/weave-story/lib/ai/prompt-check.ts`
- `/Users/leegibbeum/repos/weave-story/lib/ai/summarize-chapter.ts`
- `/Users/leegibbeum/repos/weave-story/lib/threads/fire-generate.ts`
- `/Users/leegibbeum/repos/weave-story/lib/threads/chapter-context.ts`
- `/Users/leegibbeum/repos/weave-story/workers/api/src/index.ts`
- `/Users/leegibbeum/repos/weave-story/workers/api/wrangler.toml`
- `/Users/leegibbeum/repos/weave-story/workers/cover-image/src/index.ts`
- `/Users/leegibbeum/repos/weave-story/workers/cover-image/wrangler.toml`
- `/Users/leegibbeum/repos/weave-story/shared/db/schema.ts`
- `/Users/leegibbeum/repos/weave-story/lib/db/schema.ts`

Architecture understanding from recent work:

- Cloudflare Worker API receives story/chapter generation requests.
- Queue/consumer model is used for background generation, not Cloudflare Workflows.
- A Worker can include the consumer. Conceptually:
  - Queue = task buffer.
  - Producer = API route that enqueues generation work.
  - Consumer = Worker handler that receives queued messages and runs the generation workflow.
- The client polls DB flags/status while background generation proceeds.
- The harness direction is role-based internally, but cost-sensitive:
  - Do not fan out to many expensive agents by default.
  - First chapter uses a minimal harness with clear planning/quality constraints.
  - Escalate additional model calls only when quality/risk justifies cost.

Product guidance from user:

- Prompt length may be 2000+ chars, but generated output felt too short.
- Choices should not be trivial ("How do you respond to the butler at the door?").
- The generated situation should be more immersive, high-stakes, and emotionally/plot-wise compelling.
- Future customization will likely require a stronger story harness layer, not only prompt edits.

## Schema Duplication

There were two schema files that looked duplicated:

- `/Users/leegibbeum/repos/weave-story/lib/db/schema.ts`
- `/Users/leegibbeum/repos/weave-story/shared/db/schema.ts`

Earlier direction was to clean this duplication. Re-check current contents before editing. The desired end state is one canonical shared schema or thin re-export, not two independently maintained copies.

## AI SDK Deprecation Work

The user noticed deprecated `generateObject` call signatures in the editor.

Direction:

- Update deprecated Vercel AI SDK usage to current recommended call shapes.
- Prefer official docs / installed `vercel:ai-sdk` skill when doing this.
- Search repo-wide for deprecated AI SDK signatures before changing:

```bash
rg "generateObject|generateText|streamText|experimental_|schemaDescription|as Parameters" lib workers app components shared
```

Keep changes scoped and verify TypeScript.

## Generated / Local Assets

Recently used image assets include:

- `/Users/leegibbeum/repos/weave-story/assets/images/home/`
- `/Users/leegibbeum/repos/weave-story/naver-novel-ranking.png`

The home/background and cover art were generated or reference-driven. If regenerating:

- Avoid overly brown/yellow/ochre dominant backgrounds.
- Keep home background simple so sample covers stand out.
- Keep harmony with the bottom navigation ivory tone.
- Cover style reference was Naver Novel ranking covers: modern, commercial, sharp genre signal.
- Since the app targets Korea, Japan, and the U.S., avoid locking generated cover text to only one market unless producing localized variants.

## App Store / Tax Document Side Notes

The user created a password-free copy of a business registration certificate PDF:

```text
/Users/leegibbeum/Downloads/사업자등록증명_영문_비밀번호없음.pdf
```

The original PDF password was used during that task, but do not include or reuse passwords in future notes.

Business/legal address in App Store Connect may still be old:

```text
185, World cup-ro, Yeongtong-gu
905ho
Suwon-si, Gyeonggi-do 12421
Republic of Korea
```

Bank account address used the newer actual address:

```text
101, Edu town-ro, Yeongtong-gu
Eduheim1309 Officetel 108-103
Suwon-si, Gyeonggi-do 16509
Republic of Korea
```

The business/legal address update may require Apple Support later, but it did not block the latest IAP contract activation state.

## Recommended Next Steps

### 1. Test IAP Product Loading On Device

Use a real iOS device / dev client / TestFlight build.

Check:

- Does paywall open when credits are zero?
- Does `useIAP` connect?
- Does Sentry log `[iap] connected=true`?
- Does Sentry log product count with the expected product ids?
- If products are still empty, inspect:
  - App Store Connect IAP product status.
  - Product IDs exactly matching code.
  - Bundle ID matching the App Store app.
  - Sandbox tester setup.
  - Whether the build is signed against the correct app/bundle.

### 2. Inspect App Store Connect IAP Products

Confirm these products exist and are ready:

```text
com.leejahun.weavestory.credits_starter_3
com.leejahun.weavestory.credits_value_10
```

For each product, verify:

- Type: consumable.
- Reference name.
- Price.
- Localization/display name/description.
- Review/screenshot requirements.
- Status is not missing metadata.

### 3. Verify Purchase Completion Path

After a successful sandbox purchase:

- Transaction resolves through `onPurchaseSuccess`.
- App awards credits according to `CREDITS_PER_PRODUCT`.
- `finishTransaction` is called with `isConsumable: true`.
- DB credits update is idempotent enough to avoid double-awarding on retries.
- Failed/cancelled purchases do not award credits.

### 4. Continue Story Harness Work

Once IAP is stable, continue improving:

- First chapter depth/length.
- More compelling choice situations.
- Memory/context compression across chapters.
- Cost-aware role separation inside the harness.
- Logging around generation stages so Cloudflare/Queue failures are obvious.

### 5. Run Verification

Common commands:

```bash
npx tsc --noEmit
npx expo lint
```

Targeted lint can be useful after scoped edits:

```bash
npx eslint lib/purchases/context.tsx
```

Do not assume full lint is clean; there may be pre-existing warnings/errors outside the touched area.

## Useful Commands

Start app:

```bash
npm start
```

iOS:

```bash
npm run ios
```

Database:

```bash
npm run db:push
npm run db:pull
npm run db:generate
npm run db:migrate
npm run db:studio
```

iOS deploy helper:

```bash
npm run deploy:ios
```

## Collaboration Notes

- User prefers direct implementation once direction is clear.
- User wants questions only when genuinely needed.
- User cares strongly about polished UX, not generic app UI.
- User prefers real device verification for animation, keyboard, and IAP behavior.
- Keep cost in mind for AI generation architecture. Do not introduce multi-agent fanout unless it clearly improves quality or reliability.
