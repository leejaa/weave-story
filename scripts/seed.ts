/**
 * Seed script: generates story cover + chapter images via Vercel AI Gateway (gpt-image-2),
 * uploads to Cloudflare R2 via wrangler, then inserts dummy data into Neon.
 *
 * Run: npx tsx scripts/seed.ts
 *
 * Required env vars (in .env.local):
 *   DATABASE_URL
 *   AI_GATEWAY_API_KEY
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createGateway } from '@ai-sdk/gateway';
import { generateImage } from 'ai';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const DB_URL = process.env.DATABASE_URL!;
const GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY!;
const R2_BUCKET = 'weave-story-media';
const R2_PUBLIC_URL = 'https://pub-3b97af20ccef4afb950d53316d0100f7.r2.dev';

const gateway = createGateway({ apiKey: GATEWAY_KEY });

// ── Story definitions ─────────────────────────────────────────────────────────

const STORIES = [
  {
    title: 'The Lemonpolish Door',
    slug: 'lemonpolish-door',
    genre: 'folk',
    mood: 'tender',
    estimatedChapters: 10,
    description:
      'A young woman inherits a house at the edge of a forest where every door leads somewhere different each night. When she finally opens the lemonpolish-yellow one, she cannot find her way back.',
    coverPrompt:
      'A weathered yellow door covered in aged lemon polish standing alone in a misty forest at dusk, oil painting style, warm golden light, atmospheric, literary fiction book cover, no text, no letters',
    chapters: [
      {
        number: 1,
        title: 'The Key That Smelled of Citrus',
        content: `The solicitor handed her a key that smelled, inexplicably, of lemons.\n\n"Your aunt's house," he said, pushing a manila envelope across the desk. "She left instructions: go in spring, before the bluebells bloom."\n\nMira turned the key over in her palm. Brass, old, with a bow shaped like a crescent moon. Her aunt Helena had been the kind of woman who kept dried flowers in hat boxes and wrote letters she never sent. The kind of woman who might, Mira supposed, leave behind a house that smelled of summer even in February.\n\nThe drive north took four hours. The house arrived before she expected it — a stone cottage at the treeline, its front door painted the color of lemonpolish, the yellow so bright it seemed to pulse against the grey afternoon.`,
        imagePrompt:
          'Interior of a cozy stone cottage with afternoon light streaming in, antique brass key with crescent moon bow on a wooden table, dried flowers in background, warm golden atmosphere, painterly impressionist style, no text',
        options: [
          { index: 0, text: 'Enter through the lemonpolish door immediately' },
          { index: 1, text: 'Walk around the house first to understand its layout' },
        ],
      },
      {
        number: 2,
        title: 'What the Hallway Remembers',
        content: `The hallway was longer than the outside of the house suggested.\n\nMira counted her steps — twelve, thirteen, fourteen — before the corridor finally opened into a kitchen that smelled of warm bread and something else, something green and wild, like rain on stone. On the table: a cup of tea, still steaming.\n\nShe should have left. She knew she should have left. Instead she sat down and wrapped her hands around the cup.\n\n"You came in spring," said a voice from the doorway behind her.\n\nShe turned. The doorway was empty. The lemonpolish door at the end of the hall — the one that hadn't been there a moment ago — stood half-open, exhaling warm amber light.`,
        imagePrompt:
          'Mysterious long hallway in an old stone cottage with unexpected depth, steaming teacup on wooden table in foreground, golden amber light glowing from doorway at far end, impressionist oil painting, no text',
        options: [
          { index: 0, text: 'Call out and ask who spoke' },
          { index: 1, text: 'Walk toward the amber light through the lemonpolish door' },
        ],
      },
    ],
  },
  {
    title: 'Where the River Forgets',
    slug: 'where-the-river-forgets',
    genre: 'drama',
    mood: 'slow-burn',
    estimatedChapters: 12,
    description:
      'A hydrologist returns to her childhood town to investigate why the river has been running backwards for three weeks. What she finds is not a geological anomaly — it is a wound the town has been hiding for thirty years.',
    coverPrompt:
      'A river flowing backwards through a small Korean mountain town at blue hour, reflections of streetlights on water, mysterious and melancholic mood, cinematic wide composition, painterly realism, no text, no letters',
    chapters: [
      {
        number: 1,
        title: 'The Backwards Current',
        content: `The river had been running the wrong way for twenty-two days when the call came.\n\nDr. Seo put down her coffee and looked at the photograph her colleague had sent: the Yongdam River, seen from the old bridge, its surface broken by a current that moved — unmistakably, impossibly — south to north.\n\n"There's a scientific explanation," she told herself, the same way she had been telling herself since childhood that there was a scientific explanation for why she had never returned to Jongam.\n\nShe booked a train for the following morning.\n\nThe town smelled the same: pine and cold water and something underneath, something mineral and old. The bridge was there. The river was there. And yes — she watched a red leaf spin south to north beneath her feet — the river had forgotten which way it was supposed to flow.`,
        imagePrompt:
          'View from an old stone bridge looking down at a river with eerily reversed current, a single red autumn leaf spinning, small mountain town reflected in water, blue twilight hour, painterly realism, no text',
        options: [
          { index: 0, text: 'Go directly to the river monitoring station' },
          { index: 1, text: 'First visit your childhood home on the north bank' },
        ],
      },
    ],
  },
  {
    title: 'A Stranger at the Cliff House',
    slug: 'stranger-cliff-house',
    genre: 'mystery',
    mood: 'eerie',
    estimatedChapters: 14,
    description:
      'Every summer, the cliff house is rented to a different stranger. This summer, the stranger arrived a week early, knows the names of every room, and has never once looked at the sea.',
    coverPrompt:
      'A Victorian stone house perched on dramatic coastal cliffs at night, single warm window glowing, stormy dark sea below, dense fog surrounding the cliffs, gothic dramatic atmosphere, fine art illustration, no text, no letters',
    chapters: [
      {
        number: 1,
        title: 'Early Arrival',
        content: `The cliff house had been in the family for four generations, and in all that time, no summer tenant had ever arrived before the first of July.\n\nIt was the twenty-fourth of June when Petra heard the creak of the iron gate.\n\nShe watched from the kitchen window as the stranger — tall, unhurried, carrying a single black case — walked the path she knew by heart, turned left at the hydrangeas where no one ever turned left, and stopped at the back door. The back door that was never listed in the rental description.\n\nHe knocked twice. Waited. Then looked up, directly at the window where she was standing, though she was sure she hadn't moved, hadn't made a sound.\n\n"The agency sent me early," he said, though she hadn't opened the window. "I hope that's not inconvenient."`,
        imagePrompt:
          'Victorian ivy-covered stone house exterior at dusk, mysterious tall figure with black case standing at a hidden back door, hydrangeas in foreground, fog from the sea, cinematic noir atmosphere, detailed illustration, no text',
        options: [
          { index: 0, text: 'Open the door and ask to see his booking confirmation' },
          { index: 1, text: 'Call the rental agency before opening the door' },
        ],
      },
    ],
  },
  {
    title: 'Velvet Hour',
    slug: 'velvet-hour',
    genre: 'romance',
    mood: 'tender',
    estimatedChapters: 9,
    description:
      'Two astronomers at a remote mountain observatory spend a winter mapping a new constellation. By spring, they have mapped something else entirely.',
    coverPrompt:
      'Two astronomers at a high mountain observatory at night, looking through telescope together, brilliant Milky Way starfield above, warm amber light from observatory dome, intimate romantic atmosphere, soft watercolor style, no text, no letters',
    chapters: [
      {
        number: 1,
        title: 'First Light',
        content: `The rule at the Munjae Observatory was simple: no names until the third night.\n\n"It helps," the director had explained during orientation, "if you get to know the work before you get to know the worker."\n\nSo on the first night, she knew him only as the person who made excellent coffee, kept meticulous logs, and had taped a small paper crane to the body of the main telescope. On the second night, she knew him as the person who laughed — quietly, genuinely — when she accidentally mapped a cloud formation and called it a new star.\n\nOn the third night, at four in the morning, when the sky above the Sobaek peaks was so clear it seemed to be leaning toward them, he handed her a printout and said:\n\n"I'm Junho. I think we found something."`,
        imagePrompt:
          'Inside an astronomical observatory dome at 4am, two researchers bent over telescope controls, a tiny origami paper crane hanging from equipment, brilliant stars visible through dome opening, warm intimate lighting, soft watercolor illustration, no text',
        options: [
          { index: 0, text: 'Look at what he found immediately' },
          { index: 1, text: 'Tell him your name first' },
        ],
      },
    ],
  },
  {
    title: 'Small Bones, Large Hands',
    slug: 'small-bones-large-hands',
    genre: 'folk',
    mood: 'tender',
    estimatedChapters: 7,
    description:
      'A village archivist catalogues the belongings of a woman who lived alone for sixty years and left behind 3,000 handwritten notes, each addressed to someone different.',
    coverPrompt:
      'Thousands of handwritten notes overflowing from cardboard boxes in a small village cottage, warm candlelight casting shadows, aged paper textures, folk art style, intimate and melancholic mood, no text on notes visible, no letters',
    chapters: [
      {
        number: 1,
        title: 'The First Note',
        content: `The estate was small: one room, a garden, and forty-seven cardboard boxes.\n\nYujin had catalogued stranger things — an entire cellar of unlabeled wine, a collection of pressed moths from six continents — but she had never catalogued anything like this.\n\nEach box held notes. Handwritten, on every variety of paper: receipts, margins of newspapers, paper bags, the backs of photographs. Each note was addressed to someone by name — Haewon, Myungsu, a Grandmother Choi, a Dr. Lim — and each note said, in its own way, the same thing:\n\nI am thinking of you today.\n\nThe woman who had written them, a Ms. Park Soyeon, had died at eighty-seven, never married, no children recorded. The village said she had been a seamstress. The village said she had been quiet.\n\nYujin unfolded the first note from the first box. It was addressed to a name she recognized.`,
        imagePrompt:
          'Village cottage room with overflowing cardboard boxes of handwritten notes, archivist woman sitting at wooden table carefully examining a folded note, afternoon golden light through small windows, folk art painterly style, no readable text',
        options: [
          { index: 0, text: 'Read the note that has your name on it' },
          { index: 1, text: 'Set it aside and catalog systematically from the beginning' },
        ],
      },
    ],
  },
  {
    title: 'The Clockwinder',
    slug: 'the-clockwinder',
    genre: 'folk',
    mood: 'eerie',
    estimatedChapters: 11,
    description:
      'In a city where time moves differently in every district, there is one person whose job is to keep all the clocks synchronized. She has been doing this job for longer than anyone can remember.',
    coverPrompt:
      'A woman in period clothing winding an enormous ornate clock tower at dawn, a surreal city visible below where different districts show different times of day simultaneously, magical realism illustration, golden and shadow tones, no text, no letters',
    chapters: [
      {
        number: 1,
        title: 'The Thousand Clocks',
        content: `They called her the Clockwinder, which was not a name but a job title, which was all she had ever needed.\n\nEvery morning at the hour that was technically six o'clock in the Central District (and simultaneously 9 a.m. in the northern quarter, and always, inexplicably, half past two in the Weavers' Lane), she began her rounds.\n\nNine hundred and seventy-two clocks in the city required winding. Fourteen required what she privately called *adjustment* — a concept she had never explained to anyone, because it was not the kind of thing that explained well.\n\nToday she noticed, for the first time in what she estimated was eighty or ninety years, that one clock had stopped.\n\nNot simply run down. Stopped. Its hands had broken off entirely and were nowhere to be found.\n\nThe clock was in the house of someone who, according to the city registry, did not exist.`,
        imagePrompt:
          'A woman in Victorian-era clothing examining a clock with missing hands in a mysterious empty room, through the windows other clocks show different times simultaneously, magical realism oil painting, warm gold and deep shadow tones, no text',
        options: [
          { index: 0, text: 'Investigate who owns this house' },
          { index: 1, text: 'Wind the broken clock anyway and see what happens' },
        ],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateAndUpload(prompt: string, key: string): Promise<string> {
  console.log(`  🎨 Generating image: ${key}`);

  const { image } = await generateImage({
    model: gateway.imageModel('openai/gpt-image-2'),
    prompt,
    size: '1024x1024',
  });

  const tmpFile = join(tmpdir(), `weave-seed-${Date.now()}.png`);
  writeFileSync(tmpFile, Buffer.from(image.uint8Array));

  console.log(`  ☁️  Uploading to R2: ${key}`);
  execSync(
    `npx wrangler r2 object put ${R2_BUCKET}/${key} --file="${tmpFile}" --content-type=image/png --remote`,
    { stdio: 'inherit' },
  );
  unlinkSync(tmpFile);

  const url = `${R2_PUBLIC_URL}/${key}`;
  console.log(`  ✓ ${url}`);
  return url;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!DB_URL) throw new Error('DATABASE_URL missing in .env.local');
  if (!GATEWAY_KEY) throw new Error('AI_GATEWAY_API_KEY missing in .env.local');

  const sql = neon(DB_URL);
  console.log('🌱 Starting seed...\n');

  for (const story of STORIES) {
    console.log(`\n📖 "${story.title}"`);

    const coverUrl = await generateAndUpload(story.coverPrompt, `covers/${story.slug}.png`);

    const [{ id: storyId }] = await sql`
      INSERT INTO stories (title, slug, description, genre, mood, cover_image_url, estimated_chapters)
      VALUES (
        ${story.title}, ${story.slug}, ${story.description},
        ${story.genre}, ${story.mood}, ${coverUrl}, ${story.estimatedChapters}
      )
      ON CONFLICT (slug) DO UPDATE SET
        cover_image_url = EXCLUDED.cover_image_url,
        description     = EXCLUDED.description
      RETURNING id
    `;
    console.log(`  ✓ story: ${storyId}`);

    if (story.chapters.length > 0) {
      const progress = parseFloat((story.chapters.length / story.estimatedChapters).toFixed(3));

      // Placeholder user — threads are re-created per real user at sign-in
      const DEMO_USER = '00000000-0000-0000-0000-000000000001';

      const [{ id: threadId }] = await sql`
        INSERT INTO threads (user_id, story_id, status, current_chapter, progress)
        VALUES (${DEMO_USER}, ${storyId}, 'active', ${story.chapters.length}, ${progress})
        RETURNING id
      `;
      console.log(`  ✓ thread: ${threadId}`);

      for (const ch of story.chapters) {
        const imgUrl = await generateAndUpload(
          ch.imagePrompt,
          `chapters/${story.slug}/ch${ch.number}.png`,
        );
        await sql`
          INSERT INTO chapters (thread_id, chapter_number, title, content, image_url, options)
          VALUES (
            ${threadId}, ${ch.number}, ${ch.title}, ${ch.content},
            ${imgUrl}, ${JSON.stringify(ch.options)}
          )
          ON CONFLICT (thread_id, chapter_number) DO UPDATE SET
            image_url = EXCLUDED.image_url
        `;
        console.log(`  ✓ chapter ${ch.number}`);
      }
    }
  }

  console.log('\n✅ Seed complete!');
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message ?? err);
  process.exit(1);
});
