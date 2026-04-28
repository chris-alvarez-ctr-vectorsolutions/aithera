# Content Portal — Site Map

**Product:** LearningStudio  
**Area:** Content Portal  
**Last Updated:** 2026-04-27 (revised after research synthesis)  

---

## Personas

### P1 — Content Admin
- Full access to all portal sections
- Owns author profile management, global assets, themes, and settings
- May also perform content designer tasks in smaller organizations

### P2 — Content Designer
- Primary daily user of the portal
- Focused on content library: creating, editing, and managing content items
- Can create author shells and attach authors to content
- No access to Settings; limited access to Global Assets (read/select only in v1)

### P3 — SME / Author (System User)
- Limited, targeted access
- Logs in to review content they are tagged to during the design/review phase
- Does not manage content, assets, or settings
- Represented in the system as both a user account and a linked author profile

### P4 — SME (Attribution Only)
- No system access
- Exists solely as an author profile record
- Their public-facing identity (name, bio, headshot) surfaces in the LMS for end learners

### P5 — Content Director / Strategic Buyer _(future persona — not in v1)_
- Decision-maker and quality standards owner; not a daily portal user
- Primary surface will be a **dashboard and approval workflow** — neither of which exists in v1
- In the portal their role is anticipated to be: reviewing high-level content metrics, approving assets or content before they go live, and monitoring program health
- Grounded in research Persona E (Strategic Buyer): cares about reducing third-party vendor dependency, catalog quality consistency, and having executive-ready data without manual construction
- **Design implication:** Do not design v1 screens around this persona's needs, but do not close the door on their surface either — the content library, content detail screen, and asset management screens should be designed so a read-only director view and an approval layer can be added without restructuring
- **Triggers for activating this persona in design:** when a dashboard feature is scoped, when asset/content approval workflow is built, or when role-based access expands beyond Admin / Designer / SME

---

## System Context

The Content Portal and its editor are **delivery-agnostic** — they serve as the content creation and management layer for multiple LMS delivery products. The portal does not own LMS data (assignments, completions, enrollments). Cross-system usage data is a future integration concern.

---

## Site Map

```
Content Portal
│
├── Content Library                          [P1, P2]
│   ├── Library List View
│   │   ├── Search & Filter Bar
│   │   │   ├── Filter: Content Type (Course; future: micro-learning, experience, etc.)
│   │   │   ├── Filter: Ownership (Vector-provided / My Content)
│   │   │   ├── Filter: Status (Draft / Published / Archived / Sunset)
│   │   │   └── Filter: Category [stub — taxonomy TBD]
│   │   ├── Bulk Action Toolbar (appears on selection)
│   │   │   ├── Archive
│   │   │   └── [Additional bulk actions TBD]
│   │   └── Content Item Row / Card
│   │       ├── Visible attributes: title, content type, ownership, status, duration
│   │       ├── Vector-provided item actions: View Detail, Start From
│   │       └── Customer-owned item actions: View Detail, Edit, Edit Catalog Details,
│   │                                         Duplicate, Archive, Delete [lifecycle-gated]
│   │
│   ├── Content Detail Screen                [P1, P2]
│   │   ├── Metadata summary (title, type, status, duration, authors, theme)
│   │   ├── Catalog Details (read-only for Vector-provided; editable for customer-owned)
│   │   │   ├── Thumbnail image
│   │   │   ├── Title
│   │   │   └── Description
│   │   ├── Usage / Impact [future — LMS integration TBD]
│   │   │   ├── Active assignments [across connected LMS products]
│   │   │   ├── Total completions
│   │   │   └── Last published date
│   │   └── Actions
│   │       ├── Vector-provided: Start From [prominent]
│   │       └── Customer-owned: Edit Content, Edit Catalog Details, Archive,
│   │                            Delete [lifecycle-gated]
│   │
│   ├── Start From Flow                      [P1, P2]
│   │   ├── Name new item
│   │   └── Place in library [stub — category/location picker, taxonomy TBD]
│   │
│   └── Content Editor                       [P1, P2]
│       ├── [Separate tool — launched from library]
│       └── Author Picker (inline)
│           ├── Search existing authors
│           ├── Attach existing author
│           └── Create new author shell
│               ├── Author Name [required]
│               └── [Additional fields TBD — minimal at creation]
│
├── Authors                                  [P1, P2 limited]
│   ├── Author List View
│   │   ├── Search & Filter Bar
│   │   │   ├── Filter: Profile completeness (Complete / Incomplete)
│   │   │   └── Filter: Linked user account (Linked / Unlinked)
│   │   └── Author Row
│   │       ├── Completeness indicator
│   │       ├── Linked account indicator
│   │       └── Actions: View Profile, Edit [P1 full / P2 limited], Archive [P1]
│   │
│   └── Author Profile Screen
│       ├── Public-Facing Identity [P1 editable]
│       │   ├── Author Name
│       │   ├── Headshot / Photo
│       │   ├── Bio
│       │   ├── Credentials
│       │   └── Areas of Expertise
│       ├── Profile Completeness Indicator
│       ├── Linked User Account [P1 only]
│       │   ├── Link to existing user (SME/Author role required)
│       │   └── Unlink user account
│       ├── Associated Content
│       │   └── List of content items this author is credited on
│       └── Actions: Edit, Archive [P1]; Create Shell [P2]
│
├── ── ── ── ── ── ── ── [divider] ── ── ── ── ── ── ──
│
├── Global Assets & Templates                [P1 manage; P2 read/select in editor]
│   │
│   ├── Image Assets
│   │   ├── Asset List (grid/library view)
│   │   │   ├── Status indicator (Active / Inactive)
│   │   │   └── Actions: Preview, Edit, Deactivate, Delete
│   │   └── Upload New Asset
│   │
│   ├── Templates
│   │   ├── Template List
│   │   │   ├── Vector-provided templates (read-only in v1; re-styleable future)
│   │   │   ├── Customer templates [future]
│   │   │   └── Status indicator
│   │   └── Template Detail / Preview
│   │
│   ├── Themes
│   │   ├── Theme List
│   │   │   └── Per organizational unit [unit TBD — taxonomy dependency]
│   │   ├── Theme Detail
│   │   │   ├── Color palette
│   │   │   ├── Typography
│   │   │   └── Assigned to [organizational unit]
│   │   └── Create / Edit Theme
│   │
│   ├── Avatars
│   │   ├── Avatar List
│   │   │   ├── Vector-provided avatars
│   │   │   └── Customer avatars
│   │   ├── Avatar Detail / Preview
│   │   └── Create / Configure Avatar
│   │       └── [Creation depth TBD — builder vs. upload]
│   │
│   └── Voices [future]
│       ├── Provided Voices (approved list)
│       └── Custom Voices [future]
│
└── Settings                                 [P1 only]
    ├── AI Guidelines
    │   └── Guideline text configuration (tone, guardrails, behavior directives)
    └── [Additional settings TBD — derived from feature needs as portal matures]
```

---

## Persona Access Matrix

_P5 (Content Director) is a future persona with no defined access in v1 — omitted from this matrix until their surface is scoped._

| Section | P1 Admin | P2 Designer | P3 SME (User) | P4 SME (Attribution) |
|---|---|---|---|---|
| Content Library — Browse | ✓ | ✓ | — | — |
| Content Library — Create / Edit | ✓ | ✓ | — | — |
| Content Library — Archive / Delete | ✓ | ✓ limited | — | — |
| Content Library — Start From | ✓ | ✓ | — | — |
| Content Review (tagged content) | ✓ | ✓ | ✓ | — |
| Authors — Browse list | ✓ | ✓ | — | — |
| Authors — Full profile edit | ✓ | — | — | — |
| Authors — Create shell | ✓ | ✓ | — | — |
| Authors — Link user account | ✓ | — | — | — |
| Global Assets — Browse / Select | ✓ | ✓ (in editor) | — | — |
| Global Assets — Manage / Upload | ✓ | — | — | — |
| Themes — View | ✓ | ✓ (in editor) | — | — |
| Themes — Create / Edit | ✓ | — | — | — |
| Settings | ✓ | — | — | — |

---

## Key Flows

### Content Designer — Daily Workflow
1. Land on **Content Library**
2. Locate content item (search / filter)
3. Open item → **Content Editor**
4. Attach or create author via inline **Author Picker**
5. Save / publish

### Content Admin — Author Maintenance
1. Navigate to **Authors**
2. Filter by incomplete profiles
3. Open author profile → complete missing fields
4. Optionally link a system user account (SME/Author role users only)

### Content Admin — New Customer Onboarding (Brand Setup)
1. Navigate to **Global Assets & Templates**
2. Upload brand **Image Assets**
3. Create **Theme(s)** per organizational division
4. Configure **Avatar(s)** for AI narration
5. Navigate to **Settings** → configure AI Guidelines

### Content Designer — Start From Vector Content
1. Locate Vector-provided content item in **Content Library**
2. Select **Start From**
3. Name the new item and place it in the library
4. New draft appears in library as customer-owned content
5. Open in **Content Editor**

---

## Open Dependencies

| Item | Blocked On | Impact |
|---|---|---|
| Taxonomy / hierarchy levels | Content department definition | Library filter structure, theme assignment unit, "Start From" placement step |
| Sunset process detail | Product policy decision | Content lifecycle states, delete eligibility rules |
| Avatar creation depth | Product / engineering scoping | Avatar management UI complexity |
| Bulk operation action list | Further design definition | Bulk action toolbar contents |
| P2 archive/delete permission scope | Permissions design | Which lifecycle actions designers can perform vs. admin-only |
| LMS usage data (assignments, completions) | Multi-LMS integration feasibility | Whether Usage / Impact section on content detail screen can be populated at launch |
