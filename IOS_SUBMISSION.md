# iOS App Store 심사 제출 체크리스트

Last updated: 2026-06-04

상태 범례: ⬜ 미착수 · 🟦 진행 중 · ✅ 완료 · ⏭️ 보류/후속

> **2026-06-04 다국어:** v1.0 심사 빼고 **en/ja/ko** 현지화(이름·부제·설명·키워드·프로모·개인정보·지원URL) + **6.7″ 스크린샷 en/ja/ko 5장씩**(옛 6.5″ 제거, iPad 12.9″는 en 유지·ja/ko 상속) 추가 후 **재제출(WAITING_FOR_REVIEW)**. 모두 ASC API로 처리. 카피=`store-assets/store-copy.json`, 시크릿/식별자=`SECRETS_AND_ENV.md`.

> ## 🚀 2026-06-03 · **App Store 심사 정식 제출 완료** (상태: "1.0 심사 대기 중")
> 빌드 34 + 메타데이터/스크린샷(iPhone 6.5" 5장 + iPad 5장) 전부 포함. 심사 최대 48시간, 완료 시 이메일. 출시=수동.
> 제출 막판 추가 처리: 가격=무료(175개 지역), iPad 스크린샷 필수라 생성·업로드. 신규 ASC API 키 "Screenshot Upload"(TN83PW567A) 발급해 fastlane deliver로 업로드.
> 후속(선택): Apple Sign In 키 설정, 워커 /support 커밋, 한국어(ko) 현지화, 불필요 시 ASC API 키 폐기.

## 🔴 심사 탈락 확정급 (블로커)

- ✅ **1. 인앱 계정 삭제(회원 탈퇴)** — Apple 5.1.1(v) *(코드 완료·배포 68a7197b)*
  - ✅ 백엔드 `DELETE /api/me` (본인 + 연쇄 데이터 삭제, cascade)
  - ✅ Apple 토큰 폐기 코드 구현 (로그인 시 authorizationCode→refresh token 저장, 삭제 시 `/auth/revoke`) — **⚠️ Apple Sign In 키 설정 필요(아래)**. 키 없으면 폐기는 skip되고 계정 삭제는 정상 동작.
  - ✅ profile 화면 "회원 탈퇴" 버튼 + 확인 플로우
  - ✅ i18n (ko/en/ja)
  - ✅ 삭제 후 로그인 화면 이동
  - ✅ DB: `accounts.apple_refresh_token` 컬럼 추가
  - ⬜ **(사용자)** Apple Sign In 키(.p8) 발급 + 워커 시크릿 3종 설정 → 토큰 폐기 활성화
  - ⬜ **(사용자)** 앱 리로드/리빌드 (회원탈퇴 UI·authorizationCode 캡처는 JS 변경)
- 🟦 **2. AI 생성물 신고/모더레이션** — Apple 1.2 (UGC) *(신고 기능 완료·배포 f69601fe)*
  - ✅ 챕터 신고 UI (reading 리본의 🚩 → 사유 선택 시트)
  - ✅ `POST /api/reports` + `content_reports` 테이블 + `chapters.moderation_status`(신고 시 'reported')
  - ✅ i18n (ko/en/ja, 사유 5종: 성적/폭력/혐오/불법/기타)
  - ⏭️ 시스템 프롬프트 안전 가드레일 — *사용자 결정으로 보류*
  - ⏭️ 입력 프롬프트 안전 필터 — *사용자 결정으로 보류*
  - ⬜ **(사용자)** 앱 리빌드 후 실기기에서 신고 동작 검증
- ✅ **3. 약관·개인정보처리방침 작동 링크** — IAP 3.1.2 / 5.1.1 *(배포 40aff549)*
  - ✅ worker가 `/privacy`·`/terms` HTML 서빙 (지원 이메일 leejahun0@gmail.com)
  - ✅ login + paywall에 탭 가능한 링크
  - App Store Connect 입력값: 개인정보 URL `https://weave-story-api.leejahun0.workers.dev/privacy`, 지원 URL/이메일 `leejahun0@gmail.com`
- ✅ **4. 구매 복원(Restore Purchases) 버튼** — paywall 하단 "구매 복원" 추가

## 🟡 확인/보완

- 🟦 App Store Connect 메타데이터 (leejahun0 브라우저, 앱 정보 페이지 저장 완료)
  - ✅ 부제목 "Weave your own AI story", 카테고리 도서(Books)
  - ✅ 콘텐츠 권한: 타사 콘텐츠 없음(아니요)
  - ✅ 연령 등급: **13+** (자동 계산, 재정의 안 함 — 사용자 결정). 한국 12+, 브라질 A14, 173개국 13+. *(새 ASC 체계엔 17+ 없음 → 16+/18+만 상향 가능했으나 13+ 유지 선택)*
  - ✅ 개인정보처리방침 URL: `https://weave-story-api.leejahun0.workers.dev/privacy`
  - ✅ **App 개인정보 설문 게시 완료** — 7개 데이터 유형, 모두 추적(Tracking) 없음:
    - 연결됨(앱 기능): 이름, 이메일, 기타 사용자 콘텐츠, 사용자 ID, 구입 내역
    - 미연결(앱 기능): 충돌 데이터, 실적 데이터 *(Sentry — setUser/sendDefaultPii 미설정 확인)*
  - ✅ 버전 정보 입력 완료(영어): 프로모션 텍스트, 설명, 키워드, 저작권(2026 Jahun Lee)
  - ✅ 빌드 34 선택(새 트리 아이콘 확인됨)
  - ✅ 심사 노트(영어): SIWA/Google 로그인 안내(데모계정 불요), IAP 샌드박스, AI UGC 신고/모더레이션, 회원탈퇴
  - ✅ 심사 연락처: Lee Jahun / leejahun0@gmail.com — ⬜ **전화번호(필수, 사용자 입력 필요)**
  - ✅ "로그인 필요" 해제(OAuth 전용이라 데모 username/pw 없음)
  - ✅ 출시 방법: **수동 출시** 선택(사용자 결정) *(전화번호 입력 후 저장 시 확정)*
  - ✅ **지원 URL**: 워커 `/support` 페이지 배포 완료(ko/en/ja, 200 확인) → `https://weave-story-api.leejahun0.workers.dev/support` 입력 *(전화번호 입력 후 저장 시 확정)*
  - ✅ **전화번호** 입력 완료(+82 10 3441 4148) → 지원URL·수동출시 포함 **전체 저장 성공**
  - ✅ IAP 첫 심사 동봉: **Credits Starter 3 + Credits Value 10**(소모품) 버전에 추가됨. *(Premium Monthly 자동갱신 구독은 앱 미구현 추정 → 제외. 추후 정리 권장)*
  - ✅ **스크린샷 업로드 완료** (iPhone 6.5" 슬롯, en-US, 5장): gpt-image-2 아트 + 또렷한 앱 UI 오버레이 + Fraunces 캡션, 1284×2778.
    - 순서: ①Every choice writes your story ②You decide what happens next ③Chapters written as you read ④A shelf of stories only you have read ⑤Start from a single spark
    - 업로드 경로: `fastlane deliver`(ASC API). 브라우저 file_upload는 사용자 첨부 파일만 허용해 불가 → API로 처리.
    - **신규 ASC API 키 발급**: 이름 "Screenshot Upload", Key ID `TN83PW567A`, 역할 앱 관리(App Manager), Issuer `095b3013-…`. .p8: `~/Downloads/AuthKey_TN83PW567A.p8`. 불필요 시 ASC 통합에서 폐기 가능.
    - 스크립트 /tmp/build-shots.js · 아트 /tmp/art/ · 6.5" 리사이즈 /tmp/upload/shot-1..5.png
  - ⬜ **최종 "심사에 추가" 제출**: 스크린샷 후 사용자가 직접 클릭(또는 승인). 출시=수동.
- ⬜ 권한 문자열: `expo-video` 카메라 사용 여부 확인 (미사용이면 OK)
- ⬜ 서버 로그아웃/토큰 폐기 엔드포인트 (현재 로컬 토큰만 삭제)
- ⬜ `eas.json`에 `appleTeamId` 명시 (사소)

## 🎨 앱 아이콘

- ✅ **플레이스홀더(작도선 박힌 기본 아이콘) → 브랜드 미니멀 아이콘 교체** — "갈래길/이야기 나무"(선택→분기) 컨셉, 톤다운 인디고 마크 + 웜 오프화이트(#FEF9F1) 배경, gpt-image-2 생성.
  - `icon.png`(iOS, 1024 불투명), `splash-icon.png`, Android `adaptiveIcon`(foreground/monochrome/backgroundColor), 스플래시 배경색까지 일괄 적용.
  - ⚠️ 아이콘은 **OTA 반영 불가** → 다음 **클린 빌드**에서 적용됨 (CNG: prebuild가 app.json에서 자동 생성).

## 🟢 이미 양호

- ✅ Sign in with Apple (구현 + entitlement)
- ✅ IAP consumable + 서버 영수증 검증 (2026-06-02 수정/배포 완료)
- ✅ PrivacyInfo.xcprivacy (추적 없음, Required Reason API 선언)
- ✅ 외부 결제 링크 없음
- ✅ 번들ID/버전/아이콘/스플래시

---

## 빌드 이력

- **2026-06-02 · build 33** — TestFlight 제출 완료 (커밋 `a44c615`). 포함: IAP 수정·스토리 생성 2단계 견고화·품질 게이트 정리·reading 에러 UI·회원탈퇴 UI.
- **2026-06-02 · OTA(production, iOS)** — 빌드 33에 신고 기능 + 회원탈퇴 반영 (커밋 `3536cdd`, update `7f40ba51`). 리빌드 없이 적용.
- **2026-06-02 · OTA(production, iOS)** — 약관/방침 링크 + 구매 복원 (커밋 `60bea7f`, update `e6cc925e`).
- **2026-06-02 · OTA(production, iOS)** — paywall 다국어(i18n) + 법적 페이지 ko/en/ja (커밋 `d39d3cd`, update `36513d95`).
- ⚠️ **최종 App Store 심사 제출은 클린 빌드 권장**(OTA 의존 X) — 모든 블로커가 바이너리에 포함되도록.
- **2026-06-03 · build 34** — 클린 빌드 + TestFlight 제출 완료 (커밋 `ee99543`). 바이너리 포함: **새 앱 아이콘** + 회원탈퇴 + 신고 + 약관/방침 링크 + 구매복원 + paywall 다국어. → Apple 처리 후 실기기 검증 + 심사 제출 준비.

## 작업 메모

### 현재 작업: 회원 탈퇴 (블로커 1)
- 스키마: 모든 사용자 데이터가 `users` 기준 `onDelete: cascade` → `DELETE users` 한 번으로 연쇄 삭제 확인됨.
- Apple 토큰 폐기: 현재 로그인 플로우가 Apple authorization code/refresh token을 저장하지 않음. 완전 준수하려면 (a) 로그인 시 authorizationCode 저장 (b) Apple Sign In 키(.p8) 발급 (c) 삭제 시 Apple `/auth/revoke` 호출 필요.
