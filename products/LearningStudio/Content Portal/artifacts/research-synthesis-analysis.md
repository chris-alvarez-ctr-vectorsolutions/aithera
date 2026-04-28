# Research Synthesis Analysis
## Testing Prior Discovery Against Content Portal Design Decisions

**Analyzed by:** Austin Smith  
**Date:** 2026-04-27  
**Source documents:**
- `research_synthesis_v2.md` — 11-participant interview synthesis
- `research_personas_v2.md` — 5 behavioral personas
- `design-decisions.md` — Content Portal design decisions
- `site-map.md` — Content Portal site map

---

## Framing Note

The research was conducted on the **LMS admin / content consumer** side of the product — SCORM import, catalog browsing, reporting, group completion. The Content Portal is the **content creation and management** side. These are adjacent but distinct surfaces.

The research is still highly relevant because:
1. The content created and published in the Portal is what LMS admins and learners experience downstream
2. Several research insights directly describe what the Portal needs to produce or enable
3. The research personas partially map to our portal personas — with important gaps

This analysis identifies: what the research **confirms**, what it **adds or changes**, and what it **does not cover** in our current design decisions.

---

## Persona Mapping

### Research Personas → Portal Personas

| Research Persona | Portal Persona | Fit | Notes |
|---|---|---|---|
| A — Self-Sufficient Builder | P2 Content Designer | Strong | Solo practitioner building content; high overlap in goals and friction |
| B — Pipeline Manager | P1 Content Admin (partial) | Partial | Pipeline Manager owns LMS infrastructure; our Admin owns content creation infrastructure — adjacent but not identical |
| C — Craft-Focused Designer | P2 Content Designer | Strong | Professional instructional designer; higher standards version of P2 |
| D — Operational Trainer | Not represented | **Gap** | Fire/EMS crew-based training context; no equivalent in portal personas |
| E — Strategic Buyer | Not represented | **Gap** | Decision-maker / director; no equivalent in portal personas |

### Key Gap: No Strategic Buyer or Decision-Maker Persona in the Portal
The research's Persona E (Strategic Buyer) is the person authorizing the platform, evaluating alternatives, and setting quality standards. They are not in the portal daily but their requirements shape what the portal must produce. This persona may need to be added to the portal — or at minimum, their requirements should be factored into design decisions as a stakeholder even if they're not a primary user.

### Key Gap: Operational Trainer context is missing
Persona D's core need (group/crew-based training, microlearning formats that fit a lineup window) is not reflected anywhere in the portal design decisions. This doesn't mean the portal needs to solve it directly — but it signals that content designers (P2) will eventually be building for this use case, which has implications for content type design (short-form, projectable, group-friendly).

---

## What the Research Confirms

### ✓ Content Library ownership distinction (Vector-provided vs. customer-owned)
**Research signal:** Insight #1, #10; Personas B and E  
Customers are acutely aware of what is Vector content vs. their own. They filter mentally between "the catalog" and "our stuff" constantly. The pipeline manager specifically described the flat library as a major frustration — no way to distinguish custom from Vector content. Our decision to make ownership a first-class filter in the library is directly validated.

### ✓ "Start From" as a critical workflow
**Research signal:** Insight #1, #2; Persona E  
The entire custom-build-to-avoid-one-bad-slide pattern is what "Start From" is designed to solve. Strategic Buyers would immediately recognize this feature as the unlock — "if we could have just deleted that section." The naming and discoverability of this action is critical: Persona E's mental model defaults to "build custom" and may not naturally reach for "Start From" without clear signposting.  
**Design implication:** On Vector-provided content detail screens, "Start From" should be the most prominent action — not buried alongside read-only metadata. It's the value proposition of that screen.

### ✓ Catalog details as a distinct editable concern
**Research signal:** Insight #10; Persona B  
Customers want their content to look and feel like it comes from them — not for aesthetic reasons, but as a trust and endorsement signal to learners. The decision to treat catalog details (thumbnail, title, description) as a separately editable layer from content itself is confirmed. Learners experience the catalog metadata before they experience the content.

### ✓ Content lifecycle states need to be visible
**Research signal:** Insight #5; Persona B  
Version control confusion (new upload = new course object, orphaned completion records) is one of the top 3 universal pain points. While version control is an LMS-side problem, the Content Portal is where content gets created and updated — lifecycle state (draft, published, archived, sunset-pending) must be clearly surfaced in the library so admins can make informed decisions about updates without accidentally breaking downstream records.

### ✓ Content type filtering is essential at scale
**Research signal:** Pattern Summary (appeared 7–8 interviews); Persona B, D  
"Course catalog is too flat — no filtering by custom vs. Vector, topic, or difficulty" was one of the most broadly cited frustrations. Our decision to make content type, ownership, status, and category first-class filters is validated. Persona D specifically needs duration and CE category filtering — worth noting for the future content type expansion.

### ✓ Author management as a distinct concern
**Research signal:** Indirect — Insight #1, #2  
Research participants described Vector content failing SME review because of specific subject matter or regulatory references. The Content Portal's author management system (tracking who contributed expertise to what content) is directly relevant to this — it creates accountability and traceability for subject matter authority. Not directly surfaced in the research but structurally confirmed.

---

## What the Research Adds or Changes

### + Content type taxonomy needs "duration" as a first-class metadata field
**Research signal:** Persona D; Insight #9; Pattern Summary  
Multiple personas need to filter or select content by duration — Operational Trainers need content that fits a 20–30 minute lineup window; Pipeline Managers need to communicate expected time commitment; Strategic Buyers need to differentiate long-form compliance from short-form refresher. Duration is not currently mentioned as a metadata field in our design decisions.  
**Recommendation:** Add duration as a required metadata field on all content items, visible in the library list view and filterable.

### + The content detail screen needs a stronger "downstream impact" section
**Research signal:** Insight #5, #8; Persona B  
Pipeline Managers track which learners have completed which version of what course. When content is updated in the portal, it has downstream consequences for LMS assignments and completion records. The content detail screen should surface connected LMS data where available — number of active assignments, completion count, last published date — so admins understand the blast radius before making changes.  
**Recommendation:** Add a "Usage" or "Impact" section to the content detail screen showing downstream LMS connections. Treat this as a future phase item if LMS data isn't available at portal launch, but design the screen to accommodate it.

### + "Start From" needs explicit handling for content with narration/audio
**Research signal:** Activation Guide (subsection editing); Persona C  
The research activation guide specifically flags: "What happens to the audio track if they remove a slide with narration?" This is not addressed in our "Start From" flow decisions. When a customer duplicates a Vector course and modifies it, the narration/audio tied to removed or edited sections is an unresolved UX question.  
**Recommendation:** Add this as an open question in the design decisions doc. The "Start From" flow and content editor need a clear model for what happens to audio when content is modified.

### + The content library needs a "combine sections" capability on the roadmap
**Research signal:** Pattern Summary (appeared 5–6 interviews); Persona E  
"Combining sections from multiple Vector courses into a single assignment" is a moderately broad need. This is beyond "Start From" (which copies a single item) — it's a multi-source assembly workflow. Not in scope for v1 but should be acknowledged as a future capability.  
**Recommendation:** Add to the design decisions doc as a future capability to design around (don't close the door in v1 library architecture).

### + The AI guidelines in Settings need more specific scope definition
**Research signal:** Persona E; Insight #9  
Strategic Buyers are "efficiency tool, not quality tool" on AI — they'll use it to generate outlines and draft questions, won't trust it for compliance-specific or brand-sensitive content. This has direct implications for how the AI guidelines in Settings are designed. "Tone and guardrails" is currently vague — the research suggests customers will want granular controls: what AI can draft vs. what requires human authorship, compliance content exclusions, brand voice guidelines.  
**Recommendation:** Expand the Settings > AI Guidelines design to anticipate field-level controls, not just a single text block. The current v1 approach (single guideline text) is fine to ship but the Settings layout should accommodate a more structured form in the future.

### + WCAG / accessibility tooling is a hard requirement for regulated segments
**Research signal:** Persona C; Pattern Summary (appeared 3–4 interviews)  
Craft-Focused Designers in higher ed and government are under WCAG/AODA legal mandates. Accessibility compliance is not optional for these customers — it's a purchase criterion. This doesn't directly affect the portal UI today, but content created in the portal needs to be verifiably accessible. This is a future authoring workflow requirement.  
**Recommendation:** Note in design decisions that accessibility checking (WCAG compliance validation) is a future authoring requirement for the content editor — not the portal landing page, but the creation workflow it enables.

---

## What the Research Does Not Cover (Portal Gaps)

These are portal concerns that the research has no signal on — either because they weren't in scope for the research, or because the research focused on a different user surface.

| Portal Area | Research Coverage | Implication |
|---|---|---|
| Global Assets & Templates (all types) | None | No validation for this section from research — it's net new capability without user signal yet |
| Author management (SME profiles, bios) | None | Author management is entirely new; no research signal on how customers think about SME attribution |
| Themes and brand identity configuration | Indirect (Insight #10 touches on branding) | Research suggests branding = consistency, not aesthetics — validates theme approach but doesn't test it |
| Bulk operations in content library | Partial (Pipeline Manager needs) | Pipeline Managers would benefit but no specific scenarios were tested |
| Avatar and voice creation | None | Entirely new capability; no prior user signal |
| Settings beyond AI guidelines | None | Derived section — no research to test against yet |

---

## Priority Implications for Mockup Sequencing

Based on research signal strength, here is a suggested order for mocking:

1. **Content Library — list view with ownership filter** — most validated, highest universal demand, most personas affected
2. **Content Detail Screen — Vector-provided content with "Start From" prominent** — directly addresses the #1 research finding; discoverability of Start From is critical
3. **Content Detail Screen — customer-owned content** — edit, catalog details, lifecycle actions
4. **Authors — list view with completeness filter** — lower research signal but foundational to content quality
5. **Global Assets — Image Assets and Themes** — no research signal, but required for brand consistency (Insight #10 indirect validation)
6. **Settings — AI Guidelines** — small v1 surface; low risk

---

## Open Questions Surfaced by Research

These are new open questions the research raises for the portal that were not previously captured:

1. ~~**Audio/narration handling in "Start From"**~~ — handled by the content editor; not a portal-level concern
2. **Duration as required metadata** — ✓ Resolved: system-calculated with author-entered fallback; no system-enforced limits; visible in library, detail screen, and editor
3. ~~**LMS usage data on content detail screen**~~ — ✓ Resolved: future phase; portal serves multiple LMS products and cross-system data availability is TBD. Design detail screen with a placeholder "Usage" section that can be populated when integration is defined
4. ~~**Multi-source content assembly**~~ — ✓ Resolved: editor v2 capability; content blocks from multiple sources imported into a new container. Not a portal library architecture concern — the portal manages whatever content the editor produces. No v1 design changes needed
5. ~~**Should Persona E (Strategic Buyer / Director) be added as a portal persona?**~~ — ✓ Resolved: added as P5, future persona; dashboard/approval surface not in v1
