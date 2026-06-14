#!/bin/bash
# 앱인토스 배포 — .ait 빌드 후 `ait deploy`로 업로드(콘솔 수동 드래그-업로드 대체).
# Usage: npm run deploy:ait -- "출시 메모"
#
# 사전 1회 설정 (콘솔 API 키 저장 — 사용자가 직접, 키 값은 레포에 안 들어감):
#   cd web && npx ait token add        # 프롬프트에 콘솔 API 키 붙여넣기(기본 프로필)
# CI 등 비대화 환경에서는 환경변수로:
#   AIT_API_KEY=<키> npm run deploy:ait -- "메모"
#
# ⚠️ 이 명령은 번들 "업로드"까지만 자동화한다(deployment 생성).
#    검토 요청('검토 요청하기')·출시('출시하기')는 콘솔에서 수동 — 앱인토스 플랫폼 제약.
set -e

MEMO="$*"
if [ -z "$MEMO" ]; then
  echo "❌ 배포 메모가 필요합니다."
  echo "   사용법: npm run deploy:ait -- \"출시 메모\""
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/web"

echo "🏗  .ait 빌드"
npm run build:ait

echo "🚀 ait deploy (업로드)"
if [ -n "$AIT_API_KEY" ]; then
  npx ait deploy --api-key "$AIT_API_KEY" -m "$MEMO"
else
  npx ait deploy -m "$MEMO"   # 기본 프로필(사전 `ait token add`) 사용
fi

echo ""
echo "✅ 업로드 완료. 이후는 콘솔에서 수동:"
echo "   1) 토스 앱에서 테스트(QR/스킴)  →  2) '검토 요청하기'  →  3) 승인 후 '출시하기'"
