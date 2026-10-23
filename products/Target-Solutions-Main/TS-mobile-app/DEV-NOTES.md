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
- (2026-10-21) **Presentation:** restricted tiles carry a small lock in the top-right corner and `aria-disabled="true"`. Everything else on Home is unchanged.
- (2026-10-22) **Locked tiles sink to the bottom of their group.** Within each group the tiles the user can use come first, in the admin's order, then the locked ones, also in the admin's order. Groups themselves keep their order and headers. Users with full access see the admin's order untouched.
- (2026-10-22) **One locked treatment, not two.** Graying out the admin-chosen fill produced two looks (dark gray tiles with white icons, light gray tiles with dark icons). Locked tiles now ignore the fill and ink entirely: light gray background (`--color-gray-100`), darker gray icon, label and lock (`--color-gray-600`), full opacity.
- (2026-10-21) **Tap:** opens the bottom sheet titled with the activity name — "Your account doesn't have access to record this activity. Ask your supervisor or training officer to record it for you."
- (2026-10-21) **Data:** which activities are restricted comes from the user's permissions in the web platform (per-activity access). In the prototype it is the `supervisorOnly` flag on tiles in app.js.
- (2026-10-22) **Prototype only:** the User button in the UX tools dock cycles four demo users, each an access profile, and shows the profile in the pill — "Jordan Lee: Captain (full access)", "Sam Rivera: Firefighter II (limited Quick Links)", "Leslie Carter: Firefighter (no Quick Links)", "Martin Newsome: Firefighter (no QL, no RCA)". The separate Quick Links switch is gone; the mode follows the user. `?user=firefighter|leslie|martin` starts the page as that person.

## home-empty
- (2026-10-21, later) **Decision: no Home tab at all when a department has no Quick Links.** Feedback on the empty state was to drop it. Instead the Home tab is removed from the tab bar and sign-in lands directly on **Record Completions**. Condition: the department's Quick Links card has zero tiles across all groups.
- (2026-10-21) **Record gets Home's top treatment.** With no Home tab, the Record Completions screen carries the full `--brand` bar with the department name across the top, exactly like Home does, scrolling away with the content. Departments that do have Quick Links see Record unchanged (no brand bar).
- (2026-10-21) **Record becomes the landing screen, so it keeps the tab bar** (Record · Scan · Alerts · More) — it is the only way to reach the other tabs — and its X is hidden, because there is nowhere to leave to. Cancel still discards the draft and stays on Record. Everything else about the task is unchanged.
- (2026-10-21) **Every route to Home goes to Record instead:** the notification pre-prompt's buttons, and "Go to Home" on the confirmation screens (that button is simply hidden there; "Record more" / "Record another" remain).
- (2026-10-21) ~~"No Quick Links yet" empty state inside the Quick Links card with Record a completion / Scan a QR code buttons.~~ Superseded by the decision above; removed from the mock.
- (2026-10-22) **Prototype only:** switch to **Leslie Carter** from the User button in the UX tools dock (or `?user=leslie`) to see it. Access is now per user, not a department-wide switch.

## home-no-record
- (2026-10-22) **Why it exists:** some users have neither Quick Links nor access to Record Completions. They still need the app for scanning, alerts and the File Center.
- (2026-10-22) **Tab bar is Scan · Alerts · More.** No Home tab (no Quick Links) and no Record tab (no Record Completions). Sign-in lands on **Scan**, and every route to Home or Record (the notification pre-prompt, a closed task) lands on Scan instead. Condition: the user's permissions grant neither Quick Links nor Record Completions.
- (2026-10-22) **Self-assign still works from a scan** (assumption to confirm): recording a completion for yourself is not the Record Completions tool, so a scanned QR code opens the self-assign form as usual; its X returns to Scan. If self-assign should also be withheld from these users, the scan would instead explain that the code needs an account with recording access.
- (2026-10-22) **Prototype only:** switch to **Martin Newsome** from the User button in the UX tools dock (or `?user=martin`).

## scan
- (2026-10-22) **Camera only on a deliberate action for users who land on Scan.** When Scan is the landing screen (no Home tab and no Record tab — see `home-no-record`) the app must not switch the camera on just because it opened. Scan shows a ready state instead: QR icon, "Ready to scan", one line of copy ("Open the camera and point it at the QR or barcode posted with an activity."), and a large **Open Camera** button; the live viewfinder appears only after that tap. Every arrival on the tab shows the ready state again. Users who have Home or Record chose the Scan tab themselves, so the viewfinder opens immediately for them, as before.
- (2026-10-21) **Staged camera feed instead of a scanning animation.** The viewfinder shows a printed sheet taped to a painted cinder-block gym wall: the department name, the Physical Fitness QR code, "Physical Fitness — Scan to record your workout". The red corner brackets are the app's framing guide over the feed. The old sweeping red line is gone.
- (2026-10-21) **The code in the mock is a stand-in** (`ver1/qr-fitness.svg`, not scannable). "Simulate a scan" still resolves to the Physical Fitness self-assign; in production the camera resolves whatever code it sees.

## more
- (2026-10-21) **File Center row** above the web-platform shortcut: opens the File Center at the department root (see `files`). The More tab stays highlighted while browsing from here.
- (2026-10-21) **Account row shows name + department only.** The role/title ("Company Officer") was dropped from the account row and from Profile: title data is not available at launch.
- (2026-10-21) **Privacy Policy link** at the foot of More — small, underlined, muted. Opens a Privacy Policy screen (back arrow to More) with the policy as readable text in a card. The prototype text is boilerplate; Legal supplies the real policy.

## profile
- (2026-10-21) **Name and department only** — no title line. The shared-device card's copy now describes the Welcome back check instead of an automatic sign-out.

## files
- (2026-10-21) **What it is:** a read-only mobile view of the web platform's File Center. Two ways in: a File Center Quick Link (launch type `folder` lands in that folder, `file` opens that file directly) and the File Center row under More (lands at the root). No admin functions — no upload, edit, move or delete anywhere in the app.
- (2026-10-21) **Screen:** app bar shows the current folder name (root reads "File Center") with a back arrow. Under it a sticky head: breadcrumb (`Springfield Fire Department File Center › Imported Resources › …`, ancestors tappable, scrolls sideways when long), a search field that filters the current folder as you type, and a sort button. Then a card of rows.
- (2026-10-21) **Rows:** type icon chip, name (blue, like the web), and a gray subtitle underneath — the web's "Imported From …" line when the file has one, otherwise `type · size` (folders: item count; links: domain). Trailing glyph says what a tap does: chevron (folder), down-arrow (download), external-link (browser).
- (2026-10-21) **Order:** folders first, then files and links, as the web platform lists them. Sort menu: Name A–Z (default), Name Z–A, Type, Newest first, Oldest first. The chosen sort persists while browsing.
- (2026-10-21) **Back arrow exits, always.** The app-bar back returns to the screen the File Center was opened from (Home for a Quick Link, More otherwise) no matter how deep the user has gone. Moving around the tree is done in the tree: folder rows go down, "Up one level" and the breadcrumb go up. "Up one level" shows whenever the current folder has a parent — including above the folder a Quick Link started in — so the user can climb to the root and go anywhere.
- (2026-10-21, later) **Decision: no history-style back.** The first cut popped back through every folder visited; John found that confusing next to the in-tree navigation, so back now has one meaning: leave.
- (2026-10-21) **Open by type:** PDF, image and text open in the in-app viewer (`file-view`); PowerPoint, Word, Excel, ZIP and anything else the app cannot render get the download sheet (`file-download`); links hand off to the native browser, same as an external-URL Quick Link.
- (2026-10-21) **Demo data** mirrors the admin screenshots (root: Imported Resources + User Overview Video; inside: the three PDFs and the Infoportal link) plus a Policies & SOGs folder with a nested 2026 Updates folder, so every behavior has something to tap. All department names are Springfield Fire Department, including the "Imported From" subtitles.

## files-folder
- (2026-10-21) **Folder-targeted Quick Link** (the "Imported Resources" tile, launch `folder`) lands directly in that folder with the Home tab still active. Back returns to Home from anywhere in the tree; "Up one level" goes to the File Center root.
- (2026-10-21) **File-targeted Quick Link** (the "Wildland Policy" tile, launch `file`) opens the file itself over Home — the viewer for a PDF, the download sheet for an Office file, the browser for a link. Closing it returns to Home; the user never has to pass through the folder list.
- (2026-10-22) **File Center button in the viewer bar** for files opened from a Quick Link: next to the X, a "File Center" pill goes to the root folder (back arrow from there still exits to Home). Hidden when the file was opened from the folder list, where X already returns to the folder.

## file-view
- (2026-10-21) **Full-screen viewer** for PDF, image and text: tab bar hidden, dark bar with X (close), the file name (two lines max), and a share button. Share offers the device share sheet, Save to device, and Open in another app.
- (2026-10-21) **Zoom:** pinch on device; the prototype toggles 2× on double-tap. Images and text show the file size in the bottom pill (2× while zoomed); tapping the pill also toggles zoom.
- (2026-10-21) **PDF page counter:** a "3 of 12" pill that follows the scroll. The prototype renders up to 8 placeholder pages; the real viewer renders the document.
- (2026-10-21) **Closing** returns to wherever the file was opened from: the folder list, or Home when it came from a Quick Link.

## file-download
- (2026-10-21) **Sheet first, then download.** Office files, archives and any other type the app cannot render never open silently: a bottom sheet shows the type icon, name, `type · size`, a one-line explanation ("opens outside the app, saved to your device, open in PowerPoint or share"), and Download (with the size) / Cancel. Files of 25 MB or more add a "Large file — best on Wi‑Fi" nudge.
- (2026-10-21) **Progress** replaces the buttons inside the sheet; when it completes the sheet closes and a "Saved to your device · OPEN" toast appears for a few seconds. Open hands the file to the matching app (or the share sheet if none can open it).

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
- (2026-10-02) **Same screen, reduced:** title "Self Assign" (was "Record Completion" until 2026-10-21) with the X, a header card naming the activity ("Self-assign · recorded for you"), then the single form. No stepper, no Participants step, no Add Activities, no accordion, no apply-to-all switches, no VoiceComplete button or kebab. Instructor is labelled optional. On a shared device the "Recording as … · Not you?" line sits above the card.
- (2026-10-02) **Plain dictation, not VoiceComplete:** the mic on Notes (and Areas, where configured) streams speech to text straight into that field; nothing is interpreted. Tap to start, tap again or let it finish to stop; it appends to whatever is already typed. The same mic now works this way in the group flow too (it was a placeholder toast).
- (2026-10-02) **No draft:** X and Cancel both discard, with an "Unsaved changes" confirm if anything was entered. The group Record Completions draft is parked while a self-assign is open and comes back untouched afterwards; the Record tab dot reflects the group draft only. A self-assign is a 30-second task and a lingering fitness draft would be confusing when the next Quick Link opens the group flow.
- (2026-10-02) **Validation:** only that the activity is configured. Fields are optional; date and time default to now.
- (2026-10-02) **Physical Fitness mock definition:** objectives (cardiovascular, strength, flexibility & mobility, job-specific), duration, notes. No techniques or areas. It is also in the activity picker, so a crew PT session can be group-recorded.

- (2026-10-21) **Title is "Self Assign":** the form's title row and the confirmation's app bar both read "Self Assign" instead of "Record Completion", so the flow a Self Assign Quick Link opens is named for what it is. The group flow keeps "Record Completions".

## self-assign-done
- (2026-10-02) **Confirmation for one person:** activity, date and duration, "Recorded for Jordan Lee" (plus "on this shared device" in shared mode). Actions: Record another (reopens the same activity), Go to Home. No "Same participants" shortcut.

## record-done
- **Confirmation** shows completions × participants × activities, then Record more or Home. The tab bar is back on this screen.
- (2026-10-02) **"Same participants, new activities" removed.** The back-to-back-drill case is already covered: the roster just submitted becomes the participant picker's "Last used" group, pre-checked when the next record's Participants view is empty, so "Record more" plus Add Participants gets the same crew in two taps.
