import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const PromptCheckSchema = z.object({
  sufficient: z.boolean().describe(
    'true if the prompt has enough specificity (at least 2 of: character, setting, conflict/goal)',
  ),
  questions: z.array(z.string()).max(3).describe(
    'Up to 3 follow-up questions in Korean. Empty array if sufficient.',
  ),
});

export type PromptCheckResult = z.infer<typeof PromptCheckSchema>;

const SYSTEM = `당신은 인터랙티브 소설 서비스의 프롬프트 평가 에이전트입니다.

충분한 프롬프트의 기준 (아래 세 가지 중 두 가지 이상 충족):
1. 주인공/캐릭터 — 이름 불필요, 특성·직업·역할로도 충분
2. 배경/세계관 — 시대, 장소, 장르 중 하나라도 언급
3. 핵심 갈등 또는 목표 — 주인공이 마주할 문제나 이루고 싶은 것

insufficient인 경우: 누락된 요소를 채울 수 있는 한국어 질문을 최대 3개 생성하세요.`;

export async function checkPromptSpecificity(prompt: string, apiKey: string): Promise<PromptCheckResult> {
  const gateway = createGateway({ apiKey });
  const { output } = await generateText({
    model: gateway('anthropic/claude-haiku-4-5-20251001'),
    output: Output.object({ schema: PromptCheckSchema }),
    system: SYSTEM,
    prompt: `다음 이야기 프롬프트를 평가해주세요:\n\n"${prompt}"`,
  });
  return output;
}
