# Aithera — Adaptive Learning Prototype

Mobile-first PWA prototype demonstrating an **adaptive learning layer** focused on mastery, practice, and a bounded AI coach. No backend; all behavior is JSON-driven.

## What this is meant to prove
- **Why it isn't a course.** Practice and scenarios are first-class — not bolted on after a video.
- **How practice drives mastery.** Concept mastery moves with practice outcomes; module credit follows mastery, not minutes.
- **Why AI here is trusted.** Coach Vic only answers from the loaded course content, cites sources, escalates high-risk inputs, and refuses to guess.
- **How it scales across industries.** A single industry JSON re-skins theme, language, and content emphasis. Two are wired up: Public Safety and Healthcare.

## Run locally
Just serve the folder statically:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

The service worker registers on first load, caching the shell + JSON for offline.

## Deploy
Push to `main` — `.github/workflows/pages.yml` deploys to GitHub Pages (already enabled on the repo with "GitHub Actions" as the source).

## File structure

```
index.html                    SPA shell (hash router; works under /aithera/ subpath)
manifest.webmanifest          PWA install manifest
service-worker.js             Cache-first offline shell
css/styles.css                Mobile-first styles, theme via CSS vars
js/
  app.js                      Hash router + chrome wiring
  store.js                    State, JSON loading, theme application, persistence
  adaptive.js                 Visible adaptive rules (alerts, suggestions, next-step)
  coach.js                    Coach Vic stub: bounded, cited, escalating
  views/
    launch.js                 Profile selector
    home.js                   Adaptive feed
    course.js                 Course detail w/ mastery breakdown
    chapter.js                Mixed-media learning flow + AI utility rail
    practice.js               Scenario engine (timeline, mixed inputs, rubric)
    summary.js                Post-scenario summary + auto-credited modules
    hub.js                    Practice hub w/ Mastery exploration mode
    coach.js                  Coach Vic chat
    profile.js                Profile transparency page
data/
  learners/                   2 sample learner profiles
  industries/                 2 industry profiles (theme + language)
  courses.json                2 industry-aligned courses w/ chapters + concepts
  scenarios.json              2 multi-step scenarios w/ branching outcomes
  mastery.json                Per-learner concept mastery state
.github/workflows/pages.yml   Auto-deploy
```

## Extending
- **New industry** → add `data/industries/<id>.json` + at least one learner in `data/learners/`, then add an entry to the launch screen's `INDUSTRIES` array.
- **New course** → append to `data/courses.json`. Match `industry` field. Concepts get auto-tracked once a scenario references them.
- **New scenario** → append to `data/scenarios.json` with `courseId` and `concepts` so the adaptive engine can rank it.
- **Coach knowledge** → add an entry to `INTENTS` in `js/coach.js`. Each entry is intentionally narrow so Vic stays bounded.

## Non-goals
No auth, no real model calls, no SCORM, no LMS, no backend. The point is the experience model.
