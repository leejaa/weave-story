// Per-language writing guide for direct (non-harness) chapter generation.
// Korean strings are kept exactly as they were before localization (no
// regression); English and Japanese mirror them. Genre is language-neutral.
import type { StoryLang } from './story-lang';

export type LangGuide = {
  writerSystem: string;
  summarySystem: string;
  desc: {
    title: string;
    genre: string;
    chapterTitleFirst: string;
    chapterTitle: string;
    contentMain: string;
    contentFinal: string;
    situation: string;
    question: string;
    choices: string;
    finalSituation: string;
    finalQuestion: string;
    finalChoices: string;
  };
  firstPrompt: (prompt: string, chapters: number) => string;
  summariesLabel: string;
  summaryLine: (n: number, s: string) => string;
  nextPrompt: (args: {
    prompt: string;
    chapters: number;
    summaries: string;
    prevNumber: number;
    prevContent: string;
    chosen: string;
    nextNumber: number;
    isFinal: boolean;
  }) => string;
  summaryPrompt: (content: string, n: number) => string;
};

const GENRE_DESC = 'Genre: one lowercase English token among mystery | romance | drama | thriller | folk';

const ko: LangGuide = {
  writerSystem:
    '당신은 한국 문학 소설 작가입니다. 독자가 선택한 설정을 바탕으로 인터랙티브 소설 챕터를 한국어로 작성합니다. 문학적이고 감각적인 문체로, 생동감 있는 장면과 감정을 담아 작성하세요.',
  summarySystem: '당신은 소설 편집자입니다. 챕터 내용을 간결하게 요약합니다.',
  desc: {
    title: '이야기 전체 제목 (시적이고 인상적인, 30자 이내)',
    genre: GENRE_DESC,
    chapterTitleFirst: '챕터 1 제목 (20자 이내)',
    chapterTitle: '챕터 제목 (20자 이내)',
    contentMain:
      '【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기의 모든 서사를 여기에 담으세요. situation 필드에는 새로운 이야기를 쓰지 마세요.',
    contentFinal:
      '【독자에게 직접 보여지는 챕터 본문 전체】 반드시 2000자 이상 2800자 이하. 9-12문단, 각 문단은 빈 줄로 구분. 이야기를 완결지으세요.',
    situation:
      '【선택지 화면에 표시되는 짧은 상황 요약】 content에서 묘사한 결정 순간을 1-2문장으로만 요약. 60자 이내. 새로운 내용 금지.',
    question: '독자에게 던지는 선택 질문 (예: "서연은 어떻게 할 것인가?", 20자 이내)',
    choices: '독자 선택지 정확히 2개 (각 25자 이내, 한국어, 구체적인 행동 묘사)',
    finalSituation: '마지막 챕터이므로 빈 문자열',
    finalQuestion: '마지막 챕터이므로 빈 문자열',
    finalChoices: '마지막 챕터이므로 반드시 빈 배열 []',
  },
  firstPrompt: (prompt, chapters) =>
    `독자가 원하는 이야기:\n"${prompt}"\n\n전체 챕터 수: ${chapters}챕터\n\n위 설정을 바탕으로 이야기의 첫 챕터를 작성해주세요.\n\n【반드시 지킬 것】\n- content: 반드시 2000자 이상 써주세요.\n- situation: content에서 묘사한 결정 순간을 1-2문장(60자 이내)으로만 요약하세요.`,
  summariesLabel: '[이전 챕터 요약]',
  summaryLine: (n, s) => `챕터 ${n}: ${s}`,
  nextPrompt: ({ prompt, chapters, summaries, prevNumber, prevContent, chosen, nextNumber, isFinal }) =>
    `이야기 설정: "${prompt}"\n전체 챕터 수: ${chapters}챕터\n\n${summaries}[챕터 ${prevNumber} 내용]\n${prevContent}\n\n독자의 선택: "${chosen}"\n\n현재 챕터 번호: ${nextNumber} / ${chapters}\n${isFinal ? '\n이것이 마지막 챕터입니다. choices는 반드시 빈 배열 []로 반환하세요.' : ''}\n\n【반드시 지킬 것】\n- content: 반드시 2000자 이상 써주세요.\n- situation: 1-2문장(60자 이내)으로만 요약하세요.`,
  summaryPrompt: (content, n) =>
    `다음 인터랙티브 소설 챕터의 핵심 사건, 인물 행동, 감정 변화를 200자 이내로 요약하세요.\n\n[챕터 ${n} 내용]\n${content}`,
};

const en: LangGuide = {
  writerSystem:
    'You are a literary novelist. Based on the reader\'s premise, you write interactive-fiction chapters in English. Use vivid, sensory, literary prose that brings scenes and emotions to life.',
  summarySystem: 'You are a fiction editor. You summarize chapter content concisely.',
  desc: {
    title: 'Overall story title (poetic and striking, short)',
    genre: GENRE_DESC,
    chapterTitleFirst: 'Title of chapter 1 (short)',
    chapterTitle: 'Chapter title (short)',
    contentMain:
      '[The full chapter body shown directly to the reader] Write 1200–1700 words across 9–12 paragraphs, each separated by a blank line. Put all of the narrative here. Do NOT write new story in the situation field.',
    contentFinal:
      '[The full chapter body shown directly to the reader] 1200–1700 words across 9–12 paragraphs separated by blank lines. Bring the story to a satisfying close.',
    situation:
      '[Short situation summary shown on the choice screen] Summarize the decision moment from content in 1–2 sentences. No new content.',
    question: 'The choice question posed to the reader (e.g. "What will she do?")',
    choices: 'Exactly 2 reader choices, each a short, concrete action, in English.',
    finalSituation: 'Empty string (this is the final chapter)',
    finalQuestion: 'Empty string (this is the final chapter)',
    finalChoices: 'Must be an empty array [] (this is the final chapter)',
  },
  firstPrompt: (prompt, chapters) =>
    `The story the reader wants:\n"${prompt}"\n\nTotal chapters: ${chapters}\n\nWrite the first chapter based on this premise.\n\n[Must follow]\n- content: at least 1200 words.\n- situation: summarize the decision moment from content in 1–2 sentences.`,
  summariesLabel: '[Previous chapter summaries]',
  summaryLine: (n, s) => `Chapter ${n}: ${s}`,
  nextPrompt: ({ prompt, chapters, summaries, prevNumber, prevContent, chosen, nextNumber, isFinal }) =>
    `Story premise: "${prompt}"\nTotal chapters: ${chapters}\n\n${summaries}[Chapter ${prevNumber} content]\n${prevContent}\n\nReader's choice: "${chosen}"\n\nCurrent chapter: ${nextNumber} / ${chapters}\n${isFinal ? '\nThis is the final chapter. Return choices as an empty array [].' : ''}\n\n[Must follow]\n- content: at least 1200 words.\n- situation: a 1–2 sentence summary only.`,
  summaryPrompt: (content, n) =>
    `Summarize the key events, character actions, and emotional shifts of the following interactive-fiction chapter in about 120 words or fewer.\n\n[Chapter ${n} content]\n${content}`,
};

const ja: LangGuide = {
  writerSystem:
    'あなたは文芸小説の作家です。読者が選んだ設定をもとに、インタラクティブ小説の章を日本語で執筆します。文学的で感覚的な文体で、生き生きとした場面と感情を描いてください。',
  summarySystem: 'あなたは小説の編集者です。章の内容を簡潔に要約します。',
  desc: {
    title: '物語全体のタイトル（詩的で印象的、30字以内）',
    genre: GENRE_DESC,
    chapterTitleFirst: '第1章のタイトル（20字以内）',
    chapterTitle: '章のタイトル（20字以内）',
    contentMain:
      '【読者に直接表示される章の本文全体】必ず2000字以上2800字以下。9〜12段落、各段落は空行で区切る。物語のすべてをここに書く。situationフィールドに新しい物語を書かない。',
    contentFinal:
      '【読者に直接表示される章の本文全体】2000字以上2800字以下。9〜12段落、空行で区切る。物語を完結させる。',
    situation:
      '【選択肢画面に表示される短い状況要約】contentで描いた決断の瞬間を1〜2文で要約。60字以内。新しい内容は禁止。',
    question: '読者に投げかける選択の問い（例:「彼女はどうする?」、20字以内）',
    choices: '読者の選択肢をちょうど2つ（各25字以内、日本語、具体的な行動描写）',
    finalSituation: '最終章なので空文字列',
    finalQuestion: '最終章なので空文字列',
    finalChoices: '最終章なので必ず空配列 []',
  },
  firstPrompt: (prompt, chapters) =>
    `読者が望む物語:\n"${prompt}"\n\n全章数: ${chapters}章\n\n上の設定をもとに物語の第1章を書いてください。\n\n【必ず守ること】\n- content: 必ず2000字以上。\n- situation: contentで描いた決断の瞬間を1〜2文（60字以内）で要約。`,
  summariesLabel: '[前の章の要約]',
  summaryLine: (n, s) => `第${n}章: ${s}`,
  nextPrompt: ({ prompt, chapters, summaries, prevNumber, prevContent, chosen, nextNumber, isFinal }) =>
    `物語の設定: "${prompt}"\n全章数: ${chapters}章\n\n${summaries}[第${prevNumber}章の内容]\n${prevContent}\n\n読者の選択:「${chosen}」\n\n現在の章番号: ${nextNumber} / ${chapters}\n${isFinal ? '\nこれが最終章です。choicesは必ず空配列[]で返してください。' : ''}\n\n【必ず守ること】\n- content: 必ず2000字以上。\n- situation: 1〜2文（60字以内）で要約。`,
  summaryPrompt: (content, n) =>
    `次のインタラクティブ小説の章の重要な出来事、人物の行動、感情の変化を200字以内で要約してください。\n\n[第${n}章の内容]\n${content}`,
};

const zhHant: LangGuide = {
  writerSystem:
    '你是一位文學小說作家。你會根據讀者選定的設定，以繁體中文撰寫互動小說的章節。請以富有文學性與感官質感的文筆，寫出生動的場景與情感。',
  summarySystem: '你是一位小說編輯。你會將章節內容簡潔地摘要。',
  desc: {
    title: '整部故事的標題（詩意而印象深刻，30字以內）',
    genre: GENRE_DESC,
    chapterTitleFirst: '第1章的標題（20字以內）',
    chapterTitle: '章節標題（20字以內）',
    contentMain:
      '【直接呈現給讀者的章節正文全文】務必2000字以上、2800字以下。9至12段，各段以空行分隔。將故事的所有敘事都寫在這裡。請勿在 situation 欄位寫新的故事。',
    contentFinal:
      '【直接呈現給讀者的章節正文全文】務必2000字以上、2800字以下。9至12段，以空行分隔。請將故事完結。',
    situation:
      '【顯示於選擇畫面的簡短情境摘要】將 content 中描寫的抉擇時刻以1至2句摘要。60字以內。禁止寫新內容。',
    question: '向讀者拋出的選擇提問（例:「她該怎麼做？」，20字以內）',
    choices: '讀者選項剛好2個（各25字以內，繁體中文，具體的行動描寫）',
    finalSituation: '因為是最後一章，留空字串',
    finalQuestion: '因為是最後一章，留空字串',
    finalChoices: '因為是最後一章，務必為空陣列 []',
  },
  firstPrompt: (prompt, chapters) =>
    `讀者想要的故事:\n"${prompt}"\n\n總章數: ${chapters}章\n\n請根據以上設定，撰寫故事的第一章。\n\n【務必遵守】\n- content: 務必寫滿2000字以上。\n- situation: 將 content 中描寫的抉擇時刻，僅以1至2句（60字以內）摘要。`,
  summariesLabel: '[前面章節的摘要]',
  summaryLine: (n, s) => `第${n}章: ${s}`,
  nextPrompt: ({ prompt, chapters, summaries, prevNumber, prevContent, chosen, nextNumber, isFinal }) =>
    `故事設定: "${prompt}"\n總章數: ${chapters}章\n\n${summaries}[第${prevNumber}章內容]\n${prevContent}\n\n讀者的選擇: "${chosen}"\n\n目前章節編號: ${nextNumber} / ${chapters}\n${isFinal ? '\n這是最後一章。choices 務必以空陣列 [] 回傳。' : ''}\n\n【務必遵守】\n- content: 務必寫滿2000字以上。\n- situation: 僅以1至2句（60字以內）摘要。`,
  summaryPrompt: (content, n) =>
    `請將以下互動小說章節的關鍵事件、人物行動與情感變化，以200字以內摘要。\n\n[第${n}章內容]\n${content}`,
};

export const GUIDES: Record<StoryLang, LangGuide> = { ko, en, ja, 'zh-Hant': zhHant };
