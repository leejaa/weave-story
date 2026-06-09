# Weave Story — 앱인토스(AppInToss) 웹앱 진행상황

기존 React Native(Expo) 앱 "Weave Story"(AI 인터랙티브 소설)를 **앱인토스 미니앱**으로 출시하기 위한 별도 웹앱. `web/` 하위에 React+Vite로 신규 구현하며, 기존 앱의 화면/디자인/에셋을 충실히 재현한다.

## 스택
- React 18.3 · Vite 5 · TypeScript · react-router-dom v6 (BrowserRouter, CSR)
- TanStack Query (서버 상태) · CSS Modules
- `motion`(구 framer-motion) 12 — 라우트 전환
- `@apps-in-toss/web-framework` 2.6.1 (토스 로그인 SDK, 실연동은 인증서 대기)

## 배포
- **Cloudflare Pages** — `https://weave-story-web.pages.dev` (고정 URL)
- **자동배포**: main 에 `web/**` 푸시 → `.github/workflows/deploy-web.yml` → `vite build` → `wrangler pages deploy`
  - 시크릿 `CLOUDFLARE_API_TOKEN`(등록 완료), account id 워크플로에 하드코딩
- 빌드: `npm run build`=vite(CF Pages용), `npm run build:ait`=ait(앱인토스 아티팩트)
- 미리보기 진입점(배포됨, 인증 우회): `/home`, `/gallery`

## 아키텍처 (역할 분리)
```
src/
  pages/         화면 조립: HomePage, PreviewPage, SetupPage, ReadingPage, StoriesPage, LoginPage, LoadingPage
  components/
    ui/          디자인시스템: Button, Card, Screen, TopBar, Spinner, Tag (+ index)
    nav/         AnimatedRoutes(전환 셸), TabBar, useNavDirection, transitions
    home/        BookCard, BookRail, CoverTitle, HomeBackground, HomeHeadline, BookPreview
    setup/       SetupHeader, PromptInput, SubmitButton, WritingOverlay
    reading/     ChapterRibbon, ReadingPager, TextPage, ChoiceEntryPage, ChoicePage,
                 InterventionPage, GeneratingPage, ChapterErrorPage, EndPage
  features/
    home/        useSampleCards, cards.mock
    setup/       api, copy, useStorySetup(useMutation)
    reading/     api, mock, paginate, build-pages, copy, useReading
    expand/      BookExpand (카드 커버 풀스크린 확대 hero 전환, CSS+타이머)
  lib/           api(fetch+Bearer+ApiError), query-client, query-keys, types, media(R2 URL), auth
  styles/        tokens.css(디자인 토큰), global.css
  dev/           Gallery, gallery-entry, home-entry (프로덕션 미포함 미리보기)
```

## 완료된 화면/기능
- **디자인 시스템** + 토큰. 폰트를 기존 앱과 통일: Fraunces(본문·워드마크)/Plus Jakarta Sans(UI)/DM Mono(모노)/Black Han Sans(한글 헤드라인)/Jua(커버). Google Fonts 로드, 한글은 시스템 폴백.
- **로그인 게이트**: login-bg.mp4 다크 비디오 + 브랜드 + 헤드라인 + 토스 CTA. (login.tsx 동일)
- **홈**: home-bg.mp4 비디오 배경 + 헤드라인(Black Han Sans) + 가로 스크롤 3D 북카드 레일(실제 R2 커버), 하단 탭바(새 이야기/내 이야기).
- **카드 커버 풀스크린 확대 hero 전환**(BookExpandTransition 복원) → 펼친 책 미리보기.
- **펼친 책 미리보기(/preview)**: open-book-scene.png + 왼쪽 페이지(장르/제목/프롬프트) + 오른쪽 페이지(표지), 탭→셋업, X→홈.
- **셋업(/setup)**: 책상/노트 배경 이미지 + 룰드 페이퍼 입력(Jua, 라인=배경 그라데이션으로 텍스트와 정렬) + 제출 + 생성 로딩 오버레이.
- **리더(/reading/:id)**: 챕터 리본 + 가로 스냅 페이저(본문 페이지네이션) + 선택 진입 카드 + 선택지(A/B/C+직접입력) + 개입 구분선 + 생성중/실패/끝 페이지. 목업 3챕터로 읽기→선택→생성→다음→끝 루프 시연.
- **데이터 패칭**: 읽기=`useQuery`(생성 중 8초 폴링, 토큰 없으면 목업 폴백), 쓰기=`useMutation`(성공 시 캐시 무효화). `lib/query-keys` 팩토리.
- **인증 데모**: 브라우저(토스 SDK 없음)에선 `토스로 시작하기` → 토큰 없이 게이트 통과(`getToken()===null` → 목업 모드 유지). sessionStorage 데모 플래그로 새로고침 유지.

## 화면 전환 (transitions)
- **카드 커버 확대**: `features/expand/BookExpand` — CSS `transform` transition(컴포지터 구동) + setTimeout 시퀀싱(520ms 확대 → /preview → 240ms 페이드아웃 → 오버레이 제거). **rAF 스로틀 무관, 프리뷰에서 검증 완료.**
- **라우트 전환(Motion)**: `components/nav/AnimatedRoutes` — AnimatePresence + 경로 키잉. 리더=가로 슬라이드(방향), 셋업=모달업, 탭(/, /stories)=페이드. `useNavDirection`(history.idx)로 push/pop + z-index. prefers-reduced-motion 폴백.
  - ⚠️ **헤드리스 프리뷰는 유휴 시 rAF를 스로틀해 Motion 애니메이션 완주 검증 불가**(실기기/실브라우저는 정상). 사용자 "전환 안 보임" 시 1순위 의심=브라우저 캐시(구버전 JS). 그래도 안 되면 Motion 라우트 전환도 CSS/뷰 트랜지션으로 전환 검토.

## 에셋 (R2: weave-story-media, 공개 pub-3b97af20...r2.dev)
- `videos/login-bg.mp4`, `videos/home-bg.mp4`
- `covers/card-*.png` (10 장르)
- `setup/story-prompt-paper-centered.png`, `home/open-book-scene.png`
- 콘솔 등록용 에셋: `store-assets/appintoss/out/` (로고 라이트/다크 600, 썸네일 1932×828, 스크린샷 636×1048 ×5)

## 남은 작업
### 인증서/콘솔 승인 대기 (Task 3·7·IAP)
- 앱인토스 콘솔 **검토 중**(영업일 2일). 승인 후 mTLS 인증서·AAD_STRING·DECRYPTION_KEY 발급.
- **토스 로그인 실연동**: `appLogin()` → 서버 `/auth/toss`(mTLS→토스 API→JWT). `lib/auth.ts` 의 `isInTossApp()` 분기로 구조 준비됨.
- **백엔드 엔드포인트**(CF Worker): `/auth/toss`, `/purchases/toss`(IAP 크레딧 적립).
- **인앱결제(IAP)** 연동.

### 인증서 무관 (지금 가능)
- **"내 이야기" 목록**(StoriesPage): 현재 빈 상태 플레이스홀더 → 스레드 카드 리스트(커버/제목/장르/진행률/완결 배지, 진행중·완결 섹션). 탭→/reading/:id.
- **프로필/크레딧 표시** 화면.
- (선택) Motion 라우트 전환 실기기 검증 후 튜닝, LazyMotion 번들 최적화(~46kB gz).

## 보안/운영 규칙 (고정)
- JWT_SECRET 값 출력 금지. CF API 토큰은 사용자가 직접 생성(나는 생성/입력 안 함).
- 프로덕션 배포는 사용자 명시 승인 시에만. `weave-story-secrets-backup` R2 비공개 유지.
- Apple 로그인=leejahun0 브라우저, Play 콘솔=leejahun9 브라우저. 항상 한국어 응답.
- 가입 크레딧 기본값 10 (DB 적용 완료).
