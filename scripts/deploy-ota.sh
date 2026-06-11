#!/bin/bash
# OTA(EAS Update) 배포 — production 채널.
# Usage: npm run deploy:ota -- "변경 내용 메시지"
#
# 왜 이 스크립트인가 (2026-06-11 사고 방지):
#   `eas update`는 로컬에서 번들하며 .env.local(development)을 읽는다. --environment 를
#   생략하면 .env.local 의 EXPO_PUBLIC_* 가 그대로 프로덕션 번들에 인라인되어, 잘못된
#   EXPO_PUBLIC_API_URL(웹 SPA)로 API 베이스·법적 URL 전체가 깨질 수 있다. 그래서:
#     - --environment production : EAS 서버 env(올바른 워커 URL)를 사용
#     - --clear-cache            : Metro 트랜스폼 캐시가 env 변경을 무효화 안 하는 문제 회피
#   배포 후 dist/ 번들에 잘못된 호스트가 인라인됐는지 검증한다.
set -e

MSG="$*"
if [ -z "$MSG" ]; then
  echo "❌ 배포 메시지가 필요합니다."
  echo "   사용법: npm run deploy:ota -- \"변경 내용\""
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# API 호스트는 워커여야 한다. 웹 SPA(expo.app)가 인라인되면 사고.
BAD_HOST="weave-story.expo.app"
GOOD_HOST="weave-story-api.leejahun0.workers.dev"

echo "🚀 EAS Update → branch=production, environment=production (clear-cache)"
npx eas update \
  --branch production \
  --environment production \
  --clear-cache \
  --message "$MSG" \
  --non-interactive

echo ""
echo "🔍 배포 번들 검증 (dist/) — 잘못된 API 호스트 인라인 여부"
BAD_COUNT=$(find dist -name "*.hbc" -o -name "*.js" 2>/dev/null \
  | xargs -I{} sh -c "strings '{}' 2>/dev/null" \
  | grep -c "$BAD_HOST" || true)
GOOD_COUNT=$(find dist -name "*.hbc" -o -name "*.js" 2>/dev/null \
  | xargs -I{} sh -c "strings '{}' 2>/dev/null" \
  | grep -c "$GOOD_HOST" || true)

echo "   $GOOD_HOST : $GOOD_COUNT"
echo "   $BAD_HOST : $BAD_COUNT"

if [ "$BAD_COUNT" -gt 0 ]; then
  echo ""
  echo "⚠️  경고: 배포된 번들에 잘못된 호스트($BAD_HOST)가 인라인됨!"
  echo "    .env.local 의 EXPO_PUBLIC_API_URL 을 $GOOD_HOST 로 고치고 다시 배포하세요."
  exit 1
fi

echo "✅ 검증 통과 — 올바른 워커 호스트로 배포 완료."
