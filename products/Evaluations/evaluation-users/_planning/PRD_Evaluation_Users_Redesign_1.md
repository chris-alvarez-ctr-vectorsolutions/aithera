# PRD: Evaluation Users Page — UI Redesign

**Jira Link:** [TO BE COMPLETED]

**Document Owner:** Rachel Thompson

**Last Updated:** June 5, 2026

**Kanban Status:** Draft

---

## ⭐ Critical PM Input Sections

---

## Executive Summary

The Evaluation Users page is one of the most frequently accessed pages in the EV+ platform — every evaluations user across EDU, PUB, and COM sectors interacts with this page at multiple points throughout their evaluation cycle. This initiative modernizes the page's front-end as part of Vector Solutions' ongoing platform-wide UI redesign, migrating the page to microservices architecture while meeting WCAG 2.1 A and AA web accessibility standards. No functional changes are in scope. The goal is to deliver a cleaner, more usable experience that reflects the quality and direction of the redesigned platform — putting our best foot forward on a page that serves as a primary touchpoint for virtually every EV+ end user.

---

## Problem

The Evaluation Users page currently renders using legacy front-end technology and a data table layout that is visually dense, inconsistent with the redesigned pages elsewhere in the platform, and does not meet current web accessibility standards. As the platform UI is modernized incrementally, this page creates a noticeable inconsistency in the user experience. Specific friction points include:

- Data table layout requires users to scan across crowded rows to find key form information
- Pop-up modals are used where dedicated detail pages would be clearer
- The trash icon for "show deleted forms" is misleading and causes user confusion
- The page does not meet WCAG 2.1 A/AA accessibility standards
- The underlying technology is not yet on microservices architecture

---

## Evidence

- **Customers affected:** All EV+ customers across EDU, PUB, and COM sectors. This is one of the highest-traffic pages in the platform — every evaluations user accesses it at some point in their evaluation cycle.
- **PUB usage:** For Public Safety customers, this page is selected as the default landing page for evaluatees by almost every account using default landing page settings.
- **EDU usage:** In EDU, users land on this page, the Home page, or the Evaluation Plans page — even users who don't land here will use this page multiple times throughout the school year.
- **Churn risk:** None — there are no major bugs, escalations, or churn signals tied to this page. This is a proactive modernization as part of the platform-wide redesign initiative.
- **Client committed:** No
- **Qual signal:** No specific customer quotes on file; improvement opportunity is driven by platform consistency and accessibility compliance goals.

---

## Personas (P-#)

- **P-1: Evaluatee (EDU, PUB, COM):** A staff member (e.g., teacher, officer, employee) who uses this page to view their own evaluation forms, track form status, access shared forms, upload files, and add reflections or signatures. Success = quickly finding and acting on their forms without confusion.
- **P-2: Evaluator (EDU, PUB, COM):** A supervisor or administrator (e.g., principal, sergeant, manager) who uses this page to view their own forms and, via Switch User, to view and create forms on behalf of their direct reports. Success = efficiently managing forms for themselves and their evaluatees in a single workflow.

---

## User Stories (US-#)

- **US-1:** As an evaluatee, I want to see all of my evaluation forms in a clean, scannable layout so that I can quickly find the form I need and take action on it.
- **US-2:** As an evaluatee, I want to toggle between a list view and a calendar view of my forms so that I can see my evaluation activity in the format that works best for me.
- **US-3:** As an evaluator, I want to switch to a direct report's context so that I can view their forms and start new forms on their behalf without leaving the page.
- **US-4:** As an evaluator or evaluatee, I want to filter my forms by date range and type so that I can focus on the forms most relevant to my current task.
- **US-5:** As an evaluator or evaluatee, I want to open a form directly from the list or calendar so that I can access form details and actions in one place.

---

## Proposed Solution

### In scope

- Full front-end redesign of the Evaluation Users page for all user roles (evaluator and evaluatee)
- Replace data table list view with a card-based layout consistent with the PD Tracking redesign pattern; each card displays form name (clickable link to open form) as primary element, with author, user, share status, reflection, signatures, attachments, and last modified date as secondary elements
- Retain all user-toggleable column/data options: Type, Name, Author/Coach, User, Sh (Shared), Shared Date, R (Reflection), Sig (Signatures), A (Attachments), P/F (Pass/Fail), Status, Date (form start date) — surfaced appropriately in the card design
- Retain calendar view using the new shared calendar component; forms plot by last modified date/timestamp and are clickable to open; Month/Week/Day toggle retained
- Retain all existing filters and controls: date range filter (Current Year default, respecting account-configured year start; options: Current Year, Last Year, Past Two Years), Type filter (Evaluation Forms, Uploaded Files, Scheduled Events), column toggle, Quick Search modal, New button (AP-controlled), and Show Deleted toggle
- Replace the misleading trash icon for "Show Deleted" with a clearly labeled control (e.g., "Show Deleted" toggle or button)
- Evaluator-only Switch User button retained (button and modal already redesigned; this PRD requires only that the functionality remains present and accessible)
- New button behavior fully preserved: AP-controlled via Settings > Account Preferences > Evaluation tab > "Show New Button" (checkbox: forms page); modal contents AP-configured (Evaluation Plan Forms, Evaluation Forms, Upload/Link File, Calendar Events, Professional Development)
- WCAG 2.1 A and AA compliance
- Migration of page to microservices architecture

### Not in scope

- Any changes to the Switch User button or modal (already redesigned separately)
- Changes to Quick Search modal behavior or scope
- Aligning the Type filter options to Account Preferences settings (currently static — remains static in this release; flag as future consideration)
- New columns or data points not present in the current page
- Integration between EV+ and PD Tracking
- Any new functionality beyond what is described above

---

## GTM Plan

- **UAT:** Internal UAT with QA team and customer-facing team volunteers (CS/Sales as proxy users). No formal Alpha or Beta cohort required for this release.
- **GA:** Straight to General Availability following successful UAT sign-off.
- **Entry criteria for UAT:** Redesigned page passes engineering QA; all functional behaviors from legacy page verified present; WCAG 2.1 A/AA audit complete.
- **Exit criteria for UAT / Entry criteria for GA:** No blocking issues identified in UAT; PM sign-off received.

---

## Success Metrics (M-#)

> *[TO BE COMPLETED — PM to define success metrics post-launch. Suggested starting points below for PM review.]*

#### Primary outcome metric

- **M-1: Accessibility compliance:** Page meets WCAG 2.1 A and AA standards as verified by accessibility audit at launch.
  - Measurement: Third-party or internal accessibility audit report; zero Level A/AA violations at GA.

#### Adoption / usage metrics

- **M-2: Page adoption rate:** [TO BE COMPLETED — baseline and target TBD; recommend establishing page view baseline via analytics pre-launch]
  - Measurement: Product analytics (page views, session data)

#### Performance / Technical metrics

- **M-3: Page load time:** Page loads within an acceptable threshold on standard connection.
  - Target: [TO BE DETERMINED BY ENGINEERING — recommend engineering establish baseline and set target during sprint planning]
  - Measurement: Synthetic monitoring / RUM (Real User Monitoring)

---

## Assumptions (A-#) and Dependencies (D-#)

- **A-1:** The card-based layout pattern established in the PD Tracking redesign is the approved design direction for this page, subject to UX confirmation from Austin.
- **A-2:** The Quick Search modal is either a shared component that can be reused as-is, or its behavior is unchanged in this release. [PO to confirm whether Quick Search is shared with Reports page.]
- **A-3:** The Type filter will remain static (not AP-driven) in this release.
- **A-4:** Status column values include at minimum "Submitted" and "Completed." [PO to confirm full list of possible status values.]
- **A-5:** The optional "Date" column reflects the form start date (not last modified date). [PO to confirm field name and source.]
- **D-1:** Shared calendar component (developed as part of PD Tracking redesign) must be available and stable for reuse on this page.
- **D-2:** Switch User button and modal redesign (separate initiative) must be complete or in a stable state before this page ships to avoid inconsistent UI.
- **D-3:** UX mockups from Austin are required before engineering begins build; design direction is pending.

---

## 📋 Start by PM, Complete in Flywheel

---

## Key Requirements

### Functional Requirements (FR-#)

**Functional Requirement (FR-1) — Card-based list view:** The list view must display evaluation forms as individual cards replacing the legacy data table. Each card must display the form name as a clickable link (primary element) and surface secondary data including author, user, share status, reflection indicator, signatures indicator, attachments indicator, and last modified date. The card layout must be consistent with the PD Tracking redesign card pattern.

**Acceptance Criteria**
- **AC-1.1:** Each form in the list view renders as a distinct card with the form name displayed prominently as a clickable link that opens the form.
- **AC-1.2:** Each card surfaces at minimum: author, user, share status (Sh), reflection (R), signatures (Sig), attachments (A), and last modified date/timestamp.
- **AC-1.3:** Cards render consistently across EDU, PUB, and COM sector accounts.

**Functional Requirement (FR-2) — User-controlled column/data visibility:** Users must be able to toggle optional data fields on and off in the list view. Toggleable fields are: Type, Name, Author/Coach, User, Sh, Shared Date, R, Sig, A, P/F, Status, and Date (form start date). Toggle state is per-user.

**Acceptance Criteria**
- **AC-2.1:** All listed toggleable fields are available in the column/data toggle control.
- **AC-2.2:** Enabling or disabling a field updates the card display immediately without page reload.
- **AC-2.3:** Toggle state persists for the user within the session.

**Functional Requirement (FR-3) — Calendar view:** The calendar view must display forms plotted by last modified date/timestamp as clickable entries that open the form. The calendar must support Month, Week, and Day toggle views and use the shared calendar component.

**Acceptance Criteria**
- **AC-3.1:** Forms appear on the calendar on the date matching their last modified date.
- **AC-3.2:** Each calendar entry displays the form name and is clickable to open the form.
- **AC-3.3:** Month, Week, and Day views are all functional.
- **AC-3.4:** The calendar uses the shared calendar component established in the PD Tracking redesign.

**Functional Requirement (FR-4) — Date range filter:** The date filter must default to Current Year on page load. Current Year must respect the account-configured year start date (set in Account Preferences). Filter options must include Current Year, Last Year, and Past Two Years.

**Acceptance Criteria**
- **AC-4.1:** Page loads with Current Year selected by default.
- **AC-4.2:** Current Year date range reflects the account-configured year start month and date, not a hardcoded calendar year.
- **AC-4.3:** Last Year and Past Two Years options are available and return correct results.

**Functional Requirement (FR-5) — Show Deleted control:** The page must include a control to include deleted forms in the list view. The control must be clearly labeled (not represented by a trash icon).

**Acceptance Criteria**
- **AC-5.1:** Deleted forms are excluded from the list view by default.
- **AC-5.2:** A clearly labeled control (e.g., "Show Deleted" toggle or button) allows the user to include deleted forms in the view.
- **AC-5.3:** The trash icon is not used for this control in the redesigned page.

**Functional Requirement (FR-6) — New button (AP-controlled):** When enabled in Account Preferences, a New button must appear on the page and open a modal allowing the user to create a new item. The modal contents must reflect AP configuration (Evaluation Plan Forms, Evaluation Forms, Upload/Link File, Calendar Events, Professional Development — each individually toggleable in AP).

**Acceptance Criteria**
- **AC-6.1:** New button is visible only when enabled in AP (Settings > Account Preferences > Evaluation tab > Show New Button > forms page checkbox).
- **AC-6.2:** New button modal displays only the item types enabled in AP configuration.
- **AC-6.3:** New button behavior is identical for evaluator and evaluatee roles (role does not affect button visibility — AP setting is account-wide).

**Functional Requirement (FR-7) — Switch User (evaluator-only):** Evaluators must retain access to the Switch User button, allowing them to view and act on a direct report's forms. The button and modal behavior are unchanged from the separately redesigned component.

**Acceptance Criteria**
- **AC-7.1:** Switch User button is present and functional for evaluator roles.
- **AC-7.2:** Switch User button is not visible to evaluatee-only roles.
- **AC-7.3:** After switching users, the page displays the selected user's forms in the redesigned layout.

### Nonfunctional Requirements (NFR)

- **Availability:** Standard platform availability SLA applies.
- **Performance:** Page load time must meet an acceptable threshold on a standard connection. [Target to be determined by Engineering during sprint planning — recommend establishing pre-launch baseline and setting target accordingly.]
- **Security and privacy:** No changes to existing access control, permissions, or data visibility rules. Role-based access (evaluator vs. evaluatee) must be fully preserved in the redesign.
- **Accessibility:** Page must meet WCAG 2.1 Level A and Level AA standards. Compliance must be verified via accessibility audit prior to GA release.
- **Supportability:** No new monitoring or runbook requirements beyond existing platform standards. CS and QA teams to participate in internal UAT to validate support surface prior to GA.

---

## UX/UI

- No mockups exist at time of PRD authorship. Design is pending Austin (EV+ UX Designer).
- Design direction: Follow the card-based component patterns established in the PD Tracking UI Redesign (PI.26.3). Reference the PD Tracking redesign Confluence page (ID: `27756036336`) and the before/after deck for pattern guidance.
- The shared calendar component developed for PD Tracking should be reused for the calendar view.
- Key design decisions to be resolved with Austin:
  - Card layout and information hierarchy for evaluation forms
  - Treatment of optional/toggleable data fields within the card
  - Label and placement of the "Show Deleted" control
  - Responsive behavior
- Mocks to be linked here once available: [TO BE COMPLETED]
