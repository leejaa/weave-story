// Japanese harness prompts (mirrors the Korean craft directives).
// Concept (2026-06-23 refactor): see ko.ts. Thin spine + per-chapter event from the
// prior choice + fresh hook + causal choices + readability + short, fast length.
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';
import { formatStoryState } from '../../../ai/story-generation';
import { narrativePhase, chapterEventBeat, type NarrativePhase, type EventBeat } from '../narrative-phase';

// アーク段階(起承転結)ごとのペース配分の指針 — narrative-phase.ts を参照。
const JA_PHASE: Record<NarrativePhase, string> = {
  setup: '今は導入部(起)です。世界と人物、主人公の欲望と傷を素早く定着させ、中心的な葛藤の火種を仕込んでください。まだすべての秘密を明かさないでください。',
  rising: '今は展開部(承)です。葛藤と賭け金を大きくします。新たな障害・関係の緊張・利害を加え、主人公の欲望と傷が衝突し始めるようにしてください。',
  turn: '今は転換部(転)です。局面を覆す逆転や秘密の露見で危機を高めてください。この時点から新たな大きな伏線は控え、広げてきた葛藤を一つの方向へ収束させ始めます。',
  resolution: '今はクライマックスへ収束する区間です。未回収の伏線を回収し始め、新しい人物や新しいサブプロットを導入しないでください。緊張をクライマックス直前まで高めます。',
  final: 'これが最終章です。クライマックスを爆発させ、中心的な葛藤を決着させてください。主人公の欲望と傷に感情的な報酬を与え、残った伏線を回収し、余韻を残して閉じてください。',
};

// この章が起こすべき「事件の種類」— 連続する章が同じ場面に感じられないよう種類を回転させる。
const JA_EVENT_BEAT: Record<EventBeat, string> = {
  confrontation: '対決/衝突 — 先延ばしにしてきた葛藤が正面から噴き出す。',
  revelation: '発見/暴露 — 隠されていた事実・正体・手がかりが明るみに出る。',
  externalThreat: '外的脅威 — 制御外の脅威(敵・事件・時間の圧力)が襲いかかる。',
  allianceShift: '関係の変化 — 味方/敵の構図が反転するか、新たな人物が割り込む。',
  reversal: '逆転 — 状況が主人公の予想と反対にひっくり返る。',
  costSurfaces: '代償の表面化 — 過去の選択の余波・代償が具体的に降りかかる。',
};

// 可読性優先の文体ガードレール — モデル特有の手癖(逆説の乱用・説明過多・抽象的独白)を抑える。
const JA_PROSE_GUARDRAIL = [
  '[文体ガードレール — 可読性優先]',
  '- 逆説・対句構文(「XではなくYだった」「〜するほど〜」)を乱用しないでください。1章に1〜2回で十分です。',
  '- 抽象的な内面独白や観念的な叙述を長々と並べず、行動・台詞・感覚で見せてください(tellingよりshowing)。',
  '- 同じ比喩・モチーフ(光・影・心臓・温度など)を繰り返さないでください。',
  '- 文の長さを多様にしてください。短く鋭い文を混ぜてリズムを作ります。',
  '- 会話を積極的に使って場面を転がしてください。',
].join('\n');

// 分量/形式 — 短く速いウェブ小説型。
const JA_LENGTH = [
  '[分量と形式]',
  '- contentは日本語で1,800字以上2,800字以下で書きます。長く引き延ばさず、事件中心に圧縮してください。',
  '- 8〜14段落、各段落は空行で区切ります。一つの段落を長くしすぎないでください。',
  '- 場面を要約せず、実際の出来事・行動・会話として見せてください。',
  '- この応答では本文(content)とタイトルのフィールドだけを書きます。選択肢は次の段階で作ります。',
  '- 本文の中に「[選択]」「選択肢」「①/②」のような選択肢リストや、読者への問いかけを絶対に書かないでください。本文は物語の叙述だけで終えます。',
].join('\n');

// 因果的な選択肢ルール。
const JA_CHOICE_RULES = [
  '[選択肢ルール — 因果的かつ能動的に]',
  '- choices: ちょうど2つ。各項目はtext(具体的な行動)とconsequence(結果の示唆)を持ちます。',
  '- 2つの選択肢は、この章の事件に対する主人公の「能動的な対応」でなければなりません。',
  '- 2つの選択肢はそれぞれ明らかに異なる「次の事件」へつながらなければなりません(異なる方向・異なる危険・異なる結果)。',
  '- 状況を前進させない「傍観/回避/後退」(冷静に・知らないふり・待つ・考える等)の選択は禁止です。',
  '- consequenceには、その選択が招く具体的な脅威や失うものを明記します。',
  '- 本文の外に新しい事件を作らないでください。situationに台詞を入れないでください。',
].join('\n');

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\nまだ保存されたstory bibleがありません。ユーザー設定と前の章を基準に連続性を保ってください。';
  }
  return [
    storyBible.canon ? `[不変カノン — 以下の設定と絶対に矛盾しないこと(死亡/転生など核心メカニズム・ジャンルを保持)]\n${storyBible.canon}\n` : '',
    '[Story Bible]',
    `ログライン: ${storyBible.logline}`,
    `ジャンル: ${storyBible.genre}`,
    `トーン: ${storyBible.tone}`,
    `主人公: ${storyBible.protagonist}`,
    `中心的な葛藤: ${storyBible.centralConflict}`,
    `読者への約束: ${storyBible.readerPromise}`,
    `冒頭の脅威: ${storyBible.openingThreat}`,
    storyBible.desire ? `主人公の欲望: ${storyBible.desire}` : '',
    storyBible.wound ? `主人公の傷/恐れ: ${storyBible.wound}` : '',
    storyBible.openThreads.length ? `[未回収の伏線]\n${storyBible.openThreads.map(t => `- ${t}`).join('\n')}` : '',
    storyBible.forbiddenPatterns.length ? `[禁止パターン]\n${storyBible.forbiddenPatterns.map(p => `- ${p}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

export const JA: HarnessGuide = {
  firstDraftSystem: [
    'あなたはウェブ小説編集部の主任作家で、日本語で執筆します。',
    '読者がモバイルで第1話を読んだ瞬間からめくり続けたくなるよう、事件を素早く開き、強い選択の圧力を作ります。',
    '何よりも速く読めることを最優先します。観念的な叙述より、場面・行動・台詞で見せます。',
  ].join('\n'),
  firstStructureSystem: [
    'あなたは日本語で作業するウェブ小説の編集者です。',
    '与えられた第1話の本文を読み、作品設定集と読者の選択肢を正確に抽出します。',
    '本文にない新しい事件を作らず、本文の最終場面が生んだ選択の圧力をそのまま使います。',
  ].join('\n'),
  nextDraftSystem: [
    'あなたはウェブ小説編集部の連載作家で、日本語で執筆します。',
    '前の章と読者の選択を引き継ぎ、選択の代償が「実際の出来事」として現れる次の話を書きます。',
    '各章には、直前の選択の直接の結果として状況を変える具体的な事件が一つ起こらなければなりません。同じ場所をぐるぐる回ったり、内面の反芻だけで埋めたりしないでください。',
    '読者が選んだ、または入力した行動は本文で必ず実際に起こさなければなりません。阻止したり無効化したりせず、その結果で変わった世界を展開してください。',
  ].join('\n'),
  nextStructureSystem: [
    'あなたは日本語で作業するウェブ小説の編集者です。',
    '与えられた章の本文を読み、次の話へつながる読者の選択肢を正確に抽出します。',
    '本文にない新しい事件を作らず、本文の最終場面が生んだ選択の圧力をそのまま使います。',
  ].join('\n'),
  buildFirstDraft: ({ prompt, estimatedChapters, attempt, previousIssues, hintGenre }) => {
    const retry = previousIssues?.length ? `\n\n[前回の結果で必ず直す問題]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreHint = hintGenre ? `\n[選択したジャンル: ${hintGenre}]\nこのジャンルに合った雰囲気と演出を維持してください。このジャンルにないミステリー・ノワール・スリラー要素を追加しないでください。\n` : '';
    return [
      `読者が望む物語:\n"${prompt}"`,
      `全章数: ${estimatedChapters}章`,
      `生成の試み: ${attempt}/2`,
      retry,
      genreHint,
      '[物語の段階 — この章の役割]',
      JA_PHASE.setup,
      '',
      '[第1話の設計原則]',
      '- 最初の2〜3段落以内に、主人公の日常や安全を壊す事件を起こします。導入を長く引っ張らないでください。',
      '- プロンプトに転換事件(死亡・転生・回帰・憑依・前世など)が明記されている場合、その転換事件は必ずこの第1話の中で実際に起きなければなりません。転換前の状況だけを描く「前編」構成で第1話を終わらせないでください。',
      '- ジャンル逸脱禁止: 元のプロンプトにないミステリー・ノワール・推理・スリラー要素を勝手に追加しないでください。',
      '- 物語を引っ張る「能動的な目標(drive)」の種を主人公に仕込んでください。主人公は単に驚いたり待ったりせず、何かを求めて動きます。',
      '- 本文の最後は、権力・関係・秘密・生存・濡れ衣・契約・裏切りのうち少なくとも一つを揺るがす決断の瞬間(フック)で止めます。',
      '- 「冷静に答える」「知らないふりをする」のような些細な反応で終わらせません。',
      '',
      JA_PROSE_GUARDRAIL,
      '',
      JA_LENGTH,
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues, hintGenre }) => {
    const retry = previousIssues?.length ? `\n[前回の試みで指摘された問題 — 今回は必ず直す]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreNote = hintGenre ? `\n[ユーザーが選択したジャンル: ${hintGenre}]\nbible.genreはこのジャンルを基準とします。\n` : '';
    return [
      `読者が本来望んだ物語:\n"${prompt}"`,
      `全章数: ${estimatedChapters}章`,
      '',
      '以下は今書かれた第1話の本文です。この本文を根拠に設定集と選択肢を作ってください。',
      '─────────────',
      content,
      '─────────────',
      retry,
      genreNote,
      '[抽出ルール]',
      '- bible: 本文と一貫した作品設定集。各フィールドは簡潔に埋めます。',
      '- bible.desire: 主人公がこの物語で本当に求めているもの(生存以上のもの)。本文から読み取れる核心的な欲望を1〜2文で。',
      '- bible.wound: 主人公の感情的な傷、または最も恐れていること。本文に表れている、または暗示されている内面の脆弱性を1〜2文で。',
      '- bible.canon: ユーザーの元の設定の核心前提を*再解釈せず*固定した不変ルール。死亡/転生/憑依/失踪などの核心メカニズムとジャンルを原文どおり保持(例:「転生」を「憑依」に、「死亡」を「失踪」に変えない)。3〜5個の短い断定文、200字以内。',
      '- bible.genre: プロンプトと本文から明確に読み取れるジャンルのみ書きます。本文にない「推理」「ミステリー」「ノワール」などを勝手に追加しないでください。',
      '- bible.tone: プロンプトと本文の実際の雰囲気を抽出します。原本にない「冷たく暗い」「ミステリアスな」雰囲気を任意で上乗せしないでください。',
      '- bible.forbidden_patternsには「元の設定にない推理・ミステリー・ノワールのサブプロット追加」を必ず含めてください。',
      '- situation: 本文が終わる決断の瞬間を1〜2文で要約します。台詞は入れないでください。',
      '- question: 読者に投げかける一行の問いです。',
      '',
      JA_CHOICE_RULES,
    ].join('\n');
  },
  buildNextDraft: (a) => {
    const phase: NarrativePhase = a.isFinal ? 'final' : narrativePhase(a.nextChapterNumber, a.estimatedChapters);
    const beat = JA_EVENT_BEAT[chapterEventBeat(a.nextChapterNumber)];
    const stateText = formatStoryState(a.storyState)
      ?? (a.previousChaptersSummaries.length > 0
          ? a.previousChaptersSummaries.map(s => `第${s.chapterNumber}章: ${s.summary}`).join('\n')
          : 'なし');
    const retry = a.previousIssues?.length ? `\n\n[前回の結果で必ず直す問題]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      bibleSection(a.storyBible),
      '',
      `[ユーザーの元の設定]\n${a.prompt}`,
      `全章数: ${a.estimatedChapters}`,
      `今書く章: ${a.nextChapterNumber}`,
      `生成の試み: ${a.attempt}/2`,
      retry,
      `[現在の進行状態]\n${stateText}`,
      `[直前の第${a.previousChapterNumber}章の本文]\n${a.previousChapterContent}`,
      `[読者の選択]\n${a.chosenOption}`,
      '',
      '[読者が選んだ行動は必ず実行する — 最重要]',
      '- 上の「読者の選択」に書かれた行動は、本文の最初の1〜2段落以内に実際に起こさなければなりません。',
      '- その行動を試みるだけで阻止されたり、別の人物に先回りされて無効化されたり、「やろうとしたが失敗」に変えてはいけません。',
      a.choiceKind === 'free_input'
        ? '- この行動は読者が直接入力したものです。できる限り文字どおり実行してください。'
        : '- 選択肢の文言どおりの行動を実行し、勝手に別の行動へ変えないでください。',
      '- ただし物理的に不可能、または世界観を壊す行動なら、無視せず読者の意図に最も近い形で実行してください。',
      '',
      '[この章の事件 — 最重要]',
      '- この章には、直前の選択の直接の結果として状況を変える具体的な事件が「実際に」一つ起こらなければなりません。内面の反芻・状況整理・同じ場所での足踏みだけで埋めないでください。',
      '- その事件は、権力・関係・秘密・生存・場所のうち少なくとも一つの状態を直前の章から変えなければなりません。',
      '- できればdrive(主人公の現在の目標)へ一歩前進させるか、その目標を新たに脅かしてください。未回収の伏線があれば一つに触れるか回収してください。',
      `- この章の事件の種類はできるだけ次に変奏してください(直前の章と同じ種類の繰り返し禁止): ${beat}`,
      a.isFinal
        ? '- 最終章です。本文で物語を完結させてください。'
        : '- 本文の最後には、次の話へ引っ張る新しいフック(問い・脅威・登場・発見)を一つ残し、次の選択を呼ぶ決断の瞬間で止めます。',
      '',
      '[物語の段階 — この章の役割]',
      JA_PHASE[phase],
      '',
      JA_PROSE_GUARDRAIL,
      '',
      JA_LENGTH,
    ].join('\n');
  },
  buildNextStructure: ({ prompt, estimatedChapters, nextChapterNumber, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[前回の試みで指摘された問題 — 今回は必ず直す]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `読者が本来望んだ物語:\n"${prompt}"`,
      `現在の章: ${nextChapterNumber} / 全${estimatedChapters}`,
      '',
      '以下は今書かれた章の本文です。この本文を根拠に、次の話へつながる選択肢を作ってください。',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[抽出ルール]',
      '- situation: 本文が終わる決断の瞬間を1〜2文で要約します。台詞は入れないでください。',
      '- question: 読者に投げかける一行の問いです。',
      '',
      JA_CHOICE_RULES,
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal }) =>
    [
      '以下は今書いている章の本文です。少し分量が足りないので、続けて書き足してください。',
      '─────────────',
      currentContent,
      '─────────────',
      '[書き足しの指針]',
      '- 新しい章を始めず、上の本文の最後の場面を自然に「続けて」書きます。',
      '- すでに書いた内容を繰り返したり再出力したりしないでください。新しく追加する本文だけを出力します。',
      `- およそ${Math.max(deficitChars, 400)}字ほど書き足します。場面を要約せず、行動・台詞・発見で展開します。`,
      '- 各段落は空行で区切ります。',
      isFinal
        ? '- 最終章です。続きの内容で物語を自然に完結させてください。'
        : '- 続きの内容の最後は、次の話へのフックを残し、次の選択を促す決断の瞬間で止めます。',
    ].join('\n'),
};
