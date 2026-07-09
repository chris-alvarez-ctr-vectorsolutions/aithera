# Content Portal — Author Profile Data Model

**Product:** LearningStudio → Content Portal
**Last Updated:** 2026-07-07
**Purpose:** Resolve the field set for the expanded author profile + creation flow, and the dependencies attached to each field (standardization, PII/commercial sensitivity, derived vs. entered).

This extends the Author sections of [design-decisions.md](design-decisions.md). Nothing here overrides the identity separation established there (public attribution profile ≠ linked user account).

---

## Guiding split — every field does one of three jobs

Sorting the requested dataset by *job* resolves most "strings attached" questions, because the job determines standardization, sensitivity, and edit rights.

| Job | Definition | Audience | Fields |
|---|---|---|---|
| **A — Public attribution** | Surfaces to learners in the LMS | External (learners) | Name, Display Name, Bio, Headshot, Credentials, Profession/Subject Domain, Degrees/Education, Publications |
| **B — Vendor / business** | Internal ops + PII; never leaves the portal | Internal (admins) | Email, Phone, Address, Rate, Contracts, Resume, Status |
| **C — Derived / relational** | Not entered — computed from relationships | Internal | Courses/Projects contributed (backlink) |

**Decision (2026-07-07):** All jobs live on **one profile page** for now. Per-field permissions are planned but **out of scope for this prototype**. Job B fields are grouped into their own **"Vendor / Business"** section so a permission seam exists later without a retrofit. Job A stays in the existing "Public Profile" section.

---

## Field reference

Legend — **Structured** = controlled list / typed object (queryable, filterable); **Free** = free text; **Hybrid** = controlled + free-text fallback; **Derived** = read-only backlink.

| Field | Job | Model | Standardize? | Dependencies / notes |
|---|---|---|---|---|
| **Name** | A | Free | — | Exists. Author's professional name (public). |
| **Display Name** | A | Free | — | Exists. Optional; name shown to learners. |
| **Bio** | A | Free | — | Exists. |
| **Headshot** | A | File | — | Exists (change-photo dialog). Public, separate from user-account photo. |
| **Email** | B | Free (validated) | — | **Plain data point for now.** User-account linkage is out of scope, so email is just a contact field — no "linked account" card, no relationship pointer. **Future:** this field is the migration path to a real user-account linkage; keep it distinct so that swap is clean later. |
| **Phone** | B | Free (masked) | — | PII. Not public. |
| **Address** | B | Free (or structured if a downstream tax/payment system consumes it) | Only if consumed | PII. Structure (country/state/city/postal) **only** if 1099/payments needs it; otherwise free text. |
| **Profession / Subject Domain** | A | **Structured — controlled list, searchable multiselect** | **Yes** | Already exists as `subjectTaxonomy` in authors.html. Drives the Subjects filter + "content recommendations." **UI: `vaadin-multi-select-combo-box`** (type-ahead token input) — the list is too vast for inline chips. See "Picker pattern" below. |
| **Credentials / Certs / Licenses** | A | **Controlled list, searchable multiselect + custom values** | **Yes (visual)** | **How certs are actually tracked is TBD** (issuing body? verification? expiry?) — do NOT model that yet. **UI: `vaadin-multi-select-combo-box` with `allow-custom-value`** so unlisted creds can be typed inline (the long-tail escape hatch). Prototype shows the interaction shape, not the backend. |
| **Degrees / Education** | A | **Hybrid** — `{level, field, institution, year}` | Level only | Standardize **degree level** (BS/MS/PhD/MD…) as a list. Leave **institution + field of study free text** — standardizing school names is a rabbit hole with little payoff. |
| **Publications** | A | Structured list `{title, publisher, year, url}` | No | Open-ended list. Low value to standardize; typed for consistent display. |
| **Rate** | B | Structured `{amount, currency, unit}` | Enum for currency/unit | Commercial-sensitive. Unit = per-hour / per-project / per-word etc. — a bare number is ambiguous. |
| **Resume** | B | File attachment | — | Storage + versioning is a backend concern; UI is a file ref. |
| **Contracts** | B | File attachment **list** (+ optional `{start, end}`) | — | Legal. Multiple over time → a list, not one field. May inform Status ("Under Contract"). |
| **Status** | B | **Structured — enum (state machine)** | **Yes** | See state table below. Expanded well beyond today's active/archived. |
| **Courses / Projects contributed** | C | **Derived backlink (read-only)** | — | Already built as "Associated Content." Never an input — it's the reverse of content→author attribution. |

---

## Status — state machine

Today the mock has only **Active / Archived**. Expanded set (decided 2026-07-07):

| State | Attributed on existing content? | Taggable to NEW content? | Shown in in-editor picker? | Notes |
|---|---|---|---|---|
| **Active** | Yes | Yes | Yes | Default. |
| **Available / Under Contract** | Yes | Yes | Yes | Contract-state driven; implies contract data present. May be auto-derived from Contracts once that data drives it. |
| **Inactive / On Hold** | Yes | No | Flagged / de-emphasized | Temporarily unavailable (e.g. between contracts). |
| **Do Not Contact** | Yes (still credited) | No | Flagged | Stays attributed but flagged against outreach/engagement. **Distinct from Archived** — the author is not hidden, just gated. |
| **Archived** | Yes | No | Hidden | Existing behavior: content intact, can't be tagged to new content, restorable. |
| **Other** | — | — | — | Escape hatch requested; define specific meaning when a concrete case appears. |

**Rules to preserve:** Archived = the strongest "no new tagging + hidden" state. Do Not Contact and Inactive both block new tagging but keep the author visible (flagged) — they differ in *why*, which matters for admin triage/filtering.

---

## Creation flow — Quick add vs. Full profile (decided 2026-07-07)

The **Add Author** control is a **split button**, honoring the tiered-creation decision in [design-decisions.md](design-decisions.md) (Option C):

- **Quick add** (primary action) → the existing lightweight **drawer**: Name (required), Display Name, Bio, Photo. Creates a minimal shell; an admin completes the full profile later. This is what content designers use inline.
- **Full profile** (menu option under the caret) → a **dedicated creation screen** with all sections (Public Profile + Vendor/Business). For when the creator has everything up front. Stubbed to `author-profile.html?new=1` for now; a `?new` flag would drive an empty "create" state on that screen.

Rationale: keeps the drawer a true shell (no field creep) while making "full profile" a deliberate, separate choice rather than fields bolted onto the quick path.

---

## Picker pattern for large controlled lists (decided 2026-07-07)

Subject Domain and Credentials are **too vast for inline chip walls**. Chosen pattern: **token input with type-ahead** (`vaadin-multi-select-combo-box`) — type to filter, pick multiple, selections render as removable chips in the field.

- This is the dominant industry pattern for large tag/skill datasets (LinkedIn skills, GitHub topics, Jira labels, Stack Overflow tags). It scales because the full list is never rendered — search filters it.
- Credentials adds `allow-custom-value` for the long-tail escape hatch (type an unlisted cert + Enter).
- **When a modal would be better instead** (future case, not now): when selection requires *browsing a grouped hierarchy* the user can't name by typing. If Subjects grow into a deep category tree, revisit a search-modal. Flat known vocabularies (today's case) → token input.

---

## Reference-data administration (decided 2026-07-07)

The controlled lists themselves (subjects, credentials, and — separately — course tagging categories) need an **admin surface to maintain** them. **Decision: per-section management.**

- **Subjects, Credentials** → managed under **Authors** (they're author reference data).
- **Course tagging categories** → managed under **Content Library** (they describe content).

Trade-off accepted: the "manage a controlled list" UI pattern will repeat in more than one section. **Recommendation:** build it once as a reusable list-management pattern (add / rename / retire an entry, guard against deleting an in-use value) and drop it into each host section, rather than bespoke UI per list.

**Not yet built** — these admin screens are a separate effort. Flagged here as a resolved dependency so the controlled-list fields above have a known home.

---

## Open questions to confirm before build

1. **Address structure** — is any downstream system (payments/tax) consuming it? If not, free text.
2. **"Available / Under Contract"** — is this a status an admin sets manually, or one derived automatically from the Contracts data? (Affects whether it's an editable dropdown value or a computed badge.)
3. **"Other" status** — placeholder now; needs a concrete definition before it goes live.

### Deferred by decision (represent, don't model) — 2026-07-07

- **Credentials tracking** — how certs are actually tracked (issuing body, verification, expiry) is TBD. Prototype shows chips + free-text only; no schema commitment.
- **Contracts tracking** — how contracts are tracked is TBD; a visual representation (file + label) is enough for the prototype. Revisit if contract state should auto-drive Status.
- **User-account linkage** — out of scope. Email stands in as a plain contact field and is the future migration path to a linkage.

---

## Build status

**Built (author-profile.html):**
- **Public Profile**: Bio + Subject Domain and Credentials (both `vaadin-multi-select-combo-box`; credentials allows custom values), Degrees (repeatable rows, standardized level select + free-text rest), Publications (repeatable free-text rows). View mode renders subjects/credentials as chips, degrees/publications as entry lists.
- **Vendor / Business section**: Email, Phone, Address, structured Rate (amount + currency + unit selects), Resume + Contracts as file representations. Tagged "🔒 Internal" — the future permission seam.
- **Status**: full state-machine enum via a clickable header-badge dropdown; Archived stays a confirmed Actions-sidebar move.
- **Associated Content**: unchanged — already the correct derived-backlink model.

**Built (authors.html):**
- **Add Author** is now a split button: Quick add (drawer) + Full profile (menu → dedicated screen, stubbed to `author-profile.html?new=1`).

**Not yet built:**
- **Full-profile creation screen** — currently stubbed to the profile page; needs an empty "create" state driven by `?new`.
- **Authors-list Status filter** — still lists only Active/Archived; expand to the full enum.
- **Reference-data admin screens** — per-section management of subjects/credentials (under Authors) and tagging categories (under Content Library). Separate effort.
