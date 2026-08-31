# Learning Studio — Sales Demos

Live demo builds for sales reps to walk customers through on a call. **These are
not design mocks** and the repo's normal mock conventions deliberately do not
apply here.

**Been handed a demo script and need a new link?** Go straight to
[Guide: building a new demo](#guide-building-a-new-demo). You don't need to
read the rest first.

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

## Guide: building a new demo

**For designers.** You've been handed a demo script or a scenario — "show
a manufacturing customer how a safety course gets built" — and you need a
link a rep can open on a call. This is the whole process.

You do not need to know JavaScript. You'll write one text file and run two
commands. Everything else is generated.

**One prerequisite:** the commands need [Node.js](https://nodejs.org)
installed. Check by running `node --version` in a terminal — any version
number means you're set. If it says "command not found", install the LTS
build from nodejs.org first; nothing else here works without it.

> **This is a build-time process, not something a rep ever sees.** Nobody
> demos "creating a course." You author a course that *looks* finished, and
> the rep walks a customer through the parts you decided to build.

### Before you start: read the script and answer three questions

Everything downstream follows from these. Answer them first — reworking
later means rewriting content.

**1. What does the rep actually click?**

This is the single most important decision. You build **only** that path.
Every other lesson stays plain text that goes nowhere. That's deliberate:
if everything were clickable, a rep who wandered off-script would land on
an empty screen in front of a customer.

Write the path down before you build. For example:

> Course overview → open *Lockout Hardware* → view its scenes → back →
> generate a new lesson in section 3

**2. What is the course, on paper?**

Sections and lesson titles, in order, with a duration for each. It should
read like a real course a customer might buy — a page of two lessons looks
like a prototype, not a product. Placeholder titles are fine; thin
structure isn't.

**3. Which feature is this demo showing off?**

New demos usually exist to showcase something. Today two behaviours are
available beyond browsing:

- **Opening a lesson** and stepping through its scenes, transcript and
  media.
- **Simulating AI generating a new lesson** — the rep types a prompt,
  optionally uploads a document, watches a progress state, and lands in a
  finished lesson that appears in the course.

If your script needs a behaviour that doesn't exist yet, that's a build
change, not a content change — talk to whoever owns the kit before
promising it.

### Step 1 — Create the course folder

In a terminal:

```bash
cd products/LearningStudio/sales-demos
node _kit/new-course.js forklift-safety
```

Use `lowercase-with-hyphens`; that name becomes the URL.

This creates a **working demo straight away**, with example content in
place. Open `forklift-safety/index.html` in a browser and click around —
that's your starting point, and it already shows every mechanic you can
use: a clickable lesson, a plain-text one, and a hidden one wired to the
generation flow.

### Step 2 — Write the course content

Open `forklift-safety/course.md`. This is **the only file you write.** It's
plain text, and the starter file explains the format inline. Full
reference: **`_kit/README.md`**.

The shape:

```markdown
## Section Title

### A Lesson The Rep Opens
objective: What the learner can do afterwards

#### scene 1 | 0:20 | some-image.png
What the narrator says over this scene.

#### scene 2 | 0:15 | another-image.png
The next scene's narration.

### A Lesson That's Just Listed
objective: No scenes, so this one isn't clickable
duration: 1:30
```

The rule that matters: **a lesson with `#### scene` blocks is clickable; a
lesson without them is not.** That's how you control the click path from
step 1 — build scenes only for the lessons the rep opens, and let
everything else fill out the course.

Don't add up durations yourself. Write them on individual lessons and
scenes; section and course totals are calculated for you.

### Step 3 — Add your images

Drop scene images into `forklift-safety/assets/`, then reference them by
filename in `course.md`.

**Filenames must match exactly, including the extension.** A typo doesn't
throw an error — it shows an empty media box and prints a warning in the
build output, which is easy to miss.

### Step 4 — If your demo includes AI generation

Skip this if your script doesn't need it.

To let the rep simulate generating a lesson:

1. Author the lesson **completely** — scenes, narration, images.
2. Add `hidden: true` under its title.
3. Put it **last in its section**, so it looks newly created when it
   appears.

That's all. On the call: Add Learning Object → AI Generation → type
anything → Generate Transcript → a progress state → the lesson opens, and
it's now in the course.

The flow finds the first hidden lesson in whichever section the rep clicked
from. Nothing is hard-coded, so you control it entirely from `course.md`.
A section with no hidden lesson just closes the dialog.

**Long narration?** If you were given a voiceover script, keep it in
`transcripts/` and convert it instead of retyping — it also estimates scene
durations from word count:

```bash
node _kit/transcript-to-md.js forklift-safety/transcripts/intro.md --hidden
```

Paste the output into `course.md`. See `_kit/README.md` → "Seeding an LO
from a transcript". `lockout-tagout/transcripts/` has a worked example.

### Step 5 — Rebuild after every change

```bash
node _kit/build-course.js forklift-safety
```

**Editing `course.md` changes nothing until you run this.** The output is
your first check — lesson counts, durations, and any missing images.

### Step 6 — Click the demo before you share it

Open `forklift-safety/index.html` and walk the exact path from question 1,
the way a rep would. Confirm:

- Every lesson the script opens actually opens
- Images appear (no empty media boxes)
- Durations look sensible
- If you wired generation: it runs and the new lesson appears last

### Step 7 — Commit and share

Commit the **whole course folder**, generated files included — demos are
served straight from the repo, so what you commit is what the rep sees.
Once pushed to `main`, the link is live:

```
https://vectorlearning.github.io/ux-mockups/products/LearningStudio/sales-demos/forklift-safety/index.html
```

Give GitHub Pages a minute, then open that URL yourself before sending it
on.

### Things that will trip you up

- **Never edit `index.html`, `object-manager.html`, `demo.css` or
  `course-data.js` inside a course folder.** They're regenerated from
  `_kit/` on every build, so your change works right up until it silently
  disappears. Edit `course.md` for one course, or `_kit/` for all of them.
- **Changing the shared UI in `_kit/` doesn't reach existing courses until
  you rebuild them.** Run `node _kit/build-course.js --all`.
- **`generate-img-sample.png` is owned by the kit** and copied into every
  course. Don't name one of your scene images that.
- **Nothing is saved.** Refreshing resets the demo to its authored state —
  fine for a scripted walkthrough, but a rep can't reload after generating
  a lesson and still see it.
- **Every lesson looks clickable, but only the ones you built respond.**
  Clicking a plain lesson does nothing at all — no error, no feedback. Tell
  the rep which lessons are live.

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
