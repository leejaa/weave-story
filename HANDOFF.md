# Weave Story Handoff

Last updated: 2026-06-23

> **Secrets / env / credentials:** see [`SECRETS_AND_ENV.md`](./SECRETS_AND_ENV.md)
> for the full inventory, locations, and regeneration runbook. All required
> Cloudflare Worker secrets are set (production is self-sufficient if local is lost).

## 2026-06-24 — Phase B: 사전 저작 아웃라인 + 비트 렌더 (응집·개연 해결)

Phase A로도 떡밥이 서로 안 엮이고 단발 증식 + 주인공 척추가 조연 사연에 납치되는 산만함이 남음
(즉흥 마르코프 연쇄의 한계). 인터랙티브 게임 표준 **"string of pearls"** 로 전환:

- **plot_structures** 테이블(신규): 구조 템플릿 라이브러리(15개, 장르 태그). 생성 시 장르 매칭 랜덤 픽.
  `story-harness/outline/` 모듈(schema/pick/generate/save/format/classify-genre).
- **아웃라인 우선**: 1화 생성 전에 전체 아웃라인 1회 저작(opus) — centralMystery(question+intendedAnswer)·
  spine·cast·relationships·**기능 비트 시트(beats[i]=i화)**·2~3 endings. `story_bibles.blueprint` 컬럼 재사용,
  bible 필드는 아웃라인에서 파생. 위치: `run-first-chapter-harness.ts`(attempt 루프 전, 비치명적 폴백).
- **매 화 = 비트 렌더**: `beatForChapter(outline, n)` 서수 매핑. 공유 `render-outline-prompt.ts`(4개 언어 위임).
  규칙: 선택은 본문에서 실제 실행(=비트로 가는 경로) + 같은 기능 비트로 수렴 + 중심 미스터리 한 조각 전진 +
  주인공 본인 척추 전진 + **고아 떡밥 금지**. 마지막 화는 누적 성향(요약 기반)으로 endings 중 택1.
- **장르 분류**: hintGenre 없으면 haiku classifyGenre.
- 기본 챕터 수 20→**12**(stories.ts). 버전 `@2026-06-24-B`. **하위호환**: outline 없으면 Phase A/레거시 폴백.
- MVP 범위: choiceLeanings는 요약 기반(별도 누적 미구현), story_state는 연속성용으로 유지(렌더 모드선 미주입).

## 2026-06-23 — Phase A: 스토리 청사진(Blueprint) 도입 (떡밥 회수 강제 + 장르 고정)

"자정 편의점" 검증에서 두 문제 확인 → 같은 뿌리(전역 청사진 부재): ① 떡밥이 회수 없이
단조 누적돼 4~5화에 내용 붕괴, ② 타이핑 프롬프트는 장르 잠금이 없어 미스터리로 쏠림.

- **청사진**: 생성 시 1회 **opus-4.7**로 `story_bibles.blueprint`(JSONB, nullable) 작성 —
  장르 고정 + 척추(spine) + **fraction 기반 마이크로-아크(떡밥 plant→payoff 스케줄)**.
  모듈 `workers/api/src/lib/story-harness/blueprint/`. 삽입: `run-first-chapter-harness.ts`
  saveStoryBible 직후(비치명적). `stories.genre`를 blueprint.genre로 일치(라벨 불일치 해소).
- **떡밥 회수 강제(엄격)**: `narrative-phase.ts` `hookDirective()`(plant_ok/payoff_due/converge,
  EventBeat와 직교). 4개 언어 `buildNextDraft`에 청사진·장르고정·아크·회수 블록 주입,
  가장 오래된 떡밥부터 회수, 중반(>0.45) 이후 net 증가 금지. "매 화 끝 훅 의무"는 완화.
- **장르 고정**: 청사진 genre + avoid("추리·미스터리화 금지")를 매 화 주입.
- **하위호환**: blueprint=null(옛 스토리)이면 빌더가 기존 phase 동작으로 폴백. 컬럼 nullable·비파괴.
- 버전 bump `@2026-06-23-2`. 정본: [`STORY_GENERATION_ARCHITECTURE.md`](./workers/api/STORY_GENERATION_ARCHITECTURE.md) §3.

## 2026-06-23 — 스토리 생성 하네스 컨셉 전환 (백엔드 대대적 리팩토링)

제품 컨셉 재정의: ~~일관된 장편소설~~ → **"얇은 척추(주인공 능동 목표 drive) 위에서
매 화가 직전 선택의 직접 결과로 사건 1개를 터뜨리고 끝에 새 훅을 남기는, 인과 선택·
고가독성 인터랙티브 픽션"**. 챕터 길이 ~1,800–2,800자로 하향(웹소설형). **클라 무수정**
(응답 계약 + 비종결 선택지 2개 규칙 유지). 정본 설계문서:
[`workers/api/STORY_GENERATION_ARCHITECTURE.md`](./workers/api/STORY_GENERATION_ARCHITECTURE.md).

- **메모리 모델 교체**: 손실 recap(1,200자 텍스트) → `threads.story_state` JSONB
  (drive/열린 떡밥/인물 상태/직전 사건/직전 선택 결과/위치·시점). Neon 마이그레이션
  적용 완료(nullable·비파괴, `recap` 컬럼은 전환기 호환 위해 잔존). 매 화 Haiku가
  `updateStoryState()`로 갱신(구 `generateStoryRecap` 대체), canon 모순 방지.
- **사건 강제 + 비트 회전**: `narrative-phase.ts`에 `EVENT_BEAT_CYCLE`(6비트) +
  `chapterEventBeat()` 추가. buildNextDraft가 "이번 화 사건 1개 + 끝 훅 + drive 진전"
  강제, 같은 비트 반복 방지.
- **프롬프트 4개 언어 리팩토링**(ko/en/ja/zh-hant): 공유 상수 `*_EVENT_BEAT`/
  `*_PROSE_GUARDRAIL`/`*_LENGTH`/`*_CHOICE_RULES`. 문체 가드레일(역설 남발·telling·
  추상독백·모티프 반복 금지, 문장 길이 다양화, 대화 활용). 인과·능동 선택지(후퇴 금지).
- **길이 게이트 하향**: `EXTEND_TARGET` 4500→1800, `MIN_PARAGRAPHS` 8→5. 본문 길이는
  여전히 비-게이트(짧으면 extend가 처리). **"선택지 2개" 게이트 유지(클라 호환)**.
- **버전 bump**: `FIRST/NEXT_CHAPTER_HARNESS_PROMPT_VERSION = @2026-06-23-1`. 모델은
  opus-4.7 유지. 배포 완료(Version 93771a2a).

## 2026-06-14 — 백엔드 하드닝 · 앱인토스 풀 연동 · 성능/관측성

대규모 세션. 항목별 요약(상세는 git log):

### 백엔드 하드닝 (워커, Expo+web 공용)
- **P0**: 9개 테이블 인덱스 + 입력 검증(prompt/customInput/choiceIndex 길이·범위); UGC 모더레이션(생성 후 Haiku 분류 차단 + 신고 자동숨김 + 본문 스크럽 + 텔레그램); 로그아웃 시 서버 세션(리프레시 토큰) 폐기; 레이트리밋(AUTH 30/60s IP, GEN 12/60s userId, CF 네이티브 바인딩).
- **견고성**: 비-UUID path/body id → 500 대신 404(`lib/validation.ts`); 모더레이션 신고 임계값 1(비공개 콘텐츠) + 소유권 검증, 생성 자동숨김 시 크레딧 환원.
- **환불 처리**: Apple App Store Server Notifications V2 웹훅(`/api/store-notifications/apple`, Apple API 재확인) + Google Voided Purchases cron(매일 00:30 UTC). schema `purchase_grants.status/refunded_at`. ASC 서버알림 URL 등록 완료.
- **일일 보상**: `POST /api/me/daily-reward`(KST 날짜당 1크레딧, 멱등).
- **테스트**: 돈 경로 vitest 통합테스트(지급 멱등·환불·일일보상·모더레이션). `cd workers/api && TEST_DATABASE_URL=... npm test`.

### 클라(Expo) UX/성장 — OTA 반영 (runtime 1.0.1·1.0.2 양쪽)
- 생성 실패 안내(429/5xx/네트워크), 세션 만료 로그인 배너, 목록 스켈레톤, 이야기 텍스트 공유, 아이콘 a11y 라벨, 완료 분석 이벤트(story_completed).
- **iOS 1.0.2 출시 완료**(READY_FOR_SALE). OTA 듀얼-런타임 절차: app.json version을 라이브 런타임마다 임시 변경 후 `eas update`.
- **ASO**: 보이는 카피에서 'AI' 제거(독자주도 포지셔닝), Apple 키워드 필드엔 검색용 유지. Play 리스팅 4개 언어 라이브 반영, Apple 프로모션 갱신. (부제/키워드/설명은 1.0.3에 적용 — store-copy.json 보관)

### 앱인토스 미니앱 (web/ — 별도 React+Vite, Expo와 독립)
- **토스 로그인**: mTLS 클라 인증서 CF 업로드(`TOSS_MTLS` 바인딩) + `POST /api/auth/toss`(generate-token+login-me, 응답 `{success}` 봉투 파싱, userKey로 계정 upsert). 임시 데모로그인 제거.
- **인앱결제(IAP)**: `POST /api/purchases/toss`(orderId 멱등) + 클라 `usePurchase`(구매+중단주문 복원), 프로필 충전 UI. SKU `credits_starter_3`(3)/`credits_value_10`(10). 콘솔 상품 등록 완료.
- **푸시**: 챕터 완성 시 토스 유저 `send-message`(mTLS). `TOSS_MESSAGE_TEMPLATE_CODE` 설정 시 동작(콘솔 템플릿 검수 필요).
- **관측성**: web에 `@sentry/react`(미처리 에러·5xx·네트워크 자동수집, RN 프로젝트 공유+`app:appsintoss` 태그). 토스 라우트 인프라 오류 텔레그램 알림.
- **성능**: 배경 비디오 지연로드(포스터 즉시); setup/미리보기 배경 PNG 2MB→로컬 JPEG 200KB; 샘플 커버 10장 R2 JPEG 300KB(?v=3); cover-image 워커가 생성 커버를 JPEG로 출력.
- **프로필**: PII 미복호화 시 UUID 대신 "실마리 독자" + 기본 아이콘.
- 빌드/업로드: `cd web && npm run build:ait` → `web/weave-story.ait` → 콘솔 앱 출시. **OTA 없음 — 클라 변경은 .ait 재제출**(백엔드 변경은 즉시). 인증서 후속 체크리스트 [`web/AFTER_CERT.md`](./web/AFTER_CERT.md).

## 2026-06-11 — AI 광고 영상 프리프로덕션 시작

- Weave Story 광고 영상을 Vercel AI Gateway의 `openai/gpt-image-2`와
  `bytedance/seedance-2.0` 조합으로 제작하기로 결정.
- 바로 이미지를 생성하지 않고, Creative Brief부터 시작해 단계별 산출물을 사용자와
  논의하고 승인한 뒤 다음 단계로 진행.
- 제작 기준, 확정/미확정 사항, 결정 기록은
  [`store-assets/ads/AI_VIDEO_PRODUCTION.md`](./store-assets/ads/AI_VIDEO_PRODUCTION.md)에 관리.
- 현재 단계: **Creative Brief 작성 전 논의**.

## 2026-06-10 — App Store 재심사 대응 + UI 개편

### App Store 심사 탈락 대응 (build 37 → build 41)

build 37이 두 가지 사유로 탈락:
- **2.1(b)**: 리뷰어가 크레딧 충전 UI를 찾지 못함
- **3.1.2(c)**: 자동갱신 구독(Premium Monthly)이 ASC에 존재

해소 조치:
- Premium Monthly 구독 및 구독 그룹을 ASC API로 완전 삭제 (소비성 2개만 유지)
- `app/profile.tsx`에 크레딧 충전 버튼 + PaywallModal 연결 추가
- build 41 빌드 + ASC 업로드 + 사용자가 재심사 제출 완료 → 현재 **WAITING_FOR_REVIEW**

### 홈 화면 대규모 개편 (커밋 `3c48cd6`)

- `app/book-preview.tsx` → `app/(modal)/book-preview.tsx` 로 분리, `(modal)` 라우트 그룹 신설
- `components/home/book-expand-transition.tsx` 신규 — 책 확대 전환 컴포넌트
- `components/home/book-launch-transition.tsx`, `book-shelf.tsx`, `sample-book-cover.tsx` 개편
- 구형 컴포넌트 제거: `card-item`, `sample-card-stack`, `shelf-sample-book`, `use-shelf-books`, `use-card-stack`, 외 미사용 컴포넌트 다수
- story-writing-loader Lottie 애니메이션(`assets/animations/story-writing-loader.json`) 추가
- 웹 전용 로딩 컴포넌트 신규: `components/setup/story-writing-loading-overlay.web.tsx`, `components/ui/story-loader.web.tsx`
- `shared/db/schema.ts` — 기본 크레딧 10으로 증가 + Drizzle 마이그레이션(`drizzle/`) 추가
- `workers/cover-image/src/index.ts` 개선, `tailwind.config.js` 정리

### 마이페이지(프로필) 디자인 개편 (커밋 `74ca766`)

`app/profile.tsx` 전면 개편:
- 크레딧 숫자를 Fraunces 600 64px 히어로 타이포로 강조 (크레딧 > 0: `thread` 컬러, 0: `ember` 컬러)
- 충전 버튼 fill pill → ghost outline 버튼으로 변경
- 아바타 52 → 64px, 이름 폰트 `sansSemibold` → `serifSemibold` (Fraunces)
- 크레딧 섹션 레이블 "PLAN" → "CREDITS"
- 섹션 여백·간격 정리

### OTA 배포 이력 (2026-06-10)

- iOS+Android production 동시 업데이트 (update group `7094d447`, 커밋 `74ca766`) — 마이페이지 디자인 개편
- Android 단독 업데이트 (update group `d7b38cc4`, 커밋 `3c48cd6`) — 홈 개편 + 충전 버튼

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

## 2026-06-04 — Store submission & testing status

- **App Store**: v1.0 **WAITING_FOR_REVIEW** with en/ja/ko listings + **iPhone 6.7″ and iPad 12.9″** screenshots (all new design). Release is manual after approval. Possible follow-up gap: Apple Sign In token revocation on account deletion (`APPLE_SIGNIN_*` unset) — may be a rejection risk.
- **Google Play**: en/ja/ko listings live. Closed-test track **"Alpha"** active (build 1.0.0). **Long pole = the 12-tester / 14-day requirement** (personal account). See `ANDROID_SUBMISSION.md` for the closed-test status, opt-in links, and recruitment plan.
- **⚠️ Play account structure**: the **active** dev account `8687266146434394437` (개인 계정) is owned by **leejahun9@gmail.com** (= Chrome account index `/u/2/` in the leejahun9 browser). `leejahun0@gmail.com` owns a *different, terminated* dev account (`8563905342234584322`) — don't confuse them. Reddit is blocked in browser automation, so tester recruitment is manual.

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

`main` HEAD is `74ca766` ("refactor(profile): 마이페이지 디자인 개편"),
pushed to `origin/main`. 홈 UI 개편·App Store 재심사 대응·마이페이지 디자인 개편 완료;
see the 2026-06-10 section above.

Note: `build/app.ipa` is a tracked build artifact that often shows as modified — it is
intentionally left out of feature commits. `.secrets/` and `*.p8` are gitignored.
`store-assets/` generated binaries (screenshots/covers/fonts/pages) are gitignored.

Always run `git status --short` before editing. Do not revert user changes unless explicitly asked.

## Key App Store / IAP Status

App Store Connect Business page:

```text
https://appstoreconnect.apple.com/business/atb/65213491-168c-45ae-8624-c75e81079304
```

Latest observed status:

- Digital Services Act compliance: completed.
- Paid Apps Agreement: active.
- Free Apps Agreement: active.
- Bank account `LEE JAHUN (9047)`: active.
- U.S. tax forms: active.
- Korea tax form: pending.

**현재 심사 상태 (2026-06-10)**: build 41, v1.0, **WAITING_FOR_REVIEW**

**ASC IAP 상품 현황**:
- `Credits Starter 3` (소비성, READY_TO_SUBMIT) ✅
- `Credits Value 10` (소비성, READY_TO_SUBMIT) ✅
- `Premium Monthly` 자동갱신 구독 → **삭제 완료** ✅

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

### Profile Screen (마이페이지)

Important files:

- `/Users/leegibbeum/repos/weave-story/app/profile.tsx`
- `/Users/leegibbeum/repos/weave-story/components/ui/paywall-modal.tsx`

Current direction (2026-06-10):

- 크레딧 숫자를 64px Fraunces serifSemibold 히어로 타이포로 — 앱 감성의 핵심 UI
- 크레딧 > 0: `thread`(포레스트 그린), 0: `ember`(레드) 조건부 컬러
- 충전 버튼은 ghost outline (border `thread`, 배경 투명) — 숫자가 주인공
- 아바타 64px, 이름 Fraunces serifSemibold

### New Story Tab

Important files:

- `/Users/leegibbeum/repos/weave-story/app/(tabs)/index.tsx`
- `/Users/leegibbeum/repos/weave-story/app/(modal)/book-preview.tsx` ← (2026-06-10 이동)
- `/Users/leegibbeum/repos/weave-story/components/home/book-shelf.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-cover-gallery.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/book-expand-transition.tsx` ← 신규
- `/Users/leegibbeum/repos/weave-story/components/home/book-launch-transition.tsx`
- `/Users/leegibbeum/repos/weave-story/components/home/sample-book-cover.tsx`
- `/Users/leegibbeum/repos/weave-story/lib/sample-covers/constants.ts`

Current direction:

- book-preview가 `(modal)` 라우트 그룹으로 분리됨 — 루트 스택과 독립
- book-expand-transition: 책 탭 → 확대 → 모달 전환 담당
- The main list should feel like a modern large bookstore bestseller display.
- Cover title font: `Jua`.
- Tapping a sample book opens book-preview modal → setup flow.

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

## AI SDK Deprecation Work — ✅ 완료 (2026-06-11 확인)

`ai@6.0.177` 기준 전 호출부가 이미 최신 API로 마이그레이션된 상태임을 확인. 추가 작업 없음.

현재 코드는 deprecated된 `generateObject`/`streamObject` 대신 `generateText` + `output` 설정을 사용:

```ts
import { generateText, Output } from "ai";
const result = await generateText({ output: Output.object({ schema }), ... });
return result.output; // (deprecated `experimental_output` 아님)
```

호출부 (전부 동일 패턴):
- `lib/ai/story-generation.ts`, `lib/ai/prompt-check.ts`
- `workers/api/src/lib/ai/story-generation.ts`, `workers/api/src/lib/ai/prompt-check.ts`
- `workers/api/src/lib/story-harness/drafting/structured-generation.ts`, `extend-chapter-body.ts`

다음 deprecated 시그니처는 소스에 **없음** (재확인 시 grep): `generateObject`, `streamObject`,
`maxTokens`(→`maxOutputTokens` 사용 중), 입력/결과 `experimental_output`(→`output` 사용 중),
`experimental_activeTools`, `experimental_providerMetadata`.

```bash
rg "generateObject|streamObject|\bmaxTokens\b|experimental_output|experimental_activeTools|experimental_providerMetadata" lib workers app components shared
```

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

### 0. App Store 심사 대기 중 (2026-06-10)

build 41, v1.0 현재 **WAITING_FOR_REVIEW**. 심사 통과 후 수동 출시. 리뷰어 회신 초안:

> "In-App Purchases are now accessible directly from the Profile screen: tap the profile icon → 'Buy credits' button next to your credit balance, which opens the purchase sheet (Starter Pack / Value Pack). They also still appear when credits run out during chapter generation. The auto-renewable subscription has been removed; the app now offers consumable credits only."

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
