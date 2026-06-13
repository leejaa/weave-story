import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// AI 생성 챕터의 사후 안전성 분류. 인터랙티브 소설이므로 "허구의 어두운 주제"는
// 정상으로 보고, 스토어 정책·법규상 실제로 금지되는 범주만 차단한다.
// 애매하면 OK(false negative 허용) — 정상적인 다크 픽션을 검열하지 않기 위함.
const MODERATION_SYSTEM = `You are a content-safety classifier for an interactive fiction app.
The text you evaluate is FICTION written for adult readers. Dark, violent, tragic, horror,
morally grey, or romantic/sexual themes between adults are NORMAL for fiction and must be
allowed. Do NOT flag content merely for being dark, violent, sexual, or disturbing.

Return action="hide" ONLY when the text genuinely violates app-store / platform policy:
- Sexual content involving minors, or sexualization of anyone depicted as a child (any form).
- Real-world, actionable instructions for serious harm (weapons/explosives/bioweapons,
  synthesizing illegal drugs, credible terrorism planning).
- Praise, promotion, or incitement of violence/hatred targeting a protected group
  (race, ethnicity, religion, gender, sexual orientation, disability).
- Gratuitous, glorifying depiction of non-consensual sexual assault presented as
  titillation rather than narrative consequence.
- Promotion of self-harm/suicide as desirable, or step-by-step methods.

When in doubt, choose action="ok". Evaluate the text in whatever language it is written.`;

const ModerationSchema = z.object({
  action: z.enum(['ok', 'hide']).describe('hide only for genuine policy violations; ok otherwise'),
  categories: z.array(z.enum(['csae', 'serious_harm', 'hate', 'sexual_assault', 'self_harm']))
    .describe('violated categories; empty when action=ok'),
  reason: z.string().max(200).describe('short reason in English; empty when action=ok'),
});

export type ModerationVerdict = z.infer<typeof ModerationSchema>;

const OK: ModerationVerdict = { action: 'ok', categories: [], reason: '' };

/**
 * 생성된 챕터 텍스트를 분류한다. 분류기 자체가 실패하면 fail-open(OK 반환)하되
 * 호출 측에서 그 사실을 로깅/알림하도록 별도 신호(reason='classifier_error')를 남긴다.
 */
export async function moderateChapterContent(text: string, apiKey: string): Promise<ModerationVerdict> {
  const trimmed = text?.trim();
  if (!trimmed) return OK;

  try {
    const gateway = createGateway({ apiKey });
    const { output } = await generateText({
      model: gateway('anthropic/claude-haiku-4-5-20251001'),
      output: Output.object({ schema: ModerationSchema }),
      system: MODERATION_SYSTEM,
      prompt: `Evaluate the following fiction passage:\n\n"""\n${trimmed.slice(0, 12000)}\n"""`,
    });
    return output;
  } catch (err) {
    console.error('[moderation] classifier failed (fail-open)', err);
    return { action: 'ok', categories: [], reason: 'classifier_error' };
  }
}
