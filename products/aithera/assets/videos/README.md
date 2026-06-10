# Scene videos

Drop one clip per scene here. The lesson scene-watch flow reads the path from
each scene's `video` field in `data/courses.json`.

Current expected files (AlcoholEdu HiEd · Lesson ch1 — "Reading the scene"):

| Scene | File |
|---|---|
| Scene 1 — The party        | `alcoholedu-hied-ch1-scene1.mp4` |
| Scene 2 — Sam's signs       | `alcoholedu-hied-ch1-scene2.mp4` |
| Scene 3 — Final actions     | `alcoholedu-hied-ch1-scene3.mp4` |

Naming convention: `<courseId>-<lessonId>-scene<N>.mp4`. An optional matching
poster image (`<courseId>-<lessonId>-scene<N>.jpg`) can be referenced via each
scene's `poster` field; until you add one, the flow falls back to the Unsplash
poster already authored in the data.

**Until real clips are present**, the scene player shows the poster and runs a
short simulated playback so the scrubber still fills and "Next Scene" still
unlocks — the prototype stays clickable. Once a real `.mp4` loads, the gate
switches to the actual video's `ended` event.

Use web-friendly H.264 MP4 (or add `<source>`-compatible formats). Keep clips
short (~10–60s) for snappy review.
