export interface CoverJobMessage {
  storyId: string;
  title: string;
  genre: string;
  prompt: string;
}

export async function enqueueCoverJob(job: CoverJobMessage, workerUrl: string, apiKey: string): Promise<void> {
  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cover worker enqueue failed ${res.status}: ${body}`);
  }
}
