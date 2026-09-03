# Self-Serve Bulk User Import — Dev Notes

> date: 2026-09-03

Running record of PRD decisions and client/PM feedback as they land. Source PRD:
[PRD - Self-Serve Bulk User Upload](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29342662678/PRD+-+Self-Serve+Bulk+User+Upload)
(SAFELMS-32693). The 2026-09-02 PRD revision drew 16 open inline comments from
Liz Miller Lee (owner) and one technical/CX reviewer; the items below fold that
review into the mock. Nothing in that review is a locked decision yet — items
marked **PENDING** are still open threads.

**Placement (2026-09-03):** bulk import lives in **Settings ▸ User Import** — a
tab beside Emails / Login Page / Training Plan / Certificate / Integrations. The
sidebar's active item is Settings; inside the tab, **Manual import / Automated
sync** is a secondary segmented control (not a second row of page tabs).

**A/B versions (layout):** ver1 and ver2 are identical except one constant
(`VERSION`). Both lead the manual import with the same walkthrough card (SafeLMS
pencil-banner) on the Upload landing.
- **A (ver1) — tabbed:** Manual import / Automated sync as a segmented sub-control;
  you toggle between the two.
- **B (ver2) — one page:** manual import, with automated sync stacked *underneath*
  it on the same scrolling page (no sub-tab); "Set up Automated sync" scrolls down.
Use the V1/V2 pill to compare. Which layout to keep is an open design call.

## review-blocked

- **Blocked forces a fresh upload:** a blocked-tier error no longer offers an
  in-place "Fix column mapping" — the only path is Replace file / start over, and
  the review sidebar hides "Edit column mapping" whenever anything blocks.
  (PRD comments: *"Actually want to force new restart upload if blocked error"* /
  *"This should require a whole new upload for customers."*)
- **New "Contact Vector" tier:** for errors a customer's file cannot fix — e.g.
  two accounts already on the site sharing one email (PRD **D-4**). Renders indigo
  with a headset icon, hard-stops the import, and offers "Contact Vector support"
  instead of Replace file. Which specific errors belong in this tier is **PENDING**
  the "analyze all error messages" work Liz called for.
- **Severity by icon, not color (WCAG 1.4.1):** each tier now carries a distinct
  icon — Blocked ⊘ `fa-ban`, Confirm ⚠ `fa-triangle-exclamation`, Info ⓘ
  `fa-circle-info`, Contact Vector `fa-headset` — so the tiers are legible in
  grayscale / for color-blind users. (Reviewer: *"WCAG and exclusive use of color."*)
- **Blast-radius guardrail** is exposure, not net-new — *"accounted for in existing
  error messages."* Keep parity with the internal tool's wording.
- **SAML username validation — PENDING / at risk.** Comparing the file's username
  against the SAML identity provider may be infeasible (*"Likely can't do this"*),
  and SAML + self-serve may become CX-only (*"Should we make the SAML + self-service
  uploader case CX only?"*). The SAML-mismatch screen is built but the IdP-comparison
  framing is deliberately swappable; may demote to a simpler username-format/duplicate
  check (ties to D-4) or route SAML sites away from self-serve entirely.

## review-confirm

- **Confirm needs an explicit approve** — satisfied by the acknowledge checkbox
  gating Run import. (Reviewer: *"ability to approve these."*)
- **Severity is re-tiered for customers** — internal "yellow" can be customer "red";
  the tiers are keyed to reversibility, not the internal error type. (Reviewer:
  *"if something is yellow for Vector team, could be red for customers."*)

## map

- **PII is district-configurable — PENDING.** The blanket FERPA/address block is
  being revisited: a district can be flagged "PII District" and tell Vector which
  fields are allowed; the tool should read those settings and let the customer map
  to the enabled PII fields, rather than hard-blocking. Reframes the disallowed-field
  behavior from a block to a settings read. (Reviewer: *"Revisit — why would we not
  accept address fields? … Tool should read those settings."*)
- **Some columns must not be customer-mappable — PENDING analysis:** e.g. building
  codes and position codes. And K-12 student records must have everything mapped
  (PII handling). Mapping screen will need locked targets + a "map all" rule for
  K-12 students. Not yet built.

## settings

- **Rebuilt around the two-dimension "deactivate/remove" model (2026-09-03).** Per
  the client's purge-logic doc, the step now has two independent, off-by-default
  toggles — **Deactivate users not in this file** (Purge Users) and **Remove
  positions & locations not in this file** (Purge Jobs) — replacing the old single
  add-and-update / full-roster-sync radio. "Purge" wording is dropped in favor of
  **deactivate / remove**.
- **Live example, not a bare toggle.** A "How your file will apply" panel shows two
  real records that update as the toggles flip: a user missing from the file
  (Active → Deactivated / Stays active) and a user whose jobs differ (kept / removed
  / added chips), matching the doc's Teacher/Coach/Counselor examples.
- **Every destructive choice is re-confirmed on review** as its own CONFIRM alert
  (user deactivations, position/location removals), each acknowledgeable, and each
  carries a **"Not sure? Send to my Vector rep"** escape. The settings step offers
  the same escape inline.
- **OPEN tension:** the PRD review asked to *"consider keeping only one to reduce
  complexity,"* but the client's purge-logic doc defines both dimensions (Users ×
  Jobs) with distinct outcomes. Built both per the doc; whether to simplify to one
  is a **PENDING** PM decision — the live examples are partly there to test whether
  two toggles read clearly enough to keep.

## sync-locked

- **Automated sync is progressive-disclosure everywhere (2026-09-03).** Client
  feedback: the sync views carried too much text/visual load on first entry. Every
  sync state now leads with a single **status header** that *names the state* —
  "Not available yet" / "Up to date" / (on a waiting decision) the tier chip — so
  the customer knows which state they’re in before reading anything. The supporting
  detail (how-it-works, run history, notification recipients + toggles, and the
  failure card’s row-level diff) collapses into **expanders**, open on demand.
  Nothing was removed; it’s one click away. Locked view leads with the progress
  tracker ("1 of 3 · 2 to go") as the hero; the disabled "Turn on automated sync"
  button was dropped (the lock + header already say it). Expander open/closed is
  state-backed (`state.disc`) so it survives the app’s full re-render.

## sync-failed

- **Summary-first failure card.** The sync decision now shows the tier chip +
  headline + a **one-line summary** + the primary actions up front; the fuller
  "what happened / why / what to do" and the exact affected rows sit behind a
  single "See the details / Review N changes" expander. The decision and its action
  stay visible — only the explanation collapses.
- **Notifications = email, PII-light — PENDING detail.** *"directly = email? also we
  will need to limit what we send in terms of PII."* Keep names/PII out of the email
  body; drive recipients into the app to see rows. Recipient list is built.
- **Retry routes through the manual uploader** — a failed auto-upload is corrected
  and retried via the manual flow, not a bespoke mechanism. (Reviewer: *"via the
  manual uploader."*)
- **Care alerting thresholds — backend, not mock.** Open question of when Care gets a
  case (every failure? after N?) and what Care sees. (Liz: *"Could SF handle the logic
  to only create a case after X failed attempts?"*) Out of mock scope.

## upload

- US-4 (*stop me when an upload would break login*) carries a feasibility caveat:
  *"I suspect we can't guarantee this universally with this sort of tool."* Word the
  login-safety guarantees as best-effort, not absolute.
