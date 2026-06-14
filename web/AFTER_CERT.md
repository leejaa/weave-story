# 앱인토스 인증서 발급 후 할 일 (체크리스트)

> **목적**: 앱인토스 콘솔 승인 + mTLS 인증서가 발급되면 진행할 작업을 세션이 초기화돼도 바로 이어갈 수 있게 정리한 문서.
> 전체 진행상황은 [PROGRESS.md](./PROGRESS.md) 참고. 이 문서는 **인증서 의존(blocked) 작업**만 다룬다.

## 0. 지금 상태 요약
- API 서버: `https://weave-story-api.leejahun0.workers.dev` (CF Worker, Expo와 동일 백엔드). 인증=Bearer JWT(HS256, `JWT_SECRET`), claim `{ sub: userId }`.

### ✅ 완료 (2026-06-14, 인증서 발급 후)
- **mTLS**: CF에 클라 인증서 업로드(`weave-toss-mtls`, id `6a7f22e1-...`) → `TOSS_MTLS` 바인딩(wrangler.toml). `.secrets/toss-mtls-*.{crt,key}` 보관.
- **1-B `/api/auth/toss` 구현·배포(06acb684)**: mTLS로 generate-token+login-me 호출 → userKey로 provider='toss' 계정 upsert + JWT 발급. 더미코드 스모크 401 확인.
- **1-A 임시 자동 데모 로그인 제거**: `web/src/lib/auth.ts`의 `TEMP_AUTO_DEMO_CODE` 삭제, 브라우저=미리보기 게이트로 원복(수동 데모 로그인 유지). `.ait` 재빌드 완료.

### ⬜ 남음
- **(사용자, 선택) PII 복호화 시크릿**: `TOSS_AAD_STRING`·`TOSS_DECRYPTION_KEY`(콘솔 이메일 발급) → `wrangler secret put`. 미설정이어도 로그인은 userKey로 동작(name/email만 비움).
- **E2E 검증**: 새 `.ait` 업로드 → 토스 앱 "토스로 시작하기" → 실제 로그인 → 홈 진입 확인.
- 푸시(sendMessage)·IAP(`/api/purchases/toss`)는 아래 4·3 참고(별도 작업).

## 1. 인증서 발급 시 받는 것 / 시크릿 등록
발급물(앱인토스 콘솔): **mTLS 인증서**, **AAD_STRING**, **DECRYPTION_KEY** (+ 토스 API 호출용 키들).
- 워커 시크릿 등록은 **사용자가 직접** (`npx wrangler secret put <NAME>` in `workers/api/`). 나는 값을 출력/입력하지 않는다.
- 등록 예상 시크릿: `TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`, `TOSS_AAD_STRING`, `TOSS_DECRYPTION_KEY` (정확한 이름은 발급 문서에 맞춤).
- ⚠️ `JWT_SECRET` 값 출력 금지. `weave-story-secrets-backup` R2 비공개 유지.

---

## 2. Task 3 — 토스 로그인 실연동

### 1-A. 임시 자동 데모 로그인 제거 (필수, 먼저)
파일: [web/src/lib/auth.ts](./src/lib/auth.ts)
- `TEMP_AUTO_DEMO_CODE` 상수 **삭제**.
- `loginWithToss()`의 브라우저 분기(`if (!isInTossApp())`)를 **원복**:
  - 원래 의도: 브라우저(토스 SDK 없음)에선 데모 게이트만 통과(`sessionStorage.setItem(DEMO_KEY,'1')`) 또는 토스 앱에서만 로그인 노출.
  - 토스 앱 안에서는 `appLogin()` → `POST /api/auth/toss` 경로가 정식 동작.
- `loginWithDemo()`는 **남겨도 됨**(스토어 리뷰어/QA용). 단 자동 호출만 제거.
- 데모 코드는 공개 번들 노출 임시였으므로, 제거 후 필요시 `DEMO_LOGIN_CODE` 시크릿 회전 + `ANDROID_SUBMISSION.md` 동기화 고려.

### 1-B. 백엔드 `POST /api/auth/toss` 구현 (Task 7의 일부)
파일: `workers/api/src/routes/auth.ts` (기존 `/apple`, `/google`, `/demo` 라우트와 동일 패턴으로 추가).
- 입력: `{ authorizationCode, referrer }` (클라 `loginWithToss`가 보냄).
- 처리: mTLS 인증서로 **토스 API 호출** → authorizationCode 검증/교환 → 토스 유저 정보(+User Key) 수신 → 복호화(AAD_STRING/DECRYPTION_KEY) → `users`/`accounts` upsert(provider='toss') → 우리 JWT(access/refresh) 발급.
- 출력: `{ accessToken, refreshToken }` (기존 auth 라우트와 동일 형태).
- 토스 User Key를 **여기서 저장**(아래 4. 푸시에서 사용).

### 1-C. 클라 검증
- 토스 앱 WebView에서 "토스로 시작하기" → `appLogin` → `/api/auth/toss` → 홈 진입.
- `web/src/lib/auth.ts`의 `/api/auth/toss` 경로 이미 작성됨(수정 불필요, 백엔드만 붙으면 됨).

---

## 3. Task 7 — 인앱결제 / 크레딧 충전 (조사 완료)

### ⚠️ 중요: 크레딧은 **인앱결제(IAP)** 로 구현. 토스페이(TossPay) 아님.
앱인토스엔 결제가 **2종류**다 (SDK·문서 확인됨):
- **인앱결제(IAP)** = 미니앱 내 **디지털 재화**(크레딧 등 소비성 상품). 콘솔에 상품(SKU) 등록 후 스토어 빌링으로 결제. → **우리 크레딧은 이것.**
- **토스페이(TossPay)** `checkoutPayment`/`requestTossPayPaysBilling` = 실물/서비스 등 일반 결제. 크레딧엔 부적합.

### IAP 클라 흐름 (`import { IAP } from '@apps-in-toss/web-framework'`)
일회성 구매(크레딧 팩):
```ts
const cleanup = IAP.createOneTimePurchaseOrder({
  options: {
    sku: 'credits_10',                    // 콘솔에 등록한 소비성 상품 ID
    processProductGrant: async ({ orderId }) => {
      // 주문 생성 후 호출됨 → 우리 서버에 크레딧 지급 요청(서버가 orderId 검증·적립).
      const r = await api.post('/api/purchases/toss', { orderId });  // 멱등(orderId 기준)
      return r.granted === true;          // 지급 성공 시 true
    },
  },
  onEvent: (e) => { /* e.data: orderId, displayName, amount, currency... → /api/me 무효화 */ },
  onError: (err) => { /* 로깅/복구 */ },
});
```
- **복구**: 앱 시작 시 `IAP.getPendingOrders()` → 중단된 주문 재지급, `IAP.completeProductGrant({ params: { orderId } })` 로 마감. `IAP.getCompletedOrRefundedOrders()` 로 환불 반영.
- **최소 앱 버전**: Android 5.234.0 / iOS 5.231.0 (`isMinVersionSupported` 로 가드).
- 구독 모델 원하면 `IAP.createSubscriptionPurchaseOrder({ options: { sku, offerId, processProductGrant }, ... })`.

### 백엔드 `POST /api/purchases/toss` (IAP 지급 검증)
- 입력: `{ orderId }`.
- 처리: **`getIapOrderStatus` 파트너 API(mTLS)** 로 주문 상태 검증 → 유효·결제완료면 크레딧 적립(`users.credits`). **orderId 기준 멱등**(중복 지급 방지). 기존 `POST /api/purchases/grant`(앱 IAP) 로직 재사용 가능.
- 출력: `{ granted: boolean }`.
- 참고: 결제상태 조회 API https://developers-apps-in-toss.toss.im/api/getIapOrderStatus.html

### 콘솔 / 클라 UI
- **콘솔**: 소비성 상품(SKU)·가격·미니앱 아이콘 등록. (상품 심사 있을 수 있음 → 미리 등록)
- **클라**: 프로필/크레딧 화면([web/src/pages/ProfilePage.tsx](./src/pages/ProfilePage.tsx))에 "충전" 버튼 → `IAP.createOneTimePurchaseOrder` → 지급 후 `/api/me` 무효화로 크레딧 갱신.
- 가입 기본 크레딧 10 (DB 적용 완료). 이야기 생성 1회 = 크레딧 1 차감(서버).

### 참고 문서
- 인앱결제 개요: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/IAP.html
- 토스페이(일반결제, 참고): https://developers-apps-in-toss.toss.im/tosspay/develop.html , 결제승인 `POST /api-partner/v1/apps-in-toss/pay/execute-payment`

---

## 4. 푸시 알림 (이야기 생성 완료 → 푸시 → 탭하면 읽기 화면) — 조사 완료

### 결론: **구현 가능.** Expo 푸시 플로우와 1:1 대응. (단 토스 로그인 필수 = 인증서 의존)

### 대응 관계
| | Expo (기존) | 앱인토스 |
|---|---|---|
| 유저 식별 | FCM/APNs 토큰(`push_tokens`) | **토스 User Key** (`x-toss-user-key`) |
| 발송 트리거 | 생성 완료 시 FCM 발송 | 생성 완료 시 **`sendMessage` 서버 API** 호출 |
| 탭 → 진입 | 딥링크 → `/reading/:id` | 딥링크/스킴 → 미니앱 `/reading/:id` |

### 핵심 사실 (출처: 앱인토스 공식 문서/커뮤니티)
- **`sendMessage` 서버 API**로 특정 유저에게 발송. 타겟 = **`x-toss-user-key`** (토스 로그인 필수). 응답에 push/inbox/sms 카운트.
- 토스 운영자 명시: *"푸시 발송은 토스 로그인 시 획득 가능한 User Key를 통한 발송만 지원"* → **기기 ID만으론 불가**. (비게임 미니앱도 유저 식별키 발급 가능으로 정책 열림)
- **푸시 vs 알림**: 푸시=앱 닫혀도 OS 알림 / 알림=토스앱 종 아이콘. '스마트 발송'이 둘 다 최적화.
- **기능성 vs 광고성**: "이야기 생성 완료"는 **기능성 메시지**(주문/배송류) → 마케팅 수신동의 불필요.
- **메시지 템플릿 검수**: 영업일 **2~3일** 소요 → 인증서 나오면 **바로 템플릿 등록**해 검수 병행할 것.
- **딥링크**: 푸시 탭 시 미니앱 특정 화면 랜딩 가능. SDK `getSchemeUri` 존재. 정확한 landing 필드명은 `sendMessage` 스펙에서 확정.

### 구현 작업
1. **유저ID ↔ 토스 User Key 매핑 저장**: `/api/auth/toss`에서 User Key 수신 시 DB 저장(기존 `push_tokens` 대체. 새 컬럼/테이블, 예: `accounts.toss_user_key` 또는 `toss_user_keys`).
2. **CF Worker 발송 훅**: 챕터 생성 완료 지점(기존 "생성 완료 시 발송" 로직, push 서버 Task #10 위치)에서 **FCM 대신 앱인토스 `sendMessage` 호출**. 본문 = "「{제목}」 다음 이야기가 준비됐어요" + 딥링크 `/reading/:threadId`.
3. **콘솔**: 메시지 템플릿 등록 + 검수 신청(2~3일). 발송용 API 인증 토큰(message-send scope) 발급.
4. **클라 딥링크 라우팅**: react-router라 `/reading/:threadId`로 들어오면 그대로 처리됨. 미니앱 진입 시 scheme/쿼리 → 라우트 매핑만 확인.
   - **알림 동의**: SDK `requestNotificationAgreement`(`@apps-in-toss/web-framework`)로 사용자 알림 수신 동의 받기. 기능성 메시지는 동의 불필요지만, 동의 받아두면 알림 도달률↑.
5. **폴링과 공존**: 현재 읽기 화면은 8초 폴링(`useReading`). 푸시는 "나가 있어도 알림" 용도로 보완. 둘 다 유지.

### 참고 문서
- 메시지 발송 API: https://developers-apps-in-toss.toss.im/api/sendMessage.html
- 푸시 개발/콘솔: https://developers-apps-in-toss.toss.im/push/develop.html , https://developers-apps-in-toss.toss.im/smart-message/console.html
- 운영자 답변(기기ID 불가): https://techchat-apps-in-toss.toss.im/t/id/3220

---

## 5. 발급 후 권장 순서
1. 시크릿 등록(사용자) → 2. `/api/auth/toss` 백엔드 + User Key 저장 → 3. 임시 자동 데모 로그인 제거(1-A) → 4. 토스 앱에서 로그인 E2E 검증 → 5. 푸시 템플릿 콘솔 등록(검수 2~3일 병행) → 6. `sendMessage` 발송 훅 + 딥링크 → 7. IAP(`checkoutPayment` + `/api/purchases/toss`) → 8. 실기기 전체 검증.

## 6. 검증 체크
- [ ] 토스 앱에서 "토스로 시작하기" → 실제 토스 계정 로그인 → 홈 진입
- [ ] 이야기 생성 → 앱 나감 → 완료 푸시 수신 → 탭 → `/reading/:id` 본문 표시
- [ ] 크레딧 충전(IAP) → `/api/me` 크레딧 증가 반영
- [ ] 임시 데모 자동로그인 제거됐는지(브라우저에서 코드 자동 통과 안 됨) 확인
