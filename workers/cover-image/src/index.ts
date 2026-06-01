import { neon } from '@neondatabase/serverless';
import { createGateway } from '@ai-sdk/gateway';
import { generateImage } from 'ai';

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
  ROMANCE:        { style: 'Korean mobile web novel romance cover art',        palette: 'deep wine, warm sunset gold, black suit, and soft skin tones' },
  ROFAN:          { style: 'Korean mobile web novel romantasy cover art',      palette: 'midnight blue, chandelier gold, ivory, and luminous pearl accents' },
  FANTASY:        { style: 'Korean mobile web novel fantasy cover art',        palette: 'dark emerald, black, electric blue, and metallic silver magic' },
  WUXIA:          { style: 'Korean mobile web novel martial arts cover art',   palette: 'ink black, mist white, deep crimson, and cool mountain blue' },
  MYSTERY:        { style: 'Korean mobile web novel mystery cover art',        palette: 'charcoal, muted indigo, amber spotlight, and gallery white' },
  HISTORICAL:     { style: 'Korean mobile web novel historical drama cover art', palette: 'jade black, porcelain white, warm lantern gold, and aged red' },
  MODERN_FANTASY: { style: 'Korean mobile web novel urban fantasy cover art',  palette: 'night violet, graphite, wet pavement gloss, and neon lavender' },
  SF:             { style: 'Korean mobile web novel science fiction cover art', palette: 'cosmic black, cobalt, silver, and pale blue light' },
  HORROR:         { style: 'Korean mobile web novel dark horror cover art',    palette: 'bone white, deep black, sickly green, and red pin accents' },
  ACTION:         { style: 'Korean mobile web novel action thriller cover art', palette: 'high contrast black, white, safety orange, and steel gray' },
  THRILLER:       { style: 'Korean mobile web novel psychological thriller cover art', palette: 'cold blue, stark white, graphite, and sharp red accents' },
};

function buildCoverImagePrompt(genre: string, title: string, userPrompt: string): string {
  const { style, palette } =
    GENRE_STYLE[genre?.toUpperCase()] ??
    { style: 'Korean mobile web novel cover art', palette: 'refined cinematic color with strong mobile thumbnail contrast' };

  return [
    'Textless base artwork for a mobile web novel cover.',
    `A visually striking scene that captures the soul of a story titled "${title}".`,
    `Scene concept: ${userPrompt}.`,
    `${style}, ${palette}.`,
    'Character-forward polished digital illustration, glossy commercial finish, dramatic emotion, mobile thumbnail clarity.',
    'Leave the lower third calmer and slightly darker so the app can overlay localized title text.',
    'Absolutely no text, no letters, no glyphs, no title, no genre label, no watermark, no logo, no signage.',
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
    imagePrompt: 'Textless base artwork for a Korean mobile web novel romance cover. A composed man in a black suit and a woman in an elegant deep burgundy dress stand apart in a luxury Seoul high-rise apartment at sunset, city skyline through tall windows, emotional contract-marriage tension and restrained glamour. Character-forward semi-realistic polished digital illustration, glossy commercial finish, rich burgundy, gold, and black palette, lower third calmer and slightly darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-rofan',
    genre: 'ROFAN',
    genreLabel: '로판',
    title: '공작이\n나를 선택했다',
    color: '#1a2540',
    storyPrompt: '환생해서 들어간 소설 속 세계. 원작에서 냉혹한 빌런이었던 공작이 어째서인지 나에게만 다가온다. 내가 알던 스토리가 완전히 틀어지기 시작했다.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel romantasy cover. A cold noble duke in dark formal attire extends his hand toward a young woman in a pearl-toned gown inside an opulent golden ballroom, magical tension and secret destiny. Character-forward semi-realistic polished digital illustration, glossy commercial finish, midnight blue, chandelier gold, ivory, luminous pearl accents, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-fantasy',
    genre: 'FANTASY',
    genreLabel: '판타지',
    title: '무능력자가\n세계 최강이었다',
    color: '#0d2818',
    storyPrompt: '아무 능력도 없다며 무시당해온 사람. 하지만 숨겨진 고대 각성이 시작되고, 세상이 전혀 몰랐던 진짜 힘이 깨어난다.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel fantasy cover. An underestimated young hero stands amid shattered mountain stone, ancient runes glowing from one hand, controlled lightning and hidden supreme power awakening. Character-forward semi-realistic polished digital illustration, glossy commercial finish, dark emerald, black, electric blue, metallic silver magic, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-wuxia',
    genre: 'WUXIA',
    genreLabel: '무협',
    title: '강호의\n마지막 검객',
    color: '#2d0808',
    storyPrompt: '강호에서 사라진 지 10년. 스승의 죽음 뒤에 숨겨진 진실을 쫓아 다시 검을 든 사람. 복수의 여정이 시작된다.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel martial arts cover. A lone swordsman in flowing dark robes stands on a misty cliff with an unsheathed blade catching the last light, vast mountains behind him, revenge and old martial world secrets. Character-forward semi-realistic polished digital illustration with ink atmosphere, glossy commercial finish, ink black, mist white, deep crimson, cool mountain blue, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-mystery',
    genre: 'MYSTERY',
    genreLabel: '미스터리',
    title: '사라진 화가의\n마지막 그림',
    color: '#18182a',
    storyPrompt: '저명한 화가가 마지막 작품을 완성하던 날 밤 흔적도 없이 사라졌다. 그 그림에는 아직 아무도 알아채지 못한 단서가 숨겨져 있다.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel mystery cover. A stylish investigator enters a dim nocturnal art studio where an unfinished canvas glows under an amber spotlight, empty stool and scattered brushes imply a vanished painter. Character-forward semi-realistic polished digital illustration, glossy commercial finish, charcoal, muted indigo, gallery white, amber light, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-historical',
    genre: 'HISTORICAL',
    genreLabel: '역사극',
    title: '조선의\n여자 포도청',
    color: '#0f2010',
    storyPrompt: '조선 시대, 신분을 숨기고 포도청에 들어간 여인. 사대부 가문의 연쇄 실종 사건을 쫓다 왕실의 깊은 음모에 발을 들이게 된다.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel historical drama cover. A determined woman in dark hanbok stands near a misty Joseon palace gate at night, lantern glow on stone, secret police investigation and royal conspiracy mood. Character-forward semi-realistic polished digital illustration, glossy commercial finish, jade black, porcelain white, warm lantern gold, aged red accent, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-modern-fantasy',
    genre: 'MODERN_FANTASY',
    genreLabel: '현대판타지',
    title: '죽은 자와\n대화하는 가게',
    color: '#160a25',
    storyPrompt: '서울 골목 끝, 간판도 없는 작은 가게. 이 가게의 주인은 세상을 떠난 사람들의 마지막 말을 전해준다. 오늘 문을 두드린 손님은 누구일까.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel urban fantasy cover. A mysterious shop owner stands before a glowing violet doorway in a rainy Seoul alley at night, wet pavement reflections, faint ethereal wisps carrying the last words of the dead. Character-forward semi-realistic polished digital illustration, glossy commercial finish, night violet, graphite, rain gloss, neon lavender, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
  {
    key: 'card-sf',
    genre: 'SF',
    genreLabel: 'SF',
    title: '마지막\n지구인',
    color: '#050e1a',
    storyPrompt: '인류 멸망 후 홀로 살아남은 우주비행사. 이름도 없는 별에서 다시 집으로 돌아갈 방법을 찾으며 예상치 못한 존재를 마주한다.',
    imagePrompt: 'Textless base artwork for a Korean mobile web novel science fiction cover. A lone astronaut stands on a quiet alien horizon under a vast star field, tiny Earth-like blue dot in the distance, existential solitude and unexpected encounter. Character-forward semi-realistic polished digital illustration, glossy commercial finish, cosmic black, cobalt, silver, pale blue light, lower third calmer and darker for localized title overlay. Absolutely no text, no letters, no glyphs, no logos, no signage, no watermark.',
  },
] as const;

async function handleSingleCard(
  env: Env,
  card: (typeof SAMPLE_CARDS_DEF)[number],
  refresh = false,
): Promise<Response> {
  const r2Key = `covers/${card.key}.png`;
  const existing = refresh ? null : await env.COVER_IMAGES.head(r2Key);

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

async function handleSampleCards(env: Env, refresh = false): Promise<Response> {
  const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

  const results = await Promise.allSettled(
    SAMPLE_CARDS_DEF.map(async (card) => {
      const r2Key = `covers/${card.key}.png`;
      const existing = refresh ? null : await env.COVER_IMAGES.head(r2Key);

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
    const refresh = url.searchParams.get('refresh') === '1';

    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${env.AI_GATEWAY_API_KEY}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (request.method === 'GET' && url.pathname === '/sample-cards') {
      return handleSampleCards(env, refresh);
    }

    // Generate (or return cached) a single sample card image by key
    if (request.method === 'GET' && url.pathname.startsWith('/sample-cards/')) {
      const key = url.pathname.slice('/sample-cards/'.length);
      const card = SAMPLE_CARDS_DEF.find(c => c.key === key);
      if (!card) return new Response('Not Found', { status: 404 });
      return handleSingleCard(env, card, refresh);
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
