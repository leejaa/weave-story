import { getAuthUserId } from '@/lib/auth/server';
import { checkPromptSpecificity } from '@/lib/ai/prompt-check';

export async function POST(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const prompt = body?.prompt as string | undefined;

  if (!prompt?.trim()) {
    return Response.json({ error: 'prompt required' }, { status: 400 });
  }

  const result = await checkPromptSpecificity(prompt.trim());
  return Response.json(result);
}
