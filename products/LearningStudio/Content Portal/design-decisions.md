# Content Portal — Design Decisions

**Product:** LearningStudio  
**Area:** Content Portal  
**Last Updated:** 2026-04-27  
**Contributors:** Austin Smith  

---

## Overview

The Content Portal is the primary landing page and management hub for content administrators and authors. It serves as the unified entry point for:

- **Global settings** — system-wide configuration for the content platform
- **Content library** — browsing, organizing, and managing existing content assets
- **Global assets & templates** — brand identity resources (logos, fonts, color palettes, reusable templates)
- **Content authoring** — creating new content and editing existing content from the library
- **Author management** — managing subject matter expert (SME) personas, bios, and attribution metadata

---

## System Boundary

The Content Portal is a **gated internal tool** — it is not accessible to end learners. All users of this system are internal roles: admins, content designers, SMEs, and authors with system access. End learners interact with content exclusively through the LMS, where the public-facing author profile (name, headshot, bio) is surfaced.

The portal and its editor are **delivery-agnostic** — they serve as the content creation and management layer for multiple LMS delivery products. Content created here is published to whichever LMS products a customer uses. This means:
- The portal does not own LMS data (assignments, completions, enrollments) — that lives in the delivery products
- Cross-system data (e.g. usage counts on a content item) is a future integration concern, not a v1 capability
- Design decisions should not assume a 1:1 relationship between the portal and any single LMS

This also means:
- UI can assume a higher level of technical comfort than a consumer product
- Internal identity (username, internal photo) and public identity (author name, headshot, bio) are separate and serve different audiences
- No public-facing pages or anonymous access exist within this system

---

## User Goals

| User Type | Primary Goals |
|---|---|
| Content Admin | Configure global settings, manage brand assets and templates, oversee the content library, manage and maintain author profiles |
| Content Designer | Access the library, create/edit content, attach authors to content |
| SME / Author (system user) | Review content they are tagged to during the design/review phase |
| SME (attribution only) | No system access — represented as an author profile record only; credentials surface in LMS |

---

## Information Architecture

### Top-Level Sections (TBD — subject to design exploration)

1. **Dashboard / Home** — Landing view; quick access to recent content, key actions, and status
2. **Content Library** — Full content catalog with search, filter, and organization tools
3. **Global Assets & Templates** — Brand identity repository; templates for reuse
4. **Authors** — SME profiles, personas, bios, and attribution management
5. **Settings** — Global platform configuration

---

## Open Design Questions

### Navigation Model
- **Decision: Unified flat sidenav, Content Library as default landing view**
  - No dashboard landing page — users typically arrive knowing what they need to work on; a hub page adds friction without value
  - Content Library is the default landing view for all roles — it's the primary surface for both designers and admins
  - All five sections are flat top-level sidenav items — no collapsing or grouping; the nav is simple enough that visual compression isn't needed
  - Role-based visibility will scope which nav items a user sees based on their permissions, but the nav structure itself does not change
  - Settings and Global Assets are visually separated from the primary workflow items with a divider — they are setup/maintenance tasks, not daily workflow, and the divider communicates that without hiding them

**Sidenav order:**
1. Content Library _(default landing)_
2. Authors
3. _(divider)_
4. Global Assets & Templates
5. Settings

**Rationale for order:**
- Library and Authors are the daily workflow items — they sit at the top
- Global Assets and Settings are initial-setup and low-frequency maintenance — they sit below the divider
- Authors bridges both roles (designers attach authors, admins maintain them) so it stays with the workflow group rather than the admin group

**Role scoping:**
- Smaller customers with overlapping roles see all items
- Enterprise roles see only the sections their role permits — this is handled by permissions, not by nav restructuring
- No role-adaptive landing views; the experience is unified

### Author Management Placement
- Authors are a supporting data type (they describe *who* created content) rather than a primary workflow
- **Option A: Standalone top-level section** — Elevates SME management as a first-class concern; useful if admins frequently update author profiles
- **Option B: Nested under Content Library** — Keeps authors close to the content they're associated with; reduces top-level nav clutter
- **Option C: Settings or Admin area** — Treats authors as configuration/metadata rather than content; appropriate if access is restricted to admins only
- **Decision: Option A — Standalone top-level section**
  - Admins need a dedicated space to manage and audit the author list independently of any content editing workflow
  - Content designers also attach/create authors inline during content creation, so authors live in two surfaces: the standalone management section and as a contextual panel/step within the content editor
  - This dual-surface model means the standalone section is the authoritative management view; the in-editor experience is a lightweight picker/creator that feeds into it

### Author Creation Depth
- When a content designer adds a new author during content creation, how much information is required upfront?
- **Option A: Minimal shell** — Name only (or name + photo); bio and credentials filled in later by admin or the author themselves
- **Option B: Full profile at creation** — All fields required before the author can be saved; enforces data quality but adds friction mid-workflow
- **Option C: Tiered / progressive** — Required fields (name) unblock saving; optional fields (bio, credentials, photo) prompt completion with a visible "incomplete profile" indicator
- **Decision: Option C — tiered / progressive creation**
  - Reduces friction during the content editing workflow while surfacing data quality gaps to admins
  - Author profiles will carry a completeness status (badge or indicator) visible in the admin management view
  - Admins should be able to filter/sort the author list by completeness to triage incomplete shells

### Author Identity & System Access
- Authors are not purely data records — they may be users with login accounts
- An author who is also a user can be tagged to content during the design/review phase and log in to review that content
- **Implication:** An author profile needs to be linkable to a system user account, but the link is optional — some SMEs will never log in and exist purely as attribution records
- Linking an author profile to a user account is an **admin-only task** — content designers cannot do this
- Only users with a designated **SME/Author role** are eligible to be linked to an author profile; this role gates which users appear as candidates when an admin is linking an account
- **Decision: Author profile and user account identity fields are fully independent — no sync**
  - The user account holds **internal identity**: username, internal display name, internal profile photo — visible to colleagues within the content system (portal, editor, review workflows)
  - The author profile holds **public-facing identity**: author name, professional bio, headshot — delivered to end learners via the LMS
  - These are intentionally separate because the audience and purpose differ entirely
  - Example: John logs in as "Johnny" with a casual photo; his published author profile reads "John" with a professional headshot
  - **Implication for UI:** The author profile form has no read-only fields inherited from the user account. All author profile fields are independently editable by admins. The link to a user account is a relationship pointer only (enables login and content review access), not a data sync.

### Author Permissions Model
- Both admins and content designers can create authors, but with strictly separated scopes
- **Admin capabilities:** Full CRUD on any author profile; link/unlink system user accounts (restricted to users with the SME/Author role); manage completeness; archive/deactivate authors
- **Content designer capabilities:** Create new author shells (name + minimal fields only); attach existing authors to content; cannot link user accounts, cannot edit profile fields that surface in published content
- **Decision:** Profile field editing is admin-only for anything that surfaces in published content; content designers are limited to shell creation and attaching authors to content items

### In-Editor Author Picker
- **Decision: Show all authors** regardless of completeness
- Rationale: a content designer may intentionally attach an incomplete shell knowing the admin will complete it; hiding incomplete authors would create confusion about whether the author exists
- UI note: incomplete authors should be visually indicated in the picker (e.g. a subtle "incomplete" badge) so the designer is aware, but not blocked

### Content Library

#### Content Taxonomy
- **Decision: TBD — defined by the content department as content types expand beyond courses**
- Do not design the library UI around any specific taxonomy structure; keep organizational grouping abstract and swappable
- Use stub placeholder levels (e.g. Category, Sub-category) in mockups without implying those are final names or the final depth
- Two known dependencies that will be unblocked once taxonomy is defined:
  - **Theme assignment** — themes attach to a taxonomy unit; the specific unit is unknown until the hierarchy is set
  - **Library filtering and navigation at scale** — stub filters are sufficient for v1 mockups

#### Content Types
- **Current:** Courses only
- **Future:** Micro-learnings, experiences, and other output types as the editor evolves

#### Duration as Metadata
- **Decision: Duration is first-class metadata on every content item — system-calculated where possible, author-entered as fallback**
- Duration serves three distinct surfaces:
  - **Content editor** — real-time feedback helping designers self-regulate against their target duration during build
  - **Portal library** — visible to admins and designers when browsing and managing content
  - **LMS catalog** — visible to admins assigning training and to learners selecting or completing content
- **System-calculated** is the default where the platform can derive it (e.g. video runtime, slide count × estimated read time)
- **Author-entered** is the fallback for content types the system cannot measure; author can also override the calculated value
- **No system-enforced duration limits or targets** — duration targets are defined externally (internal scope documents, customer org policy) and brought to the editor by the designer; the platform surfaces duration information but does not validate against a target
- **Implication for UI:** Duration should be visible in the library list view as a column/attribute, on the content detail screen, and as a live indicator in the content editor — not buried in a metadata panel
- **Implication:** The library UI should be designed with content type as a filterable dimension from the start, even if only one type exists today — avoids a costly retrofit when new types ship

#### Content Ownership & Visibility
- **Two content pools exist side by side in the library:**
  - **Vector-provided content** — owned and maintained by Vector; customers cannot edit originals; customers can "Start From" to create an editable duplicate
  - **Customer content** — created and owned by the customer; full edit/delete/archive rights
- **Internal Vector users** see only Vector-owned content (no customer content)
- **Customer users** see both pools in one library — their own content and Vector-provided content
- **Implication:** The library needs a clear visual and/or filter distinction between Vector-provided and customer-owned content; actions available on a content item are ownership-dependent

#### Scale
- Must support both small customers (5–10 items) and Vector's internal library (1000s of courses)
- Search and filtering are first-class features, not secondary — the library is unusable at scale without them
- Pagination or virtualized list required for large libraries

#### Content Actions
| Action | Applies To | Notes |
|---|---|---|
| Edit content | Customer-owned only | Opens the content editor |
| Edit catalog details | Customer-owned only | Image, title, description — metadata shown in browsable catalogs |
| Duplicate / Start From | Vector-provided content | Creates a customer-owned editable copy; also available on customer content |
| Archive | Customer-owned only | Soft delete; removes from active library but preserves record |
| Delete | Customer-owned only | TBD — hard delete vs. archive-only policy |
| View detail | All content | Read-only detail screen for Vector-provided content |

#### Content Detail Screen
- Every content item has a detail screen — summary of metadata, catalog details, authors, and status
- For Vector-provided content this is read-only; for customer content it surfaces edit/archive actions
- **Catalog details** (image, description, title) are a distinct editable section — these control how the content appears in customer-facing catalogs in the LMS, separate from the content itself
- **LMS usage data (future):** Research signals that admins need to understand downstream impact before modifying or archiving content (active assignments, completion count, last published date). This data is not guaranteed to be available at portal launch — the portal and editor serve multiple LMS delivery products and whether cross-system usage data can be surfaced is yet to be determined
- **Implication for UI:** Design the content detail screen with a dedicated "Usage" or "Impact" section as a placeholder — render it as unavailable or hidden in v1, but don't structurally exclude it. When LMS integration is resolved, this section can be populated without a redesign

#### Delete vs. Archive Policy
- **Decision: Lifecycle-gated deletion — hard delete eligibility depends on content state and ownership**
- **Never-published / in-progress content:** Supports hard delete at an appropriate permission level — content that has never gone live has no LMS dependencies (no enrollments, no completions) so deletion is safe
- **Published / live content:** Must go through a formal **sunset process** before becoming eligible for hard delete — the sunset process is TBD in detail but exists to protect active LMS enrollments and historical data
- **Vector-provided content:** Housekeeping (archiving, sunsetting, hard delete) is an internal Vector admin capability — customers cannot delete Vector-owned content
- **Implication for UI:** Content item actions should reflect lifecycle state — a draft shows a delete option, a published item shows an archive/sunset option instead, and a fully sunsetted item shows a delete option only at the appropriate permission level

#### "Start From" Flow
- **Decision: Quick setup step before the copy is created**
- When a user initiates "Start From" on any content item (Vector-provided or their own), they are prompted to name the new item and place it (e.g. assign a category or location in the library) before the copy is created
- The copy is created as a draft owned by the customer
- Rationale: avoids polluting the library with unnamed "Copy of X" drafts; forces minimal intentionality at creation time

#### Catalog Details Ownership
- **Decision: Catalog details (image, title, description) are only editable on content the user owns**
- Customers can only customize catalog details on content they have spun off as their own version via "Start From" — at that point they have assumed full ownership
- Vector-provided content catalog details are read-only for all customer users — they see Vector's canonical metadata
- Customers who want a customized presentation must create their own version first
- **Implication:** The detail screen for Vector-provided content should make "Start From" highly visible as the path to customization — it's the only way to unlock editing

#### Bulk Operations
- **Decision: Bulk operations are in scope**
- Supported bulk actions TBD in detail, but at minimum: archive, and potentially assign category/tag
- Bulk delete should follow the same lifecycle-gating rules as single-item delete
- **Implication for UI:** The library list view requires a selection mechanism (checkboxes) and a bulk action toolbar that appears when items are selected

### Global Assets & Templates

#### Asset Categories
Five distinct asset types live in this section. Each has meaningfully different management needs and should be treated as separate sub-sections within Global Assets & Templates:

| Category | Description | Notes |
|---|---|---|
| **Image Assets** | Brand logos, custom gradients, recurring visual elements used across content (e.g. intro screens) | Static files; managed like a brand asset library |
| **Templates** | Overlays applied to visual media — callout boxes, bullet lists, arrow pointers, focal point markers | Applied within the content editor to images/video frames; these are structural/visual tools, not full content shells |
| **Themes** | Color and visual identity configurations scoped to a brand or sub-brand (e.g. John Deere Ag vs. Construction) | A single customer may have multiple themes for different audiences or divisions |
| **Avatars** | Custom character or mascot representations used with AI narration as the "presenter" in content | Novel asset type — requires creation/customization tooling, not just file upload |
| **Voices** _(future)_ | AI voice profiles — either customer-curated custom voices or a curated list of approved provided voices | Not in scope for v1 but architecture should anticipate it |

#### Key Decisions
- **Themes are multi-per-customer** — a customer can have more than one theme (different divisions, audiences, or content lines); content items reference a theme at creation or edit time
- **Avatars are a creation tool, not just an upload** — unlike image assets (upload a file), avatars likely require a configuration/customization interface; the management screen needs to support both creation and management of existing avatars
- **Voices follow the same pattern as avatars** — when built, will need a mix of "provided" (curated approved list) and "custom" (customer-created); the asset section should be designed to accommodate this sub-pattern for both avatars and voices
- **Templates are editor-facing** — they are created and managed here but consumed inside the content editor; the management UI focuses on creating/naming/previewing template layouts, not on applying them

#### Resolved Questions

**Theme scope:**
- **Decision: Themes are applied at an organizational/divisional level, not per content item**
- The primary use case is "all Ag content is green/yellow, all Construction content is yellow/black" — a theme governs a body of content, not individual items
- Content items inherit the theme of their parent division/category rather than selecting a theme independently
- **Implication:** Theme management in the portal is an admin configuration task (set up divisions, assign themes); the content editor reflects the inherited theme rather than offering a per-item theme picker
- **Open question:** What is the organizational unit that a theme attaches to? — blocked on taxonomy definition; revisit when the content department defines the hierarchy. Use placeholder levels (e.g. Category, Division) in mockups for now

**Template authoring:**
- **Decision: Vector-provided templates only in v1; customer re-styling and custom creation in a future phase**
- Current state: templates are defined by Vector; customers select from the provided library
- Future state: customers can re-style provided templates (adjust colors, fonts to match their brand) and eventually create net-new templates
- **Implication for v1 UI:** Template management for customers is a read/select experience — browse available templates, preview them, mark favorites or set defaults. No authoring tooling needed in v1
- **Implication for future:** Template re-styling will likely follow the same pattern as themes — a configuration layer on top of a Vector-provided base, not a blank-canvas editor. Design the v1 template detail screen with this in mind so re-style controls can be added without a full redesign
- This "provided now, customizable later" pattern is consistent across templates, voices, and avatars — it should inform how all three are presented in the UI (always show "provided" and "custom" as a concept, even when custom isn't buildable yet)

**Asset availability & approval:**
- **Decision: No approval workflow in v1 — assets are available in the editor as soon as they are created/uploaded**
- Customers are responsible for their own review and governance process in v1; the system does not enforce it
- **Future state:** A formal review/approval workflow will be needed — an asset moves through a draft → approved → available pipeline before appearing in the editor
- **Implication for v1 UI:** Asset status should still be a visible concept (even if it's just "active/inactive") so the future approval workflow can be layered in without restructuring the asset management screens — avoid designing a UI that assumes all assets are always available

#### Implication for Navigation
- "Global Assets & Templates" as a single nav item likely needs sub-navigation within the section (tabs or a secondary sidenav) to switch between Image Assets, Templates, Themes, Avatars, and eventually Voices
- The section is admin-managed but the assets themselves are consumed by content designers in the editor

### Settings

#### Definition
Settings is a **support surface**, not a standalone feature. It does not own any primary workflows — its contents are derived from what the other sections of the portal require for admin setup and maintenance.

#### Currently Defined
- **AI Guidelines** — text-based configuration that influences AI features within the content editor (tone, guardrails, behavior directives, etc.)

#### Derived from Other Sections (anticipated, not exhaustive)
As the portal matures, the following areas are likely to surface settings needs:

| Source | Likely Settings |
|---|---|
| Content Library | Default content lifecycle policy (e.g. sunset duration before hard delete eligibility), default category/taxonomy structure |
| Global Assets & Templates | Asset approval workflow configuration _(future)_, default theme assignment rules |
| Authors | Author role configuration, SME/Author system role management |
| Themes | Organizational unit definitions that themes attach to (divisions, brands, categories) |
| Voices _(future)_ | Approved voice list management, custom voice configuration |

#### Design Principles for Settings
- Settings should only contain things that are **infrequently changed** and **globally scoped** — per-item configuration belongs on the item itself, not here
- Settings is **admin-only** — no content designer access
- Each settings area should be clearly labeled by which feature it governs — avoid a flat undifferentiated list as the section grows
- **Implication for v1 UI:** Settings in v1 is minimal (AI guidelines only); design it as a grouped/extensible layout from the start so new settings areas can be added as sections without a full redesign

---

## Design Principles for This UI

1. **Reduce context switching** — Users should be able to find, edit, and publish content without jumping between disconnected tools
2. **Progressive disclosure** — Global settings and author management are lower-frequency tasks; don't let them compete visually with the content library
3. **Clear ownership** — Brand assets and templates should feel distinct from authored content so users know which things are globally shared vs. per-content
4. **Searchability first** — Content libraries grow large; search and filtering are core, not secondary

---

## Key Relationships Between Sections

```
Content Library
  └── References → Authors (SME attribution on content items)
  └── Uses → Templates (from Global Assets)
  └── Uses → Assets (images, logos, brand elements)

Authors
  └── Persona / Bio / Credentials
  └── Associated Content (which library items credit this author)

Global Assets & Templates
  └── Templates (reusable content structures)
  └── Brand Assets (logos, fonts, colors)

Settings
  └── Global platform configuration
  └── User/role management (TBD — may be separate)
```

---

## Notes & Context

- Author management was identified as a distinct concern: SMEs are transcribed into content, and their professional identity (name, photo, bio, credentials) needs to be maintained independently of the content itself
- Authors exist in two surfaces: a standalone admin management section (authoritative, full CRUD) and a lightweight inline experience within the content editor (attach existing or create a minimal shell)
- The portal should work for both admins managing the system and content designers doing day-to-day content work — the navigation and landing experience may need to adapt to role
- "Global assets" implies shared resources that surface across many content items; changes here have broad impact — the UI should communicate this (e.g., "used in 47 content items")
- Author profiles should carry a completeness status so admins can identify and resolve incomplete shells created during the content editing workflow
