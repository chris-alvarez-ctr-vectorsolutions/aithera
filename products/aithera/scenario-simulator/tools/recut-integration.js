#!/usr/bin/env node
/* =========================================================================
   RE-CUT THE FROZEN INTEGRATION BUILD

   `scenario-editor/integration/` is the self-contained copy Learning Studio
   iframes. It exists so iteration on `scenario-editor/` cannot reach the
   authoring flow the K&A team is working in — which means refreshing it must be
   a DELIBERATE act, never a side effect.

   This script is that act. It re-derives the cut from the live editor:

     1. reads every local src/href out of scenario-editor/index.html
     2. copies each of those files into the cut, preserving structure
     3. rewrites the page for the cut (see TRANSFORMS below)
     4. verifies nothing in the result reaches outside the folder

   Step 4 is the reason this is a script rather than a note. A cut that escapes
   its folder fails SILENTLY — a 404 script tag renders a page that merely does
   less — and that is exactly how the archive cuts in this repo lost their
   videos.

   USAGE
     node tools/recut-integration.js            # re-cut, then verify
     node tools/recut-integration.js --check    # verify only, change nothing

   After re-cutting: add a row to scenario-editor/RELEASE-NOTES.md saying what
   reached the integration and why.
   ====================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_PAGE = path.join(ROOT, 'scenario-editor/index.html');
const CUT = path.join(ROOT, 'scenario-editor/integration');
const CHECK_ONLY = process.argv.includes('--check');

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/* ---- what the live page loads locally ---------------------------------- */
function localAssets(html) {
  const refs = new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]));
  return [...refs]
    .filter((r) => !/^(https?:)?\/\//.test(r) && !r.startsWith('#'))
    .map((r) => r.split('?')[0])
    .filter((p) => p && p !== './' && p !== '../' && !p.endsWith('/'))
    .sort();
}

/* ---- TRANSFORMS — every difference between the cut and the live page ----
   Each one is asserted, so a change upstream that removes the thing being
   rewritten fails here loudly instead of producing a cut that quietly keeps
   the live behaviour. */
function transformPage(html) {
  const steps = [
    ['base points at the cut itself',
      '    <base href="../">', '    <base href="./">'],
    ['embedded by default, ?embed=0 opts out',
      `        var q = new URLSearchParams(location.search).get('embed');
        if (q === '1' || q === 'true') document.documentElement.classList.add('embed');`,
      `        /* Embedded is the DEFAULT here, inverted from the live editor: this build
           exists to be iframed by Learning Studio, which supplies Save, Publish and
           Preview. ?embed=0 restores the chrome for debugging the page on its own. */
        var q = new URLSearchParams(location.search).get('embed');
        if (q !== '0' && q !== 'false') document.documentElement.classList.add('embed');
        /* Its own draft keys, so iteration on the live editor can never reach the
           drafts K&A are authoring in here. Must be set before studio-engine.js. */
        window.STUDIO_CHANNEL = 'integration';`],
    ['title names the build',
      '    <title>Scenario Editor — Stable</title>',
      '    <title>Scenario Editor — Frozen integration build</title>'],
  ];

  for (const [label, from, to] of steps) {
    const n = html.split(from).length - 1;
    if (n !== 1) {
      console.error(red(`  ✗ transform "${label}" matched ${n} times, expected 1`));
      console.error(dim('    The live page changed shape. Fix this script before re-cutting.'));
      process.exit(1);
    }
    html = html.replace(from, to);
  }

  /* the channel router has no sandbox to route to inside a frozen cut */
  const rStart = html.indexOf('    <!-- CHANNEL ROUTER');
  const rEnd = html.indexOf('</script>', rStart);
  if (rStart === -1 || rEnd === -1) { console.error(red('  ✗ channel router block not found')); process.exit(1); }
  html = html.slice(0, rStart)
    + `    <!-- The channel router is deliberately absent: a frozen cut has no sandbox to
         hand off to, and ?v= must not bounce anyone out of the integration build. -->`
    + html.slice(rEnd + '</script>'.length);

  /* the build notice reads STUDIO_CHANNEL and would call this a "prototype
     build", painting an amber strip inside Learning Studio's iframe */
  const nStart = html.indexOf('  <!-- ===== BUILD NOTICE');
  const nEnd = html.indexOf('</script>', html.indexOf('<script>', nStart));
  if (nStart === -1 || nEnd === -1) { console.error(red('  ✗ build-notice block not found')); process.exit(1); }
  html = html.slice(0, nStart)
    + `  <!-- ===== BUILD IDENTITY ==============================================
       The live page derives this from window.STUDIO_CHANNEL, which here is
       'integration' — and that would have read as "prototype build" and painted
       an amber strip inside Learning Studio's iframe. This build states what it
       is instead, and never shows the notice.
       ==================================================================== -->
  <script>
    (function () {
      var tag = document.getElementById('buildTag');
      if (tag) {
        tag.textContent = 'Frozen';
        tag.title = 'A frozen copy for the Learning Studio integration. Not updated.';
      }
      var note = document.getElementById('buildNotice');
      if (note) note.hidden = true;
    })();
  </script>`
    + html.slice(nEnd + '</script>'.length);

  return html;
}

/* ---- does the cut reach outside itself? -------------------------------- */
function verify() {
  const page = path.join(CUT, 'index.html');
  if (!fs.existsSync(page)) { console.error(red('  ✗ no cut at ' + path.relative(ROOT, CUT))); return false; }
  const html = fs.readFileSync(page, 'utf8');
  const base = (html.match(/<base href="([^"]+)"/) || [, './'])[1];
  let bad = 0, checked = 0;
  for (const rel of localAssets(html)) {
    const resolved = path.normalize(path.join(CUT, base, rel));
    const escapes = !resolved.startsWith(CUT);
    const exists = fs.existsSync(resolved);
    checked++;
    if (!exists || escapes) {
      bad++;
      console.error(red(`  ✗ ${rel}`) + dim(escapes ? '  escapes the cut' : '  missing on disk'));
    }
  }
  if (bad === 0) console.log(green(`  ok    all ${checked} local references resolve inside the cut`));
  return bad === 0;
}

/* ---- run --------------------------------------------------------------- */
console.log('\nRe-cut the frozen integration build\n');

if (!CHECK_ONLY) {
  const html = fs.readFileSync(SRC_PAGE, 'utf8');
  const assets = localAssets(html);

  /* The README documents the cut and is NOT derived from the live page, so it
     has to survive the wipe. Losing it would mean every re-cut silently deleted
     the explanation of what the folder is. */
  const readmePath = path.join(CUT, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : null;

  fs.rmSync(CUT, { recursive: true, force: true });
  for (const rel of assets) {
    const from = path.join(ROOT, rel);
    if (!fs.existsSync(from)) { console.error(red('  ✗ live page references a missing file: ' + rel)); process.exit(1); }
    const to = path.join(CUT, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  fs.writeFileSync(path.join(CUT, 'index.html'), transformPage(html));
  if (readme !== null) fs.writeFileSync(readmePath, readme);
  console.log(`  copied ${assets.length} file(s) and rewrote the page`
    + (readme !== null ? ', README.md preserved' : ''));
} else {
  console.log(dim('  --check: verifying the existing cut, changing nothing'));
}

console.log('\nSelf-containment\n');
const ok = verify();

if (!fs.existsSync(path.join(CUT, 'README.md'))) {
  console.log(dim('\n  note: the cut has no README.md. This script preserves one across a'));
  console.log(dim('        re-cut but never authors it — write it by hand.'));
}

console.log(ok
  ? green('\nCut is self-contained. Add a RELEASE-NOTES.md row saying what reached the integration.\n')
  : red('\nCut is NOT self-contained — do not ship it.\n'));
process.exit(ok ? 0 : 1);
