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
  ROMANCE:        { style: 'Korean literary novel romance cover art, wide atmospheric scene, human figures as small distant silhouettes',          palette: 'deep wine, warm sunset gold, black, and soft ambient tones' },
  ROFAN:          { style: 'Korean literary novel romantasy cover art, wide atmospheric scene, human figures as small distant silhouettes',        palette: 'midnight blue, chandelier gold, ivory, and luminous pearl accents' },
  FANTASY:        { style: 'Korean literary novel fantasy cover art, wide atmospheric scene, human figure as small silhouette against vast sky',   palette: 'dark emerald, storm black, electric blue, and metallic silver' },
  WUXIA:          { style: 'Korean literary novel martial arts cover art, ink-wash brushwork, wide mountain landscape, lone silhouette on cliff',  palette: 'ink black, mist white, deep crimson, and cool mountain blue' },
  MYSTERY:        { style: 'Korean literary novel mystery cover art, deep perspective scene, human figure as small distant silhouette',            palette: 'charcoal, muted indigo, amber spotlight, and gallery white' },
  HISTORICAL:     { style: 'Korean literary novel historical drama cover art, wide atmospheric scene, human figure as small silhouette in fog',    palette: 'jade black, porcelain white, warm lantern gold, and aged red' },
  MODERN_FANTASY: { style: 'Korean literary novel urban fantasy cover art, wide atmospheric alley scene, human figure as small distant silhouette', palette: 'night violet, graphite, wet pavement gloss, and neon lavender' },
  SF:             { style: 'Korean literary novel science fiction cover art, vast cosmic panorama, human figure as tiny silhouette against sky',   palette: 'cosmic black, cobalt blue, silver, and pale blue light' },
  HORROR:         { style: 'Korean literary novel horror cover art, wide atmospheric scene, human figure as small silhouette in darkness',         palette: 'bone white, deep black, sickly green, and blood red accents' },
  ACTION:         { style: 'Korean literary novel action thriller cover art, wide atmospheric scene, human figure as small dynamic silhouette',    palette: 'high contrast black, white, safety orange, and steel gray' },
  THRILLER:       { style: 'Korean literary novel psychological thriller cover art, wide atmospheric scene, human figure as small silhouette',     palette: 'cold blue, stark white, graphite, and sharp red accents' },
};

function buildCoverImagePrompt(genre: string, title: string, userPrompt: string): string {
  const { style, palette } =
    GENRE_STYLE[genre?.toUpperCase()] ??
    { style: 'Korean literary novel cover art', palette: 'refined atmospheric color with strong mobile thumbnail contrast' };

  return [
    'Textless Korean literary novel cover art, bookstore bestseller aesthetic.',
    `A visually striking scene that captures the soul of a story titled "${title}".`,
    `Scene concept: ${userPrompt}.`,
    `${style}, ${palette}.`,
    'Wide atmospheric scene, human figures as small distant silhouettes against a vast background.',
    'Gouache and watercolor painterly texture, matte flat finish, not photorealistic, not glossy.',
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
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a wide view of a luxury Seoul high-rise apartment at sunset, floor-to-ceiling windows framing the glittering city skyline, a composed man in a black suit and a woman in a deep burgundy dress stand as small distant silhouettes at opposite ends of the room, emotional contract-marriage tension. Wide panoramic scene, human figures as small silhouettes. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Rich burgundy, warm sunset gold, black palette. Lower third calm and slightly darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-rofan',
    genre: 'ROFAN',
    genreLabel: '로판',
    title: '공작이\n나를 선택했다',
    color: '#1a2540',
    storyPrompt: '환생해서 들어간 소설 속 세계. 원작에서 냉혹한 빌런이었던 공작이 어째서인지 나에게만 다가온다. 내가 알던 스토리가 완전히 틀어지기 시작했다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a grand European-style ballroom viewed from above, ornate chandeliers casting warm candlelight, a cold noble duke in dark formal attire extends a gloved hand toward a woman in a pearl-toned gown — both rendered as small elegant silhouettes amid the sweeping golden architecture. Wide panoramic scene, human figures as small distant silhouettes. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Deep midnight blue, chandelier gold, ivory, pearl accents palette. Lower third calm and slightly darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-fantasy',
    genre: 'FANTASY',
    genreLabel: '판타지',
    title: '무능력자가\n세계 최강이었다',
    color: '#0d2818',
    storyPrompt: '아무 능력도 없다며 무시당해온 사람. 하지만 숨겨진 고대 각성이 시작되고, 세상이 전혀 몰랐던 진짜 힘이 깨어난다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a lone young man stands atop a shattered mountain peak against a vast stormy sky, ancient glowing runes bursting from stone beneath his feet in electric blue light — rendered as a small dramatic silhouette against the enormous sky. Wide panoramic scene, human figure as small silhouette. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Dark emerald, storm black, electric blue, metallic silver palette. Lower third calm and slightly darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-wuxia',
    genre: 'WUXIA',
    genreLabel: '무협',
    title: '강호의\n마지막 검객',
    color: '#2d0808',
    storyPrompt: '강호에서 사라진 지 10년. 스승의 죽음 뒤에 숨겨진 진실을 쫓아 다시 검을 든 사람. 복수의 여정이 시작된다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a wide ink-wash mountain landscape at dusk, layers of misty peaks receding into the distance, a lone swordsman in dark flowing robes stands as a small silhouette on a cliff edge with unsheathed blade, deep crimson sunset bleeding through the mist. Wide panoramic scene, human figure as small distant silhouette. Ink-wash brushwork with gouache texture, matte flat finish, not photorealistic. Ink black, mist white, deep crimson, cool mountain blue palette. Lower third calm and slightly darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-mystery',
    genre: 'MYSTERY',
    genreLabel: '미스터리',
    title: '사라진 화가의\n마지막 그림',
    color: '#18182a',
    storyPrompt: '저명한 화가가 마지막 작품을 완성하던 날 밤 흔적도 없이 사라졌다. 그 그림에는 아직 아무도 알아채지 못한 단서가 숨겨져 있다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a long dim art gallery corridor stretching into depth, an unfinished canvas glowing under an amber spotlight on an empty easel, a small silhouette of a stylish investigator at the far end of the corridor, scattered brushes and an overturned stool imply a vanished painter. Wide atmospheric scene, human figure as small distant silhouette. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Charcoal, muted indigo, amber spotlight, gallery white palette. Lower third calm and darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-historical',
    genre: 'HISTORICAL',
    genreLabel: '역사극',
    title: '조선의\n여자 포도청',
    color: '#0f2010',
    storyPrompt: '조선 시대, 신분을 숨기고 포도청에 들어간 여인. 사대부 가문의 연쇄 실종 사건을 쫓다 왕실의 깊은 음모에 발을 들이게 된다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a wide view of a misty Joseon palace courtyard at deep night, stone-paved path leading through a wooden gate, warm paper lanterns casting golden circles in the fog — a small silhouette of a determined woman in dark hanbok stands near the gate. Wide panoramic scene, human figure as small silhouette. Gouache and watercolor painterly texture with ink-wash brushwork, matte flat finish, not photorealistic. Jade black, porcelain white, warm lantern gold, aged red accent palette. Lower third calm and slightly darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-modern-fantasy',
    genre: 'MODERN_FANTASY',
    genreLabel: '현대판타지',
    title: '죽은 자와\n대화하는 가게',
    color: '#160a25',
    storyPrompt: '서울 골목 끝, 간판도 없는 작은 가게. 이 가게의 주인은 세상을 떠난 사람들의 마지막 말을 전해준다. 오늘 문을 두드린 손님은 누구일까.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a narrow Seoul back-alley at night seen in depth perspective, rain-slicked cobblestones reflecting neon light, at the very end of the alley a tiny glowing violet doorway with a mysterious shop, a small silhouette of a visitor standing at the threshold, faint ethereal wisps drifting upward. Wide atmospheric alley scene, human figure as small distant silhouette. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Night violet, graphite, wet pavement gloss, neon lavender palette. Lower third calm and darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-sf',
    genre: 'SF',
    genreLabel: 'SF',
    title: '마지막\n지구인',
    color: '#050e1a',
    storyPrompt: '인류 멸망 후 홀로 살아남은 우주비행사. 이름도 없는 별에서 다시 집으로 돌아갈 방법을 찾으며 예상치 못한 존재를 마주한다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a vast alien planet horizon under an enormous star-filled sky, a lone astronaut in a white suit stands as a tiny silhouette on a rocky ridge, a small pale blue dot — Earth — glowing faintly in the upper sky, cosmic silence and profound solitude. Wide panoramic scene, human figure as tiny silhouette against enormous cosmos. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Cosmic black, cobalt blue, silver, pale blue light palette. Lower third calm and darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-action',
    genre: 'ACTION',
    genreLabel: '액션',
    title: '랭크 없는\n헌터',
    color: '#1a1205',
    storyPrompt: '전 세계에 던전이 열리고 각성자들이 생겨난 세상. 아무 능력도 없는 것으로 판명된 남자가 어느 날 최하위 던전에서 혼자 살아 돌아왔다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a wide underground dungeon entrance at night, cracked stone gate glowing red at the edges, a lone hunter in dark tactical gear stands as a small silhouette against the massive glowing threshold, other hunters visible far behind — he bears no rank insignia. Wide panoramic scene, human figure as small distant silhouette. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Dark charcoal, electric red, steel gray, amber gate-glow palette. Lower third calm and slightly darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
  },
  {
    key: 'card-thriller',
    genre: 'THRILLER',
    genreLabel: '스릴러',
    title: '완벽한\n거짓말',
    color: '#0a0f1a',
    storyPrompt: '10년 전 사건의 유일한 생존자. 기억이 없어서 혐의를 벗었지만, 기억이 조금씩 돌아오면서 내가 알던 진실이 흔들린다.',
    imagePrompt: 'Textless Korean literary novel cover art, bookstore bestseller aesthetic. Scene: a wide view of a modern apartment hallway at night, one door at the far end slightly ajar with a thin strip of cold light, a small silhouette of a figure standing frozen in the corridor, shadows stretching long and irregular, something is deeply wrong. Wide atmospheric scene, human figure as small silhouette. Gouache and watercolor painterly texture, matte flat finish, not photorealistic. Cold blue-grey, stark white, graphite, sharp red accent palette. Lower third calm and darker. Absolutely no text, no letters, no glyphs, no watermark, no logo.',
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
