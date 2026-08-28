# Learning Studio — Sales Demos

Live demo builds for sales reps to walk customers through on a call. **These are
not design mocks** and the repo's normal mock conventions deliberately do not
apply here.

## Rules for this folder

- **No Design Toolbox.** No `designtoolbox/toolbox.js` include, no comment pins,
  no flow map, no version-switcher pill. Nothing on screen may read as internal
  tooling — a customer is looking at it.
- **No version loader.** Each course is a single `index.html`. There is no
  `versions.json` and no `verN/` folder.
- **Not in `products.json`.** These are intentionally left out of the catalog, so
  they don't appear on the Learning Studio dashboard or the landing page. Reps get
  a direct link.
- **Not a handoff target.** Do not run `ux-wrapup` or `audit-mock-vwc` against
  anything in here. There's no PRD to reconcile and no dev handoff — this is
  demo-ware, not a spec.
- **Hardcoded results, predetermined path.** Every interaction resolves to a fixed
  outcome. A mis-click on a live call should never derail the demo or surface an
  error state.
- **Recreate the reference screens directly.** Build what the provided screens
  show. Don't add UI widgets, affordances, or "helpful" extras that aren't in the
  reference.

## Structure

```
sales-demos/
  README.md
  _kit/                   <- shared source of truth (see _kit/README.md)
    course.md parser + build scripts
    index.html, object-manager.html, demo.css
  lockout-tagout/
    course.md             <- the only file you author
    assets/               <- scene images
    course-data.js        <- generated
    index.html            <- copied from _kit/
    object-manager.html   <- copied from _kit/
    demo.css              <- copied from _kit/
  <course-2>/
```

**Courses are generated, not hand-built.** Each one comes from a single
`course.md`; one shared `object-manager.html` serves every learning object
via `?object=<id>`. There are no per-LO HTML files.

    node _kit/new-course.js <name>          # spin off a new course
    node _kit/build-course.js <name>        # rebuild after editing course.md
    node _kit/build-course.js --all         # rebuild every course

Full format and workflow: **`_kit/README.md`**.

**Do not hand-edit** `course-data.js` or the copied HTML/CSS in a course
folder — the next build overwrites them. Edit `course.md` for one course,
or `_kit/` for all of them.

## Path depth

A demo lives at `products/LearningStudio/sales-demos/<course>/index.html` — four
levels below the repo root, the same depth as a normal `verN/` mock. So the
repo-root asset paths are unchanged:

```html
<link rel="stylesheet" href="../../../../assets/fontawesome/css/all.min.css" />
```

## Current demos

| Course | Folder |
|---|---|
| Lockout Tagout for Authorized Employees | `lockout-tagout/` |

### LOTO — what a rep can actually do

Built from Studio screenshots: 5 sections, 22 objects. Only what the demo's
click path visits is built out; everything else is a stub by design, so the
path can't dead-end mid-call.

- **Lockout Hardware** (section 3) — the click path. Five scenes with real
  transcript and images.
- **Section 3's title card** — one scene, no transcript.
- **Add Learning Object → AI Generation** — reveals an LO authored with
  `hidden: true` and lands in its object manager. See "Hidden objects" in
  `_kit/README.md`.

Every LO is *styled* as a link so the overview reads like a finished
product, but only the objects above do anything. A rep clicking elsewhere
gets silence, not an error — worth knowing before going off-script.

### Decisions worth not re-litigating

- **Objectives are AI-generated** from the LO titles, not from the real
  course. Plausible, but confirm the framing before customer use.
- **SKUs are always fake.** `DEMO-LOTO-101` here. Never show a real catalog
  SKU in a demo; keep any replacement fake.
- **Durations are transcribed from rounded screenshot values**, so computed
  totals are approximations built from rounded parts and won't match
  Studio's exact figures. Never hand-total — the computed value wins.
- **Section 3's 0:06 object was dropped**; the 0:10 is the section title
  card. "Authorized Employee Roles and Responsibilities" is lesson #1.
- **Some controls are deliberately inert**: Generate Changes in the
  Preview-and-Enhance step, bulk audio actions, and the Course Details /
  Assessment tabs. There is no "Animate Image" — excluded as internal-only.

### Open question: the Cape Cod colour

`_kit/object-manager.html` defines `--cape-cod: #3a4550` as a **flagged
placeholder**. The themes CONTEXT.md publishes Conifer, Puerto Rico, Picton
Blue, Vivid Violet, Ecstacy and Cinnabar — no Cape Cod. It's used by the
template fill options. Swap in the real brand hex once confirmed, then
re-check contrast.

(The canvas letterbox uses a separate `--canvas-fill`, so changing Cape Cod
won't repaint the canvas.)

### Verifying changes

The build is the first check — it reports object counts, totals, missing
images and any hidden objects:

    node _kit/build-course.js lockout-tagout

Prefer non-visual verification (`node --check`, the build report, measuring
the rendered DOM) over screenshots. Watch for undefined CSS vars and Font
Awesome classes that don't resolve — a missing icon renders as an invisible
zero-width glyph with no error.
