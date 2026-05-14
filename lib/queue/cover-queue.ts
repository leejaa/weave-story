export interface CoverJobMessage {
  storyId: string;
  title: string;
  genre: string;
  prompt: string;
}

export async function enqueueCoverJob(job: CoverJobMessage): Promise<void> {
  const workerUrl = process.env.CF_COVER_WORKER_URL!;
  const apiKey = process.env.AI_GATEWAY_API_KEY!;

  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(job),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cover worker enqueue failed ${res.status}: ${body}`);
  }
}
