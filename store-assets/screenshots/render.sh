#!/bin/bash
# Render every generated HTML page to a PNG at its exact canvas size.
# On this machine Chrome writes the screenshot but then fails to exit, so we
# poll for the PNG to finish writing and hard-kill that specific Chrome.
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p out
node build.mjs

render_one() {
  local name="$1" w="$2" h="$3"
  local base="${name%.html}" out="out/${name%.html}.png"
  local profile; profile="$(mktemp -d)"
  [ -z "$profile" ] && { echo "FAILED ${base} (no tmp)"; return; }
  rm -f "$out"

  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="${w},${h}" --user-data-dir="$profile" --default-background-color=00000000 \
    --screenshot="$out" "pages/${name}" >/dev/null 2>&1 &
  local cpid=$!

  local prev=-1 cur i=0
  while [ $i -lt 50 ]; do
    if [ -s "$out" ]; then
      cur=$(stat -f%z "$out" 2>/dev/null || echo 0)
      [ "$cur" = "$prev" ] && break
      prev=$cur
    fi
    sleep 0.4; i=$((i+1))
  done

  kill -9 "$cpid" 2>/dev/null
  pkill -9 -f -- "--screenshot=$out" 2>/dev/null
  wait "$cpid" 2>/dev/null
  rm -rf "$profile"
  if [ -s "$out" ]; then echo "rendered $out  (${w}x${h})"; else echo "FAILED ${base}"; fi
}

# process substitution -> loop runs in the main shell (bash 3.2 compatible)
while IFS=$'\t' read -r name w h; do
  [ -n "$name" ] && render_one "$name" "$w" "$h"
done < <(node -e 'for(const p of require("./pages/manifest.json")) console.log(`${p.name}\t${p.w}\t${p.h}`)')

echo "DONE  ($(ls out/*.png 2>/dev/null | wc -l | tr -d ' ') pngs)"
