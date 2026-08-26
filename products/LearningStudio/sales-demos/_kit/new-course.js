#!/usr/bin/env node
/* ============================================================
   SPIN OFF A NEW COURSE

     node _kit/new-course.js <course-folder>

   Creates the folder with a starter course.md and an empty assets/,
   then runs the build so it opens in a browser immediately. Edit the
   course.md and re-run build-course.js to iterate.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const KIT = __dirname;
const ROOT = path.dirname(KIT);

const folder = process.argv[2];

if (!folder) {
  console.error('usage: node _kit/new-course.js <course-folder>');
  console.error('example: node _kit/new-course.js forklift-safety');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(folder)) {
  console.error('folder name should be lowercase-with-hyphens, e.g. forklift-safety');
  process.exit(1);
}

const dir = path.join(ROOT, folder);
if (fs.existsSync(dir)) {
  console.error(`"${folder}" already exists — pick another name or edit its course.md`);
  process.exit(1);
}

const title = folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const starter = `# ${title}
sku: CHANGE-ME

<!--
  This file is the single source of truth for this demo.
  After editing:  node _kit/build-course.js ${folder}

  STRUCTURE
    ## Section title
    ### Learning object title
    #### scene <n> | <duration> | <image filename>
    <transcript text>

  CLICK PATHS
    An LO with "#### scene" blocks is CLICKABLE — it opens the object
    manager with those scenes. An LO without them is a stub: plain text
    in the course overview that cannot be opened. Build out only what
    the demo's click path actually visits; leave the rest as stubs so a
    rep can't wander into an unfinished screen on a live call.

  IMAGES
    Drop scene images in ${folder}/assets/ and reference them by
    filename. A missing file falls back to an empty media slot and the
    build prints a warning.

  DURATIONS
    An LO with scenes derives its duration from them. An LO without
    scenes needs its own "duration:" line. Section and course totals
    always compute upward — never hand-total anything.
-->

## First Section

### Section Title Card
state: not-started
duration: 0:08

### An Example Learning Object
objective: Describe what the learner will be able to do after this object
state: in-progress

#### scene 1 | 0:20 | example.jpg
Replace this with the first scene's narration. Each scene becomes one
card in the object manager's left panel.

#### scene 2 | 0:15 | example-2.jpg
A second scene. Add as many as the click path needs.

### A Stub Object
objective: This one has no scenes, so it is not clickable
state: not-started
duration: 1:00


## Second Section

### Section Title Card
state: not-started
duration: 0:08

### Another Stub
state: not-started
duration: 1:30
`;

fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(dir, 'course.md'), starter);

console.log(`\nCreated ${folder}/`);
console.log(`  course.md   — edit this`);
console.log(`  assets/     — drop scene images here\n`);

// Build immediately so the new folder opens in a browser right away.
execFileSync(process.execPath, [path.join(KIT, 'build-course.js'), folder], { stdio: 'inherit' });

console.log(`Next:`);
console.log(`  1. edit ${folder}/course.md`);
console.log(`  2. node _kit/build-course.js ${folder}`);
console.log(`  3. open ${folder}/index.html and verify before pushing\n`);
