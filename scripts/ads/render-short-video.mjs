#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SHORT_CAPTION_THEMES } from './lib/short-caption-themes.mjs';
import { SHORT_VIDEO_CONFIGS } from './lib/short-video-configs.mjs';

const CAPTION_RENDERER = resolve('scripts/ads/render-caption-overlay.py');
const OUTPUT_DIR = resolve('store-assets/ads/generated/shorts/video');
const TMP_DIR = resolve('store-assets/ads/generated/shorts/tmp');
const SHOT_KEY = process.env.SHORT_KEY ?? 'choice-en';

function formatTime(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String((seconds % 60).toFixed(3)).padStart(6, '0');
  return `${hours}:${minutes}:${secs.replace('.', ',')}`;
}

function cueFileName(shotKey, index) {
  return resolve(TMP_DIR, `${shotKey}-cue-${String(index + 1).padStart(2, '0')}.txt`);
}

function overlayFileName(shotKey, index) {
  return resolve(TMP_DIR, `${shotKey}-overlay-${String(index + 1).padStart(2, '0')}.png`);
}

function buildSegmentFilter(segmentIndex, config) {
  const { width, height, fps } = config;
  const frames = Math.round(config.segments[segmentIndex].duration * fps);

  return `[${segmentIndex}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},zoompan=z='min(zoom+0.00045,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps},format=yuv420p[v${segmentIndex}]`;
}

function buildOverlayFilter(cues) {
  return cues
    .map((cue, index) => {
      const inputLabel = index === 0 ? '[0:v]' : `[v${index}]`;
      const outputLabel = `[v${index + 1}]`;
      const overlayInput = `[${index + 1}:v]`;
      const enableExpr = `between(t\\,${cue.start.toFixed(3)}\\,${cue.end.toFixed(3)})`;

      return `${inputLabel}${overlayInput}overlay=x=0:y=0:shortest=1:enable='${enableExpr}'${outputLabel}`;
    })
    .join(';');
}

async function writeCueFiles(shotKey, config) {
  return Promise.all(
    config.cues.map(async (cue, index) => {
      const filePath = cueFileName(shotKey, index);
      await writeFile(filePath, cue.text, 'utf8');
      return filePath;
    }),
  );
}

async function ensureAssets(config) {
  for (const segment of config.segments) {
    await mkdir(dirname(segment.image), { recursive: true });
  }
}

async function runFfmpeg(args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('ffmpeg', args, { stdio: 'inherit' });
    child.on('error', rejectPromise);
    child.on('exit', code => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function runCommand(command, args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', rejectPromise);
    child.on('exit', code => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function renderOverlayImages(shotKey, cuePaths, config) {
  const overlayPaths = cuePaths.map((_, index) => overlayFileName(shotKey, index));

  await Promise.all(
    overlayPaths.map((overlayPath, index) => {
      const cue = config.cues[index];
      const theme = SHORT_CAPTION_THEMES[cue.theme ?? 'paper'];
      if (!theme) {
        throw new Error(`Unknown caption theme: ${cue.theme}`);
      }

      return runCommand('python3', [
        CAPTION_RENDERER,
        '--text-file', cuePaths[index],
        '--output', overlayPath,
        '--width', String(config.width),
        '--height', String(config.height),
        '--font-file', theme.fontFile,
        '--font-size', String(cue.fontSize),
        '--y', String(Math.round(config.height * cue.yRatio)),
        '--line-spacing', String(theme.lineSpacing),
        '--stroke-width', String(theme.strokeWidth),
        '--font-color', theme.fontColor,
        '--stroke-color', theme.strokeColor,
        '--panel-fill', theme.panelFill,
        '--panel-stroke', theme.panelStroke,
        '--panel-radius', String(theme.panelRadius),
        '--padding-x', String(theme.paddingX),
        '--padding-y', String(theme.paddingY),
        '--shadow-color', theme.shadowColor,
        '--shadow-offset-x', String(theme.shadowOffsetX),
        '--shadow-offset-y', String(theme.shadowOffsetY),
      ]);
    }),
  );

  return overlayPaths;
}

async function renderShort(shotKey) {
  const config = SHORT_VIDEO_CONFIGS[shotKey];
  if (!config) {
    throw new Error(`Unknown SHORT_KEY: ${shotKey}`);
  }

  await ensureAssets(config);
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  const cuePaths = await writeCueFiles(shotKey, config);
  const overlayPaths = await renderOverlayImages(shotKey, cuePaths, config);
  const baseOutput = resolve(TMP_DIR, `${shotKey}-base.mp4`);
  const finalOutput = resolve(OUTPUT_DIR, config.outputName);

  await rm(baseOutput, { force: true });
  await rm(finalOutput, { force: true });

  const ffmpegInputs = config.segments.flatMap(segment => ['-i', segment.image]);

  const segmentFilters = config.segments.map((_, index) => buildSegmentFilter(index, config));
  const concatInputs = config.segments.map((_, index) => `[v${index}]`).join('');
  const baseFilter = `${segmentFilters.join(';')};${concatInputs}concat=n=${config.segments.length}:v=1:a=0[v]`;

  await runFfmpeg([
    '-y',
    ...ffmpegInputs,
    '-filter_complex', baseFilter,
    '-map', '[v]',
    '-r', String(config.fps),
    '-pix_fmt', 'yuv420p',
    baseOutput,
  ]);

  const overlayInputs = overlayPaths.flatMap(overlayPath => ['-loop', '1', '-i', overlayPath]);
  const finalFilter = buildOverlayFilter(config.cues);

  await runFfmpeg([
    '-y',
    '-i', baseOutput,
    ...overlayInputs,
    '-filter_complex', finalFilter,
    '-map', `[v${config.cues.length}]`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    finalOutput,
  ]);

  await rm(baseOutput, { force: true });
  await Promise.all(cuePaths.map(cuePath => rm(cuePath, { force: true })));
  await Promise.all(overlayPaths.map(overlayPath => rm(overlayPath, { force: true })));
  return finalOutput;
}

const output = await renderShort(SHOT_KEY);
console.log(`Rendered ${output}`);
