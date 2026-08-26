# Sales Demos — session handoff

Written 2026-08-26. Start here if you're picking this up in a new session.

## What this is

Live demo builds for sales reps to walk customers through on a call. **Not
design mocks** — the repo's normal mock conventions deliberately don't apply.
See `README.md` for the full rules (no Design Toolbox, no version loader, not
in `products.json`, not a `ux-wrapup` target).

Two screens, both generated from one `course.md`:

- **Course Overview** (`index.html`) — sections, learning objects, durations
- **Object Manager** (`object-manager.html`) — scenes, transcripts, media,
  on-screen-text templates

## Architecture — read this before editing anything

**Course folders are generated, not hand-built.**

```
_kit/                     ← source of truth
  parse-course.js         course.md → COURSE object
  build-course.js         writes course-data.js + copies kit files
  new-course.js           scaffolds a new course folder
  index.html              ← EDIT HERE, not in the course folder
  object-manager.html     ← EDIT HERE
  demo.css                ← EDIT HERE
lockout-tagout/
  course.md               ← the only authored file
  assets/                 ← scene images
  course-data.js          generated — DO NOT hand-edit
  index.html              copied from _kit/ — DO NOT hand-edit
  object-manager.html     copied from _kit/ — DO NOT hand-edit
  demo.css                copied from _kit/ — DO NOT hand-edit
```

**The trap:** editing `lockout-tagout/object-manager.html` appears to work
until the next build silently overwrites it. Always edit `_kit/`, then run
the build. Full workflow in `_kit/README.md`.

    node _kit/build-course.js lockout-tagout    # after editing course.md or _kit/
    node _kit/build-course.js --all             # every course
    node _kit/new-course.js <name>              # spin off a new course

## Where the LOTO course stands

Built from screenshots the user supplied. **5 sections, 11 objects, 21m 47s.**

| # | Section | Duration | Detail level |
|---|---|---|---|
| 1 | Introduction | 1:00 | placeholder LO only |
| 2 | Hazardous Energy | 10:00 | placeholder LO only |
| 3 | Lockout/Tagout Program Requirements | 6:47 | **title card + 6 LOs captured** |
| 4 | Lockout/Tagout Case Study | 3:00 | placeholder LO only |
| 5 | Conclusion | 1:00 | placeholder LO only |

Section 3 is the only one with real LO data. Its title card has one scene
(0:10, `section3-title-card-img.png`, no transcript) and is currently the
**only clickable object in the course**.

### Still needed

- **SKU** — currently `CHANGE-ME`
- **Course title** — currently just "Lockout/Tagout"; confirm the real one
- **LO lists** for sections 1, 2, 4, 5 (each has one placeholder LO carrying
  the section's stated duration)
- **Scene detail** — transcripts + images for whichever LOs the click path
  visits. Only section 3's title card has scenes so far.

### Decisions already made — don't re-litigate

- **Objectives are AI-generated**, not from the real course. The user asked
  for this explicitly to populate the screens. They're plausible LOTO
  objectives written from the LO titles; **someone should confirm the framing
  before customer use**. Same caveat as any placeholder content.
- **Section 3's 0:06 object was dropped.** The source list had two objects
  both titled "Lockout/Tagout Program Requirements" (0:10 and 0:06). The user
  decided the 0:10 is the section title card and the 0:06 shouldn't exist.
  "Authorized Employee Roles and Responsibilities" is now lesson #1.
- **Section durations are rounded in the source.** Section 3's header said
  "6 minutes"; its objects sum to 6:47. The computed value wins — never
  hand-total.
- **Stubs are intentionally non-clickable.** An LO with `#### scene` blocks is
  clickable; one without is plain text. This keeps click paths from
  dead-ending mid-demo. Build out only what the path actually visits.

## Conventions that aren't obvious from the code

- **Title cards** carry an image but **no transcript**, and no objective.
  An object whose name matches its section needs an explicit `type: title-card`
  — name-based detection won't catch it.
- **Durations** are authored only on leaves. An LO with scenes derives its
  duration from them; one without needs its own `duration:`.
- **Scene 1 is always active** when the object manager opens, for every LO.
- **Filenames must match exactly**, extension included. A mismatch shows the
  empty media slot and prints a build warning.
- **`<!-- HTML comments -->` are stripped before parsing**, so `course.md` can
  carry notes containing example `###` markup without creating phantom
  sections. (This was a real bug; don't remove the stripping.)

## Design-system notes carried from this session

- **Cape Cod is not in the theme.** The template fill options use
  `--cape-cod: #3a4550` as a **flagged placeholder**. The themes CONTEXT.md
  publishes Conifer, Puerto Rico, Picton Blue, Vivid Violet, Ecstacy and
  Cinnabar — no Cape Cod. Ask the user for the real hex; it's a one-line
  change in `_kit/object-manager.html`, then re-check contrast.
- Chrome (toolbar, tab pill, type scale, weights) was aligned across both
  screens against the themes CONTEXT.md. Both toolbars are 53px; all
  emphasis is semibold 600; blues are science blue `#0271ce`.

## Known-inert controls

Present so click paths read correctly, but deliberately do nothing:

- **Generate Changes** in the Preview-and-Enhance step (user said no change
  workflow needed)
- **Bulk audio actions** (the soundwave icon) — icon and tooltip only
- Course Details / Assessment tabs — hold selection briefly, fall back to
  Content

There is **no "Animate Image"** action; it was explicitly excluded as an
internal-only feature.

## Verification habits that caught real bugs

The user asked to **stop routine screenshotting** — they visually test and
report back. Verify non-visually instead:

    node --check <file>                      # JS syntax
    node _kit/build-course.js <course>       # data integrity + missing images

Also worth checking: undefined CSS vars, Font Awesome classes resolving
(a missing icon renders as an invisible zero-width glyph, no error), and
duration roll-ups.

**macOS/Chrome gotchas** if you do need a screenshot: `timeout` isn't
installed; `--user-data-dir` conflicts with the user's running Chrome and
hangs; repeated same-URL runs serve a cached stylesheet, so cache-bust with
`?v=` when testing CSS.

## Immediate next step

**Nothing here is committed** — the whole `sales-demos/` tree is untracked.
Commit before doing anything else, or a mistake has no recovery point.
