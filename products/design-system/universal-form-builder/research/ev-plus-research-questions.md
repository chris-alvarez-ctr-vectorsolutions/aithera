# Form Builder: EV+ research questions

**Status:** Draft v1 for review · **Date:** 2026-10-16 · **Audience:** Evaluations (EV+) product, engineering and UX; Form Builder discovery team

## Why this research

The Form Builder is the shared form-authoring experience that Check It builds first and Evaluations adopts next. Check It's authoring design (Checklist Management, CHECK-16683) has already been tested with several customers and was well received. EV+ authoring has not been in front of a user at all. The two EV+ product documents in [`../product-documentation/`](../product-documentation/) confirm what the TeachPoint form engine does; they say nothing about what district admins do with it.

This research answers one question: **does the authoring model validated in Check It transfer to EV+ authors, and what is EV+'s own?** It runs alongside the EV+ fill-in redesign (PI.26.4) and should land before Evaluations commits to adopting shared authoring in Q1 2027.

Every question below sits in one of three buckets:

| Bucket | Meaning |
|---|---|
| **A. Data only** | Engineering pulls it from the TeachPoint engine, the change log or support tickets. No user needed. |
| **B. User only** | Happens outside the product or lives in people's heads. Only interviews and observation can answer it. |
| **C. Pull, then validate (hybrid)** | Pull the number first, then put it in front of the user to learn *why*. Each interview opens with the participant's own data or their own form on screen. |

Bucket C is where most of the value is. A number tells us what happened; the user tells us what they assumed.

---

## A. Data only: engineering pulls

| # | Question | What to pull |
|---|---|---|
| A1 | How many forms exist, and how many are live | Rubric count per district by `state`: Draft, Published, Superseded, Publish-Restricted, Archived |
| A2 | How often forms change after publish | Superseded per district per year; time from publish to supersede; in-progress instances at the moment of supersede |
| A3 | Which question types and subtypes are used | Question count by `QTYPE` and by subtype, per district; share of questions left on the default subtype (Normal) |
| A4 | Which form settings are used | Share of forms with `rec_elapsed`, `observation`, `allow_private`, `pass_all_button`, `restrict_self_evaluation`; distribution of `sharing_behavior`, `signature_behavior`, `type`, `feature_type` |
| A5 | Scale preset adoption | Share of Rating Scale questions whose levels match a preset exactly vs. edited; distinct scales per district |
| A6 | Is a preset copied or linked | Schema check: does a question store a preset ID or its own level rows (code-dive item EV7) |
| A7 | Tags, Paragraph Bank, Computed, JAC, TS Tags usage | Districts and forms using each. Anything near zero shrinks the EV+ profile |
| A8 | Duplication | Forms with near-identical question sets within a district (the EV+ version of Check It's 2.74 copies per checklist) |
| A9 | Who authors | Distinct users who created or edited a rubric in the last 12 months, per district; district staff vs. Vector accounts |
| A10 | Copy Form usage | Change-log copy actions and what was copied (all data vs. author-only, signatures, attachments) |
| A11 | Where plans point | Do Plan Assignments reference a form ID, a version or a copy (code-dive item EV17) |
| A12 | Publish surprises | Support tickets mentioning locked settings, superseded forms or "required for completion" sharing confusion |

Send A1–A12 to the Evaluations technical reviewer together with the open code-dive items in [05](../05-code-dive-brief.md). The code-dive items (EV5–EV26) are engineering questions and stay off the discussion guide.

---

## B. User only: interviews and observation

| # | Question | Why data can't answer it |
|---|---|---|
| B1 | Where rubric content comes from and how it gets into the system | Happens outside the product: Word documents, state frameworks, PDFs re-keyed each year |
| B2 | How a mid-year change is handled today, and what breaks | The workaround is human: emails, a renamed form, teachers told to ignore the old one |
| B3 | Do blocks map to how admins think about rubric domains and Form Sections | A mental model; observed only by watching someone build with the re-skinned prototype |
| B4 | Does "Save becomes Publish" fit a district's calendar | Risk tolerance and rhythm, not behaviour the engine records |
| B5 | Does a live preview per respondent match how they reason about who answers | Observable only |
| B6 | Canvas + inspector vs. today's one-question-at-a-time modal | Side-by-side task on the prototype |
| B7 | Does anyone proof a form before publish; would an optional review step be used | No record of reviewing exists |
| B8 | Which Check It capabilities would they want (evidence required on a rubric item, fail rules that open a growth plan, locked district fields) | Hypotheticals need concrete examples and conversation |
| B9 | What implementers do for a new district | Internal interviews with EV+ implementation and support staff |

---

## C. Pull, then validate (hybrid)

| # | Question | The data (from A) | The user conversation it sets up |
|---|---|---|---|
| C1 | Who authors and how often | A9 | Is the one-admin pattern by choice or because the tool is hard? Ask occasional editors what they avoid |
| C2 | Reuse habits | A8, A10 | Show participants their own duplicates and ask why each exists. Tests whether linked blocks would have prevented them |
| C3 | Subtype understanding | A3, A12 | Walk through one of their forms and ask who they intended to answer each question |
| C4 | Scale behaviour | A5, A6 | Do they expect editing a preset to change forms already using it? Data shows what they did; the interview shows what they assumed |
| C5 | Settings that lock after publish | A2, A12 | Have they hit it, and what warning would have changed their action? Test the alternative EV+ is considering: published forms locked, and editable only with an audit trail. Decides whether the Form Builder locks individual settings at all ([08](../08-prototype-build-brief.md) P2) |
| C6 | Unused features | A7 | Unknown, unwanted, or broken? Three different design responses |
| C7 | Form sprawl | A1 | Which of their forms matter, and would they accept an archive sweep at migration |
| C8 | Mid-year propagation | A2 | Show a real case from their district and ask what they wanted to happen to in-progress instances. Decides EV+'s propagation policy |
| C9 | Who-answers variety | A3 (forms using more than one subtype) | Where it is common, preview per respondent is the test. Where it is rare, it may not matter |
| C10 | Templates | A8, A10; B1 | Do districts start from a shared standard (a state framework, a district master form), and would they want forms made from it to follow its updates? How do they see the relationship between a standard whole form and reusable domains (blocks)? Templates are parked until this is known (08 P2) |

---

## Participants

| Group | Count | Why |
|---|---|---|
| District admins who own the form library | 5–6 | Mix large districts with a dedicated admin and small ones where it is a side job |
| Evaluators or coaches who request forms from admins | 2–3 | Expose what admins get asked for and cannot do |
| EV+ implementation and support staff | 3 | Set up forms for new districts; see failure modes in tickets (B9) |

Recruit through the EV+ CSM team and the PI.26.4 fill-in redesign's customer contacts.

## Method

Each external session, about 75 minutes, remote:

1. **Contextual inquiry (45 min):** the participant builds or edits a real form in their own EV+ admin while thinking aloud. Covers B1, B2, B6, B7 and the C questions, each opened with their own number or form on screen.
2. **Prototype (30 min):** the validated Check It authoring prototype, re-skinned in EV+ vocabulary (form, section, rubric domain). Covers B3, B4, B5, B8.
3. **Artifact collection:** three real forms per participant, mapped afterwards to the mechanism catalogue in [03 §4](../03-synthesis-and-requirements.md). This grounds the legacy-mapping requirement (FB-M-08) in live content rather than screenshots.

Internal sessions with implementation and support staff are 45-minute interviews.

## Order of operations

1. **This week:** send A1–A12 and the code-dive items to the Evaluations technical reviewer. Start recruiting; it is the long pole.
2. **While pulls run:** re-skin the prototype; write the discussion guide so every C question starts from the participant's own data.
3. **Sessions:** November 2026.
4. **Readout:** early December, before the Q1 adoption decision. Findings feed back into the journey maps as a new **User-confirmed** confidence tag alongside code-confirmed, seen in product, seen in design and inferred.

## What this research does not cover

- Check It authoring usability, already validated with customers.
- Code-level behaviour (EV5–EV26 in [05](../05-code-dive-brief.md)), owned by engineering.
- EHS, which stays a design-for-three stress test until its own code dive.
