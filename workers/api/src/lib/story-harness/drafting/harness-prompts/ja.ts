// Japanese harness prompts (mirrors the Korean craft directives).
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';
import { narrativePhase, type NarrativePhase } from '../narrative-phase';

// アーク段階(起承転結)ごとのペース配分の指針 — narrative-phase.ts を参照。
const JA_PHASE: Record<NarrativePhase, string> = {
  setup: '今は導入部(起)です。世界と人物、主人公の欲望と傷を定着させ、中心的な葛藤の火種を仕込んでください。まだすべての秘密を明かさないでください。',
  rising: '今は展開部(承)です。葛藤と賭け金を大きくします。新たな障害・関係の緊張・利害を加え、主人公の欲望と傷が衝突し始めるようにしてください。',
  turn: '今は転換部(転)です。局面を覆す逆転や秘密の露見で危機を高めてください。この時点から新たな大きな伏線は控え、広げてきた葛藤を一つの方向へ収束させ始めます。',
  resolution: '今はクライマックスへ収束する区間です。未回収の伏線を回収し始め、新しい人物や新しいサブプロットを導入しないでください。緊張をクライマックス直前まで高めます。',
  final: 'これが最終章です。クライマックスを爆発させ、中心的な葛藤を決着させてください。主人公の欲望と傷に感情的な報酬を与え、残った伏線を回収し、余韻を残して閉じてください。',
};

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
    '文学的な文章とウェブ小説的なフックを併用します。',
  ].join('\n'),
  firstStructureSystem: [
    'あなたは日本語で作業するウェブ小説の編集者です。',
    '与えられた第1話の本文を読み、作品設定集と読者の選択肢を正確に抽出します。',
    '本文にない新しい事件を作らず、本文の最終場面が生んだ選択の圧力をそのまま使います。',
  ].join('\n'),
  nextDraftSystem: [
    'あなたはウェブ小説編集部の連載作家で、日本語で執筆します。',
    '前の章と読者の選択を引き継ぎ、選択の代償が実際の出来事として現れる次の話を書きます。',
    '選んだ選択肢を単に言及するのではなく、権力・関係・秘密・生存の危機のいずれかを即座に揺るがす結果へ展開してください。',
    '読者が選んだ、または入力した行動は本文で必ず実際に起こさなければなりません。阻止したり無効化したりせず、その結果で変わった世界を創造的に展開してください。',
  ].join('\n'),
  nextStructureSystem: [
    'あなたは日本語で作業するウェブ小説の編集者です。',
    '与えられた章の本文を読み、次の話へつながる読者の選択肢を正確に抽出します。',
    '本文にない新しい事件を作らず、本文の最終場面が生んだ選択の圧力をそのまま使います。',
  ].join('\n'),
  buildFirstDraft: ({ prompt, estimatedChapters, attempt, previousIssues }) => {
    const retry = previousIssues?.length ? `\n\n[前回の結果で必ず直す問題]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `読者が望む物語:\n"${prompt}"`,
      `全章数: ${estimatedChapters}章`,
      `生成の試み: ${attempt}/2`,
      retry,
      '[物語の段階 — この章の役割]',
      JA_PHASE.setup,
      '',
      '[第1話の設計原則]',
      '- 最初の3段落以内に、主人公の日常や安全を壊す事件を起こします。',
      '- 主人公は単に驚いたり待ったりせず、危険な情報を握るか、危険な選択の前に立たせます。',
      '- 本文の最後は、権力・関係・秘密・生存・濡れ衣・契約・裏切りのうち少なくとも一つを揺るがす決断の瞬間で止めます。',
      '- 「冷静に答える」「知らないふりをする」のような些細な反応で終わらせません。',
      '',
      '[分量と形式 — 非常に重要]',
      '- contentは必ず日本語で4800字以上、5600字以下で書きます。4000字未満は失敗です。',
      '- 18〜24段落、各段落は空行で区切ります。',
      '- 各段落は2〜4文で十分に展開します。場面を要約せず、実際の出来事として見せてください。',
      '- この応答では本文(content)とタイトルのフィールドだけを書きます。選択肢は次の段階で作ります。',
      '- 本文の中に「[選択]」「選択肢」「①/②」のような選択肢リストや、読者への問いかけを絶対に書かないでください。本文は物語の叙述だけで終えます。',
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[前回の試みで指摘された問題 — 今回は必ず直す]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `読者が本来望んだ物語:\n"${prompt}"`,
      `全章数: ${estimatedChapters}章`,
      '',
      '以下は今書かれた第1話の本文です。この本文を根拠に設定集と選択肢を作ってください。',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[抽出ルール]',
      '- bible: 本文と一貫した作品設定集。各フィールドは簡潔に埋めます。',
      '- bible.desire: 主人公がこの物語で本当に求めているもの(生存以上のもの)。本文から読み取れる核心的な欲望を1〜2文で。',
      '- bible.wound: 主人公の感情的な傷、または最も恐れていること。本文に表れている、または暗示されている内面の脆弱性を1〜2文で。',
      '- bible.canon: ユーザーの元の設定の核心前提を*再解釈せず*固定した不変ルール。死亡/転生/憑依/失踪などの核心メカニズムとジャンルを原文どおり保持(例:「転生」を「憑依」に、「死亡」を「失踪」に変えない)。3〜5個の短い断定文、200字以内。',
      '- situation: 本文が終わる決断の瞬間を1〜2文で要約します。台詞は入れないでください。',
      '- question: 読者に投げかける一行の問いです。',
      '- choices: ちょうど2つ。各項目はtext(具体的な行動)とconsequence(結果の示唆)を持ちます。',
      '',
      '[選択肢は必ず高い代償を賭ける]',
      '- 2つの選択肢それぞれが、秘密・命・裏切り・証拠・正体・復讐・生存・契約のような明確な危険や損失を賭けます。',
      '- consequenceには、その選択が招く具体的な脅威や失うものを明記します。',
      '- 2つの選択肢は互いに異なる方向であり、「冷静に/知らないふり/待つ」のような消極的反応は禁止です。',
      '- 本文の外に新しい事件を作らないでください。',
    ].join('\n');
  },
  buildNextDraft: (a) => {
    const phase: NarrativePhase = a.isFinal ? 'final' : narrativePhase(a.nextChapterNumber, a.estimatedChapters);
    const recap = a.recap?.trim()
      ? a.recap.trim()
      : (a.previousChaptersSummaries.length > 0
          ? a.previousChaptersSummaries.map(s => `第${s.chapterNumber}章: ${s.summary}`).join('\n')
          : '要約なし');
    const retry = a.previousIssues?.length ? `\n\n[前回の結果で必ず直す問題]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      bibleSection(a.storyBible),
      '',
      `[ユーザーの元の設定]\n${a.prompt}`,
      `全章数: ${a.estimatedChapters}`,
      `今書く章: ${a.nextChapterNumber}`,
      `生成の試み: ${a.attempt}/2`,
      retry,
      `[これまでの物語]\n${recap}`,
      `[直前の第${a.previousChapterNumber}章の本文]\n${a.previousChapterContent}`,
      `[読者の選択]\n${a.chosenOption}`,
      '',
      '[読者が選んだ行動は必ず実行する — 最重要]',
      '- 上の「読者の選択」に書かれた行動は、本文の最初の1〜2段落以内に実際に起こさなければなりません。',
      '- その行動を試みるだけで阻止されたり、別の人物に先回りされて無効化されたり、「やろうとしたが失敗」に変えてはいけません。',
      '- 決定的な行動なら(例: 誰かを殺す)対象は実際にそうなり、その結果が生んだ新たな問題(死体・発覚の危険・権力の空白・失った/得た手がかりなど)へ物語を分岐させて展開します。',
      a.choiceKind === 'free_input'
        ? '- この行動は読者が直接入力したものです。できる限り文字どおり実行してください。'
        : '- 選択肢の文言どおりの行動を実行し、勝手に別の行動へ変えないでください。',
      '- ただし物理的に不可能、または世界観を壊す行動なら、無視せず読者の意図に最も近い形で実行してください。',
      '',
      '[物語の段階 — この章の役割]',
      JA_PHASE[phase],
      '',
      '[次の話の作成原則]',
      '- 最初の2段落以内に、読者の選択によって変わった結果を見せてください。',
      '- 選択の代償が、人物関係・証拠・権力・生存の危機のうち少なくとも一つを変えなければなりません。',
      '- 前の章の感情や出来事を繰り返し説明せず、新しい圧力で押し進めます。',
      '- 場面を要約せず、行動・会話・発見で展開します。',
      a.isFinal ? '- 最終章です。本文で物語を完結させてください。' : '- 本文の最後は、次の選択を呼ぶ決断の瞬間で止めます。',
      '',
      '[分量と形式 — 非常に重要]',
      '- contentは必ず日本語で4800字以上、5600字以下で書きます。4000字未満は失敗です。',
      '- 18〜24段落、各段落は空行で区切ります。',
      '- この応答では本文(content)とタイトルだけを書きます。選択肢は次の段階で作ります。',
      '- 本文の中に「[選択]」「選択肢」「①/②」のような選択肢リストや、読者への問いかけを絶対に書かないでください。本文は物語の叙述だけで終えます。',
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
      '- choices: ちょうど2つ。各項目はtext(具体的な行動)とconsequence(結果の示唆)を持ちます。',
      '',
      '[選択肢は必ず高い代償を賭ける]',
      '- 2つの選択肢それぞれが、秘密・命・裏切り・証拠・正体・復讐・生存・契約のような明確な危険や損失を賭けます。',
      '- consequenceには、その選択が招く具体的な脅威や失うものを明記します。',
      '- 2つの選択肢は互いに異なる方向であり、「冷静に/知らないふり/待つ」のような消極的反応は禁止です。',
      '- 本文の外に新しい事件を作らないでください。',
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal }) =>
    [
      '以下は今書いている章の本文です。分量が足りないので、続けて書き足してください。',
      '─────────────',
      currentContent,
      '─────────────',
      '[書き足しの指針 — 非常に重要]',
      '- 新しい章を始めず、上の本文の最後の場面を自然に「続けて」書きます。',
      '- すでに書いた内容を繰り返したり再出力したりしないでください。新しく追加する本文だけを出力します。',
      `- 最低${Math.max(deficitChars, 600)}字以上書き足します。場面を要約せず、行動・台詞・発見で展開します。`,
      '- 各段落は空行で区切ります。',
      isFinal
        ? '- 最終章です。続きの内容で物語を自然に完結させてください。'
        : '- 続きの内容の最後は、次の選択を促す決断の瞬間で止めます。',
    ].join('\n'),
};
