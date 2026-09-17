# Self-Serve Bulk User Import — Dev Notes

> date: 2026-09-16

Running record of PRD decisions and client/PM feedback as they land. Source PRD:
[PRD - Self-Serve Bulk User Upload](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29342662678/PRD+-+Self-Serve+Bulk+User+Upload)
(SAFELMS-32693). Items marked **PENDING** are still open threads.

**Placement (2026-09-16) — moved to the Employees tab.** Bulk user import no longer
lives under Settings ▸ User Import. It now lives under the **Employees tab** (the
K-12 admin screen: sidebar `Employees` active, the Employees / Dynamic Groups /
Positions / Quick Groups / … top-tab bar, the toolbar + paginated employee list).
Each version launches the import from a **different entry point on that screen** —
that entry point is now the axis that varies between versions.

**Automated sync is assumed already set up (2026-09-16).** The earlier "how do you
turn sync on" experiment (earn-it gate / concierge request / per-version placement)
is **retired**. Every version now assumes Vector has already configured the site's
automated roster sync, so **both manual upload and automated sync are available**.
Sync surfaces as a light "Automated sync is on" status (banner / detail page) with
two states only — **up to date** and **needs your attention** — reachable from the
import flow. The bottom-left "Preview · AutoSync" panel toggles those two states.

**Versions — 5, one entry point each (2026-09-16).** V1+V2 (the old earn-it and
concierge variants) were consolidated into one standard flow; the reimagined flows
moved down a slot. The downstream experience (and its per-version error-help and
attention treatment) is preserved from the prior round; only the chrome + entry
point changed.

- **V1 — Split buttons · standard flow.** Toolbar shows a secondary **Add Single
  Employee** (opens the Add-employee modal) beside a primary **Bulk Upload**
  (launches the upload → map → settings → review → done flow in place). This is the
  consolidated manual+auto version.
- **V2 — Import button · guided assistant.** Toolbar keeps the standard primary
  **+ Add Employee**; an **Import** button sits beside **Export**. Import launches
  the upload → **guided assistant** (one issue per screen).
- **V3 — In the Add-employee modal → full-screen grid.** **+ Add Employee** opens a
  modal with a **One employee / Many (bulk upload)** toggle. Picking a file in bulk
  mode launches the **fix-in-place spreadsheet FULL-SCREEN**.
- **V4 — In the Add-employee modal → new browser tab.** Same modal toggle; bulk mode
  offers **Open bulk import in a new tab** → the **three big screens** (Upload → Fix
  → Done) run in their own tab (`window.open` → `#fm=upload`).
- **V5 — In the Add-employee modal (stays) → tax-style interview.** Same modal
  toggle; bulk mode runs the **whole guided interview inside the modal** (welcome →
  section questions → review → done), so it never leaves the employee list behind it.

Different helper per version was a deliberate ask ("try different tooltips for all the
different versions"); different attention-needed treatment per version too (amber =
customer fixes it in the file; red = a blocker only Vector can resolve → CARE).

**Modal continuation was a client ask (2026-09-16):** for the modal-entry versions,
"try one with the modal, one with full flow, maybe in a new tab" — hence V3 (full
screen), V4 (new tab), V5 (stays in the modal).

## review-blocked

- **Blocked forces a fresh upload:** a blocked-tier error offers no in-place fix —
  the only path is Replace file / start over. (PRD: *"Actually want to force new
  restart upload if blocked error"* / *"This should require a whole new upload."*)
- **"Contact Vector" tier:** for errors a customer's file cannot fix — e.g. two
  accounts already on the site sharing one email (PRD **D-4**). Renders indigo with a
  headset icon, hard-stops the import, offers "Contact Vector support." Which errors
  belong here is **PENDING** the "analyze all error messages" work.
- **Severity by icon, not color (WCAG 1.4.1):** Blocked ⊘ `fa-ban`, Confirm ⚠
  `fa-triangle-exclamation`, Info ⓘ `fa-circle-info`, Contact Vector `fa-headset`.
- **SAML username validation — PENDING / at risk.** Comparing the file's username
  against the SAML IdP may be infeasible; SAML + self-serve may become CX-only.

## review-confirm

- **Confirm needs an explicit approve** — satisfied by the acknowledge checkbox
  gating Run import. (Reviewer: *"ability to approve these."*)
- **Severity re-tiered for customers** — internal "yellow" can be customer "red";
  tiers key to reversibility, not the internal error type.

## settings

- **Two-dimension deactivate/remove model.** Two independent off-by-default toggles —
  **Deactivate users not in this file** and **Remove positions & locations not in
  this file** — with a live "How your file will apply" example that updates as the
  toggles flip. Every destructive choice is re-confirmed on review, each with a
  "Not sure? Send to my Vector rep" escape.
- **OPEN tension:** PRD review asked whether to keep only one dimension to reduce
  complexity; the client's purge-logic doc defines both. Whether to simplify is a
  **PENDING** PM decision.
- **PII is district-configurable — PENDING.** A district can be flagged "PII
  District" and tell Vector which fields are allowed; the tool should read those
  settings rather than hard-block address/FERPA fields.

## sync-failed

- **Summary-first failure card**, with the fuller explanation + affected rows behind
  a single expander. The decision + its action stay visible.
- **Notifications = email, PII-light — PENDING detail.** Keep names/PII out of the
  email body; drive recipients into the app to see rows.
- **Retry routes through the manual uploader** — a failed auto-upload is corrected
  and retried via the manual flow, not a bespoke mechanism.
- **Care alerting thresholds — backend, not mock.** When Care gets a case (every
  failure? after N?) is out of mock scope.

## upload

- US-4 (*stop me when an upload would break login*) carries a feasibility caveat:
  word the login-safety guarantees as best-effort, not absolute.
