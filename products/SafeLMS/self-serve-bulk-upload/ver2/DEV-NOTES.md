# Self-Serve Bulk User Import — Dev Notes

> date: 2026-09-16

Running record of PRD decisions and client/PM feedback as they land. Source PRD:
[PRD - Self-Serve Bulk User Upload](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29342662678/PRD+-+Self-Serve+Bulk+User+Upload)
(SAFELMS-32693). Items marked **PENDING** are still open threads.

## (2026-10-09) Bulk Upload page, Add Employee split button, row-by-row "after"

- **[DONE]** **Bulk Upload page:** no longer a full-screen takeover. The side nav stays, and a
  tall navy→blue header (same as the course editor's "New Custom Course" header) reads **Bulk
  Upload** with a ← back arrow (back to Employees; an unfinished import is kept). Nothing else
  in the header (the file name was removed). The content card is wider (1240px).
- **[DONE]** **Employees entry point:** one SafeLMS split button. The main action **Add
  Employee** opens the Add employee pop-up; the ▾ opens a menu with **Add single employee** and
  **Bulk upload**. The two halves are joined into one button (square inner corners, a thin
  light divider). Clicking outside or pressing Esc closes the menu.
- **[DONE]** **Review tables show only what was uploaded:** each row as it is in the file (Row,
  Username, names, and the value in question). Columns that showed site data ("On your site",
  "If you continue", "Why it was removed") are gone. **Only rows where a value actually
  changes are clickable** (they show "See change"): name changes, location / position renames,
  and the "last row wins" conflicts inside a file. Informational rows — new accounts, skipped
  or blocked rows, dates saved as-is, password changes, reactivations — have no before and
  after, so they aren't clickable. Clicking one selects it, and below the "Rows from your file"
  box a separate **Changes to** section shows **Now on your site** (when the change is to a
  value already on the site, e.g. Jessyca) over **After import** (e.g. Jesse), with columns
  lined up and plain styling so the admin compares by eye. A within-file conflict shows only
  After import (the before is the file row above). Clicking another row switches it.
- **[DONE]** **View details** opens with one plain line: what the warning is about, then how it
  changes things. It replaces the catalog's short second line (e.g. "Expand to see which.") and
  isn't a separate box. Blocked keeps **What to do**. `all_rows` stays count-only, so it has no
  details.
- **[DONE]** **Removed the two alerts that aren't in the Confluence catalog:** "N people …
  will be deactivated" and "N positions … will be ended". With the Import settings switch on,
  those counts still show in the Change summary and on the Run confirmation.
- **[DONE]** **Run confirmation:** **Yes, run import** is always blue, including when the import
  deactivates people. "Also download your current employee data" has a download icon on the
  left and the checkbox on the right.
- **[DONE]** **Failed automated uploads can't be reviewed or approved.** "Review & approve"
  and "Approve & run import" are gone. The run's page in the upload log says it didn't run and
  nothing changed, then lists why: each Blocked / Warning alert opens to one line on what it's
  about and how to fix the file, then the rows from the file. Side panel:
  Upload a corrected file, Original file, and who got the failure email.
- **[DONE]** **Failure email list** on the upload log ("Failed automated upload emails"): who
  gets the email when an automated upload fails, with **Edit list** to remove people, add an
  email (checks the format and duplicates) and **Save list** / **Cancel**. It's also reachable
  from a failed run's page ("Edit the list") and, in Flow 2, from the email footer.
- **[DONE]** **Rows that change are marked:** each shows a "⇄ See change" pill (solid blue
  "Hide change" once selected), and a closed alert with such rows shows a "⇄ N changes to
  compare" tag beside View details (clicking it opens the details).
- **[DONE]** **No "What to do" box** in the alert details — the line above the rows covers it.
  The CSV still includes each Blocked issue's What to do.
- **PROTOTYPE ONLY — don't build:** the **Catalog key** label under each alert title (e.g.
  `large_bldg_change`, tagged "Prototype only") shows only on the copy-review sample file, so the
  copy can be checked against the Confluence catalog. The user test never shows it.
- **[DONE]** The CSV preview adds a **What happens** column (one sentence per row on what the
  import does to it — kept in the CSV, not shown on the page).
- **[DONE]** **Upload log layout:** the table is on the left; "Made a mistake in an upload?"
  (Contact Vector Care) and the failure email list share one white card in a 280px right-hand
  column, split by a divider. The table
  dropped its **Role** and **Method** columns so it fits beside that column without scrolling
  (the All / Manual / Automated filter still separates methods; a run's own page still shows
  both). Below 1080px wide, the right column moves above the table.
- **PENDING — confirm with dev / PM:** the View details line, the "how to fix" copy, every
  after row and the CSV's What happens sentences are **UX drafts that aren't in the catalog yet**. They describe
  assumed behavior to confirm, notably: the last row wins when one code or username has two
  names; locations, positions and groups that aren't on the site are created; unrecognized
  custom-field values are skipped, not saved; site location and position names are renamed to
  match the file.

## (2026-10-02) Going back never starts over

- **[DONE]** The automated run waiting for approval (log → Review & approve): its deactivate setting is
  Off, so no "1 person deactivated / 2 positions ended". Warnings are the name change (kept) + shared
  email, begin dates before 1940 and a location not on the site — all from its own columns.
- **[DONE]** Leaving with Back / ✕ keeps the unfinished import; **Bulk Upload** reopens it on Upload
  file with everything intact (incl. each "I've reviewed this"). Only **Cancel import** or finishing a
  run clears it.
- **[DONE]** Alerts only appear for data the file has a column for (`NEEDS` / `fileHasDataFor`): no
  password column → no password warning; same for custom fields (attributes), End date, External
  Unique ID, building / position codes. Sample files updated (e.g. blocked-dates file: early begin
  dates + shared email instead of passwords / attributes / early end dates). The copy-review file still
  shows every catalog message on purpose.
- **[DONE]** Back buttons and the stepper keep everything: file, column matches, the setting and
  reviewed warnings. Coming back to **Upload file** shows the loaded file ("Your column matches and
  settings are kept") with **Replace file** and **Continue**, instead of an empty drop zone.
- **[DONE]** Picking the **same** file again keeps what they did; a **different** file starts fresh
  (its columns differ).

## (2026-10-01) Review alert head + clearer CSV copy

- **[DONE]** The tier tag (Blocked / Warning / Info / Reviewed) is an **eyebrow above the title**, so
  the sentence gets the full width. "I've reviewed this" stays top right; View details under the title.
- **[DONE]** Review page header **"Review changes"** (same shape as Map columns / Import settings) with
  a line that says what's needed: warnings → "Review each warning and check 'I've reviewed this' — once
  they're all reviewed, you can run the import."; blocked → fix or delete the rows in the file and
  re-upload; info only → nothing to review. Replaces the "What we found in your file" eyebrow.
- **[DONE]** Above Run import: a **yellow** note while warnings are open ("3 warnings need your review.
  Check 'I've reviewed this' on each one to run the import. 2 of 5 done."), **blue** when all are
  reviewed, **red** when blocked. Replaces "2 of 5 confirmations acknowledged".
- **[DONE]** **Blocked** alerts: "What to do" always sends them back to the file — "Open your file and
  fix … in these rows — or delete the rows — then upload the file again." (sync_error stays "try again"
  — it isn't a file problem.) Blocked tables show **rows only** (no column tag — it's obvious once
  they're in the file); duplicate_person now has a Row column (Row 48). Warnings dropped their column tags too (2026-10-02) — no red "Column X · …" anywhere.
- **[DONE]** Warning banners: **"I've reviewed this" top right**; **View details** is the second row,
  under the title (Info / Blocked show just View details there).
- **[DONE]** Side panel CSV copy (superseded 2026-10-01 → "**The full list of what we found** — Download the file to see every issue, the row and person it affects, and what to fix before you import."; the CSV now carries each blocked issue's "What to do" line). Earlier: "Everything we found, in one file" — Every blocked issue, warning
  and info item from this review, with each person and row they affect — one spreadsheet you can sort,
  filter or share." The list of kinds only names what the review has. File: `what_we_found.csv`.

## (2026-10-01) Map columns: * in the selector; Username note under it

- **[DONE]** The skip option is **"Don't import"** (was "— Not imported —"): it's a choice, like the
  other options. It shows gray in the selector, so the **Mapped / Not imported status column is
  removed** — three columns: Column in your file · Sample · Import as.
- **[DONE]** "Import as" is a custom dropdown styled like the live SafeLMS filter selector: bordered
  button (#7893B5, 6px), blue ring while open, menu of radio rows; the selected row has a filled blue
  check + light-blue highlight. Groups "Standard fields" / "Your site's attributes". Required fields
  show a **red** * (a native select couldn't). Closes on pick, outside click or Escape. Dev: build
  with the Vector select/combo component in that style; keep the listbox / option roles.
- **[DONE]** Required fields are marked **inside the "Import as" selector** ("First name *", "Last
  name *", "Username *") instead of a red * on the file column.
- **[DONE]** The lock note ("An upload can add new usernames but can't change an existing one.")
  sits **under the selector** of whichever column is currently imported as Username — it moves if
  Username is set on a different column.

## (2026-10-01) Review without opening; keep-a-copy on Run; toast instead of Import complete

- **[DONE]** Each Warning has **"I've reviewed this"** right under its title (tinted yellow → blue
  once checked), so it can be confirmed without opening it. **View details** sits on the same line.
  The checkbox no longer lives inside the details.
- **[DONE]** **Download current data** moved off the Review side panel into the **Run import**
  confirmation as a checkbox (**on by default** since 2026-10-01): "Also download your current employee data — a copy of
  your site as it is now, for your records."
- **[DONE]** No **Import complete** page. Run import lands back on **Employees** with a toast: "Your
  upload ran. N added · N updated · …" + "You can see it in the upload log now." (+ "A copy of your
  data from before it ran was downloaded." when that box was checked). Clears after ~8s, or ✕.
  Approving an automated run lands back on the **log** (row shows Completed) with the same toast.
  No person's name/email in it (the old page named "vpollock@…").

## (2026-09-30) One CSV in the side panel; Map dropdown adds codes

- **[DONE]** Map columns dropdown adds **External Unique ID** and **Building code**, just above
  **Position** and **Location**, which now sit at the bottom of Standard fields (supersedes the
  AC-1.5 "no codes" note — designer call). Sample-file auto-match is unchanged (`AUTO_ORDER`).
- **[DONE]** One **Download CSV** at the top of the Review side panel (sticky, so it stays in view
  while scrolling alerts). Replaces the per-alert "Download CSV" (over 20), the end-of-list
  "Complete list of changes" card and the Run-confirmation link. It's available the whole time (no
  lock) so admins can check big lists while reviewing.
- **[DONE]** Download CSV opens a **spreadsheet preview** of the file: one block per alert — a title
  row ("Warning — 6 people…"), that list's column headers, one row per person/item (column A =
  Blocked / Warning / Info), then a blank row.
- **[DONE]** View / Hide details: no underline or hover box (the rotated chevron picked up the underline).

## (2026-09-30) Collapsed Review; "Blocked"; CSV over 20; log Care banner

- **[DONE]** Review alerts are **short banners**: chip + title only, with **View details ▾** on the
  right (warnings also show "Needs review"). Opening shows the sub-line, the full list (scrolls when
  long), "What to do", and — for a Warning — the checkbox, so it's confirmed after it's seen.
  The first-row preview and "Show N more rows" are gone.
- **[DONE]** Tier label **"Blocking" → "Blocked"** (chip, sample-file tags, log notes, flow map).
- **[DONE]** "Submit a ticket to get this solved" button removed. Blocked alerts keep "Have a
  question about this? Raise an issue ticket."
- **[SUPERSEDED same day]** Per-alert Download CSV over 20 → one Download CSV in the side panel (above).
- **[DONE]** Upload log: pencil banner — "**Made a mistake in an upload?** Reach out to Vector Care
  and we'll help you sort out the changes." + Contact Vector Care (Support Center). Uploads can't be
  undone (PRD), so Care is the path.

## (2026-09-30) Only the newest automated run can be approved

- **[DONE]** Only the **newest** automated upload can be reviewed & approved; an older stopped run
  would overwrite newer data. V2's seed now matches: the newest run (Sep 25, the one the failure
  email is about) stopped on warnings → **Review & approve**; the older Sep 24 run is Blocked
  (Blocking issues, can't be approved). **PENDING:** what an older stopped run shows once a newer
  one exists (e.g. "A newer automated upload replaced this one").

## (2026-09-29) Rows on every alert; complete list of changes

- **[DONE]** Every **Blocking** alert ends with **"Submit a ticket to get this solved"** + "Have a
  question about this? **Raise an issue ticket**." (both → Support Center; replaces "Contact Vector
  support"). **PENDING:** real ticket URLs / whether they're two different ticket types.
- **[DONE]** Approving an automated run: no "Back to upload log" button — the header ✕ goes back to the log.
- **[DONE]** Completed log page: **Change report (.csv)** and **Data before this upload (.csv)**
  removed — neither is in the PRD (it asks for upload history: what each import changed + who ran
  it). "Original file" stays (designer call, 2026-09-30); "Error report (.csv)" removed.
- **[DONE]** Upload log: runs that didn't go leave the change columns empty — no "No changes" /
  "See what stopped it" text, just the row's arrow. A run waiting for approval keeps "Review & approve" (no arrow — the row chevron moves forward).
- **[DONE]** **Blocked is automated-only.** A manual upload with Blocking issues can only be cancelled,
  so it's logged as **Cancelled** (its note lists the Blocking issues).
- **[DONE]** Every row-level alert (Blocking, Warning and Info) lists the **row** it's on: a "Row"
  column for people, a "Rows" column for positions / locations / codes. Lists of people who
  *aren't* in the file (deactivations, positions ended) say there's no row to point to.
- **[DONE]** The dashed **"Where:"** box is gone. The column now sits in the table, under the
  header it applies to (red mono tag, e.g. "Column H · BEGIN_DATE"), only when the file has it.
  Same on V2's blocked-run log page.
- **[DONE]** Per-alert **"Download list (.csv)"** removed (it was a 2026-09-25 addition, not from
  the catalog). Replaced by one **Complete list of changes** card at the end of Review: shown
  only when nothing is Blocking, locked until every warning is reviewed, then Download (.csv).
  Also linked in the Run import confirmation.
- **[DONE]** "Not sure? Send to my Vector rep" removed from the Review alerts (manual and the
  automated-run approval page).
- **[DONE]** Log → Review & approve (V2) uses the same Review as the manual flow: most severe
  first, rows + column tags, checkbox boxes, complete list, pre-import download.

## (2026-09-29) Import settings copy; switch inside the box; Upload log one line per upload

- **[DONE]** "Jobs" → **"positions"** in everything users read: switch label ("Deactivate all people
  and positions not in this file"), the On/Off copy, the Vector Care line, the Review alert
  ("N positions aren't in this file and will be ended"), Change summary / run confirmation / log
  ("Positions ended"). The Add employee pop-up keeps its "Job" section — it copies the live product.
- **[DONE]** Import settings copy: subheading "By default this file only adds and updates people
  and jobs. Turn this on only if the file is your complete list of staff and the jobs they hold."
  Switch label → **"Deactivate all people and jobs not in this file"** (was "Deactivate all users
  and jobs not in this file"; also renamed on the Review recap and the log page). **Off:** "Adds and
  updates only. People and jobs already on your site are left as they are." **On:** "Your site will
  match this file." + 3 bullets (people deactivated · jobs ended for the people who hold them ·
  training history kept). Vector Care line: "This applies to both people and jobs. To deactivate
  only one, contact Vector Care in the Support Center."
- **[DONE]** No "This file will deactivate N people and end N jobs" line under On — those counts
  can't be calculated at this step (same reason the totals panel came out). Review shows them.
- **[DONE]** The switch sits inside the Off/On box and the whole box toggles it (bigger touch target).
- **[DONE]** Upload log: one "didn't run" result — **Blocked** (Failed retired). Method is plain
  text + gray icon, not a colored tag. One line per upload: When · File · Rows · Uploaded by · Role ·
  Method · Result · Added · Updated · Deactivated · Jobs ended.

## (2026-09-29) Severity order, older-data download, switch label

- **[DONE]** Review is ordered most severe first: Blocking → warnings that cause permanent loss
  (deactivations, jobs removed, "none of these match" file checks) → wrong/duplicate accounts,
  password changes, skipped rows, "only a few match" → other warnings (dates, codes, columns) →
  info. Ties keep catalog order. The copy-review file uses the same order now (was catalog order).
  Weights live in `WARN_WEIGHT` / `severity()`.
- **[DONE]** "Download current data (.csv)" on the Review side panel (a snapshot of the site
  before the import), "Data before this import" on Import complete, and "Data before this
  upload" on a completed run's log page.
- **[DONE]** Switch label → **"Deactivate all users and jobs not in this file"** (superseded same day — see above).
- **PENDING:** how long before-import snapshots are kept, and whether it's the full employee export
  or only the rows the import touches.

## (2026-09-29) Upload log → pages; approving stopped automated runs

- **[DONE]** Log rows open their own page instead of expanding. A completed, cancelled or
  failed run opens a detail page (who, method, setting, alerts & notes, what changed,
  downloads).
- **[DONE]** An automated run that stopped opens the **Review changes** design for that run
  (a banner replaces the stepper). Warnings only → the admin acknowledges each and clicks
  **Approve & run import** — the manual permission an automated run can't give itself.
  The log row then shows Completed with "Approved and run by …". Blocking → can't be
  approved; fix the export.
- **[DONE]** V2 failure email is generic: what ran, when, that it failed, one
  **View upload log** button. Details live in the log, not the email.
- **PENDING:** does approving run the stopped file as-is, or re-fetch the latest export?
  Mock assumes as-is.

## (2026-09-29) Import settings

- **[DONE]** Removed the "After this import" before → after totals panel — those counts
  can't be calculated at the Import settings step. Totals appear only in Review's
  Change summary.

## (2026-09-25) Review uses the error catalog only

- **[DONE]** Every Review alert comes from the [Error & Notification Message Catalog](https://lmsportal.atlassian.net/wiki/spaces/PMC/pages/29424549907)
  — its key, tier (Blocking / Warning / Info) and admin-facing copy. Non-catalog
  checks (SAML mismatch, mass-username guardrail, email-update notices) were removed.
- **[DONE]** Condensed alerts: catalog message as title + one line; "Show N rows" opens
  only the list (+ one "What to do" line for Blocking). Count/summary messages have
  no list. Blocking always shows **Where** (row + column).
- **[DONE]** `potential_duplicate_user` rows show "Duplicate account" as the result so
  it reads as a duplicate, not a username change.
- **[DONE]** Last sample file = copy review: all 44 catalog messages in catalog order,
  each labelled with its key.
- **[DONE]** Review opens with **Your choices** — column mapping and the import setting,
  each with Edit.
- **PENDING (catalog):** deactivations and ended jobs from the Import setting have no
  catalog key yet (suggest `deactivated_person` / `ended_job`, WARNING).
- **PENDING (catalog):** `potential_duplicate_user` is WARNING in the catalog, so it can
  be acknowledged and run — conflicts with "usernames can't be changed"? Confirm tier.

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
