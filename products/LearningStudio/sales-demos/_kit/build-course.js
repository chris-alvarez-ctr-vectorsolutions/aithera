#!/usr/bin/env node
/* ============================================================
   BUILD A COURSE

     node _kit/build-course.js <course-folder>
     node _kit/build-course.js --all

   Reads <course-folder>/course.md, writes <course-folder>/course-data.js,
   and copies the shared kit files (index.html, object-manager.html,
   demo.css) into the course folder.

   Run this after editing a course.md, or after changing anything in
   _kit/ that should reach existing courses. Verify in the browser before
   pushing — this is an authoring step, not a runtime one.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseCourse } = require('./parse-course.js');

const KIT = __dirname;
const ROOT = path.dirname(KIT);
const KIT_FILES = ['index.html', 'object-manager.html', 'demo.css'];

function fmtMSS(t) {
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

function buildCourse(folder) {
  const dir = path.join(ROOT, folder);
  const mdPath = path.join(dir, 'course.md');

  if (!fs.existsSync(mdPath)) {
    console.error(`  ✗ ${folder}: no course.md`);
    return false;
  }

  const { course, warnings } = parseCourse(fs.readFileSync(mdPath, 'utf8'));

  // --- report ---
  const objects = course.sections.flatMap(s => s.objects);
  const clickable = objects.filter(o => o.opensManager);
  const totalSecs = objects.reduce((n, o) => n + (o.disabled ? 0 : o.dur), 0);

  console.log(`  ${folder}`);
  console.log(`    "${course.title}"  sku: ${course.sku}`);
  console.log(`    ${course.sections.length} sections · ${objects.length} objects · ` +
              `${clickable.length} clickable · ${fmtMSS(totalSecs)} total`);

  // Flag scene images that aren't in assets/ — the page degrades to its
  // empty-media state, but the author probably meant to add the file.
  const missing = [];
  objects.forEach(o => o.scenes.forEach(sc => {
    if (sc.image && !fs.existsSync(path.join(dir, 'assets', sc.image))) {
      missing.push(`${o.name} → ${sc.image}`);
    }
  }));

  warnings.forEach(w => console.log(`    ! ${w}`));
  missing.forEach(m => console.log(`    ! missing image: ${m}`));

  // --- write course-data.js ---
  const banner =
`/* ============================================================
   GENERATED FILE — DO NOT EDIT BY HAND

   Built from course.md by _kit/build-course.js.
   Any edit here is lost on the next build; change course.md instead.

     node _kit/build-course.js ${folder}
   ============================================================ */

`;

  const body =
`const COURSE = ${JSON.stringify(course, null, 2)};

/* ---- Derived values -------------------------------------------------
   Durations always roll up from leaves, so nothing is hand-totalled and
   the numbers can't drift from the content. A disabled title card is
   excluded: it won't play, so it contributes no time. */

function fmtMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function fmtCourse(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + 'm ' + s + 's';
}

function sectionSeconds(section) {
  return section.objects.reduce((sum, o) => sum + (o.disabled ? 0 : o.dur), 0);
}

function courseSeconds(course) {
  return course.sections.reduce((sum, s) => sum + sectionSeconds(s), 0);
}

function courseProgress(course) {
  let done = 0, total = 0;
  course.sections.forEach(s => s.objects.forEach(o => {
    total++;
    if (o.state === 'complete') done++;
  }));
  return { done, total };
}

function findObject(course, objectId) {
  for (const section of course.sections) {
    const obj = section.objects.find(o => o.id === objectId);
    if (obj) return { section, obj };
  }
  return null;
}
`;

  fs.writeFileSync(path.join(dir, 'course-data.js'), banner + body);

  // --- copy the shared kit ---
  KIT_FILES.forEach(f => {
    const src = path.join(KIT, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, f));
  });

  if (!fs.existsSync(path.join(dir, 'assets'))) {
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  }

  console.log(`    ✓ course-data.js + ${KIT_FILES.length} kit files\n`);
  return true;
}

// ---- CLI ----
const arg = process.argv[2];

if (!arg) {
  console.error('usage: node _kit/build-course.js <course-folder> | --all');
  process.exit(1);
}

const targets = arg === '--all'
  ? fs.readdirSync(ROOT).filter(f =>
      !f.startsWith('_') &&
      fs.statSync(path.join(ROOT, f)).isDirectory() &&
      fs.existsSync(path.join(ROOT, f, 'course.md')))
  : [arg];

if (!targets.length) {
  console.error('no courses found');
  process.exit(1);
}

console.log('\nBuilding:\n');
const ok = targets.map(buildCourse).every(Boolean);
process.exit(ok ? 0 : 1);
