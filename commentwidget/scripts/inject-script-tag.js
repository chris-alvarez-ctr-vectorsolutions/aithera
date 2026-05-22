#!/usr/bin/env node
// Inject <script src="/commentwidget/feedback-widget.js"></script> before </body>
// in every relevant HTML file in this repo.
//
// Usage (run from repo root):
//   node commentwidget/scripts/inject-script-tag.js            # apply
//   node commentwidget/scripts/inject-script-tag.js --dry-run  # report only
//
// Scope:
//   - /products/**/*.html
//   - /base-template/index.html
//   - /index.html (repo root)
// Skipped directories:
//   - .claude/  .sixth/  scripts/  commentwidget/  node_modules/  .git/
// Skipped files:
//   - any file that already contains the widget script tag
//   - any file with no </body> tag (reported)

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const TAG = '<script src="/commentwidget/feedback-widget.js"></script>';
const DRY_RUN = process.argv.includes('--dry-run');

const SKIP_DIRS = new Set(['.claude', '.sixth', 'scripts', 'commentwidget', 'node_modules', '.git']);

const updated = [];
const alreadyHadTag = [];
const noBodyTag = [];

function walk(dir, into) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), into);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      into.push(path.join(dir, entry.name));
    }
  }
}

const candidates = [];
for (const sub of ['products', 'base-template']) {
  const p = path.join(REPO_ROOT, sub);
  if (fs.existsSync(p)) walk(p, candidates);
}
const rootIndex = path.join(REPO_ROOT, 'index.html');
if (fs.existsSync(rootIndex)) candidates.push(rootIndex);

for (const file of candidates) {
  const original = fs.readFileSync(file, 'utf8');
  if (original.includes('/commentwidget/feedback-widget.js')) {
    alreadyHadTag.push(file);
    continue;
  }
  if (!original.includes('</body>')) {
    noBodyTag.push(file);
    continue;
  }
  const next = original.replace('</body>', `${TAG}\n</body>`);
  if (!DRY_RUN) fs.writeFileSync(file, next);
  updated.push(file);
}

const rel = f => path.relative(REPO_ROOT, f);

console.log(`Scanned: ${candidates.length} HTML files`);
console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${updated.length}`);
for (const f of updated) console.log(`  + ${rel(f)}`);
console.log(`Already had tag: ${alreadyHadTag.length}`);
for (const f of alreadyHadTag) console.log(`  = ${rel(f)}`);
console.log(`No </body> tag: ${noBodyTag.length}`);
for (const f of noBodyTag) console.log(`  ! ${rel(f)}`);
