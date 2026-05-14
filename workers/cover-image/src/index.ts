import { neon } from '@neondatabase/serverless';
import { createGateway } from '@ai-sdk/gateway';
import { experimental_generateImage as generateImage } from 'ai';

export interface Env {
  COVER_IMAGES: R2Bucket;
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

export default {
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
