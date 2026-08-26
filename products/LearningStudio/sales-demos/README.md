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

| Course | Folder | Click path |
|---|---|---|
| Lockout/Tagout (LOTO) | `lockout-tagout/` | My Learning → Course detail → Lesson → Knowledge check → Completion |
