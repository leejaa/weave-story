import { createGateway } from '@ai-sdk/gateway';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// 7개 메인 장르 키. 템플릿 매칭·장르 고정에 사용.
export const MAIN_GENRES = ['ROFAN', 'ROMANCE', 'MODERN_FANTASY', 'HISTORICAL', 'MYSTERY', 'SF', 'WUXIA'] as const;
export type MainGenre = (typeof MAIN_GENRES)[number];

const Schema = z.object({ genre: z.enum(MAIN_GENRES) });

// hintGenre가 없을 때(직접 타이핑 프롬프트) premise에서 장르를 1회 분류(haiku, 저비용).
export async function classifyGenre(apiKey: string, premise: string): Promise<MainGenre> {
  const gateway = createGateway({ apiKey });
  try {
    const { output } = await generateText({
      model: gateway('anthropic/claude-haiku-4-5-20251001'),
      system: 'Classify the story premise into exactly one genre key. ROFAN=romance-fantasy(궁정·영애·빙의), ROMANCE=modern/realistic romance, MODERN_FANTASY=urban/hunter/supernatural-in-modern-world, HISTORICAL=period/사극, MYSTERY=detective/crime, SF=science fiction, WUXIA=무협. Pick the closest single one.',
      prompt: `Premise:\n${premise}`,
      maxOutputTokens: 200,
      output: Output.object({ schema: Schema }),
    });
    return output.genre;
  } catch {
    return 'MODERN_FANTASY'; // 분류 실패 시 안전한 기본값
  }
}
