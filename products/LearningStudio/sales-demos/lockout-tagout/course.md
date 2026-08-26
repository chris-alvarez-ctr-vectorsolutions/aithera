# Lockout Tagout for Authorized Employees
sku: DEMO-LOTO-101

<!--
  Source of truth for this demo.
  After editing:  node _kit/build-course.js lockout-tagout

  STATUS — built from screenshots, in progress
    · Title and SKU confirmed. The SKU is DELIBERATELY FAKE: demos must
      never show a real catalog SKU. Keep any replacement fake too.
    · Sections 1-5: titles + durations captured.
    · Section 3 LOs: all 8 captured with durations.
    · Still needed: LO objectives, LOs for sections 1, 2, 4 and 5, and
      scene-level detail (transcripts + images) for whichever LOs the
      click path visits.

  CLICK PATHS
    An LO with "#### scene" blocks is CLICKABLE and opens the object
    manager. One without is a stub — plain text in the course overview.
    Nothing is clickable yet; scenes get added as the click path is
    decided.

  DURATIONS
    The source screenshots show ROUNDED per-object durations; the Studio
    interface uses exact values. The durations here are transcribed from
    those rounded displays, so section and course totals computed from
    them may differ slightly from the rounded section labels
    (e.g. section 3's header said "6 minutes"). The computed value is
    the one to trust — never hand-total.
-->

## Introduction
<!-- Source showed a rounded "1 minute"; the two objects below sum to 1:43.
     The computed total wins. -->

<!-- The section's title card. It shares the section's name, so `type:`
     marks it explicitly rather than relying on name-based detection.
     No scenes yet, so its duration is authored directly. -->
### Introduction
type: title-card
state: not-started
duration: 0:08

### Course Overview
objective: Describe the purpose and scope of lockout/tagout training and identify who is required to complete it
state: not-started
duration: 1:35


## Hazardous Energy
<!-- Source showed a rounded "10 minutes"; the title card + 7 LOs below
     sum to 10:32. The computed total wins. -->

<!-- The section's title card. It shares the section's name, so `type:`
     marks it explicitly rather than relying on name-based detection.
     No scenes yet, so its duration is authored directly. -->
### Hazardous Energy
type: title-card
state: not-started
duration: 0:06

### The Hazardous Energy Problem
objective: Explain why unexpected energization or release of stored energy during servicing puts workers at risk
state: not-started
duration: 0:54

### The Hazardous Energy Solution
objective: Describe how an energy control program prevents injury by isolating equipment before service begins
state: not-started
duration: 0:43

### Hazardous Energy Isolation
objective: Identify the energy-isolating device for a piece of equipment and explain what isolation does and does not accomplish
state: not-started
duration: 1:17

### Identifying Sources of Hazardous Energy
objective: Identify the primary sources of hazardous energy in the workplace and explain why each must be controlled before servicing equipment
state: not-started
duration: 1:28

### Identifying Secondary Energy Sources
objective: Recognize stored and residual energy sources that remain hazardous after the primary source is isolated
state: not-started
duration: 0:40

### Hazardous Energy Control Procedures
objective: Apply the sequence of steps in a written energy control procedure to shut down, isolate, lock out, and verify equipment
state: not-started
duration: 4:46

### Testing
objective: Verify that all energy sources are isolated and that the equipment cannot start before beginning work
state: not-started
duration: 0:38


## Lockout/Tagout Program Requirements
<!-- Source shows 6 minutes. The title card + 7 LOs below sum to 6:47.
     The 0:06 second object from the source list was dropped: the 0:10
     object serves as the section title card. -->

<!-- The section's title card. It shares the section's name, so `type:`
     marks it explicitly rather than relying on name-based detection.
     Title scenes carry an image but no transcript. -->
### Lockout/Tagout Program Requirements
type: title-card
state: not-started

#### scene 1 | 0:10 | section3-title-card-img.png

### Authorized Employee Roles and Responsibilities
objective: Distinguish between authorized, affected, and other employees and describe the responsibilities each role carries during a lockout
state: not-started
duration: 1:12

<!-- The demo's click path. This is the only LO with scene detail, so it
     and the section title card are the only clickable objects in the
     course. Duration (0:55) derives from the scenes below — the source
     list's rounded 1:00 is intentionally not authored here. -->
### Lockout Hardware
objective: Identify standard lockout devices and select the correct hardware for common energy-isolating devices
state: not-started

#### scene 1 | 0:05 | LockoutHardware-scene1.png
There are specific requirements for locks used by authorized employees for lockout.

#### scene 2 | 0:19 | LockoutHardware-scene2.png
Locks used by authorized employees must be durable, used only for the purpose of lockout tagout, standardized within a facility by color, shape, or size, and uniquely identified and associated with an employee. The keys used for lockout locks must be controlled.

#### scene 3 | 0:23 | LockoutHardware-scene3.png
When more than one authorized employee works on a machine, the energy isolation devices must be protected by a hasp that can support the application of multiple locks. This allows each authorized employee involved to place their own lock on the hasp.

#### scene 4 | 0:04 | LockoutHardware-scene4.png
If work is to extend over a shift break, it's important that continuity of coverage be maintained.

#### scene 5 | 0:04 | LockoutHardware-scene5.png
The incoming authorized employee must place their own lock on the hasp before the outgoing authorized employee removes theirs.

### Lockout Administration
objective: Explain how written lockout procedures are documented, reviewed, and audited to meet program requirements
state: not-started
duration: 1:20

### Group Lockout
objective: Apply group lockout procedures so that every authorized employee retains individual control over their own energy isolation
state: not-started
duration: 1:15

### Lockout Release
objective: Perform the steps required to release equipment from lockout, including verification, notification, and restoring energy safely
state: not-started
duration: 0:50

### Removal of an Absent Employee's Lockout Device
objective: Describe the specific conditions and approvals required before another employee's lockout device may be removed in their absence
state: not-started
duration: 1:00


## Lockout/Tagout Case Study
<!-- Source showed a rounded "3 minutes"; the title card + 2 LOs below
     sum to 3:05. The computed total wins. -->

<!-- The section's title card. It shares the section's name, so `type:`
     marks it explicitly rather than relying on name-based detection.
     No scenes yet, so its duration is authored directly. -->
### Lockout/Tagout Case Study
type: title-card
state: not-started
duration: 0:06

### Case Study
objective: Follow a real-world lockout/tagout incident from routine task to serious injury
state: not-started
duration: 1:02

### Case Study: What Went Wrong
objective: Analyze a real-world lockout/tagout incident and identify the procedural failures that allowed it to occur
state: not-started
duration: 1:57


## Conclusion
<!-- Source showed a rounded "1 minute"; the title card + 1 LO below
     sum to 0:51. The computed total wins. -->

<!-- The section's title card. It shares the section's name, so `type:`
     marks it explicitly rather than relying on name-based detection.
     No scenes yet, so its duration is authored directly. -->
### Conclusion
type: title-card
state: not-started
duration: 0:06

### Summary and Implications
objective: Summarize the core requirements of the lockout/tagout program and locate the resources needed to apply them on the job
state: not-started
duration: 0:45
