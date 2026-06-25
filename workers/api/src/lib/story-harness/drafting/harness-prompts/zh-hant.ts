// Traditional Chinese harness prompts (mirrors the Korean/Japanese craft directives).
// Concept (2026-06-23 refactor): see ko.ts. Thin spine + per-chapter event from the
// prior choice + fresh hook + causal choices + readability + short, fast length.
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';
import { formatStoryState } from '../../../ai/story-generation';
import { narrativePhase, chapterEventBeat, hookDirective, type NarrativePhase, type EventBeat, type HookDirective } from '../narrative-phase';
import { currentArc, formatBlueprintSpine, formatGenreLock, formatArc } from '../../blueprint/format-blueprint';
import { renderFirstDraftPrompt, renderNextDraftPrompt } from './render-outline-prompt';

// 各敘事階段(起承轉結)的節奏指引 — 參見 narrative-phase.ts。
const ZH_PHASE: Record<NarrativePhase, string> = {
  setup: '現在是開端(起)。請讓世界與人物、主角的欲望與傷痕迅速站穩，並埋下核心衝突的火種。先不要揭露所有祕密。',
  rising: '現在是發展(承)。請放大衝突與賭注，同時發展並開始回收已鋪陳的伏筆。不要一味堆疊新謎團，讓主角的欲望與傷痕開始碰撞。',
  turn: '現在是轉折(轉)。以翻盤的逆轉或祕密的揭露把危機推高。從此刻起克制新的大伏筆，開始把已鋪陳的衝突收束到同一個方向。',
  resolution: '現在是朝高潮收束的區段。開始回收未解的伏筆，不要再引入新人物或新支線。把張力推到高潮之前。',
  final: '這是最後一章。請引爆高潮並了結核心衝突。給主角的欲望與傷痕情感上的回報，回收剩餘的伏筆，並以餘韻作結。',
};

// 本章應發生的「事件種類」— 讓連續章節不致感覺像同一場景，將事件種類輪替。
const ZH_EVENT_BEAT: Record<EventBeat, string> = {
  confrontation: '對峙/衝突 — 拖延已久的衝突正面爆發。',
  revelation: '發現/揭露 — 被隱藏的事實、身分或線索浮上檯面。',
  externalThreat: '外部威脅 — 失控的威脅(敵人、事件、時間壓力)逼近。',
  allianceShift: '關係變化 — 盟友/敵對的格局翻轉，或有新人物介入。',
  reversal: '逆轉 — 局勢與主角的預期相反地翻轉。',
  costSurfaces: '代價浮現 — 過往選擇的後果、代價具體降臨。',
};

// 伏筆會計指示 — hookDirective(與 EventBeat 正交:決定開新伏筆或回收)。防止單調堆疊。
const ZH_HOOK_DIRECTIVE: Record<HookDirective, string> = {
  plant_ok: '伏筆會計:可以埋下大約一個新伏筆。但正文必須藉本章事件實際推進,不要只丟伏筆就結束。',
  payoff_due: '伏筆會計(重要):本章必須在正文中「明確回收」至少一個已開的伏筆(讓讀者感到得到了答案)。不要不回收就只加新伏筆。新伏筆只能在回收之後、且與所回收者直接相關,至多一個。',
  converge: '伏筆會計(收束):絕不可新增伏筆,只專注回收已開的伏筆。把散落的線索收攏到同一個方向。',
};

// 可讀性優先的文體護欄 — 抑制模型特有的習氣(濫用對偶、過度說明、抽象獨白)。
const ZH_PROSE_GUARDRAIL = [
  '[文體護欄 — 好讀、易讀為最優先]',
  '- 使用淺白的日常用詞。避免艱深詞彙、抽象觀念語與文學性修辭，只用人人一看就懂的說法。',
  '- 句子要短而清楚，一句只講一件事。禁止冗長迂迴的句子。',
  '- 對偶/悖論句式(「不是X而是Y」「越…就越…」)一章最多一次，基本上請勿使用。',
  '- 不要堆疊抽象的內心獨白或觀念性敘述；以行動、對話、具體場景來呈現情感(showing 而非 telling)。',
  '- 不要反覆使用同一個比喻/意象(光、影、心跳、溫度等)。',
  '- 積極運用對話，讓場景輕快地推進。',
  '- 不要用說明的方式傾倒資訊，只自然帶出必要的部分。',
].join('\n');

// 篇幅/格式 — 短而快的網路小說型。
const ZH_LENGTH = [
  '[篇幅與格式]',
  '- content 以繁體中文寫1,800字以上、2,800字以下。不要拖長，要以事件為中心壓縮。',
  '- 8至14段，各段以空行分隔。不要讓任何一段過長。',
  '- 不要摘要場景，要以實際發生的事件、行動、對話來呈現。',
  '- 這次回應只寫正文(content)與標題欄位。選項在下一階段製作。',
  '- 正文中絕對不要寫出「[選擇]」「選項」「①/②」這類選項清單，也不要對讀者提問。正文只以故事敘述作結。',
].join('\n');

// 因果性的選項規則。
const ZH_CHOICE_RULES = [
  '[選項規則 — 具因果且主動]',
  '- choices: 剛好2個。每一項具有 text(具體行動)與 consequence(結果的暗示)。',
  '- 兩個選項都必須是主角對本章事件的「主動回應」。',
  '- 兩個選項各自必須通往明顯不同的「下一個事件」(不同方向、不同危險、不同結果)。',
  '- 禁止無法推進局勢的「旁觀/迴避/退縮」(冷靜、假裝不知道、等待、思考等)選項。',
  '- consequence 中要明確寫出該選擇所招致的具體威脅或將失去的東西。',
  '- [依據] 選項只能以正文／大綱中已確立的事實為前提。不要斷定或捏造正文未曾出現的新事實(意外、死因、原因、地點、人物、設定等)。(例:只提到「昏迷」卻提供「前往事故現場」這種捏造原因的選項，禁止。)',
  '- [收束] 兩個選項都必須是已開展的局勢與大綱能毫無矛盾地吸收的路徑。不要製造把故事彈出設計之外的分支。',
  '- 不要在正文之外捏造新事件。situation 中不要放入台詞。',
].join('\n');

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\n尚無已保存的 story bible。請以使用者設定與前面章節為準，維持連貫性。';
  }
  return [
    storyBible.canon ? `[不變正典 — 絕對不可與以下設定矛盾(死亡/轉生等核心機制與類型須保持一致)]\n${storyBible.canon}\n` : '',
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
    '一切以「讀得快」為最優先。比起觀念性敘述，要用場景、行動、對話來呈現。',
  ].join('\n'),
  firstStructureSystem: [
    '你是以繁體中文工作的網路小說編輯。',
    '你會讀完給定的第一話正文，準確地萃取出作品設定集與讀者的選項。',
    '不要捏造正文中沒有的新事件，直接沿用正文最終場景所產生的選擇壓力。',
  ].join('\n'),
  nextDraftSystem: [
    '你是網路小說編輯部的連載作家，以繁體中文寫作。',
    '你會承接前一章與讀者的選擇，寫出讓選擇的代價化為「實際事件」的下一話。',
    '每一章都必須有一個作為前一個選擇直接結果、足以改變局勢的具體事件。不要在原地打轉，也不要只用內心反芻來填滿。',
    '讀者所選或所輸入的行動，務必在正文中實際發生。不要加以阻止或使其失效，而要展開因此而改變的世界。',
  ].join('\n'),
  nextStructureSystem: [
    '你是以繁體中文工作的網路小說編輯。',
    '你會讀完給定章節的正文，準確地萃取出通往下一話的讀者選項。',
    '不要捏造正文中沒有的新事件，直接沿用正文最終場景所產生的選擇壓力。',
  ].join('\n'),
  buildFirstDraft: (a) => {
    if (a.outline && a.beat) return renderFirstDraftPrompt(a, { guardrail: ZH_PROSE_GUARDRAIL, length: ZH_LENGTH });
    const { prompt, estimatedChapters, attempt, previousIssues, hintGenre } = a;
    const retry = previousIssues?.length ? `\n\n[上次結果務必修正的問題]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreHint = hintGenre ? `\n[已選擇的類型: ${hintGenre}]\n請維持符合這個類型的氛圍與演出。不要加入此類型所沒有的推理、黑色、驚悚元素。\n` : '';
    return [
      `讀者想要的故事:\n"${prompt}"`,
      `總章數: ${estimatedChapters}章`,
      `生成嘗試: ${attempt}/2`,
      retry,
      genreHint,
      '[敘事階段 — 本章的角色]',
      ZH_PHASE.setup,
      '',
      '[第一話的設計原則]',
      '- 在前2至3段以內，就發生一樁打破主角日常或安全的事件。不要把開場拖得太長。',
      '- 若提示詞中明確提到了轉折事件(死亡、轉生、回歸、附身、前世等)，則該轉折事件必須在第一話中實際發生。不要只描寫轉折前的狀態，以「序章」形式結束第一話。',
      '- 類型鎖定：請勿自行加入原始提示詞中沒有的推理、黑色電影、偵探、驚悚元素。',
      '- 為主角埋下將推動故事前進的「主動目標(drive)」種子。主角不只是驚訝或等待，而是有所渴望並付諸行動。',
      '- 正文的結尾，要停在至少動搖權力、關係、祕密、生存、冤屈、契約、背叛其中之一的抉擇時刻(鉤子)。',
      '- 不要以「冷靜回應」「假裝不知道」這類瑣碎的反應作結。',
      '',
      ZH_PROSE_GUARDRAIL,
      '',
      ZH_LENGTH,
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues, hintGenre }) => {
    const retry = previousIssues?.length ? `\n[上次嘗試被指出的問題 — 這次務必修正]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreNote = hintGenre ? `\n[使用者選擇的類型: ${hintGenre}]\nbible.genre 請以此類型為基準。\n` : '';
    return [
      `讀者原本想要的故事:\n"${prompt}"`,
      `總章數: ${estimatedChapters}章`,
      '',
      '以下是剛寫好的第一話正文。請以這段正文為依據，製作設定集與選項。',
      '─────────────',
      content,
      '─────────────',
      retry,
      genreNote,
      '[萃取規則]',
      '- bible: 與正文一致的作品設定集。各欄位簡潔填寫。',
      '- bible.desire: 主角在這個故事中真正渴望的東西(超越生存之上)。以1至2句描述正文中可以讀取到的核心欲望。',
      '- bible.wound: 主角的情感傷痕或最深的恐懼。以1至2句描述正文中呈現或暗示的內心脆弱之處。',
      '- bible.canon: 將使用者原始設定的核心前提*不加重新詮釋*地固定下來的不變規則。死亡/轉生/附身/失蹤等核心機制與類型須照原文保留(例：不可把「轉生」改成「附身」、「死亡」改成「失蹤」)。3至5條簡短斷定句，200字以內。',
      '- bible.genre: 只寫提示詞和正文中可以明確讀出的類型。不要自行加入正文中沒有的「推理」「懸疑」「黑色電影」等。',
      '- bible.tone: 萃取提示詞和正文的實際氛圍。不要在原文中沒有的情況下擅自加上「冷峻陰暗」「神秘」的氛圍。',
      '- bible.forbidden_patterns 必須包含「加入原始設定中沒有的推理/懸疑/黑色電影副線」。',
      '- situation: 將正文結尾的抉擇時刻以1至2句摘要。不要放入台詞。',
      '- question: 向讀者拋出的一行提問。',
      '',
      ZH_CHOICE_RULES,
    ].join('\n');
  },
  buildNextDraft: (a) => {
    if (a.outline && a.beat) return renderNextDraftPrompt(a, { guardrail: ZH_PROSE_GUARDRAIL, length: ZH_LENGTH });
    const phase: NarrativePhase = a.isFinal ? 'final' : narrativePhase(a.nextChapterNumber, a.estimatedChapters);
    const beat = ZH_EVENT_BEAT[chapterEventBeat(a.nextChapterNumber)];
    const stateText = formatStoryState(a.storyState)
      ?? (a.previousChaptersSummaries.length > 0
          ? a.previousChaptersSummaries.map(s => `第${s.chapterNumber}章: ${s.summary}`).join('\n')
          : '無');
    const retry = a.previousIssues?.length ? `\n\n[上次結果務必修正的問題]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';

    // 設計圖(若有)+ 伏筆會計。若無設計圖(舊故事)則回退至原本行為。
    const bp = a.storyBible?.blueprint ?? null;
    const progress = a.estimatedChapters > 0 ? a.nextChapterNumber / a.estimatedChapters : 1;
    const directive = hookDirective(a.nextChapterNumber, a.estimatedChapters, a.storyState?.openLoops?.length ?? 0);
    const arc = bp ? currentArc(bp, progress) : null;
    const oldestLoops = (a.storyState?.openLoops ?? []).slice(0, 2);
    const blueprintSection = bp
      ? [
          '',
          '[故事設計圖 — 整體架構(絕不偏離)]',
          formatBlueprintSpine(bp),
          '',
          '[類型鎖定]',
          formatGenreLock(bp),
          '- 請將本作的類型維持到底。除非類型本身就是推理/懸疑,否則不要變質成不斷撒線索、保留資訊的懸疑·辦案套路。',
          ...(arc ? ['', '[本章的角色 — 設計圖弧]', formatArc(arc)] : []),
        ].join('\n')
      : '';
    const hookSection = [
      '',
      '[伏筆會計 — 嚴格]',
      ZH_HOOK_DIRECTIVE[a.isFinal ? 'converge' : directive],
      oldestLoops.length
        ? `- 目前開著的伏筆(由舊到新): ${oldestLoops.map(l => `「${l}」`).join('、')}。回收時請從最舊的開始收。`
        : '',
      progress > 0.45 && !a.isFinal
        ? '- 從此刻起,新開的伏筆數不可超過收掉的伏筆數(未回收伏筆的總數不可增加)。'
        : '',
    ].filter(Boolean).join('\n');

    return [
      bibleSection(a.storyBible),
      blueprintSection,
      '',
      `[使用者原本的設定]\n${a.prompt}`,
      `總章數: ${a.estimatedChapters}`,
      `現在要寫的章: ${a.nextChapterNumber}`,
      `生成嘗試: ${a.attempt}/2`,
      retry,
      `[目前進度狀態]\n${stateText}`,
      `[緊接的第${a.previousChapterNumber}章正文]\n${a.previousChapterContent}`,
      `[讀者的選擇]\n${a.chosenOption}`,
      '',
      '[讀者所選的行動務必執行 — 最重要]',
      '- 上方「讀者的選擇」所寫的行動，務必在正文最初的1至2段以內實際發生。',
      '- 不可只是嘗試該行動就被阻止、被他人搶先而失效，或改成「想做卻失敗」。',
      a.choiceKind === 'free_input'
        ? '- 這個行動是讀者直接輸入的。請盡可能照字面執行。'
        : '- 執行如選項文字所述的行動，不要擅自改成別的行動。',
      '- 但若是物理上不可能、或會破壞世界觀的行動，不要無視，而要以最貼近讀者意圖的形式執行。',
      '',
      '[本章的事件 — 最重要]',
      '- 本章必須有一個作為前一個選擇直接結果、足以改變局勢的具體事件「實際」發生。不要只用內心反芻、整理狀況、原地打轉來填滿。',
      '- 該事件必須讓權力、關係、祕密、生存、所在位置其中至少一項的狀態，與前一章有所不同。',
      '- 朝 drive(主角當前的目標)前進一步，或對該目標構成新的威脅。',
      `- 本章事件的種類請盡量做變奏(禁止與前一章重複同一種類): ${beat}`,
      hookSection,
      a.isFinal
        ? '- 這是最後一章。請在正文中將故事完結。'
        : '- 正文結尾停在召喚下一個選擇的抉擇時刻。結尾的鉤子須遵守上方「伏筆會計」— 必須是設計圖中已規劃的提問,或由本章剛回收的伏筆自然衍生者;不要每章都加無關的新謎團。',
      '',
      '[敘事階段 — 本章的角色]',
      ZH_PHASE[phase],
      '',
      ZH_PROSE_GUARDRAIL,
      '',
      ZH_LENGTH,
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
      '',
      ZH_CHOICE_RULES,
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal }) =>
    [
      '以下是正在撰寫的章節正文。因為篇幅略有不足，請接著繼續寫下去。',
      '─────────────',
      currentContent,
      '─────────────',
      '[續寫指引]',
      '- 不要開始新的章節，要自然地「接續」上方正文的最後場景往下寫。',
      '- 不要重複或重新輸出已經寫過的內容。只輸出新增的正文。',
      `- 大約續寫${Math.max(deficitChars, 400)}字左右。不要摘要場景，要以行動、對話、發現來展開。`,
      '- 各段以空行分隔。',
      isFinal
        ? '- 這是最後一章。請以續寫的內容自然地將故事完結。'
        : '- 續寫內容的結尾，要留下牽引下一話的鉤子，並停在促使下一個選擇的抉擇時刻。',
    ].join('\n'),
};
