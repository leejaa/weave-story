// 웹 호환 Lottie(bodymovin) 로딩 애니메이션 생성기.
// 인앱 기존 로티는 native(lottie-react-native) 전용이라 lottie-web에서 빈 화면이 됨.
// 이 스크립트는 lottie-web의 SVG 렌더러가 확실히 그리는 표준 도형/키프레임만 사용해
// "책 펼침 + 금빛 글로우 + 페이지 넘김 + 떠오르는 입자" 로더를 만든다.
// 출력: web/public/animations/story-loader.json   (path 로드로 사용)
import { writeFileSync } from 'node:fs';

const W = 300, H = 300, FR = 30, OP = 90; // 3초 루프
const CX = 150, CY = 155;

const C = {
  cream: [0.957, 0.929, 0.855],
  creamSoft: [0.910, 0.871, 0.776],
  forest: [0.176, 0.353, 0.239],
  gold: [0.847, 0.663, 0.306],
  glint: [1, 0.961, 0.839],
};

const EASE = { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } };
const stat = (k) => ({ a: 0, k });
// 애니메이션 프로퍼티: frames = [{t, v}] (v는 숫자 또는 배열). 마지막 키프레임은 핸들 없음.
const anim = (frames) => ({
  a: 1,
  k: frames.map((f, idx) =>
    idx < frames.length - 1
      ? { i: EASE.i, o: EASE.o, t: f.t, s: Array.isArray(f.v) ? f.v : [f.v] }
      : { t: f.t, s: Array.isArray(f.v) ? f.v : [f.v] },
  ),
});

const fill = (c, o = 100) => ({ ty: 'fl', c: stat(c), o: stat(o), r: 1, nm: 'fill' });
const ellipse = (w, h) => ({ ty: 'el', d: 1, s: stat([w, h]), p: stat([0, 0]), nm: 'el' });
const rect = (w, h, r = 0) => ({ ty: 'rc', d: 1, s: stat([w, h]), p: stat([0, 0]), r: stat(r), nm: 'rc' });
const grTr = (extra = {}) => ({ ty: 'tr', p: stat([0, 0]), a: stat([0, 0]), s: stat([100, 100]), r: stat(0), o: stat(100), ...extra });
const group = (items, tr = {}) => ({ ty: 'gr', it: [...items, grTr(tr)], nm: 'gr' });

let ind = 0;
function layer(nm, shapes, ks) {
  return {
    ddd: 0, ind: ++ind, ty: 4, nm, sr: 1,
    ks: {
      o: ks.o ?? stat(100),
      r: ks.r ?? stat(0),
      p: ks.p ?? stat([CX, CY]),
      a: ks.a ?? stat([0, 0]),
      s: ks.s ?? stat([100, 100]),
    },
    ao: 0, shapes, ip: 0, op: OP, st: 0, bm: 0,
  };
}

const layers = [];

// ── 떠오르는 금빛 입자 6개 (맨 위) ───────────────────────────────────────────
const N = 6;
for (let i = 0; i < N; i++) {
  const peak = 8 + (i * OP) / N;            // 등장 시점 분산
  const x = CX + (i - (N - 1) / 2) * 17;     // 가로 분산
  const sz = 9 + (i % 3) * 2;
  layers.push(layer(`mote${i}`, [group([ellipse(sz, sz), fill(C.gold)])], {
    o: anim([
      { t: Math.max(0, peak - 12), v: 0 },
      { t: peak, v: 100 },
      { t: Math.min(OP, peak + 16), v: 0 },
    ]),
    p: anim([
      { t: Math.max(0, peak - 12), v: [x, CY + 22] },
      { t: Math.min(OP, peak + 16), v: [x + (i % 2 ? 8 : -8), CY - 98] },
    ]),
    s: stat([100, 100]),
  }));
}

// ── 중앙 빛 번짐 (책이 열리며 빛이 퍼짐) ─────────────────────────────────────
layers.push(layer('burst', [group([ellipse(70, 70), fill(C.glint)])], {
  p: stat([CX, CY - 6]),
  s: anim([{ t: 0, v: [30, 30] }, { t: 45, v: [165, 165] }, { t: 90, v: [30, 30] }]),
  o: anim([{ t: 0, v: 0 }, { t: 22, v: 75 }, { t: 50, v: 0 }, { t: 90, v: 0 }]),
}));

// ── 넘어가는 페이지 3장 (스파인 기준 가로 플립, 시차) ────────────────────────
for (let i = 0; i < 3; i++) {
  const t0 = i * 30; // 시차로 연속 넘김
  const ks = {
    p: stat([CX, CY]),
    a: stat([0, 0]),
    // scaleX 100→-100 으로 가로 플립(페이지 넘김 느낌), 스파인(중앙) 기준
    s: anim([
      { t: t0, v: [100, 100] },
      { t: t0 + 22, v: [-100, 100] },
      { t: Math.min(OP, t0 + 44), v: [100, 100] },
    ]),
    o: anim([
      { t: t0, v: 0 }, { t: t0 + 4, v: 100 },
      { t: t0 + 22, v: 100 }, { t: Math.min(OP, t0 + 30), v: 0 },
    ]),
  };
  // 페이지: 중앙(스파인)에서 오른쪽으로 뻗는 직사각형 → anchor를 왼쪽 끝에
  layers.push(layer(`page${i}`, [
    group([rect(58, 84, 4), fill(C.cream)], { p: stat([29, 0]) }),
  ], ks));
}

// ── 펼친 책: 딥포레스트 표지(강한 대비) + 금빛 테두리 ─────────────────────────
// 표지마다 금빛 외곽 rect(뒤) + 딥포레스트 rect(앞) 두 장으로 금테 효과.
layers.push(layer('coverL', [
  group([rect(64, 92, 5), fill(C.forest)], { p: stat([-33, 0]) }),
  group([rect(70, 98, 6), fill(C.gold)], { p: stat([-33, 0]) }),
], { p: stat([CX, CY]), r: stat(-8) }));
layers.push(layer('coverR', [
  group([rect(64, 92, 5), fill(C.forest)], { p: stat([33, 0]) }),
  group([rect(70, 98, 6), fill(C.gold)], { p: stat([33, 0]) }),
], { p: stat([CX, CY]), r: stat(8) }));
// 책등(가운데 세로 금빛 선)
layers.push(layer('spine', [group([rect(4, 100, 2), fill(C.gold)])], { p: stat([CX, CY]) }));

// ── 책 뒤 따뜻한 금빛 글로우 (맨 아래) — 더 밝고 크게 호흡 ────────────────────
layers.push(layer('glow', [group([ellipse(230, 165), fill(C.gold)])], {
  p: stat([CX, CY - 4]),
  o: anim([{ t: 0, v: 30 }, { t: 45, v: 62 }, { t: 90, v: 30 }]),
  s: anim([{ t: 0, v: [92, 92] }, { t: 45, v: [124, 124] }, { t: 90, v: [92, 92] }]),
}));

const animation = {
  v: '5.7.4', fr: FR, ip: 0, op: OP, w: W, h: H, nm: 'story-loader', ddd: 0, assets: [], layers,
};

writeFileSync('web/public/animations/story-loader.json', JSON.stringify(animation));
console.log(`written web/public/animations/story-loader.json — layers=${layers.length}, ${(JSON.stringify(animation).length / 1024).toFixed(1)}KB`);
