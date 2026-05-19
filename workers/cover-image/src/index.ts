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

const GENRE_STYLE: Record<string, { style: string; palette: string }> = {
  ROMANCE:        { style: 'Painterly romantic atmospheric style',           palette: 'warm intimate tones, soft candlelight and golden hour' },
  ROFAN:          { style: 'Painterly romance fantasy illustration',          palette: 'deep navy and warm gold, ethereal magical lighting' },
  FANTASY:        { style: 'Painterly epic fantasy illustration',             palette: 'rich deep jewel tones with dramatic magical lighting' },
  WUXIA:          { style: 'Painterly wuxia ink illustration',                palette: 'deep crimson and flowing black ink, mountain mist' },
  MYSTERY:        { style: 'Painterly noir atmospheric style',                palette: 'deep shadows with a single focused amber or cold light' },
  HISTORICAL:     { style: 'Painterly historical drama illustration',          palette: 'warm lanternlight, deep earthy tones and aged pigments' },
  MODERN_FANTASY: { style: 'Painterly urban supernatural illustration',       palette: 'cool violet and indigo, rain-wet modern city streets' },
  SF:             { style: 'Painterly cinematic science fiction illustration', palette: 'cold deep blues and silver starlight, vast cosmic scale' },
  HORROR:         { style: 'Painterly dark atmospheric horror illustration',  palette: 'deep blacks and sickly pale greens, unsettling shadows' },
  ACTION:         { style: 'Painterly high-energy action illustration',       palette: 'high contrast bold colors with kinetic energy' },
  THRILLER:       { style: 'Painterly psychological thriller illustration',   palette: 'cold blues and harsh whites, tense stark contrast' },
};

function buildCoverImagePrompt(genre: string, title: string, userPrompt: string): string {
  const { style, palette } =
    GENRE_STYLE[genre?.toUpperCase()] ??
    { style: 'Painterly atmospheric illustration', palette: 'rich cinematic colors with dramatic lighting' };

  return [
    'Premium book cover illustration.',
    `A visually striking scene that captures the soul of a story titled "${title}".`,
    `Scene concept: ${userPrompt}.`,
    `${style}, ${palette}.`,
    'Highly detailed, cinematic composition, evocative mood, atmospheric depth, masterful use of light and shadow.',
    'No text, no letters, no words, no watermarks.',
  ].join(' ');
}

export const SAMPLE_CARDS_DEF = [
  {
    key: 'card-romance',
    genre: 'ROMANCE',
    genreLabel: '로맨스',
    title: '당신과의\n계약 결혼',
    color: '#4a1e2a',
    storyPrompt: '서로의 필요에 의해 시작된 계약 결혼. 감정은 없기로 했지만, 함께하는 시간이 늘어날수록 마음이 조금씩 흔들리기 시작한다.',
    imagePrompt: 'Book cover illustration. Elegant apartment interior at dusk, two silhouettes standing apart by floor-to-ceiling windows, city skyline below, soft warm light between them, tension in the air. Painterly romantic style, deep wine and golden tones, no text, no letters, no words.',
  },
  {
    key: 'card-rofan',
    genre: 'ROFAN',
    genreLabel: '로판',
    title: '공작이\n나를 선택했다',
    color: '#1a2540',
    storyPrompt: '환생해서 들어간 소설 속 세계. 원작에서 냉혹한 빌런이었던 공작이 어째서인지 나에게만 다가온다. 내가 알던 스토리가 완전히 틀어지기 시작했다.',
    imagePrompt: 'Book cover illustration. Opulent baroque ballroom, golden chandeliers, a noble lord in dark formal attire extending his hand toward a young woman in an elegant gown, other guests watching at a distance. Painterly romance fantasy, deep navy and gold, no text, no letters, no words.',
  },
  {
    key: 'card-fantasy',
    genre: 'FANTASY',
    genreLabel: '판타지',
    title: '무능력자가\n세계 최강이었다',
    color: '#0d2818',
    storyPrompt: '아무 능력도 없다며 무시당해온 사람. 하지만 숨겨진 고대 각성이 시작되고, 세상이 전혀 몰랐던 진짜 힘이 깨어난다.',
    imagePrompt: 'Book cover illustration. Powerful warrior standing at the peak of a shattered mountain, dramatic thunderstorm, glowing ancient runes erupting from his palm, lightning strikes around him, vast epic scale. Painterly dark fantasy, deep emerald and electric blue, no text, no letters, no words.',
  },
  {
    key: 'card-wuxia',
    genre: 'WUXIA',
    genreLabel: '무협',
    title: '강호의\n마지막 검객',
    color: '#2d0808',
    storyPrompt: '강호에서 사라진 지 10년. 스승의 죽음 뒤에 숨겨진 진실을 쫓아 다시 검을 든 사람. 복수의 여정이 시작된다.',
    imagePrompt: 'Book cover illustration. Lone swordsman standing on a misty cliff edge at dusk, traditional flowing robes billowing in the wind, unsheathed sword catching the last light, vast mountain range behind him. Painterly wuxia ink style, deep crimson and black ink, no text, no letters, no words.',
  },
  {
    key: 'card-mystery',
    genre: 'MYSTERY',
    genreLabel: '미스터리',
    title: '사라진 화가의\n마지막 그림',
    color: '#18182a',
    storyPrompt: '저명한 화가가 마지막 작품을 완성하던 날 밤 흔적도 없이 사라졌다. 그 그림에는 아직 아무도 알아채지 못한 단서가 숨겨져 있다.',
    imagePrompt: 'Book cover illustration. Dimly lit art studio at night, dramatic spotlight on a large unfinished canvas on an easel, mysterious shapes half-revealed in the painting, overturned palette and scattered brushes, ominous shadows. Painterly noir, deep slate purple and amber, no text, no letters, no words.',
  },
  {
    key: 'card-historical',
    genre: 'HISTORICAL',
    genreLabel: '역사극',
    title: '조선의\n여자 포도청',
    color: '#0f2010',
    storyPrompt: '조선 시대, 신분을 숨기고 포도청에 들어간 여인. 사대부 가문의 연쇄 실종 사건을 쫓다 왕실의 깊은 음모에 발을 들이게 된다.',
    imagePrompt: 'Book cover illustration. Joseon dynasty Seoul at night, stone lanterns casting warm light along a misty stone path, a woman in a dark hanbok standing with quiet resolve, ornate palace gate in the background. Painterly historical drama, deep jade green and black ink, no text, no letters, no words.',
  },
  {
    key: 'card-modern-fantasy',
    genre: 'MODERN_FANTASY',
    genreLabel: '현대판타지',
    title: '죽은 자와\n대화하는 가게',
    color: '#160a25',
    storyPrompt: '서울 골목 끝, 간판도 없는 작은 가게. 이 가게의 주인은 세상을 떠난 사람들의 마지막 말을 전해준다. 오늘 문을 두드린 손님은 누구일까.',
    imagePrompt: 'Book cover illustration. Small mysterious shop at night in a rainy Seoul alleyway, glowing violet and indigo light bleeding through the window, wet cobblestones reflecting otherworldly colors, ethereal wisps drifting inside. Painterly urban supernatural, deep violet and midnight blue, no text, no letters, no words.',
  },
  {
    key: 'card-sf',
    genre: 'SF',
    genreLabel: 'SF',
    title: '마지막\n지구인',
    color: '#050e1a',
    storyPrompt: '인류 멸망 후 홀로 살아남은 우주비행사. 이름도 없는 별에서 다시 집으로 돌아갈 방법을 찾으며 예상치 못한 존재를 마주한다.',
    imagePrompt: 'Book cover illustration. Lone astronaut silhouette standing on the surface of an alien planet, Earth as a pale blue dot in the vast starry sky, alien horizon glowing softly, existential solitude and wonder. Painterly cinematic sci-fi, cold deep blue and silver starlight, no text, no letters, no words.',
  },
] as const;

async function handleSingleCard(
  env: Env,
  card: (typeof SAMPLE_CARDS_DEF)[number],
): Promise<Response> {
  const r2Key = `covers/${card.key}.png`;
  const existing = await env.COVER_IMAGES.head(r2Key);

  if (existing) {
    console.log(`[cover-image/sample] cache hit: ${card.key}`);
    return Response.json({ ...card, imageUrl: `${R2_PUBLIC_URL}/${r2Key}` });
  }

  console.log(`[cover-image/sample] generating ${card.key}...`);
  const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });
  const { image } = await generateImage({
    model: gateway.imageModel('openai/gpt-image-2'),
    prompt: card.imagePrompt,
    size: '1024x1024',
  });
  await env.COVER_IMAGES.put(r2Key, image.uint8Array, {
    httpMetadata: { contentType: 'image/png' },
  });
  console.log(`[cover-image/sample] ✓ ${card.key}`);
  return Response.json({ ...card, imageUrl: `${R2_PUBLIC_URL}/${r2Key}` });
}

async function handleSampleCards(env: Env): Promise<Response> {
  const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

  const results = await Promise.allSettled(
    SAMPLE_CARDS_DEF.map(async (card) => {
      const r2Key = `covers/${card.key}.png`;
      const existing = await env.COVER_IMAGES.head(r2Key);

      if (existing) {
        console.log(`[cover-image/sample] cache hit: ${card.key}`);
        return { ...card, imageUrl: `${R2_PUBLIC_URL}/${r2Key}` };
      }

      console.log(`[cover-image/sample] generating ${card.key}...`);
      const { image } = await generateImage({
        model: gateway.imageModel('openai/gpt-image-2'),
        prompt: card.imagePrompt,
        size: '1024x1024',
      });
      await env.COVER_IMAGES.put(r2Key, image.uint8Array, {
        httpMetadata: { contentType: 'image/png' },
      });
      console.log(`[cover-image/sample] ✓ ${card.key}`);
      return { ...card, imageUrl: `${R2_PUBLIC_URL}/${r2Key}` };
    }),
  );

  const cards = results.map((result, i) =>
    result.status === 'fulfilled'
      ? result.value
      : { ...SAMPLE_CARDS_DEF[i], imageUrl: null },
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

    if (request.method === 'GET' && url.pathname === '/sample-cards') {
      return handleSampleCards(env);
    }

    // Generate (or return cached) a single sample card image by key
    if (request.method === 'GET' && url.pathname.startsWith('/sample-cards/')) {
      const key = url.pathname.slice('/sample-cards/'.length);
      const card = SAMPLE_CARDS_DEF.find(c => c.key === key);
      if (!card) return new Response('Not Found', { status: 404 });
      return handleSingleCard(env, card);
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

        const imagePrompt = buildCoverImagePrompt(genre, title, prompt);

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
