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
    parse-course.js, build-course.js, new-course.js
    transcript-to-md.js   <- voiceover script -> course.md LO
    index.html, object-manager.html, demo.css
    assets/               <- assets the shared UI itself needs
  lockout-tagout/
    course.md             <- authored: the course
    assets/               <- authored: scene images (+ copied kit assets)
    transcripts/          <- authored: voiceover scripts (optional)
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

## Spinning off a new course

End-to-end, from nothing to a demo a rep can walk a customer through.

### 1. Scaffold

```bash
cd products/LearningStudio/sales-demos
node _kit/new-course.js forklift-safety      # lowercase-with-hyphens
```

You get a working demo immediately — starter `course.md`, `assets/`,
`transcripts/`, and a build. Open `forklift-safety/index.html` to confirm
before writing anything.

The starter includes one clickable LO, one stub, and one **hidden** LO
wired to the AI-generation flow, so every mechanic is visible from the
first run. Delete what the course doesn't need.

### 2. Write the course

Everything comes from `forklift-safety/course.md` — sections, learning
objects, durations, scenes. Format and every option: **`_kit/README.md`**.

Two rules that shape the whole demo:

- **Only build what the click path visits.** An LO with `#### scene`
  blocks is clickable; one without is a stub. Stubs stop a rep
  dead-ending on an unfinished screen mid-call.
- **Never hand-total a duration.** Author them on leaves only; sections
  and the course roll up automatically.

### 3. Add scene images

Drop them in `forklift-safety/assets/` and reference them by filename.
**Filenames must match exactly, extension included** — a mismatch shows the
empty media slot and prints a build warning rather than failing loudly.

### 4. Optional: seed an LO from a voiceover script

If you have narration text, keep it in `transcripts/` and generate the
`course.md` block from it, so scene text is authored once and never
retyped:

```bash
node _kit/transcript-to-md.js forklift-safety/transcripts/intro.md --hidden
```

Scene durations are estimated from word count when not authored. See
`_kit/README.md` → "Seeding an LO from a transcript".

### 5. Optional: wire the AI-generation demo

To let a rep simulate generating a lesson: author the LO in full, mark it
`hidden: true`, and place it **last in its section** so it reads as newly
created. Then Add Learning Object → AI Generation → Generate Transcript
reveals it and opens it.

The reveal targets the first hidden object in the clicked section, so
nothing is hard-coded. A section with no hidden LO closes the modal and
does nothing.

### 6. Rebuild and verify

```bash
node _kit/build-course.js forklift-safety
```

Run this after **every** `course.md` edit, and after any `_kit/` change
that should reach existing courses. The report is the first check — object
counts, totals, hidden objects, and missing images.

Then open `index.html` and click the actual path a rep will take.

### 7. Commit

Commit the whole course folder including the generated files — demos are
served straight from the repo, so what's committed is what a rep sees.

### Gotchas

- **Edit `course.md` or `_kit/`, never a course's generated files.**
  `index.html`, `object-manager.html`, `demo.css` and `course-data.js` are
  overwritten on the next build. This is the single easiest mistake to
  make — the edit works until it silently vanishes.
- **A `_kit/` change reaches other courses only when they're rebuilt.** Run
  `--all` after editing the shared UI.
- **`generate-img-sample.png` is kit-owned**, copied into every course's
  `assets/` on build. Don't author a scene image with that name.
- **Nothing persists.** State is in-memory, so a refresh resets the demo to
  its authored state. Fine for a scripted walkthrough; a rep can't reload
  after generating.

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
