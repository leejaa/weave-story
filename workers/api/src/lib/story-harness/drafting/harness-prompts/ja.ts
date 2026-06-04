// Japanese harness prompts (mirrors the Korean craft directives).
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\nまだ保存されたstory bibleがありません。ユーザー設定と前の章を基準に連続性を保ってください。';
  }
  return [
    '[Story Bible]',
    `ログライン: ${storyBible.logline}`,
    `ジャンル: ${storyBible.genre}`,
    `トーン: ${storyBible.tone}`,
    `主人公: ${storyBible.protagonist}`,
    `中心的な葛藤: ${storyBible.centralConflict}`,
    `読者への約束: ${storyBible.readerPromise}`,
    `冒頭の脅威: ${storyBible.openingThreat}`,
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
      '[第1話の設計原則]',
      '- 最初の3段落以内に、主人公の日常や安全を壊す事件を起こします。',
      '- 主人公は単に驚いたり待ったりせず、危険な情報を握るか、危険な選択の前に立たせます。',
      '- 本文の最後は、権力・関係・秘密・生存・濡れ衣・契約・裏切りのうち少なくとも一つを揺るがす決断の瞬間で止めます。',
      '- 「冷静に答える」「知らないふりをする」のような些細な反応で終わらせません。',
      '',
      '[分量と形式 — 非常に重要]',
      '- contentは必ず日本語で2400字以上、3200字以下で書きます。1800字未満は失敗です。',
      '- 10〜14段落、各段落は空行で区切ります。',
      '- 各段落は2〜4文で十分に展開します。場面を要約せず、実際の出来事として見せてください。',
      '- この応答では本文(content)とタイトルのフィールドだけを書きます。選択肢は次の段階で作ります。',
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
    const summaries = a.previousChaptersSummaries.length > 0
      ? a.previousChaptersSummaries.map(s => `第${s.chapterNumber}章: ${s.summary}`).join('\n')
      : '要約なし';
    const retry = a.previousIssues?.length ? `\n\n[前回の結果で必ず直す問題]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      bibleSection(a.storyBible),
      '',
      `[ユーザーの元の設定]\n${a.prompt}`,
      `全章数: ${a.estimatedChapters}`,
      `今書く章: ${a.nextChapterNumber}`,
      `生成の試み: ${a.attempt}/2`,
      retry,
      `[前の章の要約]\n${summaries}`,
      `[直前の第${a.previousChapterNumber}章の本文]\n${a.previousChapterContent}`,
      `[読者の選択]\n${a.chosenOption}`,
      '',
      '[次の話の作成原則]',
      '- 最初の2段落以内に、読者の選択によって変わった結果を見せてください。',
      '- 選択の代償が、人物関係・証拠・権力・生存の危機のうち少なくとも一つを変えなければなりません。',
      '- 前の章の感情や出来事を繰り返し説明せず、新しい圧力で押し進めます。',
      '- 場面を要約せず、行動・会話・発見で展開します。',
      a.isFinal ? '- 最終章です。本文で物語を完結させてください。' : '- 本文の最後は、次の選択を呼ぶ決断の瞬間で止めます。',
      '',
      '[分量と形式 — 非常に重要]',
      '- contentは必ず日本語で2400字以上、3200字以下で書きます。1800字未満は失敗です。',
      '- 9〜14段落、各段落は空行で区切ります。',
      '- この応答では本文(content)とタイトルだけを書きます。選択肢は次の段階で作ります。',
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
};
