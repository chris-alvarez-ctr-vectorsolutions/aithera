# Sales Demo Kit

Every course demo is generated from a single `course.md`. There is **one**
object manager shared by every learning object — no per-LO HTML files.

## Spin off a new course

```bash
cd products/LearningStudio/sales-demos
node _kit/new-course.js forklift-safety
```

Creates `forklift-safety/` with a starter `course.md`, an empty `assets/`,
and a working build. Then:

1. Edit `forklift-safety/course.md`
2. Drop scene images in `forklift-safety/assets/`
3. `node _kit/build-course.js forklift-safety`
4. Open `forklift-safety/index.html` and verify
5. Commit

## Update an existing course

```bash
node _kit/build-course.js lockout-tagout   # one course
node _kit/build-course.js --all            # every course
```

Run this after editing a `course.md`, **or** after changing anything in
`_kit/` that should reach existing courses.

## course.md format

```markdown
# Course Title
sku: ABC-123

## Section Title

### Learning Object Title
objective: What the learner can do afterwards
state: complete | in-progress | not-started
duration: 1:32

#### scene 1 | 0:20 | image.jpg
The transcript for this scene. Can run to
multiple lines.

#### scene 2 | 0:14 | other.jpg
The next scene's transcript.
```

### SKUs are always fake

Demos are shown to customers, so a course must **never** display a real
catalog SKU. `new-course.js` scaffolds a valid fake one derived from the
folder name (`forklift-safety` → `DEMO-FORKSAFE-101`). It reads like a real
catalog code on a call, but the `DEMO-` prefix makes it unmistakably not one.
Change it if you want a different code — just keep the replacement fake.

### Click paths — the important rule

- An LO **with** `#### scene` blocks is **clickable**: it opens the object
  manager with those scenes.
- An LO **without** them is a **stub**: plain text in the course overview
  that cannot be opened.

Build out only what the demo's click path actually visits. Everything else
stays a stub so a rep can't wander into an unfinished screen on a live call.

### Hidden objects — for a reveal moment

`hidden: true` on an LO keeps it out of the course overview **and** out of
the duration totals, while still building it fully — scenes, transcript,
images and all.

```markdown
### The Newly Generated Lesson
objective: …
hidden: true
```

It exists for demo moments that reveal a lesson, such as simulating AI
generating one. Author it completely, then reveal it at demo time by
clearing the flag and re-rendering:

```javascript
COURSE.sections.forEach(s => s.objects.forEach(o => { o.hidden = false; }));
renderSections(); renderCourseMeta();
```

The list and the totals update together, so the numbers never disagree with
what's on screen. `build-course.js` prints any hidden object so it doesn't
look like an LO went missing.

### Durations

Authored only on leaves. An LO with scenes derives its duration from them;
an LO without scenes needs its own `duration:`. Section and course totals
always compute upward — never hand-total anything.

### Images

Referenced by filename, resolved against that course's `assets/`. A missing
file falls back to the empty media slot and the build prints a warning, so a
half-authored course still demos cleanly.

### Notes in the file

`<!-- HTML comments -->` are stripped before parsing, so author notes can
contain example `###` / `####` markup without creating phantom sections.

## What's generated vs. authored

| File | |
|---|---|
| `course.md` | **authored** — the only file you edit |
| `assets/` | **authored** — drop images here |
| `course-data.js` | generated — do not hand-edit |
| `index.html` | copied from `_kit/` |
| `object-manager.html` | copied from `_kit/` |
| `demo.css` | copied from `_kit/` |

Editing a generated file works until the next build, then it's lost. Change
`_kit/` (for all courses) or `course.md` (for one) instead.

## How the two screens connect

`index.html` links each clickable LO to
`object-manager.html?object=<id>`. The object manager reads that id, looks
it up in `course-data.js`, and renders that LO's scenes. Ids are stable and
readable — `s03-o02` is section 3, object 2 — so URLs can be shared.
