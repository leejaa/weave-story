// Traditional Chinese harness prompts (mirrors the Korean/Japanese craft directives).
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\n尚無已保存的 story bible。請以使用者設定與前面章節為準，維持連貫性。';
  }
  return [
    '[Story Bible]',
    `故事主線: ${storyBible.logline}`,
    `類型: ${storyBible.genre}`,
    `基調: ${storyBible.tone}`,
    `主角: ${storyBible.protagonist}`,
    `核心衝突: ${storyBible.centralConflict}`,
    `對讀者的承諾: ${storyBible.readerPromise}`,
    `開場的威脅: ${storyBible.openingThreat}`,
    storyBible.desire ? `主角的欲望: ${storyBible.desire}` : '',
    storyBible.wound ? `主角的傷痕/恐懼: ${storyBible.wound}` : '',
    storyBible.openThreads.length ? `[未回收的伏筆]\n${storyBible.openThreads.map(t => `- ${t}`).join('\n')}` : '',
    storyBible.forbiddenPatterns.length ? `[禁止的模式]\n${storyBible.forbiddenPatterns.map(p => `- ${p}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

export const ZH_HANT: HarnessGuide = {
  firstDraftSystem: [
    '你是網路小說編輯部的主筆作家，以繁體中文寫作。',
    '為了讓讀者在手機上讀到第一話的那一刻就停不下來，你要迅速開展事件，營造強烈的選擇壓力。',
    '你會兼用文學性的文筆與網路小說式的鉤子。',
  ].join('\n'),
  firstStructureSystem: [
    '你是以繁體中文工作的網路小說編輯。',
    '你會讀完給定的第一話正文，準確地萃取出作品設定集與讀者的選項。',
    '不要捏造正文中沒有的新事件，直接沿用正文最終場景所產生的選擇壓力。',
  ].join('\n'),
  nextDraftSystem: [
    '你是網路小說編輯部的連載作家，以繁體中文寫作。',
    '你會承接前一章與讀者的選擇，寫出讓選擇的代價化為實際事件的下一話。',
    '不要只是提及所選的選項，而要將它展開成立即動搖權力、關係、祕密或生存其中之一的結果。',
    '讀者所選或所輸入的行動，務必在正文中實際發生。不要加以阻止或使其失效，而要從其結果出發，創造性地展開因此而改變的世界。',
  ].join('\n'),
  nextStructureSystem: [
    '你是以繁體中文工作的網路小說編輯。',
    '你會讀完給定章節的正文，準確地萃取出通往下一話的讀者選項。',
    '不要捏造正文中沒有的新事件，直接沿用正文最終場景所產生的選擇壓力。',
  ].join('\n'),
  buildFirstDraft: ({ prompt, estimatedChapters, attempt, previousIssues }) => {
    const retry = previousIssues?.length ? `\n\n[上次結果務必修正的問題]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `讀者想要的故事:\n"${prompt}"`,
      `總章數: ${estimatedChapters}章`,
      `生成嘗試: ${attempt}/2`,
      retry,
      '[第一話的設計原則]',
      '- 在前三段以內，就發生一樁打破主角日常或安全的事件。',
      '- 主角不能只是驚訝或等待，而要握有危險的情報，或站在危險抉擇的面前。',
      '- 正文的結尾，要停在至少動搖權力、關係、祕密、生存、冤屈、契約、背叛其中之一的抉擇時刻。',
      '- 不要以「冷靜回應」「假裝不知道」這類瑣碎的反應作結。',
      '',
      '[篇幅與格式 — 極其重要]',
      '- content 務必以繁體中文寫滿2400字以上、3200字以下。低於1800字視為失敗。',
      '- 10至14段，各段以空行分隔。',
      '- 各段以2至4句充分展開。不要摘要場景，要當作實際發生的事件來呈現。',
      '- 這次回應只寫正文(content)與標題欄位。選項在下一階段製作。',
      '- 正文中絕對不要寫出「[選擇]」「選項」「①/②」這類選項清單，也不要對讀者提問。正文只以故事敘述作結。',
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[上次嘗試被指出的問題 — 這次務必修正]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `讀者原本想要的故事:\n"${prompt}"`,
      `總章數: ${estimatedChapters}章`,
      '',
      '以下是剛寫好的第一話正文。請以這段正文為依據，製作設定集與選項。',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[萃取規則]',
      '- bible: 與正文一致的作品設定集。各欄位簡潔填寫。',
      '- bible.desire: 主角在這個故事中真正渴望的東西(超越生存之上)。以1至2句描述正文中可以讀取到的核心欲望。',
      '- bible.wound: 主角的情感傷痕或最深的恐懼。以1至2句描述正文中呈現或暗示的內心脆弱之處。',
      '- situation: 將正文結尾的抉擇時刻以1至2句摘要。不要放入台詞。',
      '- question: 向讀者拋出的一行提問。',
      '- choices: 剛好2個。每一項具有 text(具體行動)與 consequence(結果的暗示)。',
      '',
      '[選項務必押上高昂的代價]',
      '- 兩個選項各自押上祕密、性命、背叛、證據、身分、復仇、生存、契約之類明確的危險或損失。',
      '- consequence 中要明確寫出該選擇所招致的具體威脅或將失去的東西。',
      '- 兩個選項彼此方向不同，禁止「冷靜/假裝不知道/等待」這類消極反應。',
      '- 不要在正文之外捏造新事件。',
    ].join('\n');
  },
  buildNextDraft: (a) => {
    const summaries = a.previousChaptersSummaries.length > 0
      ? a.previousChaptersSummaries.map(s => `第${s.chapterNumber}章: ${s.summary}`).join('\n')
      : '無摘要';
    const retry = a.previousIssues?.length ? `\n\n[上次結果務必修正的問題]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      bibleSection(a.storyBible),
      '',
      `[使用者原本的設定]\n${a.prompt}`,
      `總章數: ${a.estimatedChapters}`,
      `現在要寫的章: ${a.nextChapterNumber}`,
      `生成嘗試: ${a.attempt}/2`,
      retry,
      `[前面章節的摘要]\n${summaries}`,
      `[緊接的第${a.previousChapterNumber}章正文]\n${a.previousChapterContent}`,
      `[讀者的選擇]\n${a.chosenOption}`,
      '',
      '[讀者所選的行動務必執行 — 最重要]',
      '- 上方「讀者的選擇」所寫的行動，務必在正文最初的1至2段以內實際發生。',
      '- 不可只是嘗試該行動就被阻止、被他人搶先而失效，或改成「想做卻失敗」。',
      '- 若是決定性的行動(例: 殺死某人)，對象就要實際如此，並從其結果所產生的新問題(屍體、暴露的風險、權力的真空、失去/得到的線索等)展開故事的分支。',
      a.choiceKind === 'free_input'
        ? '- 這個行動是讀者直接輸入的。請盡可能照字面執行。'
        : '- 執行如選項文字所述的行動，不要擅自改成別的行動。',
      '- 但若是物理上不可能、或會破壞世界觀的行動，不要無視，而要以最貼近讀者意圖的形式執行。',
      '',
      '[下一話的撰寫原則]',
      '- 在最初的2段以內，呈現出因讀者的選擇而改變的結果。',
      '- 選擇的代價，務必改變人物關係、證據、權力、生存危機其中至少一項。',
      '- 不要反覆說明前一章的情感或事件，而要以新的壓力向前推進。',
      '- 不要摘要場景，要以行動、對話、發現來展開。',
      a.isFinal ? '- 這是最後一章。請在正文中將故事完結。' : '- 正文的結尾，要停在召喚下一個選擇的抉擇時刻。',
      '',
      '[篇幅與格式 — 極其重要]',
      '- content 務必以繁體中文寫滿2400字以上、3200字以下。低於1800字視為失敗。',
      '- 9至14段，各段以空行分隔。',
      '- 這次回應只寫正文(content)與標題。選項在下一階段製作。',
      '- 正文中絕對不要寫出「[選擇]」「選項」「①/②」這類選項清單，也不要對讀者提問。正文只以故事敘述作結。',
    ].join('\n');
  },
  buildNextStructure: ({ prompt, estimatedChapters, nextChapterNumber, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[上次嘗試被指出的問題 — 這次務必修正]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `讀者原本想要的故事:\n"${prompt}"`,
      `目前章節: ${nextChapterNumber} / 共${estimatedChapters}`,
      '',
      '以下是剛寫好的章節正文。請以這段正文為依據，製作通往下一話的選項。',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[萃取規則]',
      '- situation: 將正文結尾的抉擇時刻以1至2句摘要。不要放入台詞。',
      '- question: 向讀者拋出的一行提問。',
      '- choices: 剛好2個。每一項具有 text(具體行動)與 consequence(結果的暗示)。',
      '',
      '[選項務必押上高昂的代價]',
      '- 兩個選項各自押上祕密、性命、背叛、證據、身分、復仇、生存、契約之類明確的危險或損失。',
      '- consequence 中要明確寫出該選擇所招致的具體威脅或將失去的東西。',
      '- 兩個選項彼此方向不同，禁止「冷靜/假裝不知道/等待」這類消極反應。',
      '- 不要在正文之外捏造新事件。',
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal }) =>
    [
      '以下是正在撰寫的章節正文。因為篇幅不足，請接著繼續寫下去。',
      '─────────────',
      currentContent,
      '─────────────',
      '[續寫指引 — 極其重要]',
      '- 不要開始新的章節，要自然地「接續」上方正文的最後場景往下寫。',
      '- 不要重複或重新輸出已經寫過的內容。只輸出新增的正文。',
      `- 至少續寫${Math.max(deficitChars, 600)}字以上。不要摘要場景，要以行動、對話、發現來展開。`,
      '- 各段以空行分隔。',
      isFinal
        ? '- 這是最後一章。請以續寫的內容自然地將故事完結。'
        : '- 續寫內容的結尾，要停在促使下一個選擇的抉擇時刻。',
    ].join('\n'),
};
