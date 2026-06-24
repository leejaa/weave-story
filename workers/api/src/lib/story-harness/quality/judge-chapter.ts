import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { chapterJudgements } from '../../schema';
import type { DB } from '../../db';
import type { StoryLang } from '../../ai/story-lang';
import type { StoryOutline } from '../outline/outline-schema';
import { beatForChapter, formatOutlineSpine, formatBeat } from '../outline/format-outline';

// 의미적 품질 심사(측정). 게이트 아님 — 생성 후 비치명적으로 채점해 chapter_judgements에 저장.
// 사용자가 겪던 실제 문제(중심미스터리 정체·고아떡밥·주인공 척추 납치·장르 드리프트)를 수치화.
const JUDGE_MODEL = 'anthropic/claude-sonnet-4-6';

const JudgeSchema = z.object({
  coherence: z.number().int().min(0).max(5), // 전체 응집/개연
  centralAdvance: z.number().int().min(0).max(2), // 중심 미스터리 전진(0 정체 ~ 2 명확)
  protagonistFocus: z.number().int().min(0).max(2), // 주인공 척추 중심(0 납치 ~ 2 주도)
  choiceExecuted: z.boolean(), // 독자 선택이 본문에서 실제로 실행됐나(1화는 true)
  orphanHook: z.boolean(), // 아웃라인/중심과 무관한 단발 떡밥이 생겼나(true=문제)
  spineHijack: z.boolean(), // 조연 사연이 주인공 척추를 밀어냈나(true=문제)
  genreDrift: z.boolean(), // 장르 이탈(true=문제)
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
        'Judge each:',
        '- coherence 0-5: overall causal/connected reading.',
        '- centralAdvance 0-2: did it move the central mystery forward (0=stalled, 2=clear sliver)?',
        "- protagonistFocus 0-2: did the protagonist's OWN arc/stake progress (0=hijacked by a side character, 2=protagonist drives)?",
        '- choiceExecuted: was the reader\'s chosen action actually carried out in the prose? (true if no choice / opening chapter)',
        '- orphanHook: did it introduce a NEW hook unrelated to the outline/central mystery? (true = problem)',
        '- spineHijack: did a side character\'s sub-story take over the chapter? (true = problem)',
        '- genreDrift: did the genre drift from the intended one? (true = problem)',
        '- rationale: 1-3 sentences citing specifics from the text.',
      ].join('\n'),
    ].filter(Boolean).join('\n\n');

    const { output } = await generateText({
      model: gateway(JUDGE_MODEL),
      system,
      prompt,
      maxOutputTokens: 1500,
      output: Output.object({ schema: JudgeSchema }),
    });

    const base = (output.coherence / 5) * 40 + (output.centralAdvance / 2) * 20
      + (output.protagonistFocus / 2) * 20 + (output.choiceExecuted ? 20 : 0);
    const penalty = (output.orphanHook ? 15 : 0) + (output.spineHijack ? 20 : 0) + (output.genreDrift ? 20 : 0);
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
        centralAdvance: output.centralAdvance,
        protagonistFocus: output.protagonistFocus,
        choiceExecuted: output.choiceExecuted,
      },
      flags: { orphanHook: output.orphanHook, spineHijack: output.spineHijack, genreDrift: output.genreDrift },
      rationale: output.rationale,
      model: JUDGE_MODEL,
    });

    const flagList = [output.orphanHook && 'orphan', output.spineHijack && 'hijack', output.genreDrift && 'drift']
      .filter(Boolean).join(',') || 'none';
    console.log(`[judge] thread=${params.threadId} chapter=${params.chapterNumber} overall=${overall} coh=${output.coherence} central=${output.centralAdvance} flags=${flagList}`);
  } catch (err) {
    console.error(`[judge] failed non_critical thread=${params.threadId} chapter=${params.chapterNumber}`, err);
  }
}
