# Build Brief: Outcome 4 Module in progressive_proto

Companion to `module-authoring-outcome-4.md`. That doc is the content spec. This one is the implementation contract.

**Read the content spec first.** Every string, rubric, and duration in the build comes from it. Do not paraphrase its copy.

**The subject of this build is the sharps module.** Bloodborne Pathogens, Outcome 4: handle and dispose of sharps safely. Any other scenario or module in the repo is prior work that may supply reusable components, nothing more. Do not carry its content, characters, or copy into this module.

## Kickoff

Paste this to open the session:

> Read `docs/authoring/outcome-4-build-brief.md` and `docs/authoring/module-authoring-outcome-4.md`. Do step 0 only: survey the repo and report what exists against the assumptions listed, including whether the scene/coach layout is generic over beats or coupled to the content it was first built for. Propose a plan for phases 1 and 2. Do not write implementation code yet.

## Step 0, before writing anything

Reconcile this brief against the repo. It was written without repo access, so the following are assumptions to verify, not facts:

- There is a two-mode scene/coach layout: scene as a persistent canvas, coaching freezing it with dim plus blur.
- There is a typed JSON message contract from the model, rendered by speaker and kind rather than inferred from text.
- There is a Cloudflare Worker proxy for LLM calls.
- Routing is React Router v6 and styling is Tailwind.

Report what actually exists before proposing a plan. Three specific things to answer:

1. **Is the scene/coach layout generic over beats, or coupled to the content it was first built for?** If beats, character, or copy are hardcoded in the component, say so plainly. Decoupling it is real work and may need its own session rather than being folded into phase 4.
2. **Is there an existing beat or character-card schema in the repo?** If yes, reuse it and note any fields this module needs that it lacks. Do not fork it and do not invent a parallel one.
3. **What does the Worker proxy currently expose?** This module needs four distinct prompt-template calls (see the AI layer section). Report whether that's a config change or new endpoints.

## The core decision: a module is data, not a route tree

The point of this work is that the next module should be authorable without writing components. So build one renderer over a typed module definition, not nine hand-built pages.

```ts
type Module = {
  id: string;
  outcome: string;
  targetBehavior: string;
  barrier: string;
  screens: Screen[];
};

type Screen =
  | { kind: 'frame';       id: string; media: MediaSpec; copy: string[] }
  | { kind: 'media';       id: string; media: MediaSpec; transcript: string[]; lo?: string; determinant?: Determinant }
  | { kind: 'stepStrip';   id: string; cards: { label: string; body: string; media: MediaSpec }[]; warning?: { title: string; body: string }; jobAid?: MediaSpec; lo: string; determinant: Determinant }
  | { kind: 'check';       id: string; items: Item[]; policy: 'gate' | 'remediate' | 'ask'; onFail: string; lo: string }
  | { kind: 'chain';       id: string; nodes: { time: string; body: string; media: MediaSpec }[]; closing: string[]; openResponse: { prompt: string; rubric: string }; lo: string; determinant: Determinant }
  | { kind: 'normReveal';  id: string; prompt: string; scale: { min: number; max: number; unit: string }; actual: number | null; fallbackCopy: string; revealCopy: string; lo: string; determinant: Determinant }
  | { kind: 'confidence';  id: string; stem: string; rehearsal: { title: string; body: string[]; threshold: number }; lo: string; determinant: Determinant }
  | { kind: 'scenario';    id: string; character: CharacterCard; beats: Beat[]; lo: string; determinant: Determinant }
  | { kind: 'debrief';     id: string; sections: ('strengths' | 'growth' | 'closing')[]; openPrompt: string };

type Determinant =
  | `KNOW.${'Observe'|'Remember'|'Understand'|'Analyze'|'Evaluate'}`
  | `FEEL.${'Believe'|'Value'|'Perceive'|'Align'|'Can'}`
  | `DO.${'Activate'|'Apply'|'Create'|'Sustain'}`;
```

Ship Outcome 4 as one `Module` object in `src/content/modules/bbp-outcome-4.ts`. If a second module can't be added by writing another file in that directory, the abstraction is wrong and should be fixed before moving on.

Two schema notes:

- `determinant` is a required field on every LO-bearing screen and typed as the union above. This makes an untagged or misspelled determinant a compile error, which is the tagging-discipline problem solved in the type system rather than in review.
- `Beat` and `CharacterCard` should reuse whatever beat and character schema already exists in the repo, per step 0. Don't fork it and don't define a parallel one. If none exists, define these two here and expect a later module to inherit them.

## Media placeholders

Every image and video is a placeholder, and the placeholder should be useful rather than gray.

```ts
type MediaSpec = {
  type: 'photo' | 'video' | 'motion' | 'document';
  aspect: '16:9' | '4:3' | '1:1' | 'full-bleed';
  durationSec?: number;
  direction: string;   // the visual direction text from the content spec, verbatim
};
```

Render as a bordered block at the correct aspect ratio containing: the type, the duration if any, and the full `direction` string as readable text. Not truncated, not in a tooltip.

The reason: reviewers walking the prototype should see the art direction sitting exactly where the asset will go. It turns the prototype into the review artifact for the media brief, not just the interaction.

For the screen 2 video, render the placeholder with the voiceover script below it, timed if that's cheap to do. The 60-second ceiling is a real constraint and reviewers should feel it.

## Screen behaviors that carry the pedagogy

These are the parts where a plausible-looking implementation would defeat the design. Get them exactly right.

**Test-out affects screen 3 only.** A pre-test pass sets `testedOut: true`, which skips the `stepStrip` screen. It must not skip the frame, the video, the chain, the norm reveal, the confidence rating, or the scenario. Encode this as a `skippableByTestOut: boolean` on the screen, default `false`, set `true` on exactly one screen in this module.

**The chain advances by learner tap, one node at a time.** Previous nodes stay visible and dimmed. No autoplay, no "play all." The learner performing the advance is the mechanism; an animation that runs on its own is a different and weaker screen.

**The norm reveal requires an estimate before it reveals.** Empty submit shows an inline error and does not advance. With `actual: null`, use `fallbackCopy` and label the source on screen. Never generate a number.

**The confidence rehearsal is threshold-gated.** Ratings at or below `threshold` reveal the if-then card. Above it, advance directly. Don't show the rehearsal to everyone.

**The scenario never has a skip, and beat 4 is optional but recorded.** Silence at beat 4 advances without penalty and is noted in the debrief. Don't block advancement waiting for input there.

## Scoring and the AI layer

Four distinct Worker-proxied calls, four prompt templates:

1. **Character turn.** Single-shot response per beat, constrained by the character card and that beat's objective. Not open chat.
2. **Coach feedback.** Generated against the beat's rubric. Returns a verdict plus the feedback text.
3. **Open-response scoring.** For the chain's open response, one criterion only: did the learner name a specific downstream person. Returns pass or fail plus a one-line reason.
4. **Debrief.** Strengths and growth areas from the accumulated transcript, guardrailed to two growth items maximum.

Store turn-level records, not just final scores. Per the measurement work, response depth is its own data class and it can't be recovered later from a rollup.

Rubric scores are provisional until human-calibrated. Surface them in a dev panel, not as a learner-facing score, until that calibration happens.

## Build order

Each phase should be independently reviewable. Don't proceed to the next until the current one runs.

1. Type definitions plus the Outcome 4 module object. No UI. Verify it typechecks and the content spec's copy is transcribed exactly.
2. Module renderer, navigation, and the `MediaPlaceholder` component. Every screen kind renders as a stub. Walkable end to end.
3. The non-AI screens fully built: frame, media, stepStrip, check with gating and remediation routing, chain, normReveal, confidence.
4. The scenario. Four beats, Worker-proxied character and coach calls. Reuse the scene/coach layout if step 0 found it generic over beats. If it's coupled to its original content, stop and flag it: decoupling is a separate piece of work, and a rushed fork of that component is worse than a delay.
5. Debrief plus the dev panel showing determinant scores, turn records, and which screens were skipped by test-out.

## Acceptance criteria

- A reviewer can walk all nine screens plus the pre-test on mobile and desktop.
- Adding a second module means adding one file under `src/content/modules/`.
- Every media placeholder shows its art direction.
- A determinant typo fails the build.
- Test-out skips exactly one screen.
- The dev panel shows, for one run: determinant scores, gate outcomes, turn-level transcript.
- No copy in the UI was rewritten from the content spec.

## What is deliberately out of scope

Real assets, cohort norm data, post and follow-up waves, rubric calibration, and any other module. This build exists to make one module's shape concrete enough to argue about.
