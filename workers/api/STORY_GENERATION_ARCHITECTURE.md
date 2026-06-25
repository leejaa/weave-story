# Weave Story — 스토리 생성 아키텍처 (정본)

Last updated: 2026-06-25

> **v2 (2026-06-25-C) — 단순·장르충실·탈미스터리 전환**
> - 강제 `centralMystery`(폭로 엔진) 제거 → **`centralArc{dramaticQuestion, throughline}`**(장르중립 목표/갈등).
>   어떤 전제도 "누가 했나" 수사물로 변질되지 않게 함. 비트의 `centralAdvance`→`arcAdvance`.
> - 단순함 하드캡: cast ≤4, worldRules ≤3(현실 배경은 0개 가능), relationships ≤4. 매 화 렌더는
>   **아웃라인에 없는 새 인물·설정·떡밥 도입 금지**(조잡함 차단).
> - 장르는 **클라 선택(hintGenre) 권위**. 템플릿 픽은 비미스터리 장르에 수사·복수 골격 배제.
> - 문체 가드레일 4개 언어 강화(쉬운 단어·짧은 문장·추상 최소).
> - judge 차원 개편: coreClarity/coreAmbiguous → **readability·simplicity** 점수 + **genreDrift(수사물화)·
>   complexityCreep** 플래그. 가독성·단순성을 무겁게 가중.

이 문서는 Weave Story의 AI 챕터 생성 파이프라인의 정본 설계문서다. 코드가 진실의
원천이지만, "왜 이렇게 설계했는가"와 전체 흐름은 여기에 정리한다.

> **읽는 순서 / 현행 모델 안내**
> - **현행 주력 = Phase B(아웃라인 우선 + 비트 렌더)** — §0 참조. 신규 스토리는 전부 이 경로.
> - **Phase A(즉흥 + 청사진)** = outline이 없을 때의 **레거시 폴백**. §3의 blueprint·hookDirective·
>   §6의 EVENT_BEAT 등은 폴백 경로 설명이다.
> - **관측·디버깅·품질 측정**은 §8.

---

## 0. Phase B — 사전 저작 아웃라인 + 비트 렌더 (현행 주력, 2026-06-24)

**문제(Phase A 한계)**: 매 화를 "직전 선택의 직접 결과 사건 1개"로 즉흥 생성 → 마르코프
연쇄라 떡밥이 서로 안 엮이고 단발 증식, 주인공 척추가 조연 사연에 납치(산만).

**해결**: 인터랙티브 게임 표준 **"string of pearls"**. 생성 시점에 **전체 아웃라인을 1회
저작**하고, 매 화는 그 **기능(function) 비트를 렌더**한다. 선택은 페이크가 아니라 — 본문에서
**실제로 실행되되(선택 무산 금지)** 같은 기능 비트로 수렴 + 관계/서브플롯 강조 + 누적으로
2~3 결말 분기.

핵심 원칙: **비트는 "사건"이 아니라 "기능"으로 고정.** ("5화에 구미호 사망" ❌ → "5화에
주인공이 율의 진짜 목적에 한 발 다가감" ✅) → 어떤 선택이든 본문에서 실행하면서 같은 비트 달성.

### 흐름
1. **장르 확정** — `hintGenre`(카드) 또는 `classifyGenre()`(haiku, 타이핑 프롬프트).
2. **템플릿 픽** — `plot_structures`(DB, 구조 템플릿 15개·장르 태그) 중 장르 매칭 랜덤 1개.
   → 구조 다양성(같은 전제도 매번 다른 골격).
3. **아웃라인 저작**(opus-4.7, 스토리당 1회) — `story-harness/outline/generate-outline.ts`.
   `run-first-chapter-harness.ts`에서 **1화 생성 전에** 실행(아웃라인 우선). `StoryOutline`을
   `story_bibles.blueprint` 컬럼에 저장 + bible 필드 파생. `stories.genre` 일치.
4. **매 화 = 비트 렌더** — `beatForChapter(outline, n)`(서수: beats[n-1]=n화). 공유
   `harness-prompts/render-outline-prompt.ts`를 4개 언어 빌더가 위임 호출. 규칙: 선택 실제 실행 +
   기능 비트 수렴 + **중심 미스터리 한 조각 전진** + **주인공 본인 척추 전진** + **고아 떡밥 금지**.
5. **마지막 화** — 누적 성향(현재 MVP: 이전 화 요약 기반)으로 `outline.endings` 중 택1 완결.

### `StoryOutline` (`story-harness/outline/outline-schema.ts`)
```ts
type StoryOutline = {
  genre; tone; logline; structureName;       // 사용 템플릿명
  spine;                                      // 주인공 능동 목표(불변 척추)
  centralMystery: { question; intendedAnswer }; // 작품 관통 질문 + 내부용 정답
  cast: { name; role; want; secret? }[];      // 주인공 + 재등장 인물
  relationships: { between; dynamic; arc }[];
  beats: { index; function; centralAdvance; protagonistStake; plant?; payoff? }[]; // length=estimatedChapters
  endings: { id; condition; shape }[];        // 2~3개
};
```
기본 챕터 수 **12**(stories.ts, `STORY_CHAPTER_COUNT`로 override). 하위호환: outline 없으면
`loadStoryBible().outline=null` → 빌더가 Phase A/레거시 경로로 폴백.

---

## 1. 제품 컨셉 (2026-06-23 재정의)

**이전:** "AI가 일관된 장편소설을 자율 집필한다." → 실패. 매 화가 떠다니고 같은
자리를 맴돌았다(딥리서치상 "3-chapter cliff", "lost in the middle"). 원인은
전역 아웃라인 부재 + **손실 압축 recap(1,200자 텍스트 하나)** 이라는 아키텍처 결함.

**현재:**
> **얇은 척추(주인공의 능동적 목표 `drive`) 위에서, 매 챕터가 직전 선택의 직접
> 결과로 흥미로운 사건 1개를 터뜨리고, 짧은 호 단위로 떡밥을 깔고 회수하는, 인과적
> 선택과 높은 가독성을 가진 인터랙티브 픽션.**

목표는 "AI가 자율로 명작 장편을 쓴다"(불가능)가 아니라 "독자 선택으로 굴러가는,
챕터 단위로 재미있고 안 무너지는 경험"(달성 가능). 인터랙티브 포맷이 가장 어려운
부분(전역 일관성)을 우회시켜준다.

### 5개 축
1. **척추(drive)** — 주인공의 "현재 능동적 목표"를 구조적 상태에 둠. 매 화가 이
   목표로 진전/위협받게.
2. **사건 강제 + 비트 회전** — 매 화 = 직전 선택의 직접 결과 사건 1개 + 끝에 새 훅
   1개. 같은 비트(대면/발견/외부위협/관계변화/반전/대가표면화) 반복 금지.
3. **구조적 상태 메모리(JSONB)** — 손실 recap → `threads.story_state`로 교체.
4. **인과 선택지** — 선택지 = 이번 화 사건에 대한 인물의 능동적 대응, 각자 명백히
   다른 다음 사건을 낳음. "후퇴 선택"(상황 진전 못 시키는 것) 금지. (개수는 2개 유지)
5. **문체 가드레일 + 짧은 길이** — 역설/대구 남발·telling·추상 독백·모티프 반복
   금지, 문장 길이 다양화, 장면·대사 중심. 챕터 길이 ~1,800–2,800자(CJK).

### 클라이언트 무수정 보장
두 클라(루트 Expo 앱, `web/` 토스 미니앱)는 선택지를 `.map()`으로 동적 렌더하고
situation/question/content를 nullable로 처리한다. **응답 계약(필드·shape)과
"비종결 챕터 선택지 정확히 2개" 규칙을 유지하면 클라 수정 0.** → 전부 백엔드 작업.

---

## 2. 2단계 하네스 파이프라인

생성 경로는 `story-harness/`가 유일하다(직접 생성 경로는 2026-06-23 제거).

```
draft (본문)  ──▶  [짧으면] extend (이어쓰기)  ──▶  structure (situation/question/choices)
   opus-4.7              opus-4.7                          opus-4.7
```

- **Step 1 — draft**: 챕터 본문(content)과 제목만 생성. 선택지·질문은 안 만든다.
  본문 안에 선택지 리스트/독자 질문을 쓰는 것 금지.
- **Step 1b — extend**: 본문 길이가 `EXTEND_TARGET`(=1800자) 미만이면 이어쓰기 1콜
  추가. 새 챕터 시작 금지, 마지막 장면을 자연스럽게 "계속". 부족분 `max(deficit, 400)`.
- **Step 2 — structure**: 완성된 본문을 읽고 situation/question/choices(첫 화는
  story bible까지) 추출. 본문에 없는 새 사건 생성 금지. choices는 구조 단계에서
  `.min(2).max(6)`로 받되 `assemble()`에서 정확히 2개로 클램프(클라 호환).

모델: 본문/구조 모두 **opus-4.7**(문장력 최상위, KEEP). 상태/모더레이션은 haiku-4-5.

> Phase B에선 이 draft가 **아웃라인 비트 렌더**(render-outline-prompt.ts)로 대체된다.
> 아래 2단계 설명은 outline이 없는 폴백 경로 기준.

프롬프트 버전 상수: `story-harness/types.ts`
- `FIRST_CHAPTER_HARNESS_PROMPT_VERSION = 'first-chapter-harness@2026-06-25-C'`
- `NEXT_CHAPTER_HARNESS_PROMPT_VERSION  = 'next-chapter-harness@2026-06-25-C'`

---

## 3. 메모리 모델

세 축으로 분리:

| 저장소 | 성격 | 내용 |
|---|---|---|
| `story_bibles.canon` | 불변(immutable) | 사용자 원 설정의 핵심 전제(죽음/전생/장르 등). 재해석 금지 가드레일. |
| `story_bibles.blueprint` (JSONB) | 불변(전역 계획) | **청사진(Phase A)** — 생성 시 1회 opus-4.7로 작성. 장르 고정 + 척추 + fraction 기반 마이크로-아크(떡밥 plant→payoff 스케줄). |
| `threads.story_state` (JSONB) | 롤링(가변) | 진행 상태. 매 화 Haiku가 갱신. |

### `StoryBlueprint` 구조 (`story-harness/blueprint/`, Phase A 2026-06-23)
```ts
type StoryBlueprint = {
  genre: string;            // 단일 확정 장르(이후 불변 잠금) — stories.genre도 이걸로 일치시킴
  genreConventions: string[];
  avoid: string[];          // 추리·미스터리화 금지 포함
  spine: string;            // 주인공 핵심 능동 목표(불변)
  centralQuestion: string;
  endingDirection: string;
  arcs: { fromProgress; toProgress; goal; plant; payoff }[]; // progress(=n/total) 기반, 길이 무관
};
```
**왜**: "전역 아웃라인 부재"로 매 화가 즉흥 누적 → 떡밥 폭주 + 장르 미스터리 쏠림. 청사진이
각 화에 구체적 역할(아크)·장르 고정·plant→payoff 스케줄을 주입한다. 생성 위치:
`run-first-chapter-harness.ts`의 `saveStoryBible()` 직후(비치명적 try/catch). 로드:
`loadStoryBible()`가 zod 검증해 snapshot에 포함(검증 실패/null이면 빌더가 폴백).

### 떡밥 회수 강제 (`narrative-phase.ts` `hookDirective()`)
EventBeat(장면 결)와 **직교**한 떡밥 회계 축: progress·열린떡밥수로 `plant_ok`/`payoff_due`/
`converge`를 산출. `buildNextDraft`가 이를 언어별 지시로 렌더 + 현재 openLoops에서 가장
오래된 것부터 회수 지정 + 중반(>0.45) 이후 net 증가 금지. 기존 "매 화 끝 훅 의무"는 완화
(끝 훅 = 계획된 질문이거나 방금 회수한 떡밥에서 파생된 것만).

### `StoryState` 구조 (`lib/ai/story-generation.ts`)
```ts
type StoryState = {
  drive: string;                                      // 주인공의 현재 능동적 목표(척추)
  openLoops: string[];                                // 열린 떡밥(미해결)
  characterStates: { name: string; state: string }[]; // 인물 상태/관계
  lastEvent: string;                                  // 직전 화에서 벌어진 사건
  lastChoiceConsequence: string;                      // 직전 선택이 부른 결과
  locationTime: string;                               // 현재 위치/시점
};
```
zod로 검증(`StoryStateSchema`). `formatStoryState()`가 프롬프트용 블록으로 렌더 —
**구조 라벨은 중립 영어 키**(모델이 출력 언어와 무관하게 읽음), 값은 이미 스토리 언어.

### 갱신 흐름 (`updateStoryState()`, Haiku, 챕터당 1콜)
입력: prevState + 방금 완성된 챕터 본문 + 직전 선택 + canon →
출력: zod 검증된 갱신 StoryState. canon 모순 금지. 챕터 1은 prevState=null,
chosenOption=null. 구 `generateStoryRecap()`를 대체.

전환기 호환: `story_state`가 비어있는(리팩토링 이전 생성) 스레드는 빌더가
`previousChaptersSummaries` 나열로 폴백. `recap` 컬럼은 비파괴 위해 남겨둠(미사용).

---

## 4. 큐 흐름 (비동기)

```
POST /threads/:id/choose  ──▶  STORY_GENERATION_QUEUE  ──▶  consumer
                                                              │
            ┌─────────────────────────────────────────────────┤
            ▼                                                   ▼
generateFirstChapterBackground                    generateNextChapterBackground
  · runFirstChapterHarness                          · runNextChapterHarness
  · chapters 저장 (status=ready)                    · chapters 저장 (status=ready)
  · stories 저장 (title/genre)                      · updateStoryState → threads.story_state
  · updateStoryState → threads.story_state          · 푸시 알림(best-effort)
  · 커버 이미지 워커 호출(best-effort)
  · 푸시 알림(best-effort)
```

- consumer(`story-generation-consumer.ts`): max 4 delivery attempts + 지수 백오프 재시도.
- 본문 저장은 `status='generating'` 조건부 업데이트(중복 처리 방지).
- `updateStoryState`는 try/catch로 감싼 **비-치명** 단계(실패해도 챕터는 이미 저장됨).

컨텍스트 조립: `routes/threads.ts`의 `/choose`에서 `threads.story_state` 로드 →
`ContinuationContext.storyState`로 전달.

---

## 5. 품질 게이트 (`validation/chapter-quality.ts`)

**객관적·구조적 결함만** 생성을 게이트한다(본문 길이는 게이트하지 않음 — 짧으면
extend가 해결):
- 단락 수 < `MIN_PARAGRAPHS`(=5) → 재시도
- 비종결 챕터 선택지 ≠ 2개 → 재시도 **(클라 호환 핵심 게이트, 유지)**
- 종결 챕터 선택지 존재 → 재시도
- 질문/선택지가 수동적·진부(`TRIVIAL_PATTERNS`) → 재시도
- 두 선택지 완전 중복 → 재시도

"stakes"/"distinctness" 점수는 텔레메트리용으로 계산만 하고 게이트하지 않는다.
이 게이트는 **구조(shape)만** 본다 — 의미적 품질은 §8의 LLM 심사가 측정한다.

---

## 8. 관측 · 디버깅 · 품질 측정 (2026-06-24)

"이야기가 이상할 때 무엇이 문제인지"를 추적·측정하는 인프라.

### (A) 추적 가시성 — `generation_runs` 테이블
챕터 생성 시도마다 1행(`logging/generation-run-logger.ts`). 컬럼: stage·status·attempt·
model·promptVersion·**inputSnapshot**·**outputSnapshot**·**qualityScores**·error·elapsedMs +
story/thread/chapter FK.
- **실제 프롬프트 + 사용 비트 저장**: `create{First,Next}ChapterPackage`가 `debug{draftSystem,
  draftPrompt, structurePrompt, beatIndex, beatFunction, mode}`를 반환 → `outputSnapshot.debug`.
  (이전엔 프롬프트가 어디에도 없었음. 전체 storyBible 중복 적재는 요약으로 축소.)
- **아웃라인 생성도 기록**: stage=`outline`(chapterNumber=0), outputSnapshot에 전체 아웃라인.
- stage 값: `outline` | `first_chapter_package` | `next_chapter_package`.

### (B) 의미적 품질 측정 — `chapter_judgements` 테이블 + `quality/judge-chapter.ts`
매 화 생성·노출 **후** sonnet이 채점(비치명적, background.ts; 게이트 아님 = 측정). 컬럼:
overall(0~100)·scores·flags·rationale.
- scores: coherence(0-5)·**centralAdvance**(중심 미스터리 전진 0-2)·**protagonistFocus**
  (주인공 척추 0-2)·choiceExecuted(선택 실제 실행).
- flags(true=문제): **orphanHook**(고아 떡밥)·**spineHijack**(조연이 주인공 납치)·**genreDrift**.

### 조회 도구 — `scripts/story-debug.mjs`
```
node scripts/story-debug.mjs <threadId> [--prompts]
```
아웃라인 요약 → 화별 [상태·비트·품질 게이트·심사 점수·플래그·근거] → 평균 점수 + 플래그 누적.
DATABASE_URL은 `.env.local`에서 읽음.

---

## 6. 언어별 프롬프트 (`drafting/harness-prompts/`)

`{ko,en,ja,zh-hant}.ts`가 각각 `HarnessGuide`를 export, `index.ts`의
`GUIDES: Record<StoryLang, HarnessGuide>` + `harnessGuide(lang)`로 조립.
en.ts는 비-네이티브 폴백 언어(id/es 등)에 `langOverride()` 적용.

모든 언어 동일 패턴(공유 상수로 분리):
- `*_EVENT_BEAT: Record<EventBeat,string>` — 비트 회전 힌트
- `*_PROSE_GUARDRAIL` — 문체 가드레일(역설 남발 금지·showing·모티프 반복 금지·문장
  길이 다양화·대화 활용)
- `*_LENGTH` — 1,800–2,800자(en은 1,000–1,600 words), 8–14문단
- `*_CHOICE_RULES` — 인과·능동 선택지, 각 선택이 다른 다음 사건, 관망/회피/후퇴 금지

`buildNextDraft`는 `formatStoryState(a.storyState)`(폴백: summaries) 주입 +
"[이번 화의 사건 — 가장 중요]" 블록(사건 강제 + 끝 훅 + drive 진전 +
`chapterEventBeat(nextChapterNumber)`로 비트 회전).

비트 회전: `drafting/narrative-phase.ts`의 `EVENT_BEAT_CYCLE`(6비트) +
`chapterEventBeat(n) = cycle[(n-2) mod 6]`. 기존 arc phase(기승전결,
`narrativePhase`)와 병행.

---

## 7. 검증 (E2E)

1. `cd workers/api && npx tsc --noEmit` (exit 0)
2. Neon `story_state` 컬럼 확인: `ALTER TABLE threads ADD COLUMN story_state jsonb;`
3. `cd workers/api && npx wrangler deploy`
4. 신규 스토리 생성 → 4화까지 진행
5. 로그: `scripts/cf-logs.sh --since 5m` + `wrangler tail` — `[harness:*]`, `[state]` 확인
6. DB(Neon `run_sql`): 길이 ~1,800–2,800, 매 화 사건+끝 훅, 선택지 2개가 서로 다른
   다음 사건 암시, `threads.story_state` JSONB가 떡밥/인물/직전결과로 채워짐
7. 클라 회귀: 앱/웹 리더에서 챕터·선택지 정상 렌더

## 롤백
컬럼 추가는 nullable·비파괴 → 코드만 직전 배포로 되돌리면 즉시 복구. story_state는 무시됨.
