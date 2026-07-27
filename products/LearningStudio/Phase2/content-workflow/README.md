# Content Creation Workflow

A generalized, content-type-agnostic creation flow for Learning Studio Phase 2. Distinct from the course-specific `../chat-builder` — this one starts by asking *what kind of content* to make and supports AI, template upload, or a combination.

## Flow

```
index.html  ──►  builder.html?type=<t>&path=ai      (Course · Activity · Simulation)
(select type)     (guided conversation + live prompt)
       │
       └────────►  scenario-setup.html               (Scenario)
                    (project-creation page → detailed scene/step setup)
```

### 1. `index.html` — Entry point
Single-step selection on one page:
1. **Content type** — Course · Learning Activity · Simulation · Scenario

Picking a type reveals a simple "Ready when you are" banner with one continue action:
- **Course / Activity / Simulation** → `builder.html?type=<t>&path=ai`
- **Scenario** → `scenario-setup.html` (has its own project-creation step first)

### 1a. `scenario-setup.html` — Scenario project creation (Scenario only)
A project-creation page (same global header as `builder.html`) that captures: **project name**, an **interaction template** (Roleplay · Guided Arc · Observe/React · Teach-Back, or upload your own), optional **course context** (tie to an existing course for AI context), a **scenario premise**, and the **learner's role**. This is the on-ramp to the detailed scene/step setup.

### 2. `builder.html` — The guided builder (core screen)
Two panes:

- **Left — Chat.** A scripted, guided conversation that extracts one detail at a time. The AI *infers and confirms* (e.g. proposes an objective from the topic) rather than interrogating field-by-field. Answers come via quick-reply chips, free text, or an upload drop-zone.
- **Right — Live prompt (hybrid).** Structured fields (Topic, Audience, Objective, Tone, Length, Sources, Structure) fill in and animate as the conversation surfaces each detail. Below them, a compiled **natural-language prompt** regenerates in real time — this is the literal engine input. Fields can be locked. Required fields (`*`) gate the **Generate** button, which names what's still missing.

**Template-as-structure:** on the `template` / `combined` paths, the flow opens with an upload; the template's structure seeds the `Structure` field as the skeleton and the conversation fills the rest.

The workflow ends at **Generate** — everything downstream (scene generation, media, review) is out of scope, matching the plan/execute split in `../chat-builder-setup-and-planning-spec.md`.

## Sample scenario context

`SCENARIO-CONTEXT.md` is the **foundational reference for the sample scenario** ("The Marshall Situation") the team is using to walk through the detailed scenario setup & configuration steps. It documents the canonical narrative, cast, escalation timeline, the learner's bystander POV, themes, a consistency checklist, and the open items still to be decided. **When mocking scenes/steps for this scenario, treat that file as the source of truth** — and record new decisions back into it as they're made.

## Notes for developers / next steps
- The conversation is a **static script** (`SCRIPT` array in `builder.html`) standing in for a real LLM extraction loop. In production, each turn would be a model call that decides the next question and updates the structured state.
- The compiled prompt is assembled client-side from `STATE`. Placeholders render as `[bracketed]` grey text until filled.
- Uploads are simulated (no real file handling).
- Built with Vector Web Components + vanilla JS, no build step.
