#!/usr/bin/env node
/* ============================================================
   TRANSCRIPT → course.md LEARNING OBJECT

     node _kit/transcript-to-md.js <course>/transcripts/<file>.md
     node _kit/transcript-to-md.js <path> --duration 0:20
     node _kit/transcript-to-md.js <path> --hidden

   Prints a course.md `### Learning Object` block, with one
   `#### scene` per scene in the transcript doc. Copy the output into
   the course's course.md (or redirect it), then run build-course.js.

   The point is that scene text is authored ONCE, in the transcript
   doc, and copied mechanically from there — never retyped. A voiceover
   script is the natural unit writers hand over, so this keeps the
   demo's transcripts identical to the source without a manual step
   that could silently reword them.

   Transcript doc format:

     meta:
       title: <LO title>
       objective: <one line>

     ## scene 1
     image: some-image.png
     duration: 0:20        (optional — falls back to --duration)

     The scene's transcript text, verbatim. One paragraph or several;
     everything up to the next `## scene` heading is kept as-is.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));

function flag(name) {
  const i = args.indexOf('--' + name);
  return i === -1 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
}

if (!file) {
  console.error('usage: node _kit/transcript-to-md.js <transcript.md> [--duration 0:20] [--hidden]');
  console.error('example: node _kit/transcript-to-md.js lockout-tagout/transcripts/conveyor.md --hidden');
  process.exit(1);
}

const ROOT = path.dirname(__dirname);
const full = path.isAbsolute(file) ? file : path.join(ROOT, file);

if (!fs.existsSync(full)) {
  console.error(`no such transcript: ${file}`);
  process.exit(1);
}

const raw = fs.readFileSync(full, 'utf8');

// Strip HTML comments so authoring notes can contain example markup
// without being parsed as content (same rule as course.md).
const src = raw.replace(/<!--[\s\S]*?-->/g, '');

// ---- meta block ----
function readMeta(key) {
  const m = src.match(new RegExp('^\\s*' + key + ':\\s*(.+)$', 'm'));
  return m ? m[1].trim() : '';
}

const title     = readMeta('title');
const objective = readMeta('objective');

if (!title) {
  console.error('transcript has no `title:` in its meta block');
  process.exit(1);
}

// ---- scenes ----
// Split on the scene headings, keeping each scene's body verbatim.
const chunks = src.split(/^##\s+scene\s+\d+\s*$/m).slice(1);

if (!chunks.length) {
  console.error('transcript has no `## scene <n>` headings');
  process.exit(1);
}

/* ---- Duration from word count -------------------------------------
   A scene without its own `duration:` gets one estimated from its word
   count, so timings track the actual narration rather than a flat
   placeholder.

   IMPORTANT: there is no published standard for narration pace. No
   standards body (ATD, ISO, WCAG) specifies one. What exists is
   practitioner convention clustering at 120-150 wpm for instructional
   narration, and one genuinely verifiable industry figure: ACX (Audible)
   plans audiobooks at 9,300 words per finished hour = 155 wpm.

   We use 140 wpm: mid-range for e-learning, and deliberately below
   conversational pace because instructional content is denser and
   competes with on-screen visuals. Sources cluster here:
     · eLearningArt narration calculator ........ 150 wpm
     · Kim Handysides (e-learning VO) ........... 150 wpm (120 non-native)
     · B Online Learning ........................ 130-140 wpm
     · eLearning Industry ....................... 120-140 wpm
     · ACX / audiobook .......................... 155 wpm

   Plus a flat per-scene buffer for the lead-in, lead-out and transition
   — the part a words-per-minute rate cannot capture. Note the two
   padding mechanisms are NOT additive: 140 wpm already sits below
   natural speech to absorb intra-sentence pauses, so adding a further
   percentage on top would double-count.

   Honest error bar is roughly +/-15%. These are estimates, not
   measurements — a scene's own `duration:` always wins. If real timings
   exist, author them; one measurement from the actual narrator beats
   every convention above. */
const WORDS_PER_MINUTE = 140;
const SCENE_BUFFER_SECONDS = 2.5;

function estimateSeconds(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.round((words / WORDS_PER_MINUTE) * 60 + SCENE_BUFFER_SECONDS);
}

function fmtDur(secs) {
  return Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
}

// An explicit --duration overrides the estimate for every scene that
// doesn't carry its own.
const fixedDur = typeof flag('duration') === 'string' ? flag('duration') : null;

const scenes = chunks.map((chunk, i) => {
  // Per-scene keys sit at the top of the chunk; everything after them is
  // the transcript, preserved exactly (only outer blank lines trimmed).
  const image    = (chunk.match(/^\s*image:\s*(.+)$/m) || [])[1] || '';
  const authored = (chunk.match(/^\s*duration:\s*(.+)$/m) || [])[1];
  const text     = chunk
    .replace(/^\s*image:.*$/m, '')
    .replace(/^\s*duration:.*$/m, '')
    .trim();

  // An authored duration always wins; otherwise estimate from word count.
  const dur = authored ? authored.trim()
            : fixedDur ? fixedDur
            : fmtDur(estimateSeconds(text));

  if (!image) console.error(`  ! scene ${i + 1} has no image:`);
  return { n: i + 1, image: image.trim(), dur, text, estimated: !authored && !fixedDur };
});

// ---- emit ----
const out = [];
out.push(`### ${title}`);
if (objective) out.push(`objective: ${objective}`);
out.push('state: not-started');
if (flag('hidden')) out.push('hidden: true');
out.push('');

scenes.forEach(s => {
  out.push(`#### scene ${s.n} | ${s.dur} | ${s.image}`);
  out.push(s.text);
  out.push('');
});

process.stdout.write(out.join('\n'));

// Report to stderr so `> file` redirection stays clean.
const total = scenes.reduce((n, s) => {
  const [m, sec] = s.dur.split(':').map(Number);
  return n + (m * 60 + (sec || 0));
}, 0);
const estimated = scenes.filter(s => s.estimated).length;

console.error(`\n${scenes.length} scenes · ${fmtDur(total)} total`);
if (estimated) {
  console.error(`${estimated} duration${estimated === 1 ? '' : 's'} ESTIMATED at ` +
    `${WORDS_PER_MINUTE} wpm + ${SCENE_BUFFER_SECONDS}s/scene (~±15%).`);
  console.error('Author a `duration:` in the transcript to override.');
}
