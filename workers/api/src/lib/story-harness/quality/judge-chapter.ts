import { createGateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { chapterJudgements } from '../../schema';
import type { DB } from '../../db';
import type { StoryLang } from '../../ai/story-lang';
import type { StoryOutline } from '../outline/outline-schema';
import { beatForChapter, formatOutlineSpine, formatBeat } from '../outline/format-outline';
import { generateStructured } from '../drafting/structured-generation';

// 의미적 품질 심사(측정). 게이트 아님 — 생성 후 비치명적으로 채점해 chapter_judgements에 저장.
// 사용자가 겪던 실제 문제(중심미스터리 정체·고아떡밥·주인공 척추 납치·장르 드리프트)를 수치화.
const JUDGE_MODEL = 'anthropic/claude-sonnet-4-6';

const JudgeSchema = z.object({
  coherence: z.number().int().min(0).max(5), // 전체 응집/개연
  arcAdvance: z.number().int().min(0).max(2), // 중심 아크(목표/갈등) 전진(0 정체 ~ 2 명확)
  protagonistFocus: z.number().int().min(0).max(2), // 주인공 척추 중심(0 납치 ~ 2 주도)
  readability: z.number().int().min(0).max(2), // 가독성: 쉽고 명료해 한 번에 읽히나(0 난해 ~ 2 쉬움)
  simplicity: z.number().int().min(0).max(2), // 단순함: 설정·인물·떡밥이 깔끔한가(0 조잡 ~ 2 깔끔)
  choiceExecuted: z.boolean(), // 독자 선택이 본문에서 실제로 실행됐나(1화는 true)
  orphanHook: z.boolean(), // 아웃라인/중심과 무관한 단발 떡밥이 생겼나(true=문제)
  spineHijack: z.boolean(), // 조연 사연이 주인공 척추를 밀어냈나(true=문제)
  genreDrift: z.boolean(), // 고른 장르 이탈(특히 비미스터리인데 수사·추리물화)(true=문제)
  complexityCreep: z.boolean(), // 아웃라인에 없는 새 인물·설정·떡밥이 추가돼 복잡해졌나(true=문제)
  rationale: z.string().min(4).max(600),
});

export async function judgeChapter(params: {
  db: DB;
  apiKey: string;
  storyId: string;
  threadId: string;
  chapterId: string;
  chapterNumber: number;
  mode: 'outline' | 'legacy';
  language: StoryLang;
  outline: StoryOutline | null;
  content: string;
  chosenOption?: string | null;
}): Promise<void> {
  try {
    const gateway = createGateway({ apiKey: params.apiKey });
    const beat = params.outline ? beatForChapter(params.outline, params.chapterNumber) : null;
    const context = params.outline
      ? `${formatOutlineSpine(params.outline)}\n\n[Intended beat for this chapter]\n${beat ? formatBeat(beat) : '(none)'}`
      : '(no outline — legacy story; judge coherence/genre/choice only)';

    const system = 'You are a strict, honest story-quality judge for a choice-driven interactive serial. Score the chapter against its intended outline/beat. Be critical — do not inflate.';
    const prompt = [
      `[Outline / intended beat]\n${context}`,
      params.chosenOption ? `[Reader's choice that led into this chapter]\n${params.chosenOption}` : '[No reader choice — this is the opening chapter]',
      `[Chapter ${params.chapterNumber} body]\n${params.content}`,
      [
        'Judge each (readability and simplicity are TOP priorities):',
        '- coherence 0-5: overall causal/connected reading.',
        '- arcAdvance 0-2: did it move the central ARC (the goal/conflict) forward one step (0=stalled, 2=clear step)?',
        "- protagonistFocus 0-2: did the protagonist's OWN arc/stake progress (0=hijacked by a side character, 2=protagonist drives)?",
        '- readability 0-2: is the prose EASY and clear — simple everyday words, short clear sentences, read once and understood? (0=dense/hard/over-literary, 2=effortless).',
        '- simplicity 0-2: is the storytelling uncluttered — few elements, clean and elegant, NOT a tangle of names/threads/lore? (0=cluttered/조잡, 2=clean).',
        '- choiceExecuted: was the reader\'s chosen action actually carried out in the prose? (true if no choice / opening chapter)',
        '- orphanHook: did it introduce a NEW hook unrelated to the outline/central arc? (true = problem)',
        '- spineHijack: did a side character\'s sub-story take over the chapter? (true = problem)',
        '- genreDrift: did it drift from the GIVEN genre — especially turning a non-mystery story into a detective/investigation/whodunit plot? (true = problem)',
        '- complexityCreep: did it add NEW named characters, places, factions, world rules, or threads NOT in the outline, making it more complex? (true = problem)',
        '- rationale: 1-3 sentences citing specifics from the text.',
      ].join('\n'),
    ].filter(Boolean).join('\n\n');

    // generateStructured: 스키마 검증 실패 시 검증 메시지를 피드백해 1회 재작성(누락 방지).
    const { output } = await generateStructured({
      model: gateway(JUDGE_MODEL),
      system,
      prompt,
      schema: JudgeSchema,
    });

    // 점수식: 가독성·단순성을 무겁게(사용자 최우선), 장르 이탈(수사물화)·복잡도 가중을 강하게 감점.
    const base = (output.coherence / 5) * 25 + (output.arcAdvance / 2) * 15
      + (output.protagonistFocus / 2) * 10 + (output.readability / 2) * 25
      + (output.simplicity / 2) * 15 + (output.choiceExecuted ? 10 : 0);
    const penalty = (output.orphanHook ? 10 : 0) + (output.spineHijack ? 15 : 0)
      + (output.genreDrift ? 25 : 0) + (output.complexityCreep ? 20 : 0);
    const overall = Math.max(0, Math.min(100, Math.round(base - penalty)));

    await params.db.insert(chapterJudgements).values({
      storyId: params.storyId,
      threadId: params.threadId,
      chapterId: params.chapterId,
      chapterNumber: params.chapterNumber,
      mode: params.mode,
      overall,
      scores: {
        coherence: output.coherence,
        arcAdvance: output.arcAdvance,
        protagonistFocus: output.protagonistFocus,
        readability: output.readability,
        simplicity: output.simplicity,
        choiceExecuted: output.choiceExecuted,
      },
      flags: { orphanHook: output.orphanHook, spineHijack: output.spineHijack, genreDrift: output.genreDrift, complexityCreep: output.complexityCreep },
      rationale: output.rationale,
      model: JUDGE_MODEL,
    });

    const flagList = [output.orphanHook && 'orphan', output.spineHijack && 'hijack', output.genreDrift && 'drift', output.complexityCreep && 'complexityCreep']
      .filter(Boolean).join(',') || 'none';
    console.log(`[judge] thread=${params.threadId} chapter=${params.chapterNumber} overall=${overall} coh=${output.coherence} arc=${output.arcAdvance} read=${output.readability} simp=${output.simplicity} flags=${flagList}`);
  } catch (err) {
    console.error(`[judge] failed non_critical thread=${params.threadId} chapter=${params.chapterNumber}`, err);
  }
}
