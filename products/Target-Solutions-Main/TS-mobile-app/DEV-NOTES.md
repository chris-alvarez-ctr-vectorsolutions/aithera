# TS Mobile App — Dev Notes

> date: 2026-09-25

## region
- (2026-09-28) **Why it exists:** US and Canada accounts are two separate databases and usernames are not unique across them, so the app cannot work out the country from the credentials. The country has to be chosen before the login request is sent.
- (2026-09-28) **One tap, no default:** two equal full-width buttons (United States, Canada). No radio group, no Continue button, no pre-selection — tapping a country is the whole step.
- (2026-09-28) **Remembered:** persist the choice on the device. Later launches open straight on the login form; the picker is only shown again from the "Change" link on the login form. Log out does not clear it.
- (2026-09-28) **Login form shows the country:** a "Signing in to United States · Change" line under the brand mark, so a user on the wrong side sees it before typing.
- (2026-10-02) **Followed by the device-type step on first launch.** Picking a country goes to "Who uses this device?" the first time; once both are remembered the app opens straight on the login form. Changing the country later does not re-ask the device type.

## device
- (2026-10-02) **Why it exists:** fire and police stations share tablets (station tablet, rig iPad) that run the app. The device needs to know it is shared so it can sign people out sooner and keep the signed-in identity on screen; without it someone takes a course or records a completion under the previous person's profile.
- (2026-10-02) **It is a property of the device, not of the login.** Asked once, right after the country, by whoever sets the tablet up, and remembered on the device like the country is. Not a per-login question: a switch on the login form would be missed by the second and third person to sign in, and a question at every login would nag the majority on personal phones.
- (2026-10-02) **Same pattern as the country picker:** two equal full-width buttons, one tap, no default, no Continue. "Just me — My own phone or tablet" and "My station or crew — A shared tablet other people sign in to". Copy avoids the jargon "shared device" on the buttons; a one-line hint above explains what changes.
- (2026-10-02) **Changeable from the login form:** a second pill under the country pill ("Shared station device · Change" / "Just me · Change") leads back here. Log out does not clear it.
- (2026-10-02) **One flag drives everything:** `deviceId === 'shared'` is the only switch; every shared-mode behavior below reads it. Persist it with the country.
- (2026-10-21) **"Just me" stays signed in for a long time.** Personal devices keep the session the way other apps on a phone do — weeks or a month or more, no inactivity timer. The picker's sub-line now says "My own phone or tablet — stays signed in". Exact session length is a product/security number to confirm.

## login
- (2026-10-16) **Brand lockup is the supplied Vector Solutions / TargetSolutions logo** (`ver1/ts-logo.svg`) on the country, device and login screens, replacing the typeset "TargetSolutions" wordmark and the "Vector Solutions" sub-line, which the lockup already carries. Wordmark text is white in the SVG because the screens are navy; the flame mark keeps its colors.
- (2026-10-02) **Two remembered-choice pills** under the brand mark: country and device type, each with its own Change.
- (2026-10-02) **Failed sign-in shows the error and a country nudge.** Under the fields: "That username and password didn't work. Try again, or reset your password below." Then a tappable card: "🇺🇸 Signing in to United States. If your department is in Canada, switch country and try again · Switch". US and Canada accounts are separate databases, so a failed login at a department near the border is often really the wrong country, and the nudge should appear on every failure, not only after several. Switch flips the country in place (the pill at the top updates), keeps what was typed, and clears the error; typing in either field also clears it. Prototype rule: a blank username or password fails, anything else succeeds.

## login-agency
- (2026-10-21) **No forgot-password in Phase 1.** The "Forgot your password?" link is gone and the failed-sign-in copy no longer mentions resetting it.
- (2026-10-21) **"Log in with your agency" takes its place** under Log In (SSO). Tapping it swaps the form for one field, **Agency site path** (handed out by the administrator; no helper text under the field), with a Continue button and "Use username and password instead" to go back.
- (2026-10-21) **Validation:** only that something was entered; a blank path goes red with "Enter your agency's site path." The path's format is whatever the platform issues — nothing in the UI describes it.
- (2026-10-21) **Continue opens the agency's sign-in page embedded in the app** (see login-sso). Works the same on shared devices.

## login-sso
- (2026-10-21) **Embedded SSO.** The site path resolves to the agency's identity provider, which opens inside the app in an in-app browser sheet: a top bar with **Cancel**, a lock and the domain (`login.<path>.gov` in the mock), then the provider's own page. The mock fakes a generic SSO login — agency mark + name, "Sign in", "Use your <agency> account to continue to TargetSolutions.", Email or username, Password, "Keep me signed in", a navy Sign in button, and "Protected by your agency's single sign-on." It is deliberately plain and not in the app's visual language: it is the agency's page.
- (2026-10-21) **Sign in** lands in the app exactly like a username/password sign-in (push pre-prompt on a personal device, Home on a shared one). **Cancel** returns to the site-path field, not all the way back to the password form.
- (2026-10-21) **Demo data:** `springfd` → Springfield Fire Department, `springpd` → Springfield Police Department (`AGENCIES` in app.js); any other path shows the path itself as the agency name.

## login-shared
- (2026-10-02) **No Face ID.** The opt-in row is hidden and the Face ID pane is never shown, even if the toggle had been on. iPad Face ID only enrolls one face anyway, and biometrics make no sense on a device others sign in to.
- (2026-10-02) **Username is never prefilled** and nothing is remembered between sign-ins; the form is always blank for the next person.
- (2026-10-02) **Note under Log In** states the rule. ~~"Shared device: you are signed out after 15 minutes without activity."~~
- (2026-10-21) **Copy updated with the softer rule:** "Shared device: after 1 hour without activity you'll be asked to confirm it's still you. No Face ID or saved passwords." (see idle).

## home-shared
- (2026-10-02) **Identity strip:** "SIGNED IN AS / Jordan Lee" with avatar and a "Not you? Switch" button, pinned between the status bar and the app shell so it sits above every in-app screen, including the full-screen Record task, and never scrolls away. Personal devices do not show it, and the rest of the app is unchanged.
- (2026-10-21) **The strip collapses with the scroll.** The full strip was taking too much room. Scrolling down (past ~24px) shrinks it to a one-line ribbon, about 20px tall, with tiny text — "SIGNED IN AS Jordan Lee" — no avatar, no Switch. Pulling back up, reaching the top of the screen, or tapping the ribbon restores the full strip. Every scroller in the app behaves the same (Home, the Record task's form, the pickers), and a new screen always starts with the strip open. Animate the height (~200ms).
- (2026-10-02) **Navy, not brand color.** The status bar also stays navy in shared mode (it is brand-colored otherwise) so the status bar and strip read as one block of system chrome that tells you who you are, separate from the customer-themed app beneath.
- (2026-10-02) **Switch** signs out straight to the (blank) login form and discards any Record Completions draft. Same action as Profile → Log Out; it is just one tap from anywhere.
- (2026-10-02) **Push pre-prompt is skipped** on shared devices: alerts are personal to an account and a station tablet is not, so there is nothing to opt in to. Sign-in lands directly on Home. The pre-prompt's former "Using a shared device?" caveat is gone: the device already said what it is in setup, so the notifications message is shown only to personal-device users and carries no shared-device language.
- (2026-10-02) **Profile** carries a "Shared station device" card restating the rules above Log Out.

## record-shared
- (2026-10-21) **"Recording as Jordan Lee · Not you?" removed.** The identity strip pinned above the task already says who is signed in, so the second line under the Participants tab was redundant. Switching users is done from the strip.
- (2026-10-02) ~~"Recording as Jordan Lee · Not you?" at the top of the Participants step.~~ Superseded above.
- (2026-10-02) **Confirmation screen** adds "Recorded by Jordan Lee on this shared device." under the summary.
- (2026-10-02) **Drafts are per sign-in on a shared device.** Every sign-out path (Log Out, Switch, Not you?, inactivity) throws the draft away so it never reaches the next person. On personal devices drafts still survive log out as before.

## idle
- (2026-10-21) **Softened: no automatic sign-out.** A device often belongs to a particular truck; the captain picks up that iPad at the start of a 12-hour shift and must not be logged out during it. So after **1 hour** without activity the app shows a full-screen **Welcome back** instead of signing out: avatar, "This shared device has been idle for over 1 hour. Confirm who's using it before continuing.", then **Continue as Jordan Lee** (primary) and **Sign in to a different account** (secondary).
- (2026-10-21) **Continue is twice the height of the alternative** (96px vs 48px) so the default is the easy target for someone picking the tablet back up.
- (2026-10-21) **Continue** closes the screen and the app is exactly where it was — the draft, the open form, the scroll position, nothing is lost — and the hour restarts. **Sign in to a different account** signs out and discards any draft, as before.
- (2026-10-21) **No countdown.** The screen waits for a tap. Any touch or key press while the app is in use resets the hour.
- (2026-10-21) **Values are placeholders — product/security to confirm.** On-screen copy says 1 hour; the prototype fires after 45 s so reviewers can see it (`IDLE` at the top of app.js).
- (2026-10-02) ~~"Still there?" dialog with a 15 s countdown to sign-out after 15 minutes.~~ Superseded above.
- (2026-10-02) **Personal devices are untouched:** no timer; the session persists for weeks like other apps (see device).

## home
- **Brand bar scrolls with the page:** the department name sits in a `--brand`-coloured block at the top of Home's scroll content, so it scrolls away like a native large title. It carries no controls.
- **Alerts is a tab** (fifth tab, bell icon) with the unread count as a badge, so notifications are reachable from every screen outside the Record task.
- **Account lives in More:** an account row (avatar, name, role · department) at the top of More opens Profile, which holds Log Out. The header no longer carries a bell or avatar.
- **Theming hook:** only the status bar and the Home brand bar use the `--brand` / `--brandContrast` token pair (styles.css `:root`). A TS customer theme is that pair, optionally plus `--accent`; buttons, links and the active tab stay on `--accent` / `--link` so contrast holds.

## home-limited
- (2026-10-21) **Why it exists:** some organizations only let admins or supervisors record certain activities. A firefighter should still see those Quick Links (so they know the activity exists) but not be able to use them.
- (2026-10-21) **Presentation:** restricted tiles keep their place in the grid but render grayscale at ~45% opacity with a small lock in the top-right corner; `aria-disabled="true"`. Everything else on Home is unchanged.
- (2026-10-21) **Tap:** opens the bottom sheet titled with the activity name — "Your account doesn't have access to record this activity. Ask your supervisor or training officer to record it for you."
- (2026-10-21) **Data:** which activities are restricted comes from the user's permissions in the web platform (per-activity access). In the prototype it is the `supervisorOnly` flag on tiles in app.js.
- (2026-10-21) **Prototype only:** the Quick Links switch in the UX tools dock now cycles All → Limited → Off, and the User switch flips between Jordan Lee (captain) and Sam Rivera (firefighter). `?ql=limited` / `?user=firefighter` in the URL start the page that way.

## home-empty
- (2026-10-21) **Why it exists:** Quick Links are admin-configured, so a department that has not set any up still needs a Home to land on. Same card, same customer-named title; only the card body changes.
- (2026-10-21) **Content:** an accent-tinted icon disc (grid icon), "No Quick Links yet", one line — "Your department hasn't set up any Quick Links. You can still record completions and scan QR codes." — then two full-width buttons: **Record a completion** (primary) and **Scan a QR code** (secondary, navy outline).
- (2026-10-21) **Actions reuse existing routes:** Record a completion opens a fresh Record Completions task (same as the Record tab); Scan a QR code opens the scanner tab. No new flows.
- (2026-10-21) **Condition:** show it when the department's Quick Links card has zero tiles across all groups. The brand bar, tab bar and alerts are unchanged.
- (2026-10-21) **Prototype only:** the Quick Links switch in the UX tools dock (All → Limited → Off) and the `?ql=off` URL flag are review tooling, not product.

## more
- (2026-10-21) **Account row shows name + department only.** The role/title ("Company Officer") was dropped from the account row and from Profile: title data is not available at launch.
- (2026-10-21) **Privacy Policy link** at the foot of More — small, underlined, muted. Opens a Privacy Policy screen (back arrow to More) with the policy as readable text in a card. The prototype text is boilerplate; Legal supplies the real policy.

## profile
- (2026-10-21) **Name and department only** — no title line. The shared-device card's copy now describes the Welcome back check instead of an automatic sign-out.

## record
- **No app bar in the flow:** the screen draws its own title row (X that keeps the draft, "Record Completions", Vector AI badge), which scrolls away with the content. Saves the 56px bar on the screen that needs vertical room most, and matches the web note that the top nav hides in this flow.
- **Full-screen task:** the bottom tab bar hides while Record Completions is open (`.app--task`). The title-row X leaves and keeps the draft; the footer Cancel discards it after an "Unsaved changes" prompt.
- (2026-10-02) **Segmented control, not a stepper.** Testers read the numbered-dots stepper as a wizard: step 2 looked locked and switching felt like it would lose progress, even though navigation was already free. It is now an Activities | Participants segmented control (Tamagui ToggleGroup shape) with a count badge on each segment and a quiet dot when a view is empty; no asterisks, no numbers, no connecting line. The footer is Cancel + Submit under both views; Next and Back are gone because they were the other sequence cue. Switch in any order, nothing is lost; the only validation is at Submit, and that dialog ("Almost there") offers a Go to Activities / Go to Participants button to jump to the empty view.
- **Draft survives leaving:** the Record tab shows a dot while a draft is waiting. Reopening the tab resumes it.
- **Quick Links:** an RCA-targeted Quick Link opens this flow with its activity already added and open; a draft in progress keeps what it had. Home-side multi-select of Quick Links is a later pass.

## record-picker
- **One picker, three data sets:** the same full-screen picker serves activities, participants and (2026-10-02) techniques, mirroring the web User Selection Tool (search, Filters, Recent / Last used + All, View Selected, Save Selection). Techniques get the search-only variant: no Filters, no Recent group.
- (2026-10-02) **Participants open filtered to User Status = Active.** The preset is an ordinary applied filter: it shows as an "Active" chip under the search and as "Filters (1)", and the chip's × or Clear all removes it to reveal inactive accounts. Last used pre-checking is unaffected.
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
- (2026-10-02) **Panel counter only with several activities.** The "2/3" at the right of a panel header is hidden when there is a single activity; "1/1" told the user nothing.
- (2026-09-28) **Instructor is not pre-filled.** The data model can't seed it from the logged-in user, so the field starts on a "Select instructor…" placeholder and is filled by VoiceComplete or a manual pick. (2026-09-30) The list also carries no "(you)" marker: there is no way to connect an instructor record to the logged-in user. "Apply instructor to all" only copies once there is a value, so an empty field never wipes a sibling. The collapsed panel summary omits the instructor until set.
- (2026-09-28) **Single column.** Date, Time, Duration, and Instructor are one field per row (the two-up Date | Time and Duration | Instructor rows tested poorly with users). Each "apply to all" checkbox sits directly under the field it copies.
- **Native pickers:** date, time, and a numeric duration field instead of typed text.
- (2026-10-02) **Techniques used opens the full-screen picker.** The field stays a select-shaped trigger showing the picks as chips (or "Select techniques…"), but tapping it now opens the same full-screen picker as activities and participants: search, one flat A–Z list with the sort toggle, View Selected, and Save Selection. No Filters button (techniques have no filterable attributes). Picks commit on Save; Close leaves the field as it was. Saved picks keep the admin's list order. This replaces the earlier bottom sheet, which only filled part of the screen and resized as the type-ahead narrowed the list.
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

## self-assign
- (2026-10-02) **What it is:** a completion the user records for themselves only. Opened by a Self Assign Quick Link (the "Physical Fitness" tile replaces "SCBA Refresher") or a scanned QR code; the Scan tab's simulated scan resolves to Physical Fitness, standing in for the printed code outside the workout room.
- (2026-10-02) **Same screen, reduced:** title "Record Completion" with the X, a header card naming the activity ("Self-assign · recorded for you"), then the single form. No stepper, no Participants step, no Add Activities, no accordion, no apply-to-all switches, no VoiceComplete button or kebab. Instructor is labelled optional. On a shared device the "Recording as … · Not you?" line sits above the card.
- (2026-10-02) **Plain dictation, not VoiceComplete:** the mic on Notes (and Areas, where configured) streams speech to text straight into that field; nothing is interpreted. Tap to start, tap again or let it finish to stop; it appends to whatever is already typed. The same mic now works this way in the group flow too (it was a placeholder toast).
- (2026-10-02) **No draft:** X and Cancel both discard, with an "Unsaved changes" confirm if anything was entered. The group Record Completions draft is parked while a self-assign is open and comes back untouched afterwards; the Record tab dot reflects the group draft only. A self-assign is a 30-second task and a lingering fitness draft would be confusing when the next Quick Link opens the group flow.
- (2026-10-02) **Validation:** only that the activity is configured. Fields are optional; date and time default to now.
- (2026-10-02) **Physical Fitness mock definition:** objectives (cardiovascular, strength, flexibility & mobility, job-specific), duration, notes. No techniques or areas. It is also in the activity picker, so a crew PT session can be group-recorded.

## self-assign-done
- (2026-10-02) **Confirmation for one person:** activity, date and duration, "Recorded for Jordan Lee" (plus "on this shared device" in shared mode). Actions: Record another (reopens the same activity), Go to Home. No "Same participants" shortcut.

## record-done
- **Confirmation** shows completions × participants × activities, then Record more or Home. The tab bar is back on this screen.
- (2026-10-02) **"Same participants, new activities" removed.** The back-to-back-drill case is already covered: the roster just submitted becomes the participant picker's "Last used" group, pre-checked when the next record's Participants view is empty, so "Record more" plus Add Participants gets the same crew in two taps.
