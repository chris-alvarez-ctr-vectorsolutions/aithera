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

**Versions (2026-09-03).** The tabbed-vs-one-page layout question is settled:
**all versions are one-page** (manual import centered; automated sync stacked in a
full-width, **edge-to-edge** band beneath it). What varies between versions is now
the **automated-sync setup model** and the **error-help style**, not the layout:

- **V1 — Self-serve · gate 3:** automated sync auto-unlocks after **3** clean
  manual imports in a row (the designer’s threshold). Progress tracker + expanders.
- **V2 — Self-serve · gate 4:** same, but the **PRD’s 4-clean-imports** threshold.
  V1 vs V2 is the live A/B on the exact gate number (was flagged as an open call).
- **V3 — Concierge:** automated sync is **not self-serve** — **Vector sets it up
  for you.** An intro + "Request automated sync setup" CTA; after requesting, a
  confirmation with the setup timeline (Vector reaches out → configures & tests
  with you → goes live). Fits the "SAML / complex = CX-only" PRD thread.
- **V4 — Earn it @4 + tooltips:** locked until **4** clean imports; the review
  **error descriptions move into help tooltips.** Each alert is a compact
  one-liner + a **Help** button opening: what it means, an **A→B before/after**
  example with a visual, and a **"Usually the answer is…"** heuristic. Deep-links
  to Vector Help (User Data File Upload Errors).
- **V5 — Reimagined:** a **triage workspace** instead of a forward-only wizard.
  The file shows as a **live grid** with problem cells flagged **in place**, beside
  an **Issues panel grouped by category** (Sign-in & SSO, Duplicates, Required
  fields, Names & changes) — each with an A→B fix and a **jump-to-cell**. Fix in
  any order; **Run unlocks when no blockers remain**; import scope sits under the
  grid. Categories mirror the Vector Help error article.

**Edge-to-edge sync + scroll fix (2026-09-03):** the one-page automated-sync band
now stretches the full main width (only the sidebar bounds it). Also fixed a
latent shell bug where tall screens couldn’t scroll (`.main`/`.scroll` needed
`min-height:0`; grid row pinned to `100vh`).

**Note on the error catalog source:** the Vector support article
(support.vectortrainingeducation.com/s/article/User-Data-File-Upload-Errors) is a
JS-rendered Salesforce page that can’t be auto-scraped, so the error taxonomy here
is grounded in the mock’s existing PRD-based error set and the article is **linked**
as the deep-help reference inside V4 and V5.

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
