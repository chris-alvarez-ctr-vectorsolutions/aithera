#!/usr/bin/env node
/*
  relink-comments.js — re-link feedback-widget comments after a mock is renamed/moved.

  WHY THIS EXISTS
  ---------------
  Comments are NOT stored in the HTML file. They live in the Cloudflare KV store
  behind the feedback widget, keyed by the page's canonical URL:

      pins:<encodeURIComponent(pageUrl)>          // the comment pins for a page
      settings:<encodeURIComponent(pageUrl)>       // per-page admin settings

  (See designtoolbox/worker/index.js and feedback-widget.js `canonicalPageUrl()`.)

  So the key is derived from the /products/... path. If you rename or move a mock
  folder — e.g. "versioning test"  ->  "versioning-test" — every page under it
  gets a NEW key, and the existing comments are orphaned under the OLD key. They
  are not lost, just unreachable, because the widget now looks up the new path.

  A space in a folder name is doubly nasty: the browser encodes it as %20 in the
  URL, so the old key contains "versioning%2520test" (the %20, itself encoded).
  Working in DECODED url-space (as this script does) hides that: you just pass the
  human folder names and the substring swap does the right thing.

  WHAT IT DOES
  ------------
  Finds every pins:/settings: key whose decoded page URL contains --from and
  copies it to the key for the same URL with --from replaced by --to. Originals
  are LEFT IN PLACE as a backup (delete them later by hand if you want). Dry-run
  by default; pass --apply to actually write.

  USAGE
  -----
    # from designtoolbox/worker (so wrangler picks up wrangler.toml), OR pass --namespace-id
    wrangler login                       # one-time; this script shells out to wrangler
    node ../scripts/relink-comments.js --from "versioning test" --to "versioning-test"
    node ../scripts/relink-comments.js --from "versioning test" --to "versioning-test" --apply

  --from / --to are matched against the folder path as it appears in the URL.
  Spaces are handled automatically (encoded to %20 to match the stored URL).
  You can pass either a bare folder name ("versioning test") or a longer path
  fragment ("Scheduling/versioning test") for a more precise match.

  FLAGS
    --from <s>          (required) path fragment to look for
    --to <s>            (required) replacement path fragment
    --apply             actually copy (default is a dry run that only prints)
    --namespace-id <id> KV namespace id (defaults to the one in wrangler.toml)
    --include-settings  also copy the per-page settings: key (default: on)
    --no-settings       skip settings: keys, copy only pins:
*/

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ----- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
function flag(name) { const i = argv.indexOf(name); return i !== -1; }
function opt(name, def) { const i = argv.indexOf(name); return i !== -1 ? argv[i + 1] : def; }

const FROM = opt('--from');
const TO = opt('--to');
const APPLY = flag('--apply');
const DO_SETTINGS = !flag('--no-settings');

if (!FROM || !TO) {
  console.error('ERROR: --from and --to are required.\n');
  console.error('  node relink-comments.js --from "versioning test" --to "versioning-test" [--apply]');
  process.exit(1);
}

// Namespace id: --namespace-id wins, else parse wrangler.toml next to the worker.
function nsFromToml() {
  const tomlPath = path.resolve(__dirname, '..', 'worker', 'wrangler.toml');
  try {
    const txt = fs.readFileSync(tomlPath, 'utf8');
    const m = txt.match(/id\s*=\s*"([0-9a-f]{32})"/i);
    return m ? m[1] : null;
  } catch { return null; }
}
const NS = opt('--namespace-id', nsFromToml());
if (!NS) { console.error('ERROR: no --namespace-id and none found in worker/wrangler.toml'); process.exit(1); }

// ----- match/rewrite in DECODED url-space -----------------------------------
// The browser encodes a space in the path as %20, so match the URL form.
const fromFrag = encodeURI(FROM); // "versioning test" -> "versioning%20test"; hyphen/slash pass through
const toFrag = encodeURI(TO);

const PINS = 'pins:';
const SETTINGS = 'settings:';
const prefixes = DO_SETTINGS ? [PINS, SETTINGS] : [PINS];

// ----- wrangler shell helpers -----------------------------------------------
function wrangler(args) {
  return execFileSync('npx', ['wrangler', ...args, '--namespace-id', NS, '--remote'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}
function kvList() {
  const out = wrangler(['kv', 'key', 'list']);
  return JSON.parse(out).map((k) => k.name);
}
function kvGet(key) { return wrangler(['kv', 'key', 'get', key]); }
function kvPut(key, value) {
  // Write via a temp file so huge/JSON values never hit shell/arg limits.
  const tmp = path.join(require('os').tmpdir(), 'relink-' + Buffer.from(key).toString('hex').slice(0, 24) + '.json');
  fs.writeFileSync(tmp, value);
  try { wrangler(['kv', 'key', 'put', key, '--path', tmp]); }
  finally { try { fs.unlinkSync(tmp); } catch {} }
}

// Given a key, decode its URL body, swap the fragment, re-encode. Returns the
// new key, or null if this key doesn't contain the fragment.
function rewriteKey(key) {
  const prefix = prefixes.find((p) => key.startsWith(p));
  if (!prefix) return null;
  const body = key.slice(prefix.length);
  let pageUrl;
  try { pageUrl = decodeURIComponent(body); } catch { return null; }
  if (!pageUrl.includes(fromFrag)) return null;
  const newUrl = pageUrl.split(fromFrag).join(toFrag);
  return { prefix, oldKey: key, oldUrl: pageUrl, newUrl, newKey: prefix + encodeURIComponent(newUrl) };
}

// ----- run ------------------------------------------------------------------
console.log(`Namespace: ${NS}`);
console.log(`Match:     "${fromFrag}"  ->  "${toFrag}"  (in decoded page URLs)`);
console.log(`Mode:      ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes — add --apply to copy)'}\n`);

let allKeys;
try { allKeys = kvList(); }
catch (e) {
  console.error('Failed to list KV keys. Are you logged in? Run `wrangler login` (or set CLOUDFLARE_API_TOKEN).\n');
  console.error(String(e.stderr || e.message || e));
  process.exit(1);
}

const matches = allKeys.map(rewriteKey).filter(Boolean);
if (!matches.length) {
  console.log('No keys matched — nothing to relink. (Check the --from fragment against the OLD path.)');
  process.exit(0);
}

let copied = 0, skipped = 0;
for (const m of matches) {
  console.log(`• ${m.oldUrl}`);
  console.log(`    -> ${m.newUrl}`);
  if (!APPLY) { console.log('    (dry run)\n'); continue; }
  const value = kvGet(m.oldKey);
  // Don't clobber an existing destination that already has content.
  let existing = null;
  try { existing = kvGet(m.newKey); } catch { existing = null; }
  if (existing && existing.trim() && existing.trim() !== '[]' && existing.trim() !== 'null') {
    console.log('    SKIPPED — destination already has data (not overwriting).\n');
    skipped++;
    continue;
  }
  kvPut(m.newKey, value);
  console.log('    copied ✓\n');
  copied++;
}

if (APPLY) {
  console.log(`Done. Copied ${copied}, skipped ${skipped}. Originals left in place as backup.`);
  console.log('Reload the renamed mock on GitHub Pages — the comments should reappear.');
} else {
  console.log(`Dry run complete — ${matches.length} key(s) would be copied. Re-run with --apply to do it.`);
}
