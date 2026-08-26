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
| `generated-sample.jpg` | AI-generation demo result (not course content) |

Run `node _kit/build-course.js lockout-tagout` after adding files; the
build lists anything still missing.
