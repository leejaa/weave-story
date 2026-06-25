// 스토리 생성 품질 디버깅 도구(읽기 전용).
// 사용법:  node scripts/story-debug.mjs <threadId> [--prompts]
//   <threadId> : threads.id (또는 story 첫 스레드)
//   --prompts  : 실제 draft 프롬프트 전문까지 출력(기본은 요약/절단)
//
// 출력: 아웃라인 요약 + 화별 [상태·사용 비트·품질 게이트·의미적 심사(응집/중심전진/척추/플래그)·rationale].
// DATABASE_URL은 .env.local에서 읽음(값 미노출). neon 드라이버는 workers/api/node_modules 사용.
import { neon } from '../workers/api/node_modules/@neondatabase/serverless/index.mjs';
import { readFileSync } from 'node:fs';

const threadId = process.argv[2];
const showPrompts = process.argv.includes('--prompts');
if (!threadId) { console.error('usage: node scripts/story-debug.mjs <threadId> [--prompts]'); process.exit(1); }

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const DB = env.match(/^DATABASE_URL=(.*)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
if (!DB) { console.error('DATABASE_URL not in .env.local'); process.exit(1); }
const sql = neon(DB);

const trunc = (s, n) => (s == null ? '' : (s.length > n ? s.slice(0, n) + ` …(+${s.length - n}자)` : s));
const J = (v) => (v == null ? '' : JSON.stringify(v));

const [thread] = await sql.query('SELECT t.id, t.story_id, t.current_chapter, s.title, s.genre, s.estimated_chapters FROM threads t JOIN stories s ON s.id=t.story_id WHERE t.id=$1', [threadId]);
if (!thread) { console.error('thread not found'); process.exit(1); }
console.log(`\n=== STORY: ${thread.title ?? '(제목없음)'} | genre=${thread.genre} | ${thread.current_chapter}/${thread.estimated_chapters}화 | story=${thread.story_id} ===`);

// 아웃라인(story_bibles.blueprint)
const [bible] = await sql.query('SELECT blueprint FROM story_bibles WHERE story_id=$1', [thread.story_id]);
const o = bible?.blueprint;
if (o && o.beats) {
  console.log(`\n[OUTLINE] structure="${o.structureName}" beats=${o.beats.length} endings=${o.endings?.length}`);
  console.log(`  spine: ${o.spine}`);
  const arc = o.centralArc ?? (o.centralMystery ? { dramaticQuestion: o.centralMystery.question, throughline: o.centralMystery.intendedAnswer } : null);
  console.log(`  centralArc: ${arc?.dramaticQuestion}`);
  console.log(`    └ throughline: ${trunc(arc?.throughline, 160)}`);
  if (o.cast) console.log(`  cast: ${o.cast.map(c => c.name).join(', ')}`);
  if (o.causalAnchors?.length) o.causalAnchors.forEach(a => console.log(`  causal: ${a.hook} ⇐ ${trunc(a.why, 120)}`));
  if (o.endings) o.endings.forEach(e => console.log(`  ending(${e.id}): ${trunc(e.shape, 100)} [when ${trunc(e.condition, 60)}]`));
} else {
  console.log('\n[OUTLINE] 없음 (레거시/Phase A 스토리)');
}

// 화별 챕터 + 최신 generation_run + 심사
const chs = await sql.query('SELECT chapter_number, title, status, length(content) AS len FROM chapters WHERE thread_id=$1 ORDER BY chapter_number', [threadId]);
for (const ch of chs) {
  const beat = o?.beats?.find(b => b.index === ch.chapter_number);
  const [run] = await sql.query(
    "SELECT status, attempt_max, quality, out FROM (SELECT status, (input_snapshot->>'attempt')::int AS attempt_max, quality_scores AS quality, output_snapshot AS out, row_number() OVER (PARTITION BY chapter_number ORDER BY created_at DESC) rn FROM generation_runs WHERE thread_id=$1 AND chapter_number=$2 AND stage LIKE '%chapter_package') x WHERE rn=1",
    [threadId, ch.chapter_number],
  );
  const [jg] = await sql.query('SELECT overall, scores, flags, rationale FROM chapter_judgements WHERE thread_id=$1 AND chapter_number=$2 ORDER BY created_at DESC LIMIT 1', [threadId, ch.chapter_number]);

  console.log(`\n──────── ${ch.chapter_number}화: ${ch.title ?? ''} (${ch.len}자, ${ch.status}) ────────`);
  if (beat) console.log(`  BEAT: ${trunc(beat.function, 140)}\n        arc+: ${trunc(beat.arcAdvance ?? beat.centralAdvance, 100)} | 주인공: ${trunc(beat.protagonistStake, 100)}`);
  if (run) console.log(`  GEN: status=${run.status} quality=${J(run.quality)}`);
  if (jg) {
    const flags = Object.entries(jg.flags ?? {}).filter(([, v]) => v).map(([k]) => k).join(',') || 'none';
    console.log(`  JUDGE: overall=${jg.overall}/100 scores=${J(jg.scores)} flags=[${flags}]`);
    console.log(`         → ${jg.rationale}`);
  } else {
    console.log('  JUDGE: (없음)');
  }
  if (showPrompts && run?.out?.debug?.draftPrompt) {
    console.log(`  --- DRAFT PROMPT (mode=${run.out.debug.mode}) ---\n${run.out.debug.draftPrompt}\n  --- /PROMPT ---`);
  }
}

// 요약: 평균 점수 + 플래그 합
const [agg] = await sql.query("SELECT avg(overall)::int avg_overall, count(*) FILTER (WHERE (flags->>'orphanHook')::bool) orphan, count(*) FILTER (WHERE (flags->>'spineHijack')::bool) hijack, count(*) FILTER (WHERE (flags->>'genreDrift')::bool) drift, count(*) FILTER (WHERE (flags->>'complexityCreep')::bool) cx, count(*) FILTER (WHERE (flags->>'choiceUngrounded')::bool) cu, count(*) FILTER (WHERE (flags->>'causalGap')::bool) cg FROM chapter_judgements WHERE thread_id=$1", [threadId]);
console.log(`\n=== 요약: 평균 ${agg?.avg_overall ?? '-'}/100 | 고아떡밥 ${agg?.orphan ?? 0}회 · 척추납치 ${agg?.hijack ?? 0}회 · 장르드리프트(수사물화) ${agg?.drift ?? 0}회 · 복잡도증가 ${agg?.cx ?? 0}회 · 선택지근거없음 ${agg?.cu ?? 0}회 · 인과비약 ${agg?.cg ?? 0}회 ===\n`);
