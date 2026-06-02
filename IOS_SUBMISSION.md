# iOS App Store 심사 제출 체크리스트

Last updated: 2026-06-02

상태 범례: ⬜ 미착수 · 🟦 진행 중 · ✅ 완료 · ⏭️ 보류/후속

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
- ⬜ **3. 약관(EULA)·개인정보처리방침 작동 링크** — IAP 3.1.2 / 5.1.1
  - ⬜ 약관/방침 페이지 호스팅
  - ⬜ login + paywall에 실제 링크
- ⬜ **4. 구매 복원(Restore Purchases) 버튼** — paywall 또는 profile

## 🟡 확인/보완

- ⬜ App Store Connect: 개인정보처리방침 URL, 지원 URL, App 개인정보 설문, 연령 등급, 스크린샷, 설명, 심사 노트(샌드박스 IAP + AI 콘텐츠 안내)
- ⬜ 권한 문자열: `expo-video` 카메라 사용 여부 확인 (미사용이면 OK)
- ⬜ 서버 로그아웃/토큰 폐기 엔드포인트 (현재 로컬 토큰만 삭제)
- ⬜ `eas.json`에 `appleTeamId` 명시 (사소)

## 🟢 이미 양호

- ✅ Sign in with Apple (구현 + entitlement)
- ✅ IAP consumable + 서버 영수증 검증 (2026-06-02 수정/배포 완료)
- ✅ PrivacyInfo.xcprivacy (추적 없음, Required Reason API 선언)
- ✅ 외부 결제 링크 없음
- ✅ 번들ID/버전/아이콘/스플래시

---

## 빌드 이력

- **2026-06-02 · build 33** — TestFlight 제출 완료 (커밋 `a44c615`). 포함: IAP 수정·스토리 생성 2단계 견고화·품질 게이트 정리·reading 에러 UI·회원탈퇴 UI. → Apple 처리 후 실기기 검증 예정.

## 작업 메모

### 현재 작업: 회원 탈퇴 (블로커 1)
- 스키마: 모든 사용자 데이터가 `users` 기준 `onDelete: cascade` → `DELETE users` 한 번으로 연쇄 삭제 확인됨.
- Apple 토큰 폐기: 현재 로그인 플로우가 Apple authorization code/refresh token을 저장하지 않음. 완전 준수하려면 (a) 로그인 시 authorizationCode 저장 (b) Apple Sign In 키(.p8) 발급 (c) 삭제 시 Apple `/auth/revoke` 호출 필요.
