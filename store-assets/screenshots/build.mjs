/* Generates marketing screenshots for App Store (iOS) + Play (Android)
   in EN / JA / KO. Layout is platform-driven; copy + in-phone app markup
   are locale data. UI strings mirror the app's locale JSON; story content
   is representative (AI-generated at runtime). Run: node build.mjs */
import { mkdirSync, writeFileSync } from 'node:fs';

const chevL = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const chevR = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const flag = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;

const statusbar = `
  <div class="statusbar">
    <div class="time">9:41</div>
    <div class="right">
      <div class="sb-signal"><i></i><i></i><i></i><i></i></div>
      <div class="sb-wifi"></div>
      <div class="sb-batt"><i></i></div>
    </div>
  </div>`;

/* language-independent cover art (sample_cards.image_url + color) */
const COVER_ART = {
  romance: { img: 'card-romance.png', color: '#4a1e2a' },
  rofan:   { img: 'card-rofan.png',   color: '#1a2540' },
  fantasy: { img: 'card-fantasy.png', color: '#0d2818' },
  mystery: { img: 'card-mystery.png', color: '#18182a' },
};

function cover(loc, key) {
  const art = COVER_ART[key], c = loc.cards[key];
  const lines = Array.from({ length: 9 }, (_, i) =>
    `<i style="top:${8 + i * 9}%;opacity:${i % 2 === 0 ? 0.2 : 0.09}"></i>`).join('');
  return `
    <div class="book">
      <div class="glow"></div>
      <div class="cover">
        <div class="img" style="background-color:${art.color};background-image:url(../covers/${art.img})"></div>
        <div class="tshade"></div><div class="spine"></div><div class="rim"></div>
        <div class="pill">${c.genre}</div>
        <div class="ctitle">${c.title}</div>
      </div>
      <div class="pages">${lines}</div>
    </div>`;
}
function mini(key) {
  const art = COVER_ART[key];
  return `<div class="mini" style="background-color:${art.color};background-image:url(../covers/${art.img})"></div>`;
}

/* the five in-phone screens, built from locale data */
function screens(loc) {
  const u = loc.ui, d = loc.demo;
  return {
    choice: `
      <div class="rc-header">
        <div class="rc-close">${chevL}</div>
        <div class="rc-htext"><div class="rc-title">${d.storyTitle}</div><div class="rc-sub">${u.entryKicker}</div></div>
      </div>
      <div class="cp-content">
        <div class="cp-top">
          <div class="cp-situation">${d.situation}</div>
          <div class="cp-headline">${d.question}</div>
        </div>
        <div class="cp-choices">
          <div class="tile"><div class="marker">A</div><div class="ttext">${d.options[0]}</div></div>
          <div class="tile sel"><div class="marker">B</div><div class="ttext">${d.options[1]}</div></div>
          <div class="tile"><div class="marker">C</div><div class="ttext">${d.options[2]}</div></div>
        </div>
        <div class="cp-divider"><div class="line"></div><div class="lbl">${u.orInput}</div><div class="line"></div></div>
        <div class="cp-input"><div class="ph">${u.inputPlaceholder}</div></div>
        <div class="cp-cta"><span>${u.continue}</span></div>
      </div>`,

    setup: `
      <div class="sp"><div class="sp-bg"></div>
        <div class="sp-head"><div class="sp-back">${chevL}</div></div>
        <div class="sp-content">
          <div class="sp-headline">${u.spHeadline}</div>
          <div class="sp-subtext">${u.spSubtext}</div>
          <div class="sp-group">
            <div class="sp-field"><span class="ph" style="color:var(--ink)">${d.setupTyped}<span class="cursor"></span></span></div>
            <div class="sp-hint">${u.spHint}</div>
            <div class="sp-submit"><span>${u.spStart}</span></div>
          </div>
        </div>
      </div>`,

    read: `
      <div class="ribbon">
        <div class="row">
          <div class="back">${chevL}</div>
          <div class="tblock"><div class="title">${d.storyTitle}</div><div class="pos">${u.nowReading}</div></div>
          <div class="report">${flag}</div>
          <div class="bookmark">3 / 8</div>
        </div>
        <div class="progress"><i style="width:38%"></i></div>
      </div>
      <div class="tp-page">
        <div class="tp-chapter">${d.chapterLabel}</div>
        <div class="tp-prose">
          <p class="drop">${d.prose[0]}</p>
          <p>${d.prose[1]}</p>
          <p>${d.prose[2]}</p>
        </div>
        <div class="tp-num">2 / 6</div>
      </div>`,

    home: `
      <div class="home">
        <div class="home-head">
          <div class="home-greet">${u.greetingEvening}</div>
          <div class="home-hero">${u.heroHeadline}</div>
        </div>
        <div class="home-sec"><span>${u.woven}</span><span>${u.seeAll}</span></div>
        <div class="shelf">
          ${cover(loc, 'rofan')}
          ${cover(loc, 'romance')}
          ${cover(loc, 'fantasy')}
        </div>
      </div>`,

    library: `
      <div class="lib">
        <div class="lib-head">
          <div class="lib-eyebrow">${u.libEyebrow}</div>
          <div class="lib-title">${u.libTitle}</div>
        </div>
        ${loc.libRows.map(r => `
        <div class="row">
          ${mini(r.key)}
          <div class="meta">
            <div class="mrow"><span class="g">${r.mood}</span>${r.done
              ? `<span class="done">${r.done}</span>`
              : `<span class="ch">${r.ch}</span>`}</div>
            <div class="t">${r.title}</div>
            ${r.done ? '' : `<div class="prow"><div class="bar"><i style="width:${r.pct}%"></i></div><span class="pct">${r.pct}%</span></div>`}
          </div>
        </div>`).join('')}
      </div>`,
  };
}

/* ============ locale data ============ */
const L10N = {
  en: {
    dir: 'en',
    market: {
      choice:  { eyebrow: 'WEAVE · INTERACTIVE FICTION', headline: 'Your <span class="accent">choices</span><br>shape the story', sub: 'Every turn you take<br>rewrites what happens next.' },
      setup:   { eyebrow: 'CREATE · ONE LINE', headline: 'One line<br>becomes a <span class="accent">novel</span>', sub: 'Describe the story you want —<br>AI writes the first chapter.' },
      read:    { eyebrow: 'READ · YOUR PAGES', headline: 'A novel written<br>for <span class="accent">you alone</span>', sub: 'Calm, book-like pages<br>to lose yourself in.' },
      home:    { eyebrow: 'GENRES · SEVEN WORLDS', headline: 'Romance to<br><span class="accent">wuxia</span>', sub: 'Seven genres to choose from —<br>one book for tonight.' },
      library: { eyebrow: 'LIBRARY · YOUR SHELF', headline: 'Pick up right<br>where you <span class="accent">left off</span>', sub: 'Ongoing and finished tales,<br>all in one place.' },
    },
    ui: {
      greetingEvening: 'Good evening.', heroHeadline: 'A story<br>only for you', woven: 'Woven for tonight', seeAll: 'See all →',
      spHeadline: 'What story<br>do you want?', spSubtext: 'Freely describe the story you want.',
      spHint: 'The more specific the character, setting, and conflict — the more vivid the story.', spStart: 'Start story',
      libTitle: 'My Stories', libEyebrow: 'MY LIBRARY',
      orInput: 'Or type your own', inputPlaceholder: 'Type what you want to do…', continue: 'Continue story', entryKicker: 'Moment of choice',
      nowReading: 'Now reading',
    },
    demo: {
      storyTitle: 'Chosen by the Duke',
      situation: 'The Duke set down the rose he was holding and looked at me. “Will you come with me tonight?”',
      question: 'Will you take his hand?',
      options: ['Take his hand without hesitation', 'Ask first why it has to be you', 'Politely decline and turn away'],
      chapterLabel: 'Chapter 3 · Roses and Thorns',
      prose: [
        'The Duke’s study was full of late-afternoon light. He stood at the window, gazing out at the garden, and I lingered at the threshold, unable to step any closer.',
        '“Are you afraid?” he asked, without turning. Beneath the familiar coldness was a low tremor I had never heard from him before.',
        'I answered with a single step instead. The floor creaked softly, and at the sound he turned his head, slowly, to face me.',
      ],
      setupTyped: 'In the dying days of Joseon, a woman hides her identity to enter the palace and uncovers evidence of a treasonous plot',
    },
    cards: {
      rofan:   { genre: 'Romantasy', title: 'Chosen by\nthe Duke' },
      romance: { genre: 'Romance',   title: 'Contract\nMarriage' },
      fantasy: { genre: 'Fantasy',   title: 'The Weakest\nWas Supreme' },
      mystery: { genre: 'Mystery',   title: 'The Painter’s\nLast Canvas' },
    },
    libRows: [
      { key: 'rofan', mood: 'Yearning', ch: 'Ch.4', title: 'Chosen by the Duke', pct: 50 },
      { key: 'mystery', mood: 'Eerie', ch: 'Ch.1', title: 'The Painter’s Last Canvas', pct: 20 },
      { key: 'romance', mood: 'Tender', done: 'Completed', title: 'Contract Marriage' },
    ],
  },

  ja: {
    dir: 'ja',
    market: {
      choice:  { eyebrow: 'WEAVE · インタラクティブ小説', headline: 'あなたの<span class="accent">選択</span>が<br>物語を変える', sub: '分かれ道での決断が、<br>次の場面を紡ぎ出す。' },
      setup:   { eyebrow: 'CREATE · 一行の種', headline: '一行で<br><span class="accent">物語</span>が始まる', sub: '読みたい物語を説明すれば、<br>AIが最初の章を書く。' },
      read:    { eyebrow: 'READ · 没入のページ', headline: 'あなただけに<br>書かれた<span class="accent">物語</span>', sub: '紙の本のように静かに、<br>一章ずつ読む。' },
      home:    { eyebrow: 'GENRES · 七つの世界', headline: '恋愛から<br><span class="accent">武俠</span>まで', sub: '七つのジャンルから選ぶ、<br>今夜のための一冊。' },
      library: { eyebrow: 'LIBRARY · 自分の書棚', headline: 'いつでも<br><span class="accent">続き</span>から', sub: '進行中の物語も完結した物語も、<br>ひとつの場所に。' },
    },
    ui: {
      greetingEvening: 'こんばんは。', heroHeadline: 'あなただけの<br>物語', woven: '今夜のためにつむがれた', seeAll: 'すべて見る →',
      spHeadline: 'どんな物語が<br>読みたいですか？', spSubtext: '読みたい物語を自由に説明してください。',
      spHint: '主人公、舞台、葛藤が具体的なほど、物語はより鮮やかになります。', spStart: '物語を始める',
      libTitle: 'マイ物語', libEyebrow: 'MY LIBRARY',
      orInput: 'または自分で入力', inputPlaceholder: 'したい行動を入力してください…', continue: '物語を続ける', entryKicker: '選択の瞬間',
      nowReading: '読んでいる章',
    },
    demo: {
      storyTitle: '公爵が私を選んだ',
      situation: '公爵は手にしていた薔薇を卓に置き、私を見つめた。「今夜、私と一緒に来てくれるか?」',
      question: '彼の手を取りますか?',
      options: ['迷わず彼の手を取る', 'なぜ私なのかと、まず尋ねる', '丁重に断って背を向ける'],
      chapterLabel: '第三章 · 薔薇と棘',
      prose: [
        '公爵の書斎は午後遅くの光で満ちていた。彼は窓辺に立ち、長いあいだ庭を眺めていた。私は敷居のところで、それ以上近づけずにいた。',
        '「怖いのか?」振り返らずに彼が問うた。いつもの冷たさの下に、聞いたことのない低い震えがあった。',
        '私は答えの代わりに一歩を踏み出した。床がかすかに鳴り、その音に彼はゆっくりと振り向いた。',
      ],
      setupTyped: '滅びゆく朝鮮末期、身分を隠して宮廷に入った女が、謀反の証拠を見つける物語',
    },
    cards: {
      rofan:   { genre: 'ロマファン', title: '公爵が\n私を選んだ' },
      romance: { genre: '恋愛',       title: 'あなたとの\n契約結婚' },
      fantasy: { genre: 'ファンタジー', title: '無能者が\n世界最強' },
      mystery: { genre: 'ミステリー', title: '消えた画家の\n最後の絵' },
    },
    libRows: [
      { key: 'rofan', mood: 'ときめき', ch: 'Ch.4', title: '公爵が私を選んだ', pct: 50 },
      { key: 'mystery', mood: '不穏', ch: 'Ch.1', title: '消えた画家の最後の絵', pct: 20 },
      { key: 'romance', mood: 'あたたかい', done: '完結', title: 'あなたとの契約結婚' },
    ],
  },

  ko: {
    dir: 'ko',
    market: {
      choice:  { eyebrow: 'WEAVE · 인터랙티브 소설', headline: '당신의 <span class="accent">선택</span>이<br>이야기를 바꾼다', sub: '갈림길마다 내리는 결정이<br>다음 장면을 새로 써내려가요.' },
      setup:   { eyebrow: 'CREATE · 한 문장의 씨앗', headline: '한 문장이면<br><span class="accent">소설</span>이 시작돼', sub: '원하는 이야기를 설명하면<br>AI가 첫 챕터를 써냅니다.' },
      read:    { eyebrow: 'READ · 몰입의 페이지', headline: '나만을 위해<br>쓰여진 <span class="accent">소설</span>', sub: '종이책처럼 차분하게,<br>한 장씩 펼쳐 읽어요.' },
      home:    { eyebrow: 'GENRES · 일곱 갈래', headline: '로맨스부터<br><span class="accent">무협</span>까지', sub: '취향대로 고르는 일곱 가지 장르,<br>오늘 밤을 위한 한 권.' },
      library: { eyebrow: 'LIBRARY · 나의 서재', headline: '언제든<br><span class="accent">이어서</span> 읽다', sub: '진행 중인 이야기도, 완결된 이야기도<br>한곳에 모아 둬요.' },
    },
    ui: {
      greetingEvening: '좋은 저녁이에요.', heroHeadline: '세상에 하나뿐인<br>나만의 이야기', woven: '오늘 밤을 위해 엮인 이야기', seeAll: '모두 보기 →',
      spHeadline: '어떤 이야기를<br>원하세요?', spSubtext: '원하는 이야기를 자유롭게 설명해주세요.',
      spHint: '주인공, 배경, 갈등이 구체적일수록 더 생생한 이야기가 만들어져요.', spStart: '이야기 시작하기',
      libTitle: '내 이야기', libEyebrow: 'MY LIBRARY',
      orInput: '또는 직접 입력', inputPlaceholder: '원하는 행동을 직접 입력하세요…', continue: '이야기 계속하기', entryKicker: '선택의 순간',
      nowReading: '읽고 있는 장',
    },
    demo: {
      storyTitle: '공작이 나를 선택했다',
      situation: '공작은 들고 있던 장미를 탁자에 내려놓고 나를 바라보았다. 「오늘 밤, 나와 함께 가 주겠소?」',
      question: '그의 손을 잡을 것인가?',
      options: ['망설임 없이 그의 손을 잡는다', '왜 하필 나냐고 먼저 묻는다', '정중히 거절하고 돌아선다'],
      chapterLabel: '제3장 · 장미와 가시',
      prose: [
        '공작의 서재는 늦은 오후의 빛으로 가득했다. 그는 창가에 서서 오래도록 정원을 바라보고 있었고, 나는 문턱에서 차마 더 다가서지 못한 채 그의 등을 응시했다.',
        '「두려운가?」 그가 돌아보지 않고 물었다. 목소리에는 익숙한 냉기 대신, 처음 듣는 낮은 떨림이 배어 있었다.',
        '나는 대답 대신 한 걸음을 내디뎠다. 마룻바닥이 작게 울렸고, 그 소리에 그가 천천히 고개를 돌렸다.',
      ],
      setupTyped: '무너져가는 조선 말기, 신분을 숨긴 채 궁에 들어간 여인이 역모의 증거를 발견하는 이야기',
    },
    cards: {
      rofan:   { genre: '로판',     title: '공작이\n나를 선택했다' },
      romance: { genre: '로맨스',   title: '당신과의\n계약 결혼' },
      fantasy: { genre: '판타지',   title: '무능력자가\n세계 최강이었다' },
      mystery: { genre: '미스터리', title: '사라진 화가의\n마지막 그림' },
    },
    libRows: [
      { key: 'rofan', mood: '설렘', ch: 'Ch.4', title: '공작이 나를 선택했다', pct: 50 },
      { key: 'mystery', mood: '서늘한', ch: 'Ch.1', title: '사라진 화가의 마지막 그림', pct: 20 },
      { key: 'romance', mood: '따뜻한', done: '완결', title: '당신과의 계약 결혼' },
    ],
  },
};

const SHOTS = [
  { id: 'choice', screen: 'choice' },
  { id: 'setup', screen: 'setup' },
  { id: 'read', screen: 'read' },
  { id: 'home', screen: 'home' },
  { id: 'library', screen: 'library' },
];

const platforms = {
  ios:     { w: 1290, h: 2796 },
  android: { w: 1080, h: 2160 },
};

function page(p, loc, shot) {
  const { w, h } = p;
  const market = loc.market[shot.id];
  const margin = Math.round(w * 0.075);
  const copyTop = Math.round(h * 0.058);
  const eSize = +(w * 0.0205).toFixed(1);
  const hSize = +(w * 0.078).toFixed(1);
  const sSize = +(w * 0.0285).toFixed(1);
  const bezel = Math.round(w * 0.011);
  const deviceW = Math.round(w * 0.73);
  const screenW = deviceW - bezel * 2;
  const scale = screenW / 390;
  const screenH = Math.round(844 * scale);
  const deviceH = screenH + bezel * 2;
  const gap = Math.round(h * 0.026);
  const islandW = Math.round(deviceW * 0.34);
  const islandH = Math.round(bezel * 2.4);
  const view = screens(loc)[shot.screen];

  return `<!doctype html><html lang="${loc.dir}"><head><meta charset="utf-8">
<link rel="stylesheet" href="../styles.css">
<style>
  .canvas{width:${w}px;height:${h}px;}
  .copy{width:100%;padding:${copyTop}px ${margin}px 0;}
  .eyebrow{font-size:${eSize}px;letter-spacing:${(eSize*0.18).toFixed(1)}px;margin-bottom:${Math.round(eSize*1.1)}px;}
  .headline{font-size:${hSize}px;line-height:1.17;}
  .subline{font-size:${sSize}px;line-height:1.5;margin-top:${Math.round(sSize*0.85)}px;}
  .device{margin-top:${gap}px;width:${deviceW}px;height:${deviceH}px;border-radius:${Math.round(deviceW*0.092)}px;padding:${bezel}px;}
  .device .screen{width:${screenW}px;height:${screenH}px;border-radius:${Math.round(deviceW*0.082)}px;}
  .device .island{width:${islandW}px;height:${islandH}px;border-radius:${Math.round(islandH/2)}px;top:${Math.round(bezel*1.0)}px;}
  .app-scaler{transform:scale(${scale.toFixed(4)});width:390px;}
</style></head>
<body>
<div class="canvas">
  <div class="topline"></div>
  <div class="copy">
    <div class="eyebrow">${market.eyebrow}</div>
    <div class="headline">${market.headline}</div>
    <div class="subline">${market.sub}</div>
  </div>
  <div class="device">
    <div class="island"></div>
    <div class="screen">
      <div class="app-scaler"><div class="app">${statusbar}${view}</div></div>
    </div>
  </div>
</div>
</body></html>`;
}

mkdirSync(new URL('./pages', import.meta.url), { recursive: true });
const manifest = [];
for (const [plat, p] of Object.entries(platforms)) {
  for (const [lng, loc] of Object.entries(L10N)) {
    SHOTS.forEach((shot, i) => {
      const name = `${plat}-${lng}-${String(i + 1).padStart(2, '0')}-${shot.id}.html`;
      writeFileSync(new URL(`./pages/${name}`, import.meta.url), page(p, loc, shot));
      manifest.push({ name, w: p.w, h: p.h });
    });
  }
}
writeFileSync(new URL('./pages/manifest.json', import.meta.url), JSON.stringify(manifest, null, 2));
console.log('generated', manifest.length, 'pages');
