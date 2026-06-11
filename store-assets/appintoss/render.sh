#!/bin/bash
# 앱인토스 콘솔용 에셋 일괄 렌더.
#   로고(라이트/다크) 600×600, 썸네일 1932×828, 세로형 스크린샷 636×1048 ×5(ko)
# Chrome headless 가 스크린샷을 쓴 뒤 종료에 실패하는 환경이라, PNG 쓰기 완료를
# 폴링한 뒤 해당 Chrome 만 강제 종료한다. (screenshots/render.sh 와 동일 패턴)
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p out

render_one() {
  local page="$1" out="$2" w="$3" h="$4"
  local profile; profile="$(mktemp -d)"
  rm -f "$out"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="${w},${h}" --user-data-dir="$profile" --default-background-color=00000000 \
    --screenshot="$out" "$page" >/dev/null 2>&1 &
  local cpid=$! prev=-1 cur i=0
  while [ $i -lt 50 ]; do
    if [ -s "$out" ]; then
      cur=$(stat -f%z "$out" 2>/dev/null || echo 0)
      [ "$cur" = "$prev" ] && break
      prev=$cur
    fi
    sleep 0.4; i=$((i+1))
  done
  kill -9 "$cpid" 2>/dev/null || true
  pkill -9 -f -- "--screenshot=$out" 2>/dev/null || true
  wait "$cpid" 2>/dev/null || true
  rm -rf "$profile"
  if [ -s "$out" ]; then echo "  ✓ $out  (${w}×${h})"; else echo "  ✗ FAILED $out"; fi
}

echo "[1/3] 브랜드 페이지 생성"
node brand-pages.mjs

echo "[2/3] 로고 + 썸네일 렌더"
render_one "pages/logo-light.html" "out/logo-light-600.png"      600  600
render_one "pages/logo-dark.html"  "out/logo-dark-600.png"       600  600
render_one "pages/thumbnail.html"  "out/thumbnail-1932x828.png"  1932 828

echo "[3/3] 세로형 스크린샷 636×1048 (ko) 렌더"
( cd ../screenshots && node build.mjs >/dev/null )
SHOTS=(01-choice 02-setup 03-read 04-home 05-library)
n=1
for s in "${SHOTS[@]}"; do
  render_one "../screenshots/pages/appintoss-ko-${s}.html" "out/screenshot-${n}-${s#??-}.png" 636 1048
  n=$((n+1))
done

echo "DONE → $(ls out/*.png 2>/dev/null | wc -l | tr -d ' ') 개 PNG (store-assets/appintoss/out/)"
