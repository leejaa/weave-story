export interface CoverJobMessage {
  storyId: string;
  title: string;
  genre: string;
  prompt: string;
}

export async function enqueueCoverJob(job: CoverJobMessage): Promise<void> {
  const accountId = process.env.CF_ACCOUNT_ID!;
  const queueId = process.env.CF_QUEUE_ID!;
  const apiToken = process.env.CF_API_TOKEN!;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues/${queueId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ body: job, content_type: 'json' }],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CF Queue publish failed ${res.status}: ${body}`);
  }
}
