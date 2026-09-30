# TS Mobile App — Dev Notes

> date: 2026-09-25

## region
- (2026-09-28) **Why it exists:** US and Canada accounts are two separate databases and usernames are not unique across them, so the app cannot work out the country from the credentials. The country has to be chosen before the login request is sent.
- (2026-09-28) **One tap, no default:** two equal full-width buttons (United States, Canada). No radio group, no Continue button, no pre-selection — tapping a country is the whole step.
- (2026-09-28) **Remembered:** persist the choice on the device. Later launches open straight on the login form; the picker is only shown again from the "Change" link on the login form. Log out does not clear it.
- (2026-09-28) **Login form shows the country:** a "Signing in to United States · Change" line under the brand mark, so a user on the wrong side sees it before typing.

## home
- **Brand bar scrolls with the page:** the department name sits in a `--brand`-coloured block at the top of Home's scroll content, so it scrolls away like a native large title. It carries no controls.
- **Alerts is a tab** (fifth tab, bell icon) with the unread count as a badge, so notifications are reachable from every screen outside the Record task.
- **Account lives in More:** an account row (avatar, name, role · department) at the top of More opens Profile, which holds Log Out. The header no longer carries a bell or avatar.
- **Theming hook:** only the status bar and the Home brand bar use the `--brand` / `--brandContrast` token pair (styles.css `:root`). A TS customer theme is that pair, optionally plus `--accent`; buttons, links and the active tab stay on `--accent` / `--link` so contrast holds.

## record
- **No app bar in the flow:** the screen draws its own title row (X that keeps the draft, "Record Completions", Vector AI badge), which scrolls away with the content. Saves the 56px bar on the screen that needs vertical room most, and matches the web note that the top nav hides in this flow.
- **Full-screen task:** the bottom tab bar hides while Record Completions is open (`.app--task`). The title-row X leaves and keeps the draft; the footer Cancel discards it after an "Unsaved changes" prompt.
- **Stepper is navigation:** both steps are always tappable, in either order. Next/Back only move between steps. The only validation is at Submit.
- **Draft survives leaving:** the Record tab shows a dot while a draft is waiting. Reopening the tab resumes it.
- **Quick Links:** an RCA-targeted Quick Link opens this flow with its activity already added and open; a draft in progress keeps what it had. Home-side multi-select of Quick Links is a later pass.

## record-picker
- **One picker, two data sets:** the same sheet serves activities and participants, mirroring the web User Selection Tool (search, Filters, Recent / Last used + All, View Selected, Save Selection).
- **Saving is the source of truth:** unchecking an already-added item removes it from the draft.
- **Filters:** every field from the UST (Category, Activity type, Credential for activities; User Status, Station, Shift, Rank, EMS, Specialty, Region, Department for people) is a working multi-select — a select-shaped header that opens a chip list. Values within a field are OR'd, fields are AND'd.
- (2026-09-28) **"Last used" replaces "Recent" for participants:** the group is the exact roster from the officer's last submission — no recency time window. Re-synced on every Submit. Activities keep a plain Recent group.
- (2026-09-28) **Last used is pre-checked:** opening the participant picker with no participants on the step checks the whole Last used roster. Once the draft has people, their choices win and reopening never re-checks someone they removed.
- (2026-09-28) **Last used header controls:** a chevron collapses / expands the group; a Deselect all / Select all toggle acts on the roster currently visible (search + filters applied). The label flips as rows are checked.
- (2026-09-28) **Sort:** the "All" header (both pickers) shows the row count and an A–Z / Z–A toggle that sorts every group, including Last used. While searching the header reads "Results".
- (2026-09-28) **Clear all filters:** the filter sheet has a Clear all action at the top (both pickers) that empties the pending selection; Apply / Cancel still commit or discard. Disabled when nothing is pending.

## record-form
- **Smart defaults:** date = today, time = now, and both "apply to all" switches start on. Changing the date/time or instructor with those on copies the value to every activity.
- (2026-09-30) **"Apply to all" is a switch, not a checkbox.** It is a setting that changes how the form behaves, so it uses the settings pattern (label left, track right, same geometry as the Face ID switch on login; the on-state is the checkbox blue, not green, so the form stays one accent). The training objectives stay checkboxes because they are items being recorded. This replaces the earlier small-checkbox variant, which read as an inconsistency next to the full-size objective checkboxes.
- (2026-09-28) **Instructor is not pre-filled.** The data model can't seed it from the logged-in user, so the field starts on a "Select instructor…" placeholder and is filled by VoiceComplete or a manual pick. "Apply instructor to all" only copies once there is a value, so an empty field never wipes a sibling. The collapsed panel summary omits the instructor until set.
- (2026-09-28) **Single column.** Date, Time, Duration, and Instructor are one field per row (the two-up Date | Time and Duration | Instructor rows tested poorly with users). Each "apply to all" checkbox sits directly under the field it copies.
- **Native pickers:** date, time, and a numeric duration field instead of typed text.
- (2026-09-28) **Techniques used is a sheet, not inline chips.** The admin-configured list can run long, so the field is a select-shaped trigger showing the picks as chips (or "Select techniques…"); tapping opens a bottom sheet with a search box, an A–Z checklist, Clear, and Done (n). Checks apply immediately; Done just closes. Same paradigm as the participant picker, scaled down to a sheet.
- **Components:** everything below the instructor row is the activity's admin-configured components (objectives checklist, techniques multi-select, Areas Covered, Notes). An activity with no components shows the "hasn't been configured" notice and blocks Submit.
- **Kebab:** Clear form, Delete activity.

## record-voice
- **Sticky transcript:** while recording, the panel header and the live transcript are `position: sticky` at the top of the scroll area so the user can scroll the form and still see what is being captured. Sticky offsets are measured from the scroller's content edge, so the scroll container carries no padding.
- **One activity at a time:** starting a capture on another panel cancels the previous live one.

## record-filled
- **Analyze is the single step:** it fills the fields from the transcript (no separate Done). The capture collapses to a strip with Re-record and Edit transcript; the form fields underneath stay directly editable, which is the correction path.

## record-participants
- **One list, not one card per activity:** each person reads "All N activities" and expands to per-activity checkboxes for exceptions. This is the same data model as the web's matrix with far less scrolling.
- **The officer is not auto-added.** They must add themselves in the picker to receive a completion.
- **Header kebab:** Add participants, Delete all participants (confirmed).

## record-done
- **Confirmation** shows completions × participants × activities, then Record more, Same participants + new activities (mobile-only shortcut for back-to-back drills), or Home. The tab bar is back on this screen.
