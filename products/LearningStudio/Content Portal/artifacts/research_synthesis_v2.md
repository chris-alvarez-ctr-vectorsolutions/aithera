# Vector Solutions Research Synthesis
### Custom Course Creation & SCORM Import | 11 Participant Interviews

---

## Topline: What This Research Found (Read This First)

**The central finding:** Vector Solutions customers are being pushed toward expensive, slow, and unreliable third-party workflows — custom SCORM vendors, external authoring tools, and manual admin workarounds — not because Vector's content is wrong, but because they cannot make targeted edits to it. The majority of full custom-build decisions trace back to a single slide, a single line of on-screen text, or a single regulatory reference that can't be changed. Simultaneously, the SCORM import pipeline has enough friction that self-built content often takes longer to get live in the platform than it did to create.

**If Vector fixes two things**, most of the workarounds go away:
1. **Subsection-level editing within Vector catalog courses** (add/remove/annotate at the slide or section level)
2. **Self-service SCORM upload** with descriptive error feedback and reliable rendering

Everything else in this report is real and worth addressing — but these two are where customers are leaving money on the table and, in some cases, actively evaluating alternatives.

---

## Research Method Note

11 interviews conducted across fire/EMS, manufacturing, higher education, K–12, and regulated government. Interviews were semi-structured, 45–75 minutes each. Synthesis used affinity clustering across tagged observations before identifying patterns; insights were tested against the "so-what" standard (specific claim + reason + consequence of not acting) before inclusion.

---

## Participants

| Organization | Role(s) Interviewed | Segment |
|---|---|---|
| J.D. Irving (Sawmill) | Training Coordinator | Industrial Manufacturing |
| LA City Fire Department | Vector Coordinator, Captain | Public Safety |
| Manhattan FD (IL) | Training Officer | Public Safety |
| Ohio University | Project Manager + L&D Administrator | Higher Education |
| Plastipak | Dir. of Corporate Learning + LMS Admin | Industrial Manufacturing |
| Renfrew County School Board | ICT Sr. Manager + Software Developer | K–12 |
| South Metro Fire | eLearning LMS Specialist | Public Safety |
| Starbucks | Network Learning Specialist | Retail / Food Manufacturing |
| Texas Alcoholic Beverage Commission | LMS Admin + eLearning Developer | Government |
| Vanderbilt University | Director of Student Accountability | Higher Education |

---

## Insight 1

### Organizations are building full custom SCORM courses to fix problems that a single editable slide or deleted section would have solved.

**Why this is happening:** Vector catalog courses are evaluated by subject matter expert review groups before adoption. These reviews are thorough and often surface one or two blocking elements — a regulatory reference to a U.S. agency when the org is Canadian, a slide recommending contact with a national fraternity headquarters when the institution's policy is to route directly to internal conduct, a section on jailbreaking that the security team considers outdated. Because there is no mechanism to remove or override that element in-platform, the entire course is rejected and a custom build is commissioned.

**Consequence of not acting:** Every rejected Vector course that triggers a custom SCORM build represents: (a) lost Vector catalog revenue the customer is paying for but not using, (b) money flowing to third-party authoring vendors instead of Vector, (c) a 1–3 month development cycle that delays training delivery, and (d) an import process that creates more friction downstream. Vanderbilt has built three custom modules this way. Ohio University is mid-build on a cybersecurity course. TABC has declined to use the customer service module for years. These are not isolated cases.

> *"If we could have just deleted that section — the one about reporting to the headquarters — we probably would have used that module and given you the money."* — Vanderbilt University

> *"There's a course that was brought to me around Christmas. Fantastic course. But it talks about calling the CDC. That is just not right for us. And there was no way to modify it."* — Renfrew County School Board

> *"It could be 70% exactly what we need and 30% would just confuse our employees."* — Plastipak

**What customers actually need:** The ability to remove or hide a specific section or slide within a Vector course. Not module-level suppression (which exists and is appreciated) — subsection or slide-level removal. This is the single highest-impact customization capability missing from the platform.

---

## Insight 2

### On-screen contextual annotation is the customization feature customers reach for most — and it doesn't exist.

**Why this is happening:** Even when a Vector course is substantively correct, there are always gaps between the general content and the organizational context. Customers need to add a specific phone number for their compliance hotline, link to their version of the policy being covered, flag that their state uses different regulatory terminology, or note that a listed government agency has a different Canadian equivalent. The workaround is adding a separate custom slide after the relevant section — but this visually breaks the course, is outside the course's interactive flow, and is often ignored by learners.

**Consequence of not acting:** Customers who cannot annotate inline are making one of two choices: build a full custom course (expensive, slow) or accept that the training is less accurate or relevant than it should be. For legally required training in particular — FERPA, Title IX, hazing, EEO — accepting "close enough" creates compliance risk. Ohio University's registrar's office rejected the Vector FERPA course specifically because they couldn't add links to their own institutional policies within the course flow.

> *"If it's actually in the text of the course as the course is ongoing, that has a lot more impact. Adding a separate slide breaks the continuity."* — Ohio University (Carlos Walker)

> *"We have a specific button we want staff to click in their Gmail to report phishing. It's not something you would put in because it's not vendor-agnostic. We need to show exactly where to go."* — Renfrew County School Board

> *"For Title IX — just being able to add our office's contact information on the screen, at the moment the learner is reading about who to contact — that changes what they actually do."* — Ohio University (Carlos Walker)

**What customers actually need:** Inline on-screen text overlay — the ability to add a text annotation, link, or short block of content to a specific slide or section within a Vector course, rendered as part of the course flow rather than as a separate step.

---

## Insight 3

### Customers are waiting weeks for legally required training to go live because the SCORM import pipeline runs through a human queue.

**Why this is happening:** The current workflow requires custom SCORM files to be routed through a Customer Success Manager, FTP'd to Vector's servers, processed by an internal team, tested, and then made available — a process that participants reported taking 1 to 8 weeks. For most routine training, this is an inconvenience. For legally mandated training (Ohio state legislation requiring a campus act training, TABC policy updates), it is a compliance problem.

**Consequence of not acting:** Ohio University submitted a legally required course in June. At the time of the interview (August), it still had not been imported after multiple follow-ups. This is a direct compliance exposure for the institution. If the pattern is common — and participants across Vanderbilt, Renfrew, South Metro, and Starbucks described versions of the same problem — it represents an ongoing liability for Vector in regulated industries and a strong incentive to evaluate platforms with self-service upload.

> *"I tested Skillsoft's ability to drop the SCORM in and had it up and running within 15 minutes. If Vector could do that, that would be wonderful."* — Ohio University (Michael Greene)

> *"This is a legally required training that we have to have per Ohio state law. Every time we've tried to contact that team since June, we've received static."* — Ohio University (Michael Greene)

> *"I would send our package to Scott, he sends it to the developers, they upload to a test environment, he gets back to me in a week or two. I check it, find an issue, they fix it, wait another week. It's cumbersome."* — Renfrew County School Board

**What customers actually need:** Self-service SCORM upload directly in the platform, with near-real-time processing and clear feedback at each stage (uploading → processing → available). The 15-minute benchmark set by a competitor is the reference point customers are already using.

---

## Insight 4

### When a SCORM course renders incorrectly after import, customers have no path to fix it themselves — and the feedback loop is too slow to catch it before learners are affected.

**Why this is happening:** Post-import rendering issues are common — button overlaps, content sizing mismatches, resume/bookmark failures, unsatisfying end-of-course experiences — and every one of them requires another round trip through the CSM/developer queue. By the time the fix lands, learners may have already experienced the broken version and lost progress or credit.

**Consequence of not acting:** Rendering failures erode learner trust, inflate support ticket volume, and in some cases directly prevent course completion (Renfrew County's government-provided hazing course had a button overlap that blocked navigation entirely). For departments like LAFD with 3,500 members, even a 5% rendering failure rate is 175 people who need manual intervention.

> *"Your Next button was appearing over one of the course's own next buttons. You couldn't continue without resizing your screen to get a sliver."* — Renfrew County School Board

> *"When you come to the end of a custom SCORM course, it times you out. You don't get the completion certificate experience. Very unsatisfying."* — Ohio University (Carlos Walker)

> *"If someone stops a course midway, progress was not saved. They had to start completely over."* — Renfrew County School Board

**What customers actually need:** Three things, in priority order: (1) better pre-import compatibility validation that catches known rendering issues before the file is processed, (2) a preview/sandbox mode where admins can test the learner experience before publishing to their population, and (3) a self-service fix pathway for common rendering issues rather than requiring a support ticket for every one.

---

## Insight 5

### When a course is updated, the new version appears as a completely separate course — orphaning completion records and making employees look non-compliant for training they already finished.

**Why this is happening:** There is no version control system. A revised SCORM file must be uploaded as a new course object. The prior version must be manually inactivated. Any credentials or assignments tied to the old version must be manually reconciled. Prior completion records do not carry forward to the new version, so reporting shows employees as non-compliant even when they completed the training before the update.

**Consequence of not acting:** This is not a minor inconvenience — it creates false compliance records at the executive and auditor level. TABC's compliance team now routinely sees new hires flagged as missing training they completed on an earlier version. J.D. Irving has to email Vector support to manually merge completion records between versions, adding 1–2 days to every course update cycle. For annual mandatory training (EEO, cybersecurity, FERPA) that gets refreshed each cycle, this problem recurs on a fixed schedule across hundreds of organizations.

> *"It'd be nice if we can just upload a new version and it still shows on the credential side that the hire is not missing training when they actually did complete it."* — TABC

> *"If there was a button that said 'pull records from this activity when you're updating' — that would be awesome."* — J.D. Irving

> *"Some people completed version one. I don't want to re-assign version two to them. So I have to inactivate version one, figure out who hasn't completed it, assign version two only to them."* — South Metro FD

**What customers actually need:** Version control with a selectable "carry forward completions" option. When uploading a revised SCORM, the admin should be able to designate it as a new version of an existing course, choose whether prior completions satisfy the new requirement, and have the system maintain a unified completion history across versions.

---

## Insight 6

### The Activity Builder could replace Articulate Rise for a significant share of custom content — but only if it gains conditional step logic and a basic rich text editor.

**Why this is happening:** Several participants described their Articulate Rise workflow and then identified exactly two capabilities that keep them there rather than using Activity Builder: (1) conditional step progression — step 2 does not unlock until step 1 is complete, including video completion — and (2) the ability to format text with headers, bold, bullet lists, and inline images without writing HTML. Everything else they do in Rise is within reach of an enhanced Activity Builder.

**Consequence of not acting:** Customers who need conditional flow must purchase, learn, and maintain a separate authoring tool subscription (Rise, Captivate, Storyline), create content outside the platform, then manage the SCORM import pipeline. This increases cost, complexity, and the failure surface area. South Metro FD stated directly that eliminating the SCORM dependency would be worth it on its own.

> *"If the Activity Builder had conditional flow and the ability for a video not to be fast-forwarded, I wouldn't even need Rise360."* — South Metro FD

> *"I hate that there's not a WYSIWYG editor in the text. I have to know HTML. If we had it, everything would look consistent."* — South Metro FD

> *"What if I just wanted to do a quick PowerPoint slide? It launches another tab. Users get lost. They don't know how to get back."* — Renfrew County School Board

**What customers actually need:** Two Activity Builder enhancements: (1) conditional step logic — a toggle that locks a step until the prior step reaches 100% completion, with special handling for video (cannot fast-forward) — and (2) a WYSIWYG rich text editor with at minimum: headers, bold/italic, bullet/numbered lists, inline image upload, and basic link embedding.

---

## Insight 7

### Fire and EMS departments experience the LMS as fundamentally misaligned with how they actually train — because crew-based learning cannot receive credit in a system built for individual completion.

**Why this is happening:** Fire departments train as companies. It is standard practice to gather the crew in the training room, project content on a screen, and work through material together. A captain facilitates discussion; probationary firefighters benefit from hearing experienced members' reasoning. But SCORM completion tracking is per-user and per-session. A crew of 8 watching content together results in 0 completion records unless each member then individually re-takes the course alone — doubling the time burden and stripping out the collaborative learning value.

**Consequence of not acting:** Fire departments are either (a) not using Vector SCORM content for group training scenarios at all, defaulting to PowerPoint on an Apple TV with no LMS record, or (b) using it only for mandatory compliance checkbox items that they can force members to complete solo. The catalog's fire/rescue content — which Vector has invested in — is largely unused in a segment where it should be a core offering. Manhattan FD explicitly said canned courses are reserved for members who missed live training, as a "punishment."

> *"We all have Apple TVs in our training room. We can broadcast it up there and get through it as a group — but it doesn't clear off everybody's Vector. They still have to go in and do it individually. I have no way of recording a group completion."* — LA City Fire Department

> *"In the fire service we don't do anything by ourselves. We respond together, we eat together, 90% of the time we train together. Except when we're doing your courses — those force us apart."* — Manhattan FD

> *"If we do a group completion and it's done correctly, we can mark everyone as complete. Why can't I do the same thing here?"* — Manhattan FD (describing CAPSI class credit model as the precedent)

**What customers actually need:** A supervisor-attested group completion model — an admin or officer can mark a defined group as having completed a training event, with optional attestation, and the record appears on each individual's training transcript. This mirrors how CAPSI class credit already works in their world. Individual accountability for assessments can coexist with group credit for content viewing.

---

## Insight 8

### Reporting requires manual post-processing in Excel for every organization in this study — and for some, it's generating enough false data to erode leadership trust in the platform.

**Why this is happening:** The current reporting outputs give completion lists, not decision-ready intelligence. Admins export raw completion data and rebuild it in Excel or Power BI to produce department-level dashboards, cross-reference with HR demographics, identify non-compliant groups, and track progress toward compliance windows. Ohio University has had repeated instances where the system shows non-completions for employees who have completion screenshots — a bug that has reached executive HR leadership and generated frustration beyond the L&D team.

**Consequence of not acting:** Every hour admins spend in Excel is an hour not spent on training design or learner support. More critically, false non-completion flags have a concrete organizational impact: managers are chasing employees for training they already finished; HR leaders are questioning the platform's data integrity; and in one case, executive leadership is "very upset at the amount of time" spent reconciling records. If a platform's data can't be trusted, it loses the credibility needed to enforce compliance.

> *"The data we get out of Vector will often throw false flags on non-completions when people have completed. University HR leadership is getting very upset at the amount of time I spend tracking completions."* — Ohio University (Michael Greene)

> *"I want a screen on my wall: Station 2 didn't get their learning done. I pick up the phone. Instead I have to run reports, export them, build in Excel, then I can see it."* — Manhattan FD

> *"I run a report for completions. It shows the title, the duration. But the objective field for SCORM and catalog courses is null. I have to concatenate from the title and fill it manually."* — South Metro FD

**What customers actually need:** At minimum: (1) fix the false non-completion bug causing completion screenshots to not register, and (2) a configurable admin dashboard showing completion status by group/station/department without requiring a report export. Longer term: question-level analytics (which questions are most frequently failed) to enable evidence-based course improvement.

---

## Insight 9

### Learner engagement is uniformly low for long-form compliance courses — and customers know it. The path forward is microlearning + spaced repetition, not more SCORM.

**Why this is happening:** Mandatory annual compliance training is experienced by learners as a checkbox, not learning. Participants across every segment described learners clicking through without reading, fast-forwarding videos, and answering quiz questions by process of elimination. Meanwhile, the operational realities of fire/EMS (call interruptions), manufacturing (line pulls), and retail (shift length) mean a 60-minute course is often abandoned and restarted multiple times. The research literature on skill retention — which Manhattan FD cited directly — shows significant degradation after 90 days without reinforcement.

**Consequence of not acting:** Long-form SCORM that isn't being genuinely consumed isn't training — it's legal cover at best. Departments are increasingly aware that their compliance numbers don't reflect actual knowledge. Customers are exploring alternatives: Canvas (South Metro FD actively evaluating), microlearning platforms, push-notification knowledge checks. If Vector doesn't offer a credible microlearning/spaced repetition path, it risks being supplemented or replaced for the engagement-first use case.

> *"We know those hour-long things aren't effective. They just let them run. If you could come up with something that's more engaging and people actually enjoy — let me know, I'll sign on."* — South Metro FD

> *"After 90 days you start to degrade your skill level. So how do we use that? Hey, you haven't done the chainsaw thing in a while — here's a 30-second TikTok. Oh yeah, I remember."* — Manhattan FD

> *"Every year the cybersecurity training comes around, half a dozen people say: I already know this, can't you just give me an assessment and let me test out?"* — Ohio University

**What customers actually need:** Three capabilities working together: (1) a microlearning format — structured, short-form (5–15 min) course type that doesn't require full SCORM overhead, (2) pre-assessment / test-out — if a learner can demonstrate competency upfront, skip or shorten the course, and (3) scheduled knowledge pushes — the ability to schedule follow-up quiz questions to reinforce a course taken weeks earlier, tied to the same training record.

---

## Insight 10

### The branding conversation is really a consistency conversation — and the thing customers want most is predictable navigation, not logos.

**Why this is happening:** Participants were asked repeatedly about custom branding and logos. When pressed on what they actually meant, most described a different problem: Vector's catalog courses come from multiple content vendors and have inconsistent navigation patterns — different locations for the Next button, different exit behaviors, different progress indicators. Learners who are conditioned to one pattern get lost when another course behaves differently. Two of the more logo-focused organizations (J.D. Irving, Starbucks) framed branding not as aesthetics but as the signal that tells employees "this content is from us and is endorsed by us."

**Consequence of not acting:** Inconsistent navigation across the catalog creates a low-grade but persistent source of learner confusion and support tickets ("how do I get back to where I was?", "why didn't I get credit?"). Exit behavior inconsistencies — some courses require clicking a specific exit button, others auto-save — are generating real completion record failures that fall on admins to resolve. Plastipak reported this as a consistent issue in Journey that they expect to see in Convergence as well.

> *"Does everything have a similar navigation? A similar introduction? A similar exit? You reduce so much frustration — the 'I didn't exit correctly so I didn't get credit' scenario."* — Plastipak

> *"You take a course in green and then all of a sudden you take a Vector training that's blue. The branding is important to keep standardization."* — J.D. Irving

> *"Branding is so important. But beyond the front page, they don't really care. I'd much rather be able to remove course sections."* — Manhattan FD

**What customers actually need:** Consistent UX patterns across the entire Vector catalog — standardized navigation location, consistent auto-save / progress-resume behavior, and a predictable end-of-course completion experience. A white-label/org-branding layer on top of that would have value for specific segments (manufacturing with strong brand identity, universities) but is not the root problem.

---

## Pattern Summary: What Keeps Coming Up

The following patterns appeared across 5 or more interviews and cut across segments. They are listed not as ranked priorities but as durable signals.

**Appeared in 9–11 interviews:**
- Desire to remove or hide specific content within Vector catalog courses
- SCORM import requires too many human handoffs and too much wait time
- No version control for updated courses; completion history breaks on re-upload

**Appeared in 7–8 interviews:**
- On-screen text annotation within existing courses
- Activity Builder needs conditional step logic
- Admin reporting requires Excel post-processing to be usable
- Course catalog is too flat — no filtering by custom vs. Vector, topic, or difficulty

**Appeared in 5–6 interviews:**
- Combining sections from multiple Vector courses into a single assignment
- Microlearning / short-form formats as a distinct content type
- Inconsistent navigation and exit behavior across catalog courses
- SCORM rendering failures post-import (buttons, sizing, resume)
- File size limits create forced course fragmentation

**Appeared in 3–4 interviews (segment-specific but high-intensity):**
- Group/crew completion recording (fire/EMS)
- Translation and multilingual content support (manufacturing, global)
- Digital accessibility compliance / WCAG checking (higher ed, government)
- Learning path sequencing and prerequisite gates (manufacturing, higher ed)
- False non-completion records in reporting (higher ed, manufacturing)

---

## Feature Priority Matrix

The following maps each major ask to the insight it addresses and the segment where demand is strongest.

| Feature | Primary Insight | Highest-Demand Segment |
|---|---|---|
| Subsection/slide-level removal within Vector courses | #1 | Universal |
| On-screen text annotation (inline) | #2 | Higher Ed, Government |
| Self-service SCORM upload | #3 | Universal |
| SCORM rendering validation + preview mode | #4 | Universal |
| Version control with completion carry-forward | #5 | Universal |
| Conditional step logic in Activity Builder | #6 | Fire/EMS, Manufacturing |
| WYSIWYG rich text editor in Activity Builder | #6 | Fire/EMS, Manufacturing |
| Group/crew completion recording | #7 | Fire/EMS |
| Admin dashboard (completion status at a glance) | #8 | Universal |
| False non-completion bug fix | #8 | Higher Ed, Manufacturing |
| Microlearning format + pre-assessment / test-out | #9 | Universal |
| Consistent navigation UX across catalog | #10 | Manufacturing, Retail |
| Multi-course section combining | #1, #2 | Manufacturing, Higher Ed |
| Learning path sequencing / prerequisite gates | #9 | Manufacturing, Higher Ed |
| Translation / multilingual authoring support | — | Manufacturing (global) |
| WCAG compliance checking in authoring workflow | — | Higher Ed, Government |

---

## What This Research Does Not Tell Us

These are questions the data raises but cannot answer from 11 interviews:

- How frequently does the "one blocking element" pattern occur at scale — i.e., what percentage of Vector courses fail SME review for customization-fixable reasons?
- What is the actual revenue impact of the third-party SCORM vendor spend that could be captured by Vector?
- How do these findings generalize to segments not represented here (healthcare, K–12 students, hospitality)?
- What is the feasibility timeline and engineering cost for self-service SCORM upload — and what are the platform safety/quality tradeoffs?
- Would a group completion model satisfy CAPSI and state fire marshal compliance requirements, or would it create new audit risk?

---

*Research conducted by Virginia Pollock and Austin Smith, Vector Solutions UX/Design Team.*
*Synthesis methodology: observation tagging → affinity clustering → pattern identification → insight drafting → so-what validation.*
