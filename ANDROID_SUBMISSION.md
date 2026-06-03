# Google Play 출시 체크리스트 (Weave Story / Android)

Last updated: 2026-06-03
개발자 계정: **LEE JAHUN** (개인 계정, ID 8687266146434394437, leejahun9@gmail.com)
패키지명: `com.leejahun.weavestory` (app.json와 일치)
앱 ID(Play): `4975060960175249342`

상태 범례: ⬜ 미착수 · 🟦 진행 중 · ✅ 완료 · ⏭️ 보류/후속 · ⚠️ 주의

> ## 진행 요약 (2026-06-03)
> - ✅ **🎉 클로즈드 테스트(Alpha) 심사 제출 완료!** 게시 개요 → "검토를 위해 변경사항 14개 전송" 완료. 사전 자동검사 통과 후 정식 심사(보통 7일 이내).
> - ✅ 개발자 등록·본인 인증·**전화번호 인증** 완료 → 계정 활성
> - ✅ **앱 "Weave Story" 생성** (en-US, 앱, 무료)
> - ✅ **Android AAB(vc8, 리뷰어 데모 로그인 포함) 업로드·릴리스 생성** — Alpha 트랙. AAB `fRjzwWcvgNJNKQpbwP9rYU.aab`. 1.0.0, targetSDK 36, 50.7MB. ⚠️ 매핑파일 없음 경고(무해).
> - ✅ **앱 콘텐츠 11/11 완료**: 개인정보처리방침·앱액세스권한(리뷰어 데모)·광고·콘텐츠등급·타겟층(18+)·데이터보안·정부앱·금융·건강 + 앱카테고리(엔터테인먼트)·연락처·스토어등록정보
> - ✅ **스토어 등록정보 완성**: 아이콘·그래픽이미지·스크린샷5·제목·짧은/전체 설명·출시노트(en-US). ⚠️ supply 함정: 아이콘/그래픽이미지는 `images/icon.png`·`images/featureGraphic.png` **단일 파일**이어야 함(스크린샷만 하위폴더). 하위폴더(`images/icon/icon.png`)면 업로드 무시됨.
> - ✅ **국가/지역 = 전체 177개국**, **테스터 = 이메일목록 "Weave Story Closed Test"**(현재 jhlee@k-doc.kr 1명), 의견 이메일 jhlee@k-doc.kr
> - ⬜ **🚨 (사용자 필수) 테스터 11명 이상 추가** → 비공개 테스트 트랙 "Weave Story Closed Test" 이메일 목록에 실제 Google 계정 12명+ 추가. **12명+가 14일 연속 옵트인**해야 프로덕션 액세스 신청 가능. (현재 1명만 등록됨)
>   - 리뷰어 데모 로그인 코드: `weave-review-9f3k` (로그인 화면 "Reviewer access" → 코드 입력 → Enter)

---

## 0. 계정 설정 (1회성)
- ✅ 개발자 등록($25), **본인 인증 완료**(2026-06-03)
- ✅ **연락처 전화번호 인증 완료** → "앱 만들기" 활성화됨
- ⚠️ **개인 계정 비공개 테스트 의무**: 프로덕션 출시 전 **테스터 12명 이상이 14일 연속 옵트인한 비공개 테스트** 완료 후 프로덕션 액세스 신청 가능. (Google이 20→12명으로 완화) → **출시 타임라인 변수. 테스터 12명 확보 필요(사용자).**

## 1. 앱 생성 & 빌드
- ✅ "앱 만들기" 완료 — Weave Story, en-US, 앱, 무료
- ✅ **Android App Bundle(.aab) 빌드 완료** — versionCode 7, AAB 아티팩트 URL 위 참조
- ✅ Play 앱 서명: EAS 관리 keystore(Build Credentials aBJQdfbBcN) 사용 → 업로드 시 자동
- ✅ 패키지명/버전/아이콘/스플래시 (app.json android 설정)
- 🟦 **API 업로드 준비**: Google Play 서비스 계정 생성 + JSON 키 + Play 연동/권한 → `eas submit -p android` 또는 `fastlane supply`
  - 방식: Google Cloud Console에서 서비스 계정+키 생성 → Play Console "사용자 및 권한"에서 SA 이메일에 권한 부여 (구 "API 액세스" 페이지는 폐지됨)
  - ⚠️ Play Console 앱 단위 페이지(앱 콘텐츠 등) 직접 URL 접근 시 일시 오류 반복 → SPA 내비 클릭으로 우회 필요
  - ✅ GCP 약관 동의(사용자 1클릭), 프로젝트 **`weave-story-498307`** 생성
  - ✅ 서비스 계정 **`play-publisher@weave-story-498307.iam.gserviceaccount.com`** 생성 + **JSON 키 발급** → `~/Downloads/weave-story-498307-7037201e6747.json`
  - ✅ Google Play Android Developer API 활성화
  - ✅ Play Console "사용자 및 권한"에서 SA에 **관리자 권한 부여**(CI/CD용 — 추후 최소권한 조정 가능)
  - ✅ **fastlane supply 업로드 성공**: AAB(vc7) → **비공개 테스트(alpha) 트랙 draft**, 스토어 등록정보(제목·짧은/전체 설명), 이미지(아이콘·그래픽이미지·스크린샷5) 전부 업로드
    - supply 메타데이터 경로 주의: `--metadata_path`는 언어 폴더를 담은 디렉터리(`/tmp/play-meta/android`)를 가리켜야 함(상위 주면 "android"를 언어로 오인 → Invalid request)
    - 재사용: AAB `/tmp/weave-story.aab`, 메타 `/tmp/play-meta/`, 키 `~/Downloads/weave-story-498307-7037201e6747.json`

## 2. 스토어 등록정보 (Store listing) — 대부분 iOS 자산 재활용 가능
- ⬜ 앱 이름(30자), **짧은 설명(80자)**, 전체 설명(4000자) — 영어/한국어
- ✅ 앱 아이콘 512×512 제작 (`/tmp/play/icon-512.png`)
- ✅ **그래픽 이미지 1024×500 제작** (`/tmp/play/feature-graphic.png` — 포크패스 장면 + Weave Story)
- ✅ 휴대전화 스크린샷 5장 제작 (`/tmp/play/shot-1..5.png`, 1480×2868 = Play 2:1 이내. iOS 5종 재가공)
- ⬜ 태블릿 스크린샷(선택)
- ✅(재활용) 개인정보처리방침 URL `https://weave-story-api.leejahun0.workers.dev/privacy`
- ⬜ 카테고리, 태그, 연락처(이메일/웹사이트)

## 3. 앱 콘텐츠 / 정책 선언 (App content) — iOS와 1:1 대응 많음
- ⬜ 개인정보처리방침 URL (위 재활용)
- 🟦 **앱 액세스 권한 = (A) 데모 로그인 구현 완료·배포**
  - ✅ 서버 `POST /api/auth/demo`(시크릿 `DEMO_LOGIN_CODE=weave-review-9f3k`, 데모계정 크레딧50) — **배포·검증 완료**(틀린코드 401, 맞는코드 200)
  - ✅ 앱: 로그인 화면 "Reviewer access" → 코드 입력 → 데모 로그인 (api.ts/context.tsx/login.tsx)
  - ✅ Android AAB **리빌드 완료(vc8, 리뷰어 로그인 번들)** + supply로 alpha 트랙 재업로드 (`fRjzwWcvgNJNKQpbwP9rYU.aab`)
  - ✅ **앱 액세스 선언 저장 완료** — "앱의 전체 또는 일부 기능이 제한됨" → 안내 "Reviewer demo sign-in"(사용자 이름/비밀번호 = `weave-review-9f3k`, 기타 정보에 단계 안내). ⚠️ 함정: 안내 모달 하단 **"앱에 액세스하는 데 다른 정보가 필요하지 않음" 체크박스가 필수 확인 항목** — 체크 안 하면 "다른 정보가 필요한가요?" 빨간 오류 + "변경사항을 저장할 수 없습니다"로 추가 버튼이 조용히 실패함(네트워크 요청 없음). 체크하면 통과.
- ✅ 앱 콘텐츠 선언 완료: 개인정보처리방침·광고(없음)·**콘텐츠등급**(성인향 IARC)·광고ID(없음)·정부앱(아니요)·금융(없음)·건강(없음)
- ✅ **타겟층 = 만 18세 이상** (ESRB 청소년+ 라 13세 미만 비활성. 무필터 성인향 AI 픽션 → 18+ 단독 선택. 18+ 선택 시 아동 관련 단계 2~4 자동 생략 → 요약 바로 저장)
- ✅ **데이터 보안(Data safety) 양식 완료** — 5단계 마법사:
    - 전송 암호화 = 예(HTTPS/CF), 계정 생성 = OAuth(Google/Apple), 삭제 요청 URL = `https://weave-story-api.leejahun0.workers.dev/support`(지원 FAQ에 회원 탈퇴 단계 명시), 계정 미삭제 부분삭제 = 아니요
    - 데이터 유형/취급: **개인정보**(이름·이메일·사용자ID → 수집·비임시·필수·앱 기능+계정 관리), **금융**(구매 내역 → 앱 기능), **앱 활동**(기타 사용자 제작 콘텐츠=스토리 → 앱 기능), **앱 정보 및 성능**(비정상 종료 로그·진단 → Sentry, 애널리틱스)
    - **공유 없음**(Sentry/서버는 처리 위탁 = 수집, 공유 아님). 추적/광고ID 없음
    - ⚠️ 함정: 각 데이터 유형 모달 첫 진입 시 "수집됨" 첫 클릭이 자주 무시됨 → 한 번 더 클릭 필요
- ✅ 생성형 AI / UGC 신고 기능: 인앱 신고(reports.ts) + legal 페이지에 모더레이션 명시(재활용)
- ✅ 정부앱/금융/건강/뉴스 = 해당 없음 선언 완료
- **→ 앱 설정 진행률: 앱 콘텐츠 9/11 (남음: 앱 카테고리·연락처, 스토어 등록정보 최종)**

## 4. 결제 (Google Play Billing)
- ✅ **서버 검증 구현·배포·검증 완료** — `workers/api/src/lib/google-play.ts`(SA OAuth RS256 → Play Developer API), `/purchases/grant` 플랫폼 분기. 워커 시크릿 `GOOGLE_PLAY_SA_CLIENT_EMAIL`·`GOOGLE_PLAY_SA_PRIVATE_KEY` 설정 + 배포(ver ddc3e212). 스모크 테스트: 가짜 토큰 → `[google-verify] HTTP 400 Invalid Value`(=OAuth·권한 정상, 토큰 값만 거부) → 402. **실 구매 토큰이면 검증 성공 구조.**
- ✅ **앱 코드** — Android `requestPurchase({google:{skus}})`, `purchaseToken`+`platform` 서버 전송 (`context.tsx`/`grant-purchase.ts`/`fetch.ts`). iOS 영향 없음. 커밋 e56c696.
- ✅ **Google Payments 결제 프로필 연결 완료** — 기존 개인 프로필 "이자훈 Play용 개인 프로필"(ID 5969-4260-9578) 선택·연결. 공개 판매자 프로필 입력(업체명 Weave Story, 카테고리 컴퓨터 소프트웨어, 지원이메일 jhlee@k-doc.kr, 명세서명 Weave Story). ⚠️ **정산 은행 계좌(지급받을 방법)는 미등록** — 수익 정산 시 사용자가 추가 필요(상품 생성/구매에는 불필요).
- ✅ **인앱 상품 2개 생성·활성화 완료** (Play Console 일회성 제품, 구입 유형, 173개국, 이전 버전 호환):
    | 상품 ID | 구매옵션ID | 이름 | 크레딧 | USD | KRW(한국·정확) |
    |---|---|---|---|---|---|
    | `com.leejahun.weavestory.credits_starter_3` | credits-starter-3 | Starter Pack | 3 | ~$2.87-2.99 | **₩4,400** |
    | `com.leejahun.weavestory.credits_value_10` | credits-value-10 | Value Pack | 10 | ~$7.83-7.99 | **₩12,000** |
    - KRW 기준 입력(한국은 iOS와 정확히 동일), 타 지역은 Google 자동 환산.
- ✅ **Android AAB(vc9, 결제 코드) 빌드 완료** — EAS build `9c3744ae`, versionCode 9, AAB `khQfkJxUpW53b9sjrxhov7.aab` (로컬 `/tmp/weave-story-vc9.aab`)
- 🚫 **(사용자 필수·블로커) 한국 개발자 추가 정보** — 유료 인앱 상품 생성으로 **전자상거래법 준수 정보**가 필요해짐. Play Console > 개발자 계정 > 계정 세부정보 > "한국 개발자의 경우 추가 정보 필요"에 입력:
    - **사업자 등록 번호** (사업자등록증)
    - **전자상거래 라이선스 번호** (통신판매업 신고번호)
    - **전자상거래 라이선스 대행사** (신고 수리 기관/지자체)
    - ⚠️ 이게 없으면 **vc9(유료 결제 포함) 업로드가 API에서 차단됨** (`supply` 에러: "To comply with Korean law, developers in Korea must provide additional information"). Claude 입력 불가(실제 법적 등록번호). 사업자등록·통신판매업 신고가 없으면 먼저 발급 필요.
    - **현재 vc8(리뷰어 로그인, 결제 없음)은 클로즈드 테스트에 이미 라이브** — 앱 테스트는 가능, 결제(vc9)만 블로킹됨.
- ⬜ 위 해결 후: vc9 alpha 업로드 → 클로즈드 테스트에서 샌드박스 결제 검증

## 5. 출시
- ✅ 국가/지역 선택(177개국 전체), 무료
- ✅ 비공개 테스트 트랙(Alpha)에 AAB(vc8) 릴리스 생성 + 출시노트 + 테스터 목록 + **심사 제출 완료(2026-06-03)**
- ⬜ **(사용자) 테스터 12명+ 14일 연속 옵트인** → 프로덕션 액세스 신청 → 프로덕션 심사
- ⬜ 심사 결과 확인(보통 7일 이내). 승인 시 관리형 게시 OFF라 즉시 클로즈드 테스트 게시됨

---

## 내가(Claude) 할 수 있는 것 / 사용자가 해야 하는 것
- **Claude 가능**: Android AAB 빌드(eas), 스토어 등록정보·앱콘텐츠 폼 작성(브라우저), feature graphic/스크린샷 제작, 데이터보안·콘텐츠등급 설문, 서버 Google Billing 검증 코드.
- **사용자 필수**: ① 연락처 전화번호 SMS 인증 ② 비공개 테스트 테스터 20명 확보·14일 대기 ③ (필요시) 로그인 자격증명.
