/* 앱인토스(Apps in Toss) 미니앱 콘솔용 브랜드 에셋 HTML 생성기.
   - logo-light  600×600  : 크림 배경 + 슬레이트 나무 글리프 (앱 아이콘 충실 재현)
   - logo-dark   600×600  : 다크 슬레이트 배경 + 크림 나무 글리프 (다크모드 변형)
   - thumbnail  1932×828  : 워드마크 + 한국어 태그라인 + 북커버 3종 (가로 배너)

   글리프는 android-icon-monochrome.png(검정 실루엣)을 CSS mask로 재색칠해
   배경색과 무관하게 임의 색으로 렌더한다. 폰트/커버는 screenshots 파이프라인 자산 재사용.
   렌더는 render.sh가 Chrome headless로 정확한 캔버스 크기에 수행한다. */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

/* 자산 상대경로 (pages/ HTML 기준) */
const FONTS = '../../screenshots/fonts';
const COVERS = '../../screenshots/covers';

/* 검정 나무 실루엣(투명 배경)을 base64 데이터 URI로 인라인한다.
   Chrome headless 는 file:// CSS mask-image 를 로드하지 못해(배경 이미지는 됨)
   글리프가 비어 렌더되므로, data URI 로 박아 넣어 확실히 마스킹한다. */
const MONO = 'data:image/png;base64,' + readFileSync(
  new URL('../../assets/images/android-icon-monochrome.png', import.meta.url)
).toString('base64');

/* 브랜드 팔레트 (styles.css :root 와 동일) */
const C = {
  paper: '#f5f0e8',
  paperGrad: 'linear-gradient(168deg, #f8f3eb 0%, #f1e8d9 52%, #e7dac6 100%)',
  ink: '#1c1c17',
  inkSoft: '#4c4c3e',
  slate: '#5b5b7a',        // 앱 아이콘 나무 색
  slateDeep: '#23233a',    // 다크 로고 배경
  thread: '#2d5a3d',       // 브랜드 포레스트
  cream: '#f5f0e8',
};

const fontFace = `
  @font-face { font-family:"Fraunces";     src:url("${FONTS}/Fraunces_600SemiBold.ttf"); font-weight:600; }
  @font-face { font-family:"FrauncesReg";  src:url("${FONTS}/Fraunces_400Regular.ttf"); font-weight:400; }
  @font-face { font-family:"Jakarta";      src:url("${FONTS}/PlusJakartaSans_400Regular.ttf"); font-weight:400; }
  @font-face { font-family:"JakartaSemi";  src:url("${FONTS}/PlusJakartaSans_600SemiBold.ttf"); font-weight:600; }
  @font-face { font-family:"BlackHanSans"; src:url("${FONTS}/BlackHanSans_400Regular.ttf"); font-weight:400; }`;

const reset = `*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}html,body{margin:0;padding:0}`;

/* mask 기반 나무 글리프: 임의 색(color)으로 size 비율 렌더 */
function tree(color, sizePct) {
  return `<div style="
    width:${sizePct}%;height:${sizePct}%;
    background:${color};
    -webkit-mask:url('${MONO}') center/contain no-repeat;
    mask:url('${MONO}') center/contain no-repeat;"></div>`;
}

/* ---------- 로고 (정사각) ---------- */
function logoPage({ w, bg, treeColor, treePct }) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
    ${reset}${fontFace}
    .canvas{width:${w}px;height:${w}px;display:flex;align-items:center;justify-content:center;background:${bg};overflow:hidden}
  </style></head><body>
    <div class="canvas">${tree(treeColor, treePct)}</div>
  </body></html>`;
}

/* ---------- 썸네일 1932×828 ---------- */
const COVER_CARDS = [
  { img: 'card-rofan.png',   color: '#1a2540', genre: '로판',   title: '공작이\n나를 선택했다', rot: -8, x: 0,   y: 38,  z: 1 },
  { img: 'card-romance.png', color: '#4a1e2a', genre: '로맨스', title: '당신과의\n계약 결혼',   rot: 0,  x: 196, y: 0,   z: 3 },
  { img: 'card-fantasy.png', color: '#0d2818', genre: '판타지', title: '무능력자가\n세계 최강',   rot: 8,  x: 392, y: 38,  z: 2 },
];

function thumbCard(c) {
  const lines = Array.from({ length: 7 }, (_, i) =>
    `<i style="position:absolute;left:8%;right:8%;height:2px;background:rgba(255,255,255,.5);top:${30 + i * 9}%;opacity:${i % 2 ? 0.1 : 0.22}"></i>`).join('');
  return `
    <div style="position:absolute;left:${c.x}px;top:${c.y}px;z-index:${c.z};
        transform:rotate(${c.rot}deg);width:300px;height:444px;border-radius:18px;overflow:hidden;
        box-shadow:0 30px 60px rgba(28,20,10,.34),0 6px 16px rgba(28,20,10,.22);
        background-color:${c.color};background-image:url('${COVERS}/${c.img}');background-size:cover;background-position:center">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 40%,rgba(0,0,0,.62) 100%)"></div>
      <div style="position:absolute;top:18px;left:18px;font:600 17px Jakarta;color:#fff;background:rgba(255,255,255,.16);
        padding:5px 13px;border-radius:999px;backdrop-filter:blur(4px)">${c.genre}</div>
      <div style="position:absolute;left:20px;bottom:22px;right:20px;font:600 30px/1.18 Fraunces;color:#fff;white-space:pre-line;
        text-shadow:0 2px 12px rgba(0,0,0,.5)">${c.title}</div>
      ${lines}
    </div>`;
}

function thumbnailPage({ w, h }) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
    ${reset}${fontFace}
    .canvas{width:${w}px;height:${h}px;position:relative;overflow:hidden;background:${C.paperGrad};display:flex;align-items:center}
    .grain{position:absolute;inset:0;background:
      radial-gradient(120% 80% at 12% 8%, rgba(255,255,255,.5), transparent 55%),
      radial-gradient(90% 90% at 100% 100%, rgba(45,90,61,.10), transparent 60%)}
    .left{position:relative;z-index:5;padding:0 0 0 110px;max-width:1060px}
    .brand{display:flex;align-items:center;gap:22px;margin-bottom:34px}
    .badge{width:96px;height:96px;border-radius:24px;background:${C.paper};
      box-shadow:0 8px 22px rgba(28,20,10,.14),inset 0 0 0 1px rgba(0,0,0,.04);display:flex;align-items:center;justify-content:center}
    .eyebrow{font:600 22px Jakarta;letter-spacing:4px;color:${C.thread};text-transform:uppercase}
    .wordmark{font:600 112px/1.0 Fraunces;color:${C.ink};letter-spacing:-1px;margin-bottom:26px}
    .tagline{font:400 46px/1.32 BlackHanSans;color:${C.inkSoft}}
    .tagline b{color:${C.thread}}
    .sub{margin-top:18px;font:400 27px/1.4 Jakarta;color:${C.inkSoft};opacity:.85}
    .stage{position:absolute;right:120px;top:50%;transform:translateY(-50%);width:692px;height:520px}
  </style></head><body>
    <div class="canvas">
      <div class="grain"></div>
      <div class="left">
        <div class="brand">
          <div class="badge">${tree(C.slate, 62)}</div>
          <div class="eyebrow">WEAVE · 인터랙티브 소설</div>
        </div>
        <div class="wordmark">Weave Story</div>
        <div class="tagline">AI가 써주는 <b>나만의</b><br>인터랙티브 소설</div>
        <div class="sub">한 문장이면 충분해요. 당신의 선택이 이야기를 바꿉니다.</div>
      </div>
      <div class="stage">${COVER_CARDS.map(thumbCard).join('')}</div>
    </div>
  </body></html>`;
}

/* ---------- emit ---------- */
mkdirSync(new URL('./pages', import.meta.url), { recursive: true });
const out = {
  'logo-light.html': logoPage({ w: 600, bg: C.paper,      treeColor: C.slate, treePct: 60 }),
  'logo-dark.html':  logoPage({ w: 600, bg: C.slateDeep,  treeColor: C.cream, treePct: 60 }),
  'thumbnail.html':  thumbnailPage({ w: 1932, h: 828 }),
};
for (const [name, html] of Object.entries(out)) {
  writeFileSync(new URL(`./pages/${name}`, import.meta.url), html);
}
writeFileSync(new URL('./pages/manifest.json', import.meta.url), JSON.stringify([
  { name: 'logo-light.html',  w: 600,  h: 600 },
  { name: 'logo-dark.html',   w: 600,  h: 600 },
  { name: 'thumbnail.html',   w: 1932, h: 828 },
], null, 2));
console.log('generated', Object.keys(out).length, 'brand pages');
