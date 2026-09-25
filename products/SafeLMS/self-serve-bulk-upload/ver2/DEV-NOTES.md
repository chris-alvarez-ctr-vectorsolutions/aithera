# Self-Serve Bulk User Import — Dev Notes

> date: 2026-09-16

Running record of PRD decisions and client/PM feedback as they land. Source PRD:
[PRD - Self-Serve Bulk User Upload](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29342662678/PRD+-+Self-Serve+Bulk+User+Upload)
(SAFELMS-32693). Items marked **PENDING** are still open threads.

## (2026-09-25) V2 — starts from the failure email

- **[WIP]** V2 opens on the email site admins get when a nightly **automated** upload
  fails (customers own the auto-uploader, so Care isn't notified — tentative, per the
  Liz/Jessyca session). The email lists each issue with its column + rows and has one
  CTA, "Check it in your upload log", which opens the log with that run expanded and
  highlighted: why it failed, row-level tables, Upload a corrected file / Error report
  / Open a case.
- **PENDING:** how often to email (every failure vs. after N failures) — engineering
  feasibility unknown. The mock assumes every failure.

## (2026-09-25) Designer feedback round

- **[DONE]** **Usernames can never be changed by an upload.** Any row that matches an
  existing person but sends a different username is Blocked (not a % threshold).
  Map columns carries a note saying so.
- **[DONE]** Blocked (and Contact Vector) alerts are now **red**; Confirm stays yellow,
  Info blue.
- **[DONE]** Blocked alerts show **Where** — the exact row(s) + spreadsheet column
  (e.g. Column D (USER_ID), from row 2) — without expanding. Details show "Why it's
  blocked" instead of a before → after (no green "new value" box, since the change
  isn't possible); the current value is shown locked.
- **[DONE]** "See details" lists **every** affected person/row (all 166, all 31 jobs,
  all 118 updates…) in a scrolling table with a count + CSV download — not just a
  count. Added Info alerts for new users and updated users so every change is reviewable.
- **[DONE]** Import settings: switch renamed **"Deactivate anyone and any jobs not in
  this file"**; the On/Off description is always visible under the switch and
  follows its state; before → after totals moved to a side panel like Review's.
- **[DONE]** Users-only or jobs-only deactivation is not self-serve — a banner routes
  to Vector Care via the Support Center. **PENDING:** exact Care contact URL (links to
  the Support Center home for now).
- **[DONE]** Review side panel: "Edit column mapping / Change import settings" links
  replaced with support articles (stepper still jumps back).
- **[DONE]** New **Upload log** (Employees → Upload log, and from Import complete):
  every upload with when, file, who, Manual vs Automated, result, and changes.
  **PENDING:** confirm blocked/cancelled attempts should be logged (mock logs them).

## (2026-09-24) Review readout — open backlog

A working session covered the whole flow. Status tags: **[DONE]** shipped, **[WIP]**
in progress, **[TODO]** not started, **[PARKED]** revisit later, **[EXTERNAL]** outside
the mock.

**Pre-upload / intro step**
- **[DONE 2026-09-24]** Pre-upload content lives ON the Upload file step (a separate
  intro page was tried, then merged back in at the designer's request): template card
  (download + [process & template guide](https://support.vectortrainingeducation.com/s/article/User-Data-Bulk-Upload-Process-and-Template))
  and Help Center card ([best practices](https://support.vectortrainingeducation.com/s/article/Best-Practices-for-Uploading-and-Structuring-User-Data-in-Vector-LMS-Higher-Education),
  [common upload errors](https://support.vectortrainingeducation.com/s/article/User-Data-File-Upload-Errors))
  above the drop zone; the stepper is the steps overview. ← Back returns to Employees.
  Import settings "Learn more" → best practices; Review side panel → common errors.
- **[DONE 2026-09-24]** Bug where the page "jumps and goes out and comes back in" —
  root cause was the full-screen import overlay replaying its fade-in on every
  re-render (Employees page showed through). It now fades in only when it opens;
  in-place clicks don't animate at all.
- **[DONE]** Email is NOT required (confirmed).
- **[NOTED]** One discussed function flagged "not feasible" — no fix specified.

**Map columns**
- **[DONE]** Start from the columns SafeLMS needs; the user maps THEIR columns to each —
  mirrors the internal uploader. 10 file columns → 10 rows. Target dropdown = core
  fields (first/last/username/location/position/title/begin/end date) + the site's own
  custom attributes (dynamic per customer). Username/first/last required. Withhold
  internal-only fields (building/position codes). Extra unmapped columns OK. Liz: "run
  with it." (Asterisk now fixed to the column, 2026-09-23.)

**Import settings (complete-roster toggle)**
- **[DONE 2026-09-24]** Simplified: one-line intro + "Learn more" (help article),
  the "With this off/on" summary collapsed by default, and the "can't be undone"
  note moved to Review (above Run import).
- **[DONE 2026-09-24]** Toggle copy shortened: heading "Is this file your full
  employee list?", switch "Deactivate anyone not in this file" (sub: "Only turn on if
  the file lists everyone."), collapsed summary "What happens when off/on" with 2–3
  short bullets. Review alerts quote the new switch name. Liz may still tune it.
- **[DONE 2026-09-24]** Before → after TOTALS: two tiles, Active users (170 → N) and
  Active jobs (214 → N), each with a one-line delta ("+12 new · 6 deactivated").
  No itemized detail here — that lives on Review. `JOBS_TOTAL` (214) is mock data.

**Review changes**
- **[DONE 2026-09-24]** Side panel header is now just "Change summary"; the
  "compared against N users" line is gone and the footer is "Nothing changes until
  you run it."
- **[DONE 2026-09-24]** Summary fields: New users added, Existing users updated, Users
  deactivated — plus "Jobs ended" only when roster mode actually ends jobs.
- **[DONE 2026-09-24]** "Replace file" → **Cancel import** (secondary button under Run
  import). It discards the upload and returns to Upload with an "Import cancelled —
  nothing was changed" note. **OPEN:** does a cancelled/unconfirmed upload appear in
  the upload log as an attempt? Name stays "Cancel import" until answered.
- **[DONE 2026-09-24]** Blocked imports: Cancel import is the way out; the
  mapping/settings links are hidden while blocked.
- **[DONE]** "Replace file" removed from under the red alerts.
- **[DONE 2026-09-24]** Run import now asks twice: clicking it opens a "Run this
  import?" modal (recap counts + the **"This can't be undone"** warning, moved OFF the
  Change summary panel) with Go back / **Yes, run import** (red when the import
  deactivates users or ends jobs).
- **[DONE 2026-09-24]** Cancel import is a secondary RED (outline) button.
- **[DONE 2026-09-24]** Stepper: completed steps are clickable (and keyboard-operable)
  to jump back to that page; jumping to Upload discards the current file.
- **[DONE 2026-09-24]** "See details" list tables now have column labels (e.g. "Job
  being removed (position · location)" / "Who it affects"; "Row in your file" /
  "Would import as · already exists as").

**Error / alert display** — **[DONE 2026-09-24]** redesigned:
- **[DONE]** Each alert's explanation + example merged into ONE "See details" box,
  CLOSED by default; the separate Help popover is gone.
- **[DONE]** Code-like dot/dash lists → scannable TABLE (`.axt`).
- **[DONE]** "from → to" now a big before→after (green/red cards or a Now→After table)
  with a large arrow, not the code-like glyph.
- **[DONE]** Alerts share ~one footprint by default (colored header + one-line gist +
  actions); detail expands on demand.
- **[DONE]** Color-coded by severity via tiers: blocked=red, confirm=amber/yellow,
  info=blue, contact-Vector=indigo.
- **[DONE]** No row data shown by default; the detail table is height-capped and
  scrolls (`.axt-wrap`, max-height 220px) so large sets never render a 150-row wall.
- **[DONE]** "Replace file" removed from under the alerts (redo path stays in the side
  panel). The side-panel rename to "Cancel import" is done (see Review changes).

**Parked**
- **[PARKED]** Export the file with error messages inline — Liz recalled Rich saying
  it's possible; not in the PRD. Revisit later.

**Error-message documentation (Confluence)**
- **[EXTERNAL / DONE]** Confluence page cataloging every error message (key, plain
  meaning, current internal "red" text, admin-facing message, extra details) is live.
  Source = Rich's Perl file; neither Liz nor Deborah has Bitbucket access. Framework
  first, then tag-team fill over 1–2 weeks.

**Placement (2026-09-16) — moved to the Employees tab.** Bulk user import no longer
lives under Settings ▸ User Import. It now lives under the **Employees tab** (the
K-12 admin screen: sidebar `Employees` active, the Employees / Dynamic Groups /
Positions / Quick Groups / … top-tab bar, the toolbar + paginated employee list).
Each version launches the import from a **different entry point on that screen** —
that entry point is now the axis that varies between versions.

**Automated sync is OUT OF SCOPE (2026-09-24).** Customers can't be given automated
sync self-serve, so the sync page, the "Automated sync is on" banner, the Preview ·
AutoSync panel, and the flow map's sync lane (B) were **removed** from the mock. Where
sync used to be offered, the mock now links a Help Center article, **"How to get
automated sync"** (URL TBD): the Upload step's Help Center line, the Add employee
modal's bulk tab, and the Import complete page. (Supersedes the 2026-09-16 "sync is
assumed already set up" decision.)

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
- **Consolidated to ONE all-or-nothing switch.** The two toggles were collapsed
  into a single **"Make this file the complete roster"** switch (on = deactivate
  missing users + end-date absent jobs; off = add/update only).
- **(2026-09-24) Reduced density.** The long On/Off paragraph under the toggle was
  redundant with the "With this on" bullet box, so it was collapsed to a single
  guidance line ("Turn this on only when your file lists everyone"). The scannable
  bullet box now carries the consequences; permanence note + rep link unchanged.
- **(2026-09-23) Plain-language copy pass.** Import-settings microcopy reworded:
  heading "What happens to people and jobs that aren’t in this file?", an On/Off
  labeled contrast under the toggle, a three-bullet "With this on" box, and a
  "This can’t be undone" permanence note. "end-dated" → "ended" throughout this
  screen (help-tooltip copy on the Review step is unchanged). Copy-only — no logic,
  layout, or the single-toggle behavior changed.
- **(2026-09-23) Right-side preview removed; page condensed.** The itemized "What
  would change on your site" preview (deactivated-users list, end-dated-jobs list,
  the Maya-Torres per-user example) was removed from the Import-settings step and
  the layout condensed to a single column (toggle + on/off summary + rep-help). A
  compact "This is permanent" note stays when the switch is on. The full itemized
  changes are still confirmed on the **Review changes** step.

## map

- **(2026-09-23) Required-field asterisk is fixed to the column, not the mapping.**
  The red `*` on a file column now reflects the column's natural (auto-detected)
  target being a required field (First name / Last name / Username), so it stays
  put regardless of what the "Import as" dropdown is currently set to.

## upload

- US-4 (*stop me when an upload would break login*) carries a feasibility caveat:
  word the login-safety guarantees as best-effort, not absolute.
