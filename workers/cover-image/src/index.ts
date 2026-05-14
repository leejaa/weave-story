import { neon } from '@neondatabase/serverless';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';

export interface Env {
  COVER_IMAGES: R2Bucket;
  COVER_QUEUE: Queue<CoverJobMessage>;
  DATABASE_URL: string;
  AI_GATEWAY_API_KEY: string;
}

export interface CoverJobMessage {
  storyId: string;
  title: string;
  genre: string;
  prompt: string;
}

const R2_PUBLIC_URL = 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev';

const SAMPLE_COVERS = [
  {
    key: 'sample-romance',
    genre: 'ROMANCE',
    title: '마지막 편지가\n남긴 향기',
    color: '#2d5a3d',
    prompt:
      'Book cover illustration. Moonlit writing desk with scattered rose petals, a half-written letter by candlelight, vintage ink bottle and quill. Painterly atmospheric style, warm sepia and gold tones, no text, no letters, no words.',
  },
  {
    key: 'sample-mystery',
    genre: 'MYSTERY',
    title: '열두 번의\n목요일',
    color: '#2a3d5a',
    prompt:
      'Book cover illustration. Rain-slicked cobblestone street at night, single ornate gas lamp casting yellow light, a shadowy figure disappearing around a corner, atmospheric fog. Painterly noir style, deep navy and charcoal, no text, no letters, no words.',
  },
  {
    key: 'sample-fantasy',
    genre: 'FANTASY',
    title: '달빛 아래\n세 번째 문',
    color: '#3d2a5a',
    prompt:
      'Book cover illustration. Ancient stone archway glowing with magical blue-green light in a moonlit forest, ethereal wisps of light, towering ancient trees. Painterly fantasy style, rich purples and forest greens, no text, no letters, no words.',
  },
] as const;

async function handleSampleCovers(env: Env): Promise<Response> {
  const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

  const results = await Promise.allSettled(
    SAMPLE_COVERS.map(async (sample) => {
      const r2Key = `covers/${sample.key}.png`;
      const existing = await env.COVER_IMAGES.head(r2Key);

      if (existing) {
        console.log(`[cover-image/sample] cache hit: ${sample.key}`);
        return { genre: sample.genre, title: sample.title, color: sample.color, imageUrl: `${R2_PUBLIC_URL}/${r2Key}` };
      }

      console.log(`[cover-image/sample] generating ${sample.key}...`);
      const { image } = await generateImage({
        model: gateway.imageModel('openai/gpt-image-2'),
        prompt: sample.prompt,
        size: '1024x1024',
      });
      await env.COVER_IMAGES.put(r2Key, image.uint8Array, {
        httpMetadata: { contentType: 'image/png' },
      });
      console.log(`[cover-image/sample] ✓ ${sample.key}`);
      return { genre: sample.genre, title: sample.title, color: sample.color, imageUrl: `${R2_PUBLIC_URL}/${r2Key}` };
    }),
  );

  const cards = results.map((result, i) =>
    result.status === 'fulfilled'
      ? result.value
      : { genre: SAMPLE_COVERS[i].genre, title: SAMPLE_COVERS[i].title, color: SAMPLE_COVERS[i].color, imageUrl: null },
  );

  return Response.json({ cards });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${env.AI_GATEWAY_API_KEY}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (request.method === 'GET' && url.pathname === '/sample') {
      return handleSampleCovers(env);
    }

    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '')) {
      const job = await request.json<CoverJobMessage>();
      await env.COVER_QUEUE.send(job);
      console.log(`[cover-image] enqueued story:${job.storyId}`);
      return new Response('queued', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },

  async queue(batch: MessageBatch<CoverJobMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { storyId, title, genre, prompt } = message.body;
      try {
        console.log(`[cover-image] start story:${storyId} title:"${title}" genre:${genre}`);

        const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

        const imagePrompt =
          `Book cover illustration for a "${genre}" interactive story titled "${title}". ` +
          `Theme: ${prompt}. ` +
          `Painterly atmospheric style, cinematic composition, rich color, no text, no letters, no words.`;

        console.log(`[cover-image] calling gpt-image-2...`);
        const { image } = await generateImage({
          model: gateway.imageModel('openai/gpt-image-2'),
          prompt: imagePrompt,
          size: '1024x1024',
        });
        console.log(`[cover-image] image generated (${image.uint8Array.byteLength} bytes)`);

        const key = `covers/${storyId}.png`;
        await env.COVER_IMAGES.put(key, image.uint8Array, {
          httpMetadata: { contentType: 'image/png' },
        });
        console.log(`[cover-image] uploaded to R2: ${key}`);

        const imageUrl = `${R2_PUBLIC_URL}/${key}`;
        const sql = neon(env.DATABASE_URL);
        await sql`UPDATE stories SET cover_image_url = ${imageUrl} WHERE id = ${storyId}`;
        console.log(`[cover-image] ✓ done story:${storyId} url:${imageUrl}`);

        message.ack();
      } catch (err) {
        console.error(`[cover-image] ✗ failed story:${storyId}`, err);
        message.retry();
      }
    }
  },
};
