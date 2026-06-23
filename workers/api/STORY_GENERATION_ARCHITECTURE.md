# Weave Story — 스토리 생성 아키텍처 (정본)

Last updated: 2026-06-23

이 문서는 Weave Story의 AI 챕터 생성 파이프라인의 정본 설계문서다. 코드가 진실의
원천이지만, "왜 이렇게 설계했는가"와 전체 흐름은 여기에 정리한다.

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

프롬프트 버전 상수: `story-harness/types.ts`
- `FIRST_CHAPTER_HARNESS_PROMPT_VERSION = 'first-chapter-harness@2026-06-23-1'`
- `NEXT_CHAPTER_HARNESS_PROMPT_VERSION  = 'next-chapter-harness@2026-06-23-1'`

---

## 3. 메모리 모델

두 축으로 분리:

| 저장소 | 성격 | 내용 |
|---|---|---|
| `story_bibles.canon` | 불변(immutable) | 사용자 원 설정의 핵심 전제(죽음/전생/장르 등). 재해석 금지 가드레일. |
| `threads.story_state` (JSONB) | 롤링(가변) | 진행 상태. 매 화 Haiku가 갱신. |

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
