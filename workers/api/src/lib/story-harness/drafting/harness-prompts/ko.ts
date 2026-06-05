// Korean harness prompts — reproduces the exact strings used before
// localization, so existing KO generation is byte-for-byte unchanged.
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\n아직 저장된 story bible이 없습니다. 사용자 설정과 이전 챕터를 기준으로 연속성을 유지하세요.';
  }
  return [
    '[Story Bible]',
    `로그라인: ${storyBible.logline}`,
    `장르: ${storyBible.genre}`,
    `톤: ${storyBible.tone}`,
    `주인공: ${storyBible.protagonist}`,
    `중심 갈등: ${storyBible.centralConflict}`,
    `독자 약속: ${storyBible.readerPromise}`,
    `오프닝 위협: ${storyBible.openingThreat}`,
    storyBible.openThreads.length ? `[열린 떡밥]\n${storyBible.openThreads.map(t => `- ${t}`).join('\n')}` : '',
    storyBible.forbiddenPatterns.length ? `[금지 패턴]\n${storyBible.forbiddenPatterns.map(p => `- ${p}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

export const KO: HarnessGuide = {
  firstDraftSystem: [
    '당신은 한국 웹소설 편집부의 수석 작가입니다.',
    '독자가 모바일에서 첫 화를 읽자마자 계속 넘기고 싶도록, 사건을 빠르게 열고 강한 선택 압박을 만듭니다.',
    '문학적인 문장과 웹소설식 후킹을 함께 사용합니다.',
  ].join('\n'),
  firstStructureSystem: [
    '당신은 한국 웹소설 편집자입니다.',
    '주어진 첫 화 본문을 읽고, 작품 설정집과 독자 선택지를 정확하게 추출합니다.',
    '본문에 없는 새 사건을 만들지 않고, 본문의 마지막 장면이 만든 선택 압박을 그대로 사용합니다.',
  ].join('\n'),
  nextDraftSystem: [
    '당신은 한국 웹소설 편집부의 연재 작가입니다.',
    '이전 챕터와 독자의 선택을 이어 받아, 선택의 대가가 실제 사건으로 드러나는 다음 화를 씁니다.',
    '독자가 고른 선택을 단순히 언급하지 말고 권력, 관계, 비밀, 생존 위험 중 하나를 즉시 흔드는 결과로 전개하세요.',
    '독자가 선택하거나 입력한 행동은 본문에서 반드시 실제로 일어나야 합니다. 막거나 무산시키지 말고, 그 결과로 바뀐 세계를 창의적으로 전개하세요.',
  ].join('\n'),
  nextStructureSystem: [
    '당신은 한국 웹소설 편집자입니다.',
    '주어진 챕터 본문을 읽고, 다음 화로 이어지는 독자 선택지를 정확하게 추출합니다.',
    '본문에 없는 새 사건을 만들지 않고, 본문의 마지막 장면이 만든 선택 압박을 그대로 사용합니다.',
  ].join('\n'),
  buildFirstDraft: ({ prompt, estimatedChapters, attempt, previousIssues }) => {
    const retry = previousIssues?.length ? `\n\n[이전 결과에서 반드시 고칠 문제]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `독자가 원하는 이야기:\n"${prompt}"`,
      `전체 챕터 수: ${estimatedChapters}챕터`,
      `생성 시도: ${attempt}/2`,
      retry,
      '[첫 화 설계 원칙]',
      '- 첫 3문단 안에 독자의 일상/안전을 깨는 사건을 발생시킵니다.',
      '- 주인공은 단순히 놀라거나 기다리지 않고, 위험한 정보를 쥐거나 위험한 선택 앞에 서야 합니다.',
      '- 본문의 마지막은 권력, 관계, 비밀, 생존, 누명, 계약, 배신 중 최소 하나를 흔드는 결정의 순간에서 멈춥니다.',
      '- "침착하게 대답한다", "모른 척한다"처럼 사소한 반응으로 끝내지 않습니다.',
      '',
      '[분량과 형식 — 매우 중요]',
      '- content는 반드시 한국어 2600자 이상, 3400자 이하로 씁니다. 2000자 미만이면 실패입니다.',
      '- 10-14문단, 각 문단은 빈 줄로 구분합니다.',
      '- 각 문단은 2-4문장으로 충분히 전개합니다. 장면을 요약하지 말고 실제 사건으로 보여주세요.',
      '- 이번 응답은 오직 본문(content)과 제목 필드만 작성합니다. 선택지는 다음 단계에서 만듭니다.',
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[이전 시도에서 지적된 문제 — 이번엔 반드시 고치세요]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `독자가 원래 원한 이야기:\n"${prompt}"`,
      `전체 챕터 수: ${estimatedChapters}챕터`,
      '',
      '아래는 방금 작성된 첫 화 본문입니다. 이 본문을 근거로 설정집과 선택지를 만드세요.',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[추출 규칙]',
      '- bible: 본문과 일관된 작품 설정집. 각 필드는 간결하게 채웁니다.',
      '- situation: 본문이 끝나는 결정 순간을 1-2문장(120자 이내)으로 요약합니다. 대사를 넣지 마세요.',
      '- question: 독자에게 던지는 한 줄 질문(80자 이내)입니다.',
      '- choices: 정확히 2개. 각 항목은 text(구체적 행동)와 consequence(결과 암시)를 가집니다.',
      '',
      '[선택지는 반드시 높은 대가를 건다]',
      '- 두 선택지 각각이 비밀·목숨·배신·증거·정체·복수·생존·계약 같은 분명한 위험이나 손실을 걸어야 합니다.',
      '- consequence에는 그 선택이 부를 구체적 위협이나 잃을 것을 명시합니다.',
      '- 두 선택지는 서로 다른 방향이어야 하고, "침착하게/모른 척/기다린다" 같은 소극적 반응은 금지합니다.',
      '- 본문 밖의 새로운 사건을 만들지 마세요.',
    ].join('\n');
  },
  buildNextDraft: (a) => {
    const summaries = a.previousChaptersSummaries.length > 0
      ? a.previousChaptersSummaries.map(s => `챕터 ${s.chapterNumber}: ${s.summary}`).join('\n')
      : '요약 없음';
    const retry = a.previousIssues?.length ? `\n\n[이전 결과에서 반드시 고칠 문제]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      bibleSection(a.storyBible),
      '',
      `[사용자 원 설정]\n${a.prompt}`,
      `전체 챕터 수: ${a.estimatedChapters}`,
      `현재 작성할 챕터: ${a.nextChapterNumber}`,
      `생성 시도: ${a.attempt}/2`,
      retry,
      `[이전 챕터 요약]\n${summaries}`,
      `[직전 챕터 ${a.previousChapterNumber} 본문]\n${a.previousChapterContent}`,
      `[독자의 선택]\n${a.chosenOption}`,
      '',
      '[독자가 고른 행동을 반드시 실행할 것 — 가장 중요]',
      '- 위 "독자의 선택"에 적힌 행동은 본문 첫 1-2문단 안에서 실제로 일어나야 합니다.',
      '- 그 행동을 시도만 하다 저지당하거나, 다른 인물이 선수 쳐 무산시키거나, "하려 했으나 실패"로 돌리지 마세요.',
      '- 결정적 행동이면(예: 누군가를 죽인다) 대상은 실제로 그렇게 되고, 그 결과가 만든 새 문제(시신·발각 위험·권력 공백·잃거나 얻은 단서 등)로 이야기를 갈라지게 전개하세요.',
      a.choiceKind === 'free_input'
        ? '- 이 행동은 독자가 직접 입력한 것입니다. 가능한 한 문자 그대로 실행하세요.'
        : '- 선택지 문구의 행동을 그대로 실행하고, 임의로 다른 행동으로 바꾸지 마세요.',
      '- 단, 물리적으로 불가능하거나 세계관을 깨는 행동이면 무시하지 말고 독자의 의도에 가장 가까운 방식으로 실행하세요.',
      '',
      '[다음 화 작성 원칙]',
      '- 첫 2문단 안에 독자의 선택 때문에 달라진 결과를 보여주세요.',
      '- 선택의 대가가 인물 관계, 증거, 권력, 생존 위험 중 최소 하나를 바꿔야 합니다.',
      '- 이전 챕터의 감정과 사건을 반복 설명하지 말고, 새 압박으로 밀어붙입니다.',
      '- 장면은 요약하지 말고 행동, 대화, 발견으로 전개합니다.',
      a.isFinal ? '- 마지막 챕터입니다. 본문에서 이야기를 완결지으세요.' : '- 본문의 마지막은 다음 선택을 부르는 결정의 순간에서 멈춥니다.',
      '',
      '[분량과 형식 — 매우 중요]',
      '- content는 반드시 한국어 2400자 이상, 3400자 이하로 씁니다. 2000자 미만이면 실패입니다.',
      '- 9-14문단, 각 문단은 빈 줄로 구분합니다.',
      '- 이번 응답은 오직 본문(content)과 제목만 작성합니다. 선택지는 다음 단계에서 만듭니다.',
    ].join('\n');
  },
  buildNextStructure: ({ prompt, estimatedChapters, nextChapterNumber, content, previousIssues }) => {
    const retry = previousIssues?.length ? `\n[이전 시도에서 지적된 문제 — 이번엔 반드시 고치세요]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    return [
      `독자가 원래 원한 이야기:\n"${prompt}"`,
      `현재 챕터: ${nextChapterNumber} / 전체 ${estimatedChapters}`,
      '',
      '아래는 방금 작성된 챕터 본문입니다. 이 본문을 근거로 다음 화로 이어지는 선택지를 만드세요.',
      '─────────────',
      content,
      '─────────────',
      retry,
      '[추출 규칙]',
      '- situation: 본문이 끝나는 결정 순간을 1-2문장(120자 이내)으로 요약합니다. 대사를 넣지 마세요.',
      '- question: 독자에게 던지는 한 줄 질문(80자 이내)입니다.',
      '- choices: 정확히 2개. 각 항목은 text(구체적 행동)와 consequence(결과 암시)를 가집니다.',
      '',
      '[선택지는 반드시 높은 대가를 건다]',
      '- 두 선택지 각각이 비밀·목숨·배신·증거·정체·복수·생존·계약 같은 분명한 위험이나 손실을 걸어야 합니다.',
      '- consequence에는 그 선택이 부를 구체적 위협이나 잃을 것을 명시합니다.',
      '- 두 선택지는 서로 다른 방향이어야 하고, "침착하게/모른 척/기다린다" 같은 소극적 반응은 금지합니다.',
      '- 본문 밖의 새로운 사건을 만들지 마세요.',
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal }) =>
    [
      '아래는 지금 쓰고 있는 챕터의 본문입니다. 분량이 부족하니 이어서 더 써야 합니다.',
      '─────────────',
      currentContent,
      '─────────────',
      '[이어쓰기 지침 — 매우 중요]',
      '- 새 챕터를 시작하지 말고, 위 본문의 마지막 장면을 자연스럽게 "이어서" 씁니다.',
      '- 이미 쓴 내용을 반복하거나 다시 출력하지 마세요. 새로 추가되는 본문만 출력합니다.',
      `- 최소 ${Math.max(deficitChars, 600)}자 이상 더 씁니다. 장면을 요약하지 말고 행동·대화·발견으로 전개합니다.`,
      '- 각 문단은 빈 줄로 구분합니다.',
      isFinal
        ? '- 마지막 챕터입니다. 이어진 내용으로 이야기를 자연스럽게 완결지으세요.'
        : '- 이어진 내용의 마지막은 다음 선택을 부르는 결정의 순간에서 멈춥니다.',
    ].join('\n'),
};
