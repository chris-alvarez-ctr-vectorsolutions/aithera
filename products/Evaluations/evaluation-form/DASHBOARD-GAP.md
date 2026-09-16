# Dashboard tooling gap — a card can only surface ONE dev build

**Raised**: 2026-09-16
**Raised from**: `products/Evaluations/evaluation-form` (Evaluation Form)
**For**: whoever owns the dashboard tooling (`scripts/build-dashboards.js` +
`designtoolbox/dashboard.js`)
**Severity**: low — a workaround exists (direct URLs); nothing is broken or
mis-rendering.

---

## The situation that surfaced it

The Evaluation Form now has **two** dev builds at its feature root, and both
need to reach developers:

| File | Source | Covers |
|---|---|---|
| `dev_handoff.html` | `ver1/index.html` | Original desktop design |
| `dev_handoff_a11y.html` | `ver2/index.html` | 400% zoom / small-viewport accessibility pass |

They are companions, not replacements — V1 carries the full feature set, V2
carries the responsive behaviour. A developer needs both.

**The dashboard card links only `dev_handoff.html`.** The a11y build is
currently reachable only by direct URL, which we've documented in
`mock-definition-a11y.md`.

---

## What's actually going on in the code

Three findings, and the third is the interesting one.

### 1. Detection is hardcoded to one filename

`scripts/build-dashboards.js` → `detectDevHandoff()`:

```js
const candidate = 'dev_handoff.html';
return fs.existsSync(path.join(dir, candidate)) ? true : null;
```

It looks for exactly that name and returns a **boolean**. A second dev build
under any other name is invisible to it.

### 2. The documented `devHandoff` override isn't wired up

`designtoolbox/README.md` (~line 272) and the `ux-wrapup` skill both say:

> Point the dashboard at a non-default name with `devHandoff: "<file>.html"` in
> that mock's `meta.json`.

The **dashboard honours this** — `designtoolbox/dashboard.js:550`:

```js
const devFile = (typeof m.devHandoff === 'string' && m.devHandoff.trim())
  ? m.devHandoff.trim() : 'dev_handoff.html';
```

But `build-dashboards.js` regenerates every `meta.json` entry from scratch on
push and sets `entry.devHandoff = true`, clobbering any string. So a hand-set
`devHandoff: "dev_handoff_alpha.html"` survives until the next push, then
reverts. **The documented multi-version workflow (`dev_handoff_alpha.html` /
`dev_handoff_beta.html`) does not currently work end-to-end.**

### 3. `extraLinks` is rendered but never populated — a one-line gap

`dashboard.js` already fully supports an `extraLinks` array on a card
(lines 579–586 build the URLs, line 1648 renders them as their own
click-to-copy / Open rows):

```js
extraLinks: Array.isArray(m.extraLinks) ? m.extraLinks.map(l => ({
  label: l.label || l.file,
  pagesUrl: `${PAGES_BASE}/${base}/${fileEnc}`,
  blobUrl:  `${REPO_BASE}/${base}/${fileEnc}`,
})) : [],
```

**But nothing ever puts `extraLinks` into `meta.json`.** `build-dashboards.js`
copies `title`, `description`, `folder`, `ticket`, `prd`, `status`,
`designerNote` and `modified` from `products.json` — `extraLinks` is not in that
list, so a curated entry is dropped on every rebuild.

The rendering half is done. Only the plumbing is missing.

---

## Suggested fix (smallest first)

**Option A — carry `extraLinks` through (one line).** In
`build-dashboards.js`, beside the other curated passthroughs:

```js
if (Array.isArray(it.extraLinks)) entry.extraLinks = it.extraLinks;
```

Then a second build is curated in `products.json`:

```json
{ "name": "Evaluation Form", "rel": "evaluation-form",
  "extraLinks": [
    { "label": "Dev Build — 400% a11y", "file": "dev_handoff_a11y.html" }
  ]
}
```

Additive, no migration, no behaviour change for existing cards, and it makes an
already-built dashboard feature reachable. This also gives every mock a way to
surface supplementary files (a spec PDF, a second variant) without new concepts.

**Option B — make `devHandoff` respect an existing string.** In
`detectDevHandoff()`, return the *filename* rather than `true`, and don't
overwrite a string already present in `meta.json`. This makes the documented
multi-version workflow actually work, but it's a slightly larger change to a
field other cards depend on.

**Option C — support a list of dev builds.** Properly models "this feature has
a desktop build and an accessibility build," with the card showing both as
primary actions. Biggest change; only worth it if multi-build handoffs become
common rather than a one-off.

Our suggestion is **A**, with **B** as a follow-up if the documented
alpha/beta workflow is meant to be real. We deliberately did **not** implement
any of these — the dashboard tooling is owned elsewhere, and this note exists so
that owner can decide.

---

## Until then

The a11y build is reachable directly, and both URLs are documented at the top of
`mock-definition-a11y.md`:

- **Dev Page** —
  `https://vectorlearning.github.io/ux-mockups/products/Evaluations/evaluation-form/dev_handoff_a11y.html`
- **Dev HTML** —
  `https://github.com/vectorlearning/ux-mockups/blob/main/products/Evaluations/evaluation-form/dev_handoff_a11y.html`

No dashboard changes were made for this handoff.
