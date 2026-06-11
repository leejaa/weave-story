# 앱인토스 콘솔 등록용 에셋

`store-assets/appintoss/` 에서 `./render.sh` 실행 시 이 폴더에 재생성됩니다.
모두 기존 앱스토어/플레이스토어 파이프라인(아이콘·폰트·커버·스크린샷 생성기)을 재사용해 만들었습니다.

## 콘솔 필드 ↔ 파일 매핑

| 콘솔 항목 | 규격 | 파일 | 비고 |
|-----------|------|------|------|
| 앱 로고 | 600×600 | `logo-light-600.png` | 크림 배경 + 슬레이트 나무 (앱 아이콘과 동일 아이덴티티) |
| 다크모드 앱 로고 | 600×600 | `logo-dark-600.png` | 다크 슬레이트 배경 + 크림 나무 |
| 썸네일 | 1932×828 | `thumbnail-1932x828.png` | 워드마크 + 한국어 태그라인 + 북커버 3종 |
| 스크린샷 (세로형, 최소 3장) | 636×1048 | `screenshot-1-choice.png` ~ `screenshot-5-library.png` | 5장 중 원하는 순서로 3장 이상 |

## 스크린샷 권장 순서 (5장 전부 업로드 추천)

1. `screenshot-1-choice.png` — 선택지 화면 (핵심 인터랙티브 가치)
2. `screenshot-4-home.png` — 홈/장르 (둘러보는 재미)
3. `screenshot-3-read.png` — 읽기 화면 (몰입감)
4. `screenshot-2-setup.png` — 한 문장으로 시작
5. `screenshot-5-library.png` — 내 서재

## 생성 방법

```bash
cd store-assets/appintoss
./render.sh        # 8개 PNG 재생성
```

- 브랜드 에셋(로고·썸네일): `brand-pages.mjs` → Chrome headless 렌더
- 스크린샷: `../screenshots/build.mjs` 의 `appintoss(636×1048)` 플랫폼 → ko 로케일 5장
