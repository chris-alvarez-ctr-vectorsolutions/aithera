# 🐛 Bug Report - Learning Studio

---

## 📄 **COURSE OVERVIEW PAGE**

### General/Systemic Issues
- **Bug #16:** Modal titles and icons styling inconsistency (full studio)
  - Some modals have filled icons, some outlined, some none
  - Some have subheadings, some don't
  - **Fix needed:** Standardize styling across all modals

- **Bug #12:** Transparent color token issue (full studio)
  - Transparent color tokens over field backgrounds display darker than expected
  - Affects badges on Assessment tab and likely other places
  - **Fix needed:** Handle this scenario consistently across entire studio

- **Bug #17:** Duration badge border radius inconsistency (full studio)
  - Scene Management: Pill shape (fully rounded)
  - Course Overview: Border radius (not fully rounded)
  - **Fix needed:** Make consistent across studio

### Course Structure/Main View
- **Bug #1:** Export dropdown not using design system component
  - **Fix needed:** Update to design system component

- **Bug #3:** Duration badge colors not displaying properly
  - Transparent color on filled background
  - **Fix needed:** Update color styling

- **Bug #5:** Default view of sections
  - Currently: Sections expanded by default
  - **Fix needed:** Default to collapsed view

- **Bug #6:** Background fill not staying full height on scroll
  - Partially filled, partially white background visible
  - **Fix needed:** Maintain full height background when scrolling

- **Bug #7:** Drag and drop icon in course structure panel
  - **Fix needed:** Update icon design

- **Bug #8:** Section title and number typography
  - All using same typography, making it hard to read
  - **Fix needed:** Review and update typography compared to mockups

- **Bug #13:** Course structure component expand/collapse UI behavior
  - Appears to be reloading the page while expanding
  - **Fix needed:** Clean up the UI behavior

### Assessments Tab
- **Bug #4:** Missing questions badge (needs tooltip + link fix)
  - **Issue 1:** Add tooltip: "There have not been any assessment questions created for this learning object"
  - **Issue 2:** Deep link from learning object name should link to Assessments tab, not Scenes tab
  - **Clarification:** If assessment questions are NOT required, update badge text to "No questions created" or "No current questions" instead of "missing"

- **Bug #14:** Section expand/collapse alignment issue
  - Title moves down below chevron instead of staying in line
  - **Fix needed:** Clean up alignment

### Course Details Tab
- **Bug #2:** Comments panel not extending to full viewport height
  - Currently nested underneath toolbars
  - **Fix needed:** Extend to full viewport height
  - *(Note: This is fixed correctly on Scene Management page)*

- **Bug #9:** Add learning object modal - Tab bar toggle component
  - Not displaying correctly
  - Extra padding on left of active tab and on right

- **Bug #10:** Upload component (course image) styling
  - Label and component too close together
  - **Fix needed:** Verify spacing/styling

- **Bug #11:** Course title and default voice input alignment
  - Default voice inputs slightly below course title
  - **Fix needed:** Align horizontally

---

## 🎬 **SCENE MANAGEMENT PAGE**

### General/Systemic Issues
- **Bug #19:** Drag and drop icon on Scenes tab
  - **Fix needed:** Update icon design (consistent with Course Overview #7)

### Generate Bulk Audio Modal
- **Bug #15:** Generate bulk audio modal default radio option
  - Currently defaults to second option
  - **Fix needed:** Default to first option ("Select voice for all scenes")

### Pan and Zoom
- **Bug #18:** Pan and zoom directions selector - Auto-save/selection lag
  - Selecting direction triggers auto-save, but selection doesn't update until save completes
  - Rapid clicks revert to last auto-saved state
  - Possible queuing issue
  - **Impact:** Confusing and clunky to operate

### Citations Tab
- **Bug #20:** Painting/layout issue on initial load
  - "Add additional citation" and "Save citations" buttons load before citations appear
  - Buttons then jump to bottom as citations load in
  - Citations drop to very bottom of page
  - **Fix needed:** Sync with Knowledge Check and Assessment tabs (buttons at top, normal loading)

### Scene Editing - Templates
- **Bug #21:** OST templates not displaying on canvas when selected
  - Currently only display after text has been added
  - **Fix needed:** Display on canvas immediately when selected

- **Bug #24:** Deleting templates is unclear
  - Current method: Set template value back to "Select template" or null
  - **Fix needed:** Add clear "Remove" or "Clear" button

### Scene Editing - Text
- **Bug #22:** Text editor in modal instead of side panel
  - **Fix needed:** Move text editing to side panel to enable real-time canvas preview

### Canvas/Media Adjustments
- **Bug #23:** Canvas behavior during media/template adjustments
  - Currently: Canvas disappears with spinner, reappears with new selections (clunky screen jumping)
  - **Fix needed:** Use dark overlay working state instead of disappearing

- **Bug #25:** Canvas aspect ratio when panels are collapsed
  - Canvas widens too much when media/properties and transcript panels are both collapsed
  - **Fix needed:** Lock canvas to specific aspect ratio regardless of screen size

### Learning Object Preview
- **Bug #26:** Audio playing from incorrect scene in preview
  - Scenario: Learning object with mix of complete and incomplete scenes
  - Shows placeholder for incomplete scene but plays audio from next complete scene
  - **Fix needed:** Sync audio with displayed scene

### Properties Panel
- **Bug #27:** Properties panel styling inconsistency
  - Text styling differs between learning object and title card
  - Title card: Text appears bold/semi-bold
  - Not using same code/components
  - **Fix needed:** Standardize component usage

### Title Card Specific Issues
- **Bug #28:** Title card state mismatch
  - Marked "in progress" on course overview
  - No media, no template, nothing in scene
  - But system says "ready to finalize"
  - **Fix needed:** Validate state logic

- **Bug #30:** Title card template selection premature finalization
  - Selecting template immediately marks card as "ready to finalize"
  - Happens before text or media added
  - **Fix needed:** Validate finalization conditions for title cards

- **Bug #31:** Title card add media missing image generation
  - Only shows "Upload media" and "Stock library"
  - **Fix needed:** Add image generation option

### Read-Only State (Completed Learning Objects)
- **Bug #29:** Read-only state not properly implemented
  - Hover effects on "mark complete scene" button
  - X/actions still visible on media elements in properties panel
  - Disabled edit on learning object title (should be removed, not disabled)
  - Bulk audio button disabled (should be removed, not disabled)
  - **Fix needed:** Clean up read-only state - remove non-functional elements rather than disabling

---

## 📊 **SUMMARY BY TYPE**

**Design System/Consistency Issues (4):**
- Modal titles and icons (#16)
- Transparent color tokens (#12)
- Duration badge border radius (#17)
- Properties panel styling (#27)

**Layout/Spacing Issues (5):**
- Export dropdown component (#1)
- Background fill height (#6)
- Comments panel height (#2)
- Upload component spacing (#10)
- Course title alignment (#11)

**State/Validation Issues (4):**
- Title card state mismatch (#28)
- Title card premature finalization (#30)
- Auto-save/selection queuing (#18)
- Read-only state cleanup (#29)

**Visual/Typography Issues (3):**
- Duration badge colors (#3)
- Section title typography (#8)
- Drag and drop icons (#7, #19)

**UX/Workflow Issues (7):**
- Canvas behavior during edits (#23)
- Template deletion clarity (#24)
- Text editor placement (#22)
- Canvas aspect ratio (#25)
- Citations tab layout (#20)
- OST template display (#21)
- Audio preview sync (#26)

**Missing Functionality (2):**
- Deep link to assessments tab (#4)
- Title card image generation (#31)

**Modal/Component Issues (2):**
- Tab bar toggle padding (#9)
- Generate bulk audio default (#15)

**Expansion/Collapse Issues (2):**
- Course structure expand/collapse behavior (#13)
- Assessments tab section alignment (#14)

---

**Total: 31 bugs**
