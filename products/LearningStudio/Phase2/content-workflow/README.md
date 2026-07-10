# Content Creation Workflow

A generalized, content-type-agnostic creation flow for Learning Studio Phase 2. Distinct from the course-specific `../chat-builder` — this one starts by asking *what kind of content* to make and supports AI, template upload, or a combination.

## Flow

```
index.html  ──►  builder.html?type=<t>&path=<p>
(select type)     (guided conversation + live prompt)
(select path)
```

### 1. `index.html` — Entry point
Two-step selection on one page:
1. **Content type** — Course · Learning Activity · Simulation · Scenario
2. **Creation path** — AI-guided · Start from template · Combined

Selecting a path navigates to the builder with `?type=&path=` query params.

### 2. `builder.html` — The guided builder (core screen)
Two panes:

- **Left — Chat.** A scripted, guided conversation that extracts one detail at a time. The AI *infers and confirms* (e.g. proposes an objective from the topic) rather than interrogating field-by-field. Answers come via quick-reply chips, free text, or an upload drop-zone.
- **Right — Live prompt (hybrid).** Structured fields (Topic, Audience, Objective, Tone, Length, Sources, Structure) fill in and animate as the conversation surfaces each detail. Below them, a compiled **natural-language prompt** regenerates in real time — this is the literal engine input. Fields can be locked. Required fields (`*`) gate the **Generate** button, which names what's still missing.

**Template-as-structure:** on the `template` / `combined` paths, the flow opens with an upload; the template's structure seeds the `Structure` field as the skeleton and the conversation fills the rest.

The workflow ends at **Generate** — everything downstream (scene generation, media, review) is out of scope, matching the plan/execute split in `../chat-builder-setup-and-planning-spec.md`.

## Notes for developers / next steps
- The conversation is a **static script** (`SCRIPT` array in `builder.html`) standing in for a real LLM extraction loop. In production, each turn would be a model call that decides the next question and updates the structured state.
- The compiled prompt is assembled client-side from `STATE`. Placeholders render as `[bracketed]` grey text until filled.
- Uploads are simulated (no real file handling).
- Built with Vector Web Components + vanilla JS, no build step.
