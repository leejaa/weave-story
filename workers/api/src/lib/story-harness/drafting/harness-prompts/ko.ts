// Korean harness prompts.
//
// 컨셉(2026-06-23 리팩토링): "일관된 장편소설"이 아니라 "얇은 척추(주인공의 능동적 목표)
// 위에서, 매 챕터가 직전 선택의 직접 결과로 흥미로운 사건이 터지고, 짧은 호 단위로 떡밥을
// 깔고 회수하는, 가독성 높은 인터랙티브 픽션". 핵심 변화: ① 매 화 구체적 사건 강제 + 끝 훅,
// ② 구조적 상태(story_state) 주입, ③ 인과적 선택지, ④ 문체 가드레일, ⑤ 짧고 빠른 길이.
import type { StoryBibleSnapshot } from '../../memory/load-story-bible';
import type { HarnessGuide } from './types';
import { narrativePhase, chapterEventBeat, hookDirective, type NarrativePhase, type EventBeat, type HookDirective } from '../narrative-phase';
import { formatStoryState } from '../../../ai/story-generation';
import { currentArc, formatBlueprintSpine, formatGenreLock, formatArc } from '../../blueprint/format-blueprint';
import { renderFirstDraftPrompt, renderNextDraftPrompt } from './render-outline-prompt';

// 챕터의 아크 단계(기·승·전·결)별 페이싱 지침.
const KO_PHASE: Record<NarrativePhase, string> = {
  setup: '지금은 도입부(기)입니다. 세계와 인물, 주인공의 욕망과 상처를 빠르게 자리잡게 하고 중심 갈등의 불씨를 심으세요. 아직 모든 비밀을 드러내지 마세요.',
  rising: '지금은 전개부(승)입니다. 갈등과 판돈을 키우되, 벌여둔 떡밥을 발전시키고 회수하기 시작하세요. 끝없이 새 미스터리만 쌓지 말고, 주인공의 욕망과 상처가 충돌하게 하세요.',
  turn: '지금은 전환부(전)입니다. 판을 뒤집는 반전이나 비밀의 노출로 위기를 끌어올리세요. 이 시점부터 새로운 큰 떡밥은 자제하고, 벌여둔 갈등들을 한 방향으로 모으기 시작하세요.',
  resolution: '지금은 절정으로 수렴하는 구간입니다. 열린 떡밥을 회수하기 시작하고, 새 인물이나 새 서브플롯을 도입하지 마세요. 긴장을 절정 직전까지 끌어올리세요.',
  final: '이것이 마지막 챕터입니다. 절정을 터뜨리고 중심 갈등을 매듭지으세요. 주인공의 욕망과 상처에 감정적 보상을 주고, 남은 떡밥을 회수하며 여운 있게 닫으세요.',
};

// 이번 화 사건의 "결" — 연속된 챕터가 같은 장면처럼 느껴지지 않도록 사건 종류를 회전시킨다.
const KO_EVENT_BEAT: Record<EventBeat, string> = {
  confrontation: '대면/충돌 — 미뤄둔 갈등이 정면으로 터진다.',
  revelation: '발견/폭로 — 숨겨졌던 사실·정체·단서가 드러난다.',
  externalThreat: '외부 위협 — 통제 밖의 위협(적·사건·시간 압박)이 들이닥친다.',
  allianceShift: '관계 변화 — 동맹·적대 구도가 뒤집히거나 새 인물이 끼어든다.',
  reversal: '반전 — 상황이 주인공의 예상과 반대로 뒤집힌다.',
  costSurfaces: '대가 표면화 — 지난 선택의 후폭풍·대가가 구체적으로 닥친다.',
};

// 떡밥 회계 지시 — hookDirective(장면 결과 직교: 새 떡밥을 열지/닫을지). 누적 폭주 차단.
const KO_HOOK_DIRECTIVE: Record<HookDirective, string> = {
  plant_ok: '떡밥 회계: 새 떡밥을 하나 정도 심어도 됩니다. 단, 본문은 이번 화 사건으로 실제 전진해야 하며 떡밥만 던지고 끝내지 마세요.',
  payoff_due: '떡밥 회계(중요): 이번 화에는 열려 있는 떡밥 중 최소 1개를 본문 안에서 "명확히 회수"하세요(독자가 답을 얻었다고 느끼게). 회수 없이 새 떡밥만 추가하지 마세요. 새 떡밥은 회수한 뒤에, 그 회수와 직접 연결된 것으로 하나까지만.',
  converge: '떡밥 회계(수렴): 새 떡밥을 절대 추가하지 말고 열린 떡밥을 회수하는 데만 집중하세요. 흩어진 가닥을 한 방향으로 모읍니다.',
};

// 가독성 우선 문체 가드레일 — 정렬 모델 특유의 매너리즘(역설 남발·telling·추상 독백)을 억제.
const KO_PROSE_GUARDRAIL = [
  '[문체 가드레일 — 가독성 우선]',
  '- 역설·대구 구문("X가 아니라 Y였다", "...할수록 ...했다")을 남발하지 마세요. 한 화에 한두 번이면 충분합니다.',
  '- 추상적 내면 독백이나 관념적 서술을 길게 늘어놓지 말고, 행동·대사·감각으로 보여주세요(telling보다 showing).',
  '- 같은 비유·모티프(빛·그림자·심장·온도 등)를 반복하지 마세요.',
  '- 문장 길이를 다양하게 쓰세요. 짧고 선명한 문장을 섞어 리듬을 만드세요.',
  '- 대화를 적극적으로 사용해 장면을 굴리세요.',
].join('\n');

// 분량/형식 — 짧고 빠른 웹소설형. (역할: draft 단계 공통)
const KO_LENGTH = [
  '[분량과 형식]',
  '- content는 한국어 1,800자 이상 2,800자 이하로 씁니다. 너무 길게 늘이지 말고 사건 중심으로 압축하세요.',
  '- 8-14문단, 각 문단은 빈 줄로 구분합니다. 한 문단을 너무 길게 쓰지 마세요.',
  '- 장면을 요약하지 말고 실제 사건·행동·대화로 보여주세요.',
  '- 이번 응답은 오직 본문(content)과 제목 필드만 작성합니다. 선택지는 다음 단계에서 만듭니다.',
  '- 본문 안에 "[선택]", "선택지", "①/②" 같은 선택지 목록이나 독자에게 던지는 질문을 절대 쓰지 마세요. 본문은 이야기 서술로만 끝냅니다.',
].join('\n');

// 인과적 선택지 규칙 — structure 단계 공통.
const KO_CHOICE_RULES = [
  '[선택지 규칙 — 인과적이고 능동적으로]',
  '- choices: 정확히 2개. 각 항목은 text(구체적 행동)와 consequence(결과 암시)를 가집니다.',
  '- 두 선택지는 이번 화 사건에 대한 주인공의 "능동적 대응"이어야 합니다.',
  '- 두 선택지는 각각 명백히 다른 "다음 사건"으로 이어져야 합니다(서로 다른 방향·다른 위험·다른 결과).',
  '- 상황을 진전시키지 못하는 "관망/회피/후퇴"(침착하게·모른 척·기다린다·생각한다 등) 선택은 금지합니다.',
  '- consequence에는 그 선택이 부를 구체적 위협이나 잃을 것을 명시합니다.',
  '- 본문 밖의 새로운 사건을 만들지 마세요. situation에 대사를 넣지 마세요.',
].join('\n');

function bibleSection(storyBible: StoryBibleSnapshot): string {
  if (!storyBible) {
    return '[Story Bible]\n아직 저장된 story bible이 없습니다. 사용자 설정과 이전 챕터를 기준으로 연속성을 유지하세요.';
  }
  return [
    storyBible.canon ? `[불변 캐논 — 아래 설정과 절대 모순 금지(사망/환생 등 핵심 메커니즘·장르 유지)]\n${storyBible.canon}\n` : '',
    '[Story Bible]',
    `로그라인: ${storyBible.logline}`,
    `장르: ${storyBible.genre}`,
    `톤: ${storyBible.tone}`,
    `주인공: ${storyBible.protagonist}`,
    `중심 갈등: ${storyBible.centralConflict}`,
    `독자 약속: ${storyBible.readerPromise}`,
    `오프닝 위협: ${storyBible.openingThreat}`,
    storyBible.desire ? `주인공의 욕망: ${storyBible.desire}` : '',
    storyBible.wound ? `주인공의 상처/두려움: ${storyBible.wound}` : '',
    storyBible.openThreads.length ? `[열린 떡밥]\n${storyBible.openThreads.map(t => `- ${t}`).join('\n')}` : '',
    storyBible.forbiddenPatterns.length ? `[금지 패턴]\n${storyBible.forbiddenPatterns.map(p => `- ${p}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

export const KO: HarnessGuide = {
  firstDraftSystem: [
    '당신은 한국 웹소설 편집부의 수석 작가입니다.',
    '독자가 모바일에서 첫 화를 읽자마자 계속 넘기고 싶도록, 사건을 빠르게 열고 강한 선택 압박을 만듭니다.',
    '짧고 빠르게 읽히는 가독성을 최우선으로 합니다. 관념적 서술보다 장면·행동·대사로 보여줍니다.',
  ].join('\n'),
  firstStructureSystem: [
    '당신은 한국 웹소설 편집자입니다.',
    '주어진 첫 화 본문을 읽고, 작품 설정집과 독자 선택지를 정확하게 추출합니다.',
    '본문에 없는 새 사건을 만들지 않고, 본문의 마지막 장면이 만든 선택 압박을 그대로 사용합니다.',
  ].join('\n'),
  nextDraftSystem: [
    '당신은 한국 웹소설 편집부의 연재 작가입니다.',
    '이전 챕터와 독자의 선택을 이어 받아, 선택의 대가가 "실제 사건"으로 터지는 다음 화를 씁니다.',
    '매 화에는 직전 선택의 직접 결과로 상황을 바꾸는 구체적 사건이 하나 벌어져야 합니다. 같은 자리를 맴돌거나 내면 반추로만 채우지 마세요.',
    '독자가 선택하거나 입력한 행동은 본문에서 반드시 실제로 일어나야 합니다. 막거나 무산시키지 말고, 그 결과로 바뀐 세계를 전개하세요.',
  ].join('\n'),
  nextStructureSystem: [
    '당신은 한국 웹소설 편집자입니다.',
    '주어진 챕터 본문을 읽고, 다음 화로 이어지는 독자 선택지를 정확하게 추출합니다.',
    '본문에 없는 새 사건을 만들지 않고, 본문의 마지막 장면이 만든 선택 압박을 그대로 사용합니다.',
  ].join('\n'),
  buildFirstDraft: (a) => {
    if (a.outline && a.beat) return renderFirstDraftPrompt(a, { guardrail: KO_PROSE_GUARDRAIL, length: KO_LENGTH });
    const { prompt, estimatedChapters, attempt, previousIssues, hintGenre } = a;
    const retry = previousIssues?.length ? `\n\n[이전 결과에서 반드시 고칠 문제]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreHint = hintGenre ? `\n[선택한 장르: ${hintGenre}]\n이 장르에 맞는 분위기와 연출을 유지하세요. 이 장르에 없는 추리·누아르·미스터리·스릴러 요소를 추가하지 마세요.\n` : '';
    return [
      `독자가 원하는 이야기:\n"${prompt}"`,
      `전체 챕터 수: ${estimatedChapters}챕터`,
      `생성 시도: ${attempt}/2`,
      retry,
      genreHint,
      '[서사 단계 — 이 챕터의 역할]',
      KO_PHASE.setup,
      '',
      '[첫 화 설계 원칙]',
      '- 첫 2-3문단 안에 독자의 일상/안전을 깨는 사건을 발생시킵니다. 도입을 길게 끌지 마세요.',
      '- 프롬프트에 전환 사건(사망·환생·회귀·빙의·전생 등)이 명시된 경우, 그 전환 사건은 반드시 이번 첫 화 안에서 실제로 일어나야 합니다. 전환 이전 상황만 묘사하는 "전편" 구성으로 첫 화를 끝내지 마세요.',
      '- 장르 이탈 금지: 원 프롬프트에 없는 추리·누아르·미스터리·스릴러 요소를 자의로 추가하지 마세요.',
      '- 주인공에게 이 이야기를 끌고 갈 "능동적 목표(drive)"의 씨앗을 심으세요. 주인공은 단순히 놀라거나 기다리지 않고 무언가를 원하고 움직입니다.',
      '- 본문의 마지막은 권력·관계·비밀·생존·누명·계약·배신 중 최소 하나를 흔드는 결정의 순간(훅)에서 멈춥니다.',
      '- "침착하게 대답한다", "모른 척한다"처럼 사소한 반응으로 끝내지 않습니다.',
      '',
      KO_PROSE_GUARDRAIL,
      '',
      KO_LENGTH,
    ].join('\n');
  },
  buildFirstStructure: ({ prompt, estimatedChapters, content, previousIssues, hintGenre }) => {
    const retry = previousIssues?.length ? `\n[이전 시도에서 지적된 문제 — 이번엔 반드시 고치세요]\n${previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';
    const genreNote = hintGenre ? `\n[사용자가 선택한 장르: ${hintGenre}]\nbible.genre는 이 장르를 기준으로 합니다.\n` : '';
    return [
      `독자가 원래 원한 이야기:\n"${prompt}"`,
      `전체 챕터 수: ${estimatedChapters}챕터`,
      '',
      '아래는 방금 작성된 첫 화 본문입니다. 이 본문을 근거로 설정집과 선택지를 만드세요.',
      '─────────────',
      content,
      '─────────────',
      retry,
      genreNote,
      '[추출 규칙]',
      '- bible: 본문과 일관된 작품 설정집. 각 필드는 간결하게 채웁니다.',
      '- bible.desire: 주인공이 이 이야기에서 진정으로 원하는 것(생존 이상의 것). 본문에서 읽히는 핵심 욕망을 1-2문장(100자 이내)으로.',
      '- bible.wound: 주인공의 감정적 상처 또는 가장 두려워하는 것. 본문에서 드러나거나 암시된 내면의 취약점을 1-2문장(100자 이내)으로.',
      '- bible.canon: 사용자 원 설정의 핵심 전제를 *재해석 없이* 고정한 불변 규칙. 사망/환생/빙의/실종 같은 핵심 메커니즘과 장르를 원문 그대로 보존(예: "환생"을 "빙의"로, "사망"을 "실종"으로 바꾸지 말 것). 3-5개의 짧은 단정문, 200자 이내.',
      '- bible.genre: 원 프롬프트와 본문에서 명확히 읽히는 장르만 적습니다. 본문에 없는 "추리", "미스터리", "누아르" 등을 자의로 추가하지 마세요.',
      '- bible.tone: 원 프롬프트와 본문의 실제 분위기를 추출합니다. 원본에 없는 "차갑고 어두운", "미스터리한" 분위기를 임의로 덧씌우지 마세요.',
      '- bible.forbidden_patterns에는 "원 설정에 없는 추리·미스터리·누아르 서브플롯 추가"를 반드시 포함하세요.',
      '- situation: 본문이 끝나는 결정 순간을 1-2문장(120자 이내)으로 요약합니다. 대사를 넣지 마세요.',
      '- question: 독자에게 던지는 한 줄 질문(80자 이내)입니다.',
      '',
      KO_CHOICE_RULES,
    ].join('\n');
  },
  buildNextDraft: (a) => {
    if (a.outline && a.beat) return renderNextDraftPrompt(a, { guardrail: KO_PROSE_GUARDRAIL, length: KO_LENGTH });
    const phase: NarrativePhase = a.isFinal ? 'final' : narrativePhase(a.nextChapterNumber, a.estimatedChapters);
    const beat = KO_EVENT_BEAT[chapterEventBeat(a.nextChapterNumber)];
    const stateText = formatStoryState(a.storyState)
      ?? (a.previousChaptersSummaries.length > 0
          ? a.previousChaptersSummaries.map(s => `챕터 ${s.chapterNumber}: ${s.summary}`).join('\n')
          : '없음');
    const retry = a.previousIssues?.length ? `\n\n[이전 결과에서 반드시 고칠 문제]\n${a.previousIssues.map(i => `- ${i}`).join('\n')}\n` : '';

    // 청사진(있으면) + 떡밥 회계. 청사진이 없으면(옛 스토리) 기존 동작으로 폴백.
    const bp = a.storyBible?.blueprint ?? null;
    const progress = a.estimatedChapters > 0 ? a.nextChapterNumber / a.estimatedChapters : 1;
    const directive = hookDirective(a.nextChapterNumber, a.estimatedChapters, a.storyState?.openLoops?.length ?? 0);
    const arc = bp ? currentArc(bp, progress) : null;
    const oldestLoops = (a.storyState?.openLoops ?? []).slice(0, 2);
    const blueprintSection = bp
      ? [
          '',
          '[이야기 청사진 — 전체 구성(절대 이탈 금지)]',
          formatBlueprintSpine(bp),
          '',
          '[장르 고정]',
          formatGenreLock(bp),
          '- 이 작품의 장르를 끝까지 유지하세요. 장르가 추리/미스터리가 아니라면, 단서만 계속 흘리거나 정보를 보류하는 미스터리·수사물 관습으로 변질시키지 마세요.',
          ...(arc ? ['', '[이번 화의 역할 — 청사진 아크]', formatArc(arc)] : []),
        ].join('\n')
      : '';
    const hookSection = [
      '',
      '[떡밥 회계 — 엄격]',
      KO_HOOK_DIRECTIVE[a.isFinal ? 'converge' : directive],
      oldestLoops.length
        ? `- 현재 열린 떡밥(오래된 순): ${oldestLoops.map(l => `「${l}」`).join(', ')}. 회수할 때는 가장 오래된 것부터 닫으세요.`
        : '',
      progress > 0.45 && !a.isFinal
        ? '- 이 시점부터는 새로 여는 떡밥 수가 닫는 떡밥 수를 넘지 않게 하세요(전체 미해결 떡밥이 늘면 안 됩니다).'
        : '',
    ].filter(Boolean).join('\n');

    return [
      bibleSection(a.storyBible),
      blueprintSection,
      '',
      `[사용자 원 설정]\n${a.prompt}`,
      `전체 챕터 수: ${a.estimatedChapters}`,
      `현재 작성할 챕터: ${a.nextChapterNumber}`,
      `생성 시도: ${a.attempt}/2`,
      retry,
      `[현재 진행 상태]\n${stateText}`,
      `[직전 챕터 ${a.previousChapterNumber} 본문]\n${a.previousChapterContent}`,
      `[독자의 선택]\n${a.chosenOption}`,
      '',
      '[독자가 고른 행동을 반드시 실행할 것 — 가장 중요]',
      '- 위 "독자의 선택"에 적힌 행동은 본문 첫 1-2문단 안에서 실제로 일어나야 합니다.',
      '- 그 행동을 시도만 하다 저지당하거나, 다른 인물이 선수 쳐 무산시키거나, "하려 했으나 실패"로 돌리지 마세요.',
      a.choiceKind === 'free_input'
        ? '- 이 행동은 독자가 직접 입력한 것입니다. 가능한 한 문자 그대로 실행하세요.'
        : '- 선택지 문구의 행동을 그대로 실행하고, 임의로 다른 행동으로 바꾸지 마세요.',
      '- 단, 물리적으로 불가능하거나 세계관을 깨는 행동이면 무시하지 말고 독자의 의도에 가장 가까운 방식으로 실행하세요.',
      '',
      '[이번 화의 사건 — 가장 중요]',
      '- 이번 화에는 직전 선택의 직접 결과로 상황을 바꾸는 구체적 사건이 "실제로" 하나 벌어져야 합니다. 내면 반추·상황 정리·같은 자리 맴돌기로만 채우지 마세요.',
      '- 그 사건은 권력·관계·비밀·생존·위치 중 최소 하나의 상태를 직전 화와 달라지게 만들어야 합니다.',
      '- drive(주인공의 현재 목표)를 향해 한 걸음 전진하거나, 그 목표를 새롭게 위협하세요.',
      `- 이번 화 사건의 결은 가급적 다음으로 변주하세요(직전 화와 같은 종류 반복 금지): ${beat}`,
      hookSection,
      a.isFinal
        ? '- 마지막 챕터입니다. 본문에서 이야기를 완결지으세요.'
        : '- 본문의 마지막에는 다음 선택을 부르는 결정의 순간에서 멈춥니다. 끝의 훅은 위 "떡밥 회계"를 지키세요 — 청사진상 계획된 질문이거나 방금 회수한 떡밥에서 자연히 파생된 것이어야 하며, 매 화 무관한 새 미스터리를 추가하지 마세요.',
      '',
      '[서사 단계 — 이 챕터의 역할]',
      KO_PHASE[phase],
      '',
      KO_PROSE_GUARDRAIL,
      '',
      KO_LENGTH,
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
      '',
      KO_CHOICE_RULES,
    ].join('\n');
  },
  buildExtend: ({ currentContent, deficitChars, isFinal }) =>
    [
      '아래는 지금 쓰고 있는 챕터의 본문입니다. 분량이 조금 부족하니 이어서 더 써야 합니다.',
      '─────────────',
      currentContent,
      '─────────────',
      '[이어쓰기 지침]',
      '- 새 챕터를 시작하지 말고, 위 본문의 마지막 장면을 자연스럽게 "이어서" 씁니다.',
      '- 이미 쓴 내용을 반복하거나 다시 출력하지 마세요. 새로 추가되는 본문만 출력합니다.',
      `- 약 ${Math.max(deficitChars, 400)}자 정도 더 씁니다. 장면을 요약하지 말고 행동·대화·발견으로 전개합니다.`,
      '- 각 문단은 빈 줄로 구분합니다.',
      isFinal
        ? '- 마지막 챕터입니다. 이어진 내용으로 이야기를 자연스럽게 완결지으세요.'
        : '- 이어진 내용의 마지막은 다음 화로 끌고 갈 훅을 남기고 다음 선택을 부르는 결정의 순간에서 멈춥니다.',
    ].join('\n'),
};
