# Play Store 클로즈드 테스터 모집 런북

> 갱신: 2026-06-14 · 담당: 사용자(모집·게시) + Claude(목록 등록·추적)

## 목표 / 요건
개인 개발자 계정이라 **프로덕션 출시 전 의무**:
- **테스터 12명 이상**이 **14일 연속** 클로즈드 테스트(Alpha)에 옵트인 유지
- 이후 Play Console에서 **"프로덕션 액세스 신청"** → Google 검토(보통 며칠)

> 14일 시계는 **12명이 모두 옵트인된 시점(Day 0)** 부터 카운트. 중간에 인원이 12명 미만으로 떨어지면 카운트가 흔들릴 수 있으니 **여유 있게 14~15명** 확보 권장.

## 현재 상태
- 트랙 **Alpha(클로즈드 테스트)**: 1.0.1 (vc14) **라이브** — 옵트인 즉시 설치 가능 ✅
- 테스터 이메일 목록: **"Weave Story Closed Test"** — 현재 소수(콘솔에서 정확 인원 확인 필요), **목표 12명+**
- 개발자 계정: LEE JAHUN (개인, leejahun9@gmail.com), 패키지 `com.leejahun.weavestory`

## 옵트인 링크 (테스터에게 공유)
- 웹 옵트인: `https://play.google.com/apps/testing/com.leejahun.weavestory`
- 스토어: `https://play.google.com/store/apps/details?id=com.leejahun.weavestory`

## 테스터가 해야 할 것 (안내문)
1. 본인 **Gmail 주소**(안드로이드 기기 Play 스토어 계정)를 알려준다 → 목록에 등록됨
2. 등록 후 **웹 옵트인 링크** 접속 → "테스터 되기(Become a tester)" 클릭
3. 스토어 링크에서 **설치** → **14일 동안 삭제하지 말고** 가끔 실행
4. (선택) 리뷰어 데모 로그인: 로그인 화면 "Reviewer access" → 코드 `weave-review-9f3k`

## 모집 채널: 텔레그램 상호 테스트(맞테스트)
Google Play 14일 클로즈드 테스트를 서로 도와주는 텔레그램 그룹들이 있다. **상호(1:1) 테스트가 전제** — 상대 앱도 설치/테스트해줘야 한다.
- 검색 키워드: "Google Play closed testing", "14 days testing", "tester exchange"
- 에티켓: 상대 옵트인 링크로 설치 + 14일 유지 약속을 지킬 것. 약속 안 지키면 상대도 빠짐 → 14일 시계 무너짐.
- 운영: **상대 Gmail 받기 ↔ 내 Gmail 등록 교환**. 받은 이메일은 Claude가 목록에 일괄 등록.

### 붙여넣기용 모집 메시지

**영문 (교환 그룹용)**
```
[Android] Need 12 testers for my closed test (14 days) — full mutual testing 1:1 🤝
App: Weave Story — AI interactive fiction where your choices rewrite the story.
Opt-in: https://play.google.com/apps/testing/com.leejahun.weavestory
Steps: send me your Gmail → I add you → tap "Become a tester" → install & keep 14 days.
Drop your app + Gmail and I'll test yours back right away. 🙏
```

**한국어 (지인/커뮤니티용)**
```
안드로이드 앱 출시 전 테스트 도와주실 분 찾습니다! 🙏
'Weave Story' — 당신의 선택으로 줄거리가 바뀌는 AI 인터랙티브 소설 앱이에요.
방법: ① Gmail 주소를 알려주세요(등록해드려요) ② 아래 링크에서 "테스터 되기" ③ 설치 후 14일만 유지(가끔 실행)
옵트인: https://play.google.com/apps/testing/com.leejahun.weavestory
14일 뒤 정식 출시할 수 있어요. 도와주시면 정말 감사합니다!
```

## 테스터 추적표
| # | Gmail | 등록일 | 옵트인 확인 | Day-14 도달일 | 비고 |
|---|-------|--------|-------------|---------------|------|
| 1 | | | | | |
| 2 | | | | | |
| … | | | | | |

> 12명이 모두 옵트인된 날을 Day 0으로 적고, +14일을 "프로덕션 액세스 신청 가능일"로 표시.

## 다음 단계
1. 텔레그램 그룹에 모집 메시지 게시 + 맞테스트 (사용자)
2. 수집된 Gmail을 목록 "Weave Story Closed Test"에 등록 (Claude — Play Console)
3. 12명+ 14일 유지 확인
4. **프로덕션 액세스 신청** → 검토 → 프로덕션 출시
