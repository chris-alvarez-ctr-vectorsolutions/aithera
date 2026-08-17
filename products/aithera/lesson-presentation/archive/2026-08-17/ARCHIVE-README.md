# Frozen snapshot — 2026-08-17

A **frozen, self-contained copy** of the Aithera lesson-presentation prototypes as
of 2026-08-17, captured immediately **before** the Scenario CML v4 alignment
retrofit — the change that makes v4 our authored source of truth instead of our
own native per-type shapes.

**Do not edit anything in this folder.** It is a reference / regression baseline.
When comparing a migrated live page against its original, open the original here.

- **Browse the snapshot index:** `archive/2026-08-17/index.html`
- **Intended git tag:** `archive/pre-v4-alignment-2026-08-17`
  (`git show archive/pre-v4-alignment-2026-08-17:products/aithera/lesson-presentation/<file>`)

## Why this one matters more than a normal rollback point

The v4 retrofit is not a refactor that preserves everything. Three things we built
have **no representation in Scenario CML v4 at all**, so after the cutover this
snapshot is the only place they still run:

- **The cold-open context modality** (`intro` — narrated audio / video scene
  setting, via `js/scene-context.js`). v4's landing is `narrative` text plus a
  `landing_cta_label`, and that is all.
- **Teach-back.** v4 has exactly three practice modes — coach-inquiry, roleplay,
  observe-react. Retrieval is not among them, and v4's only coverage-crediting
  mechanic is welded to `observe_react`'s required `exhibit`, so a topic-coverage
  interaction cannot be expressed.
- **Tier-routed branching** (`transitions[].onTier`) and the **safety flags**
  (`elevatedStakes` / `involvesMinors` / `threatContent`). v4 advancement is
  forward-only and server-owned; tier no longer routes.

## What is in here

Every runtime dependency of the pages: all root `*.html`, plus `js/ css/ assets/
docs/ experiments/ thumbnails/`.

**Excluded on purpose:**

- `worker/` — server-side Cloudflare Worker source. The live pages POST to the
  deployed worker URL, not to this folder.
- `../assets/videos/` (~100 MB) — **not duplicated.** Copying the video tree into
  every snapshot would add 100 MB per cut to the repo. The snapshot's video
  references therefore point **up and out** to the single shared tree at
  `products/aithera/assets/videos/`, which is intentional (see below).

## Paths: this snapshot does NOT have "relative paths only"

The 2026-08-04 README claimed zero `../` escapes. That claim is inaccurate — it
has 26 of them, and so does this cut, by necessity: the video tree is shared, not
copied. Being precise about it matters, because getting these depths wrong breaks
cold opens **silently** — the video 404s, and the player skips straight to coach
chat with no error in the console.

A snapshot sits **two levels deeper** than the live pages, so every escaping path
gained two `../` segments. There are two distinct kinds, and they land at
different depths:

| Reference | Live tree | In this snapshot | Points at |
|---|---|---|---|
| product videos/images | `../assets/…` | `../../../assets/…` | `products/aithera/assets/` |
| vendored Font Awesome | `../../../assets/…` | `../../../../../assets/…` | repo-root `assets/fontawesome/` |

Verified after the cut by resolving every reference against the filesystem the
way a browser would — noting that a relative path written inside a `.js` file
resolves against the **loading document**, not the script's own folder:

| Tree | Asset refs | Resolve OK | Broken |
|---|---|---|---|
| live product root | 24 | 19 | 5 |
| `archive/2026-08-04` | 26 | 21 | 5 |
| `archive/2026-08-17` | 24 | 19 | 5 |

The identical broken counts are **pre-existing in the live tree**, not introduced
by any cut:

- `../assets/videos/my-clip.mp4` and `…/clip.mp4` — placeholder examples in
  Studio helper text and lint messages ("e.g. `../assets/videos/my-clip.mp4`").
  They are documentation, never loaded.
- `../assets/videos/hazmat_scene_3.mp4` — **a real missing video**, referenced by
  `hazmat-scene-practice.html`. The shared tree has `hazmat_firstPerson.mp4` and
  `hazmat_tankerScene.mp4` but no `hazmat_scene_3.mp4`. This is the silent-skip
  failure mode described above, and it predates both snapshots.
