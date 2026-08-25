#!/usr/bin/env node
/* =========================================================================
   SURFACE CHECK — do the pages still point at the files they claim to?

   Two failure classes, both silent, both found by hand more than once:

     A DEAD PATH.   A page loads a module that is not there. The browser reports
                    404 in a console nobody has open, the feature that module
                    provided just does not happen, and the page still renders.
                    This is what a folder move leaves behind: seven script tags
                    get repointed and the eighth does not.

     A SPLIT ?v=.   Two pages load the SAME file at different ?v=. The version
                    is a cache-buster, not a pin — the file on disk is the file
                    both pages run — so the page with the lower number is the
                    one whose visitors keep a stale copy. It reads as "the fix
                    didn't work" and it is nobody's fault twice: once for not
                    bumping, once for not knowing there was a second page.

   Neither is a judgement call, which is the point. Both were being caught by
   remembering to look, and remembering does not scale past two surfaces.

   WHAT COUNTS AS A SURFACE
   Every TRACKED .html under products/aithera, except anything beneath an
   archive/ directory. Two exclusions, two different reasons:

     archive/    A cut is a frozen snapshot carrying its own js/ copies and its
                 own old ?v= on purpose. Holding it to today's numbers would
                 make the check permanently red, and a permanently red check
                 gets switched off.
     untracked   The page list comes from `git ls-files`, not from walking the
                 disk, because a walk also finds build output somebody's machine
                 happens to have — products/aithera/editor/dist/ is gitignored
                 and was being scanned. What gets served is what is committed,
                 so that is what this judges, and the check reports the same
                 numbers locally as it does in CI.

   USAGE
     node tools/surface-check.js            # from products/aithera/scenario-simulator
     node tools/surface-check.js --quiet     # findings only, no per-page roll-up

   Exit code is 1 on any finding, so it can gate a change.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');          // products/aithera
const QUIET = process.argv.includes('--quiet');
const rel = (p) => path.relative(ROOT, p);

/* ---- the surfaces ------------------------------------------------------- */
const isArchived = (p) => p.split(path.sep).includes('archive');

/* Ask git, so an untracked build directory on one machine cannot change what the
   check reports. Falls back to walking the disk where git is not available — a
   check that refuses to run is worse than one that occasionally over-reaches, and
   the fallback still skips the two directories that produce noise. */
function pages() {
  try {
    const out = execFileSync('git', ['-C', ROOT, 'ls-files', '-z', '--', '*.html'], { encoding: 'utf8' });
    const list = out.split('\0').filter(Boolean).map((p) => path.join(ROOT, p));
    if (list.length) return list.filter((p) => !isArchived(p));
  } catch (e) { /* no git, or not a repo — walk instead */ }
  const walk = (dir, acc = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'archive') walk(full, acc); }
      else if (e.name.endsWith('.html')) acc.push(full);
    }
    return acc;
  };
  return walk(ROOT);
}
const PAGES = pages();

/* ---- what a page asks for ----------------------------------------------
   Only src=/href= that name a LOCAL file. A bare anchor, an absolute URL and a
   root-relative path are all somebody else's business: the first is in-page, the
   second is the CDN, and the third depends on where the site is mounted. */
const REF = /(?:src|href)="([^"]+)"/g;
const LOCAL_FILE = /\.(js|css|html|md|json|txt|pdf|png|jpe?g|svg|webp|mp4|webm|woff2?)$/i;

function refs(html) {
  const out = [];
  let m;
  // <base href> is where paths resolve FROM, not a link to anywhere — baseOf()
  // reads it, and leaving it in here would report the sandbox's own "../../" as
  // a dead directory.
  REF.lastIndex = 0;
  html = html.replace(/<base\b[^>]*>/gi, '');
  while ((m = REF.exec(html))) {
    const raw = m[1];
    const clean = raw.replace(/[?#].*$/, '');
    if (!clean || /^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;
    if (clean.startsWith('/')) continue;
    // A trailing slash is a real target too, and the one most likely to break:
    // the editor's own URL is a bare folder, and both retired writer-studio pages
    // redirect to it. It resolves to that folder's index.html, so check for that
    // rather than the directory — a folder that exists but serves nothing is the
    // same 404 to whoever clicked the link.
    const dir = clean.endsWith('/');
    if (!dir && !LOCAL_FILE.test(clean)) continue;
    const v = /[?&]v=([^&"]+)/.exec(raw);
    out.push({ raw, clean: dir ? clean + 'index.html' : clean, v: v ? v[1] : null });
  }
  return out;
}

/* A page carrying <base href> resolves everything against that, and both editor
   builds do — the sandbox's is two levels up. Reading the tag instead of assuming
   the page's own folder is the difference between this check being useful and it
   reporting sixty false breakages. */
function baseOf(html) {
  const m = /<base[^>]+href="([^"]+)"/i.exec(html);
  return m ? m[1] : '';
}

/* ---- collect ------------------------------------------------------------ */
const dead = [];                    // { page, ref }
const loaders = new Map();          // resolved file -> [{ page, v }]

for (const page of PAGES) {
  const html = fs.readFileSync(page, 'utf8');
  const root = path.resolve(path.dirname(page), baseOf(html));
  for (const r of refs(html)) {
    const target = path.resolve(root, r.clean);
    if (!fs.existsSync(target)) { dead.push({ page, ref: r.raw }); continue; }
    // Keyed by the resolved file, not the href, so two pages reaching one module
    // by different relative paths are still recognised as the same loader pair.
    if (!loaders.has(target)) loaders.set(target, []);
    loaders.get(target).push({ page, v: r.v });
  }
}

/* A file loaded by one page cannot disagree with anything, and a page that omits
   ?v= entirely is opting out of cache-busting rather than contradicting a number
   — flagging that would be a style opinion, and this check has none. */
const split = [];
for (const [file, uses] of loaders) {
  const versioned = uses.filter((u) => u.v !== null);
  const distinct = [...new Set(versioned.map((u) => u.v))];
  if (distinct.length > 1) split.push({ file, uses: versioned });
}

/* ---- report ------------------------------------------------------------- */
console.log('Surface check — ' + loaders.size + ' local file(s) referenced by '
  + PAGES.length + ' live page(s)\n');

console.log('Dead paths — does every referenced file exist?\n');
if (!dead.length) {
  console.log('  ok    every local src/href resolves on disk');
} else {
  for (const d of dead) console.log('  DEAD  ' + rel(d.page) + '\n          → ' + d.ref);
}

console.log('\nCache-bust agreement — does one file carry one ?v= everywhere?\n');
if (!split.length) {
  console.log('  ok    no file is loaded at two different versions');
} else {
  for (const s of split) {
    const newest = s.uses.map((u) => Number(u.v)).filter((n) => !Number.isNaN(n)).sort((a, b) => b - a)[0];
    console.log('  SPLIT ' + rel(s.file));
    for (const u of s.uses.sort((a, b) => Number(b.v) - Number(a.v))) {
      console.log('          ?v=' + u.v + (Number(u.v) === newest ? '  ' : ' ←stale') + '  ' + rel(u.page));
    }
    console.log('        fix: bump every loader to ?v=' + newest + ' — the file is shared, so the lower ones only serve a stale cache');
  }
}

if (!QUIET && !dead.length && !split.length) {
  console.log('\nBoth classes clear. A folder move or a module edit that forgets a surface');
  console.log('now fails here rather than reaching an author as a feature that does nothing.');
}

process.exit(dead.length + split.length ? 1 : 0);
