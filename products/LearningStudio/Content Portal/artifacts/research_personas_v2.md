# Vector Solutions Research Personas
### Custom Course Creation & SCORM Import Study

---

## How These Personas Were Built

These personas are behavioral archetypes grounded in observation clusters from 11 interviews, not assumed demographics. Each persona was defined by a recurring **behavioral pattern** — a characteristic way of making decisions, hitting friction, and workarounds — rather than by job title or industry. The same behavioral pattern appeared across different titles and sectors, which is why the personas cross segment lines.

Each persona includes: who they are, what they need, where they hit the wall, how they'd respond to planned feature enhancements, and what a good testing scenario looks like.

---

## Persona A — The Self-Sufficient Builder
*"I taught myself Articulate on YouTube. Give me the tool and I'll figure it out. What I can't afford is to be blocked by the system when I'm ready to ship."*

### Who This Is
The Self-Sufficient Builder is a training practitioner who has developed real authoring skill through self-teaching and iteration. They are almost always working alone or with one direct collaborator. They know enough to build effective training — but they are not a professional instructional designer and they don't have a team to absorb blockers. When the platform creates friction (SCORM import delays, unclear errors, Activity Builder limitations), it hits them harder because there's no one to escalate to or workaround the problem for them.

**Representative participants:** Leo Jolin (J.D. Irving), Thomas Lombard (South Metro FD), Mary Jeffrey (TABC), Sarah Burks (Starbucks)

**Role titles in the wild:** Training Coordinator, eLearning LMS Specialist, Network Learning Specialist, eLearning Developer

### Goals
- Build and ship training fast enough to stay ahead of operational changes and requests
- Create content that looks consistent and professional without a design degree
- Reduce the overhead cost (time, tools, re-work) of getting custom content into the LMS
- Be self-reliant: resolve problems without opening a ticket or waiting on a CSM

### Core Friction Points
**1. The SCORM tax.** Building the course is one project. Publishing it, zipping it, uploading it, checking rendering, fixing rendering issues, re-uploading — that's a second project of equal or greater time cost. For a solo practitioner, this is brutal.

**2. The Activity Builder glass ceiling.** They can build 80% of what they need in the Activity Builder — until they hit the conditional step wall. Once they need step 2 to lock until step 1 completes, they're forced into Rise/Captivate, which adds an entire tool's worth of overhead for what should be a checkbox.

**3. Vague errors with no self-serve resolution.** "Bad error" as a response to a failed upload means they have to stop, email support, wait, and come back. Each instance is small but they compound across a month of work.

**4. Version updates that break completion history.** They update courses regularly (equipment changes, policy tweaks, typo fixes). Each update triggering a manual CSM-assisted merge of completion records is a recurring tax on every course in their portfolio.

### What They Need (Ranked)
1. Self-service SCORM upload with descriptive error messages
2. Conditional step unlock + video fast-forward prevention in Activity Builder
3. WYSIWYG rich text editor in Activity Builder
4. SCORM version control with "carry forward completions" option
5. Inline image embedding in activities
6. File size limits that accommodate real-world course sizes (750MB+ for video-heavy content)

### How They'd Respond to Planned Features

**Self-service SCORM upload:** High positive response. This directly removes the single biggest recurring friction point. Must be fast (15-minute benchmark from Skillsoft was cited as the reference). Error messages must be specific and actionable ("description field exceeds 250 characters" not "bad error").

**Activity Builder: conditional steps:** High positive response. Will immediately migrate workflows from Rise to the Activity Builder for standard EMS/safety content. Test whether they discover this feature intuitively or whether it needs surfacing.

**Version control:** Strong positive, especially for those managing annual mandatory training cycles (cybersecurity, compliance). Watch for confusion about what "carry forward" means — they'll want certainty that prior completions won't disappear.

### Testing Scenario
*"You've just finished updating your lockout/tagout course in Rise — fixed three outdated photos and corrected a policy reference. Walk me through how you'd get this new version live without affecting the 43 people who already completed the previous version."*

Watch for: Current workaround exposure (manual inactivation + CSM contact); reaction to version control UI; anxiety about whether old records are safe.

---

## Persona B — The Pipeline Manager
*"I'm not the one building the courses. I'm the one who makes sure everything that's supposed to be in the system is in the system, assigned to the right people, and showing the right status."*

### Who This Is
The Pipeline Manager owns the LMS infrastructure but not the content. They sit at the intersection of instructional designers who build courses, subject matter experts who approve them, HR and compliance teams who need reports, and learners who take the training. Their job is to keep the system accurate and the stakeholders informed. They have a high tolerance for complexity in assignment logic and a very low tolerance for data integrity failures.

**Representative participants:** Carlos Walker (Ohio University), Melissa Lark (Plastipak), Dan Cistone (TABC)

**Role titles in the wild:** Project Manager (OIT), LMS Administrator, Training Administrator

### Goals
- Know at a glance who has and hasn't completed required training, for any group in the org
- Manage the course library without being buried in an undifferentiated list of 2,000+ items
- Get custom SCORM files from the instructional designer into the platform without a week-long handoff
- Eliminate the Excel post-processing step from their reporting workflow

### Core Friction Points
**1. The course library is a flat list.** There's no way to distinguish custom content from Vector catalog content in the admin view. Finding a specific course requires exact title matching — one missing word in the search query and it won't surface. With 2,000+ items in a large org, navigation becomes a daily source of friction.

**2. The reporting gap.** Exports contain raw data. Getting to "who in the Engineering department hasn't finished cybersecurity training this quarter" requires exporting, opening Excel, building a pivot, cross-referencing HR demographics. This happens weekly for some participants.

**3. False non-completions.** Ohio University's instance had a persistent bug generating non-complete records for employees who had completion screenshots. At scale (10,000+ users), this is not a data anomaly — it's a data integrity failure that has reached VP-level HR leadership.

**4. The SCORM handoff.** They receive a zip file from the instructional designer and have no way to import it themselves. They have to route it through a CSM and wait. If there's a rendering problem, they hear about it after learners have already experienced it.

### What They Need (Ranked)
1. Course library filtering and categorization (custom vs. Vector, by topic, by department)
2. Admin dashboard: at-a-glance completion status by group/station/department
3. Self-service SCORM upload (even if they're not the one building the course, they're the one trying to get it live)
4. Fix for false non-completion records
5. Version control — completion history continuity across course updates
6. Configurable session timeout (3-hour default is too long for shared-device environments)

### How They'd Respond to Planned Features

**Course library filtering/tagging:** Immediate relief. The "naming convention as a workaround" system (prefixing everything with "TABC-" or "OU-") is a sign of an absent feature, not a viable long-term strategy.

**Admin dashboard:** High value but needs configurability. They want to filter by the org structures they actually use (department, shift, station, job type) — not just a flat org-wide view.

**Self-service upload:** Relieves a blocker they hit on every custom course cycle. Watch for: whether they want to be the one to upload or whether they want to hand off to the instructional designer with confidence it'll land correctly.

### Testing Scenario
*"Your compliance window closes in two weeks. Show me how you'd find out which employees in the Finance department still haven't completed the FERPA training, and send that list to their manager."*

Watch for: Where they start (report? dashboard? course library?); how many steps it takes; whether they hit the Excel step; reaction to a dashboard alternative.

---

## Persona C — The Craft-Focused Designer
*"I care about whether this is actually worth taking. The accessibility, the institutional branding, the screen reader behavior — those aren't nice-to-haves. They're the job."*

### Who This Is
The Craft-Focused Designer is a dedicated instructional designer who brings professional learning design standards to their work. They are fluent in at least one authoring tool (Rise, Storyline, Captivate) and have developed institutional templates and workflows over years. They have the highest standards in the room for what a "good" course looks like — and the highest sensitivity to what breaks. They are often the internal champion for accessibility compliance and the person who catches all the rendering bugs.

**Representative participants:** Michael Greene (Ohio University), Mary Jeffrey (TABC), Sarah Burks (Starbucks)

**Role titles in the wild:** Learning & Development Administrator, eLearning Developer, Learning Specialist, Instructional Designer

### Goals
- Produce courses that meet accessibility standards (WCAG/AODA) without adding significant overhead to the build process
- Make courses look and feel like they come from the institution, not a generic vendor
- Reduce the cycle time between "course complete" and "live in the LMS" without sacrificing quality
- Have a proper review and feedback loop with SMEs — tracked, organized, actionable

### Core Friction Points
**1. The import pipeline is opaque and slow.** They build a course to professional standards, then hand it off and wait. They can't monitor status. They can't test it themselves before it hits learners. When a rendering issue appears, it's already in production.

**2. The end-of-course UX breaks their work.** The completion experience at the end of a custom SCORM course in Vector doesn't match what they designed. The platform overrides their carefully crafted end state with a timeout or redirect that confuses learners and generates support contacts.

**3. There's no way to clear test data.** They test courses before publishing, which creates phantom completion records they can't erase. This means they can't re-test without generating misleading data.

**4. The accessibility story is unclear.** They are under WCAG and/or AODA compliance mandates and need to know that what they build will pass screen reader tests within the Vector player. This is not just a preference — it's a legal requirement for their institution.

### What They Need (Ranked)
1. Self-service SCORM upload with preview/sandbox mode before publishing to learners
2. Consistent, predictable end-of-course completion experience for custom SCORM
3. Ability to clear test session data (test mode that doesn't write permanent records)
4. WCAG compliance tooling in the authoring or import workflow
5. Peer review and comment functionality integrated with the LMS (not just Articulate Review)
6. Custom branding/color theming applied to the Vector player for white-label feel

### How They'd Respond to Planned Features

**SCORM sandbox/preview:** Very high positive. This is the single step that currently requires a CSM handoff for quality assurance. They'd use this every time.

**End-of-course consistency:** Relief more than excitement — this is a longstanding annoyance. Will want to see it not just for completion state but for the full resume/bookmark experience.

**WCAG checking:** High value for higher ed and government segments. Will want to understand what the checker actually validates — they know enough to ask hard questions about screen reader behavior vs. color contrast vs. keyboard navigation.

### Testing Scenario
*"You've built a 20-minute FERPA training in Rise and it's approved by your SMEs. Walk me through how you'd get it into Vector and make sure it's working correctly before you assign it to 4,000 employees."*

Watch for: Where they expect to hit the CSM handoff; their reaction to a self-service alternative; anxiety about quality assurance without the test step; questions about how test data is handled.

---

## Persona D — The Operational Trainer
*"We don't train alone. We don't respond alone. We don't eat alone. So why does your software make us learn alone?"*

### Who This Is
The Operational Trainer works in an environment where safety, proficiency, and team cohesion are inseparable. They are usually a working professional (firefighter, paramedic) who has been assigned training technology responsibilities on top of an operational role. Their most important insight is that learning is social and contextual — and any training tool that disrupts the crew dynamic is working against them, not with them. They have varying levels of tech sophistication but a very clear picture of what works and what doesn't in their environment.

**Representative participants:** Sean Welch (LAFD), Dave Piper (Manhattan FD), Thomas Lombard (South Metro FD)

**Role titles in the wild:** Vector Solutions Coordinator, Captain (In-Service Training), eLearning LMS Specialist

### Goals
- Record credit for training that actually happened — including group training in a room together
- Deliver content that fits a 20–30 minute lineup window, not a 90-minute solo SCORM session
- Keep EMS continuing education credits current for 3,500+ members with minimal admin overhead
- Surface relevant refresher content to members on a scheduled basis to maintain proficiency

### Core Friction Points
**1. Group training earns no credit.** This is the defining frustration for this persona. Crew-based learning is the norm; individual LMS completion is the mandate. These two things are in direct conflict, and every workaround (forcing members to solo re-take, force-completing records, skipping LMS tracking entirely for live training) is a compromise.

**2. External SCORM files don't import cleanly.** Fire and EMS departments receive SCORM files from county DHS, regional training groups, and state agencies. These files have inconsistent quality and frequently render incorrectly in Vector — timer failures, button overlaps, navigation errors. Participants can't fix these because they didn't build them.

**3. Course catalog is too flat to navigate.** Typing "EMS" into search returns 500 results with no way to filter by CE category, time estimate, or credential bucket. Finding the right course for a specific CAPSI requirement is manual and time-consuming.

**4. Timer bugs in Vector-provided EMS courses.** Multiple participants reported a period where EMS continuing education timers were not advancing correctly, effectively making courses incompletable. This generated dozens of member complaints and required manual force-completions.

### What They Need (Ranked)
1. Supervisor-attested group completion recording
2. Microlearning format: structured short-form (≤30 min) content type that earns CE credit
3. SCORM import reliability improvements for externally sourced files
4. Richer course catalog filtering (CE category, topic, duration, credential bucket)
5. Scheduled refresher push: ability to queue a 3-question follow-up to reinforce prior training
6. Timer bug resolution for Vector-provided EMS content (fix confirmed in-flight; verify resolution)

### How They'd Respond to Planned Features

**Group completion:** Transformative. This is the single feature that could shift SCORM from "compliance checkbox tool" to "real training infrastructure" for this segment. Testing must explore: what counts as a valid group (crew roster? manual list? station assignment?), who can attest (captain only? any officer?), and whether assessments need to remain individual.

**Microlearning format:** High positive, with a specific operational requirement — must fit in a lineup window (20–30 min maximum), must be projectable on a shared display, and ideally supports a group-discusses-then-individual-confirms model.

**Catalog filtering:** Moderate positive; good hygiene but not urgent. They will use it once built but aren't blocked today.

### Testing Scenario
*"Your crew watched the county DHS EMS update this morning in the training room. It took 25 minutes and you had 8 members present. Show me how you'd record credit for everyone."*

Watch for: Whether they try the existing system (knowing it won't work), how they expect a group completion flow to work, what verification they'd consider sufficient, whether they'd trust a record generated this way to hold up in a CAPSI audit.

---

## Persona E — The Strategic Buyer
*"I'm thinking five years out. I need the platform to grow with us. And I need to stop paying a third party to do things Vector could be doing itself."*

### Who This Is
The Strategic Buyer is not in the LMS daily. They are the person who decides what gets built, which vendors are used, whether to renew, and what "good" looks like for the institution's training program. They are outcome-focused and have strong opinions about learner experience quality. They are the ones most likely to switch platforms or authorize a third-party SCORM vendor — and the ones most capable of becoming a strong internal champion for Vector if the platform earns it.

**Representative participants:** Dr. Jeremy Bourgion (Vanderbilt), Mary Eastridge (Plastipak), Dave Piper (Manhattan FD)

**Role titles in the wild:** Director of Student Accountability, Director of Corporate Learning, Training Officer (senior)

### Goals
- Reduce dependency on expensive, slow third-party SCORM development vendors
- Build a measurable training program with data that reaches executive level without manual construction
- Ensure institutional quality standards are met — both content accuracy and production quality
- Use Vector's catalog to cover as much ground as possible, with customization to close the gaps

### Core Friction Points
**1. The third-party vendor relationship is painful and expensive.** Coordination across Vector + an outside vendor + internal SMEs + legal review creates a 3–4 party project for every custom module. Compatibility issues (SCORM size mismatch, rendering failures) compound across all three relationships. Vanderbilt convened a three-party meeting between their outside vendor and Vector just to resolve persistent import issues.

**2. Customization is all-or-nothing.** A single blocking element in a Vector course triggers a full rebuild. There is no middle path. If slide-level customization existed, a meaningful share of their custom builds would be unnecessary — and the third-party vendor relationship would shrink accordingly.

**3. The platform doesn't feel like it's evolving toward their needs.** They want to see a roadmap signal: that Vector is moving toward native authoring, better analytics, more sophisticated learner engagement. Without that, the question isn't whether to supplement — it's when.

**4. Quality inconsistency in the catalog.** Different production values, visual styles, and interaction quality across Vector catalog courses signals to their reviewers that the content comes from multiple sources with different standards. This makes SME review harder and institutional adoption feel riskier.

### What They Need (Ranked)
1. Subsection-level editing within Vector courses (the capability that prevents the third-party vendor call)
2. Multi-course section combining — ability to build a custom course from sections of multiple Vector courses
3. Program-level analytics: completion dashboards by cohort, trend over time, question failure analysis
4. Gamification and branching scenario capabilities (not immediately, but on the roadmap)
5. A content design services offering from Vector (reduce/eliminate third-party vendor dependency)
6. Consistent visual quality and UX patterns across the catalog

### How They'd Respond to Planned Features

**Subsection-level editing:** This is the unlock. If they can remove the one blocking element, they can avoid the third-party build. This will not satisfy all their custom needs — truly institution-specific content (Vanderbilt's bird narrator, Ohio's campus-specific phishing examples) will still be built custom — but it would reduce the full-build trigger from "one wrong slide" to "genuinely missing or irreplaceable content."

**Program analytics/dashboard:** High positive. They'll immediately want to configure it by the cohort structures that matter to their organization (grad school vs. undergrad, new hire cohort, department). Watch for: whether default views are too generic to be useful.

**AI-assisted content scaffolding:** Open to it as an efficiency tool, skeptical of it as a quality tool. Will use it to generate outlines and draft questions; will not trust it to write compliance-specific or brand-sensitive content. "The robot gets me started; I finish it."

### Testing Scenario
*"You've identified that Vector's hazing module is 90% of what you need, but there are two slides that contradict your institution's reporting policy. Show me how you'd handle that."*

Watch for: Whether they go to the editing tools immediately or default to their mental model of "build custom"; the level of control they expect (slide-level? section-level? text overlay?); what a satisfying outcome looks like vs. what feels like a workaround.

---

## Persona Comparison at a Glance

| | A: Self-Sufficient Builder | B: Pipeline Manager | C: Craft-Focused Designer | D: Operational Trainer | E: Strategic Buyer |
|---|---|---|---|---|---|
| **Core job** | Build and ship training | Keep the system accurate | Make content worth taking | Train the crew | Set direction and standards |
| **In the LMS** | 15–25 hrs/week | 10–20 hrs/week | 5–15 hrs/week | 3–8 hrs/week | 1–3 hrs/week |
| **Highest frustration** | SCORM import overhead | False non-completions + flat library | Import opacity + end-of-course UX | Can't record group credit | One bad slide = full rebuild |
| **Most wanted feature** | Self-service upload + conditional steps | Admin dashboard + course library filtering | Upload sandbox + WCAG tooling | Group completion recording | Subsection editing within Vector courses |
| **AI posture** | Cautious (policy/IP concerns) | Neutral | Low need | Not relevant | Efficiency tool; not quality tool |
| **Switch risk** | Medium — if tools stay limited | Low — operationally embedded | Low — tool loyalty to authoring platform | Medium — actively evaluating Canvas | High — if platform doesn't show momentum |

---

## Activation Guide for Feature Testing

### Subsection/slide-level course editing
**Activate with:** Persona E (Strategic Buyer) for strategic framing; Persona C (Craft-Focused Designer) for UX execution detail
**Core scenario:** "One slide in this Vector course contradicts your policy. Show me what you'd do."
**Risk to probe:** Do they expect slide-level or section-level? Is "hide" enough or do they need "remove"? What happens to the audio track if they remove a slide with narration?

### Self-service SCORM upload
**Activate with:** Persona A (Self-Sufficient Builder) and Persona C (Craft-Focused Designer)
**Core scenario:** "You've just exported your Rise course. Get it live in Vector."
**Risk to probe:** Speed expectation (15 min is the benchmark); reaction to processing delay; trust in the rendered output without a CSM check.

### Conditional step logic in Activity Builder
**Activate with:** Persona A (Self-Sufficient Builder)
**Core scenario:** "Set up a training where learners can't take the quiz until they've watched the full video."
**Risk to probe:** Discoverability — do they find the feature without being told it exists? Do they trust it works without testing with a learner?

### Group completion recording
**Activate with:** Persona D (Operational Trainer)
**Core scenario:** "8 crew members just completed 25 minutes of group training in the training room. Record credit."
**Risk to probe:** What they consider sufficient proof of attendance; whether individual assessments still need to be separate; CAPSI compliance implications.

### Admin dashboard / reporting
**Activate with:** Persona B (Pipeline Manager)
**Core scenario:** "Compliance window closes in two weeks. Show me who in Finance hasn't finished FERPA training."
**Risk to probe:** Whether they default to export+Excel even when a dashboard exists; what filters they reach for first; what they'd need to trust the data without verifying in a report.

### Version control / course update
**Activate with:** Persona A (Self-Sufficient Builder) and Persona B (Pipeline Manager)
**Core scenario:** "You've corrected a compliance error. Update the course without making the 200 people who completed it re-take it."
**Risk to probe:** Anxiety about existing records disappearing; desire for optional "require retake" toggle; understanding of what "version" means in their mental model.

---

*Personas developed from direct observation data by Virginia Pollock and Austin Smith, Vector Solutions UX/Design Team.*
*Methodology: behavioral pattern clustering across 11 interviews; personas validated against the full transcript set before finalization.*
*All names are fictional composites. Participant quotes attributed to organizations, not personas.*
