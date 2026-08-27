#!/usr/bin/env node
/* =========================================================================
   build-updated-stamps.js — per-experiment "Last updated" dates

   The experiment index pages show an "Updated <date>" stamp on each card so
   designers can tell at a glance when a prototype last actually changed.
   GitHub Pages can't provide this (every deploy re-stamps every file with the
   same Last-Modified), so the truthful source is git history.

   For each directory in STAMP_DIRS, this script writes an `updated.json`:

     { "files": { "<file>.html": "<iso of last change>" } }

   Date per file = its last git commit date; for files that are uncommitted or
   locally modified (a work-in-progress mock), the file's mtime is used instead
   — so a local preview shows "Updated today" while you're editing.

   The output is DETERMINISTIC on purpose: given a clean checkout at a commit it
   is byte-identical every run. It deliberately carries NO run timestamp. The
   dashboards workflow commits this file back and retries its push with a
   rebase; a volatile `generated: <now>` field made two concurrent runs rewrite
   the same line to different times, so the loser's rebase hit a conflict and
   the job failed spuriously (and it churned a commit every single run). With no
   volatile field, an unchanged tree regenerates the same bytes → nothing to
   commit → no race. Don't reintroduce a timestamp here; nothing consumes it
   (the index page reads only `.files`).

   Usage:  node scripts/build-updated-stamps.js
   Runs in CI on every push (see .github/workflows/dashboards.yml) and can be
   run locally from anywhere in the repo.
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

// Experiment folders that get card stamps. Add a folder here to enroll it.
const STAMP_DIRS = ['products/aithera/lesson-presentation'];

function git(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

for (const relDir of STAMP_DIRS) {
  const absDir = path.join(REPO_ROOT, relDir);
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    console.warn(`skip (missing): ${relDir}`);
    continue;
  }

  const files = {};
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.html') || e.name === 'index.html') continue;
    const relFile = `${relDir}/${e.name}`;

    // Locally modified or never committed → the honest date is the file's mtime.
    const dirty = git(['status', '--porcelain', '--', relFile]) !== '';
    const committed = git(['log', '-1', '--format=%cI', '--', relFile]);

    const iso = (dirty || !committed)
      ? fs.statSync(path.join(absDir, e.name)).mtime.toISOString()
      : committed;
    files[e.name] = iso;
  }

  // No run timestamp — see the header note. Output must be deterministic so
  // concurrent CI runs regenerate identical bytes and never conflict on rebase.
  const out = { files };
  fs.writeFileSync(path.join(absDir, 'updated.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${relDir}/updated.json (${Object.keys(files).length} files)`);
}
