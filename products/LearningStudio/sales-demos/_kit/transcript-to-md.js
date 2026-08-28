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

const fallbackDur = typeof flag('duration') === 'string' ? flag('duration') : '0:20';

const scenes = chunks.map((chunk, i) => {
  // Per-scene keys sit at the top of the chunk; everything after them is
  // the transcript, preserved exactly (only outer blank lines trimmed).
  const image = (chunk.match(/^\s*image:\s*(.+)$/m) || [])[1] || '';
  const dur   = (chunk.match(/^\s*duration:\s*(.+)$/m) || [])[1] || fallbackDur;
  const text  = chunk
    .replace(/^\s*image:.*$/m, '')
    .replace(/^\s*duration:.*$/m, '')
    .trim();

  if (!image) console.error(`  ! scene ${i + 1} has no image:`);
  return { n: i + 1, image: image.trim(), dur: dur.trim(), text };
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
console.error(`\n${scenes.length} scenes · ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} total`);
