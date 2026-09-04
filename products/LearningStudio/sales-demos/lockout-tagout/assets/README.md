# Scene images

Referenced by filename from `../course.md`, e.g.

    #### scene 1 | 0:10 | section3-title-card-img.png

A missing file falls back to the empty media slot and the build prints a
warning, so a half-authored course still demos cleanly. Filenames must
match exactly — extension included.

## Current

| File | Used by |
|---|---|
| `section3-title-card-img.png` | Section 3 title card, scene 1 |
| `LockoutHardware-scene[1-5].png` | Lockout Hardware, scenes 1–5 |
| `NewLO-scene[1-18]-img.png` | Conveyor Belt LOTO Procedure, scenes 1–18 |
| `generate-img-sample.png` | Image-generation result in the object manager (not course content) |
| `generated-sample.jpg` | **Unused** — superseded by `generate-img-sample.png` |

Note the two similarly-named files: `generate-img-sample.png` is the live
one, wired to `GENERATED_IMAGE` in `_kit/object-manager.html`.
`generated-sample.jpg` is the earlier placeholder, now referenced by
nothing and safe to delete.

Run `node _kit/build-course.js lockout-tagout` after adding files; the
build lists anything still missing.
