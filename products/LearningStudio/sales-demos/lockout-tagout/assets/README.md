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
| `generate-img-sample.jpeg` | Image-generation result in the object manager (not course content) — **owned by `_kit/assets/`**, recopied on every build |

`generate-img-sample.jpeg` is wired to `GENERATED_IMAGE` in
`_kit/object-manager.html`. It is a KIT asset, not course content: the
canonical copy lives in `_kit/assets/` and `build-course.js` recopies it
into every course's `assets/` on each build. To change it, replace the
file in `_kit/assets/` and rebuild — replacing only this copy gets
overwritten. Don't name a scene image that.

Run `node _kit/build-course.js lockout-tagout` after adding files; the
build lists anything still missing.
