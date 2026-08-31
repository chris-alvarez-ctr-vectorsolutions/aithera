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
When more than one authorized employee works on a machine, the energy isolation devices must be protected by a hasp that can support the application of multiple locks. This allows each authorized employee involved to place their own lock on the hasp. If work is to extend over a shift break, it's important that continuity of coverage be maintained.

<!-- Scenes 4 and 5 split the final sentence MID-SENTENCE, matching the
     video. Scene 4 intentionally has no terminal punctuation and scene 5
     intentionally begins lowercase — neither is a typo. -->
#### scene 4 | 0:04 | LockoutHardware-scene4.png
The incoming authorized employee must place their own lock on the hasp

#### scene 5 | 0:04 | LockoutHardware-scene5.png
before the outgoing authorized employee removes theirs.

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

<!-- The AI-generation demo reveals this LO. It is authored in full but
     hidden: true keeps it out of the overview until the rep clicks
     Generate Transcript. Scene text is generated from
     transcripts/machine-specific-conveyor.md -- never retype it there or
     here; edit the transcript and re-run _kit/transcript-to-md.js. -->
### Conveyor Belt Lockout/Tagout Procedure
objective: Apply the facility's machine-specific conveyor lockout/tagout procedure following the correct sequence for preparation, shutdown, isolation, verification, and restoration
state: not-started
hidden: true

#### scene 1 | 0:28 | NewLO-scene1-img.png
You're standing at a conveyor that needs maintenance. Before you touch anything, can you name all seven energy sources that might be hiding in that seemingly simple belt system? Most authorized employees can spot the obvious electrical disconnect, but conveyors often conceal mechanical tension, stored pneumatic pressure, and gravitational hazards that can injure or kill if not properly controlled.

#### scene 2 | 0:21 | NewLO-scene2-img.png
This is why your facility has a machine-specific lockout/tagout procedure for each conveyor. Unlike a general guideline, your conveyor procedure identifies every energy source on that exact piece of equipment and walks you through the precise sequence to isolate, verify, and restore it safely.

#### scene 3 | 0:27 | NewLO-scene3-img.png
Before you flip any switches or hang any locks, preparation comes first. Confirm the conveyor line has been cleared of product and materials. Then notify all affected employees, those upstream and downstream operators who depend on this conveyor running. They need to know the equipment is going down and approximately how long it will be out of service.

#### scene 4 | 0:27 | NewLO-scene4-img.png
Once notifications are complete, identify the specific conveyor you're locking out and locate every isolation point. This typically includes the motor disconnect switch, the control panel breaker, any mechanical blocking devices for the take-up carriage, belt chocks or clamps if it's an incline section, and the pneumatic supply valve if the conveyor has a diverter mechanism.

#### scene 5 | 0:36 | NewLO-scene5-img.png
When you're ready to shut down the conveyor, here's a critical point many people miss. You must stop the conveyor using the local E-stop button or the control station stop button. Never de-energize the disconnect switch while the belt is still running. That creates an uncontrolled stop that can damage equipment and create unexpected hazards. After you hit the stop button, the belt and all rotating components must come to a complete stop before you move to isolation.

#### scene 6 | 0:41 | NewLO-scene6-img.png
The isolation sequence follows a specific order for a reason. Start with the motor disconnect switch and place it in the off position. Next, open the control panel breaker. Now address the mechanical stored energy. Insert the mechanical block or pin into the belt take-up carriage to prevent it from moving under tension. If your conveyor runs on an incline, apply the belt chock or clamp to keep the belt from sliding downhill under gravity. Finally, if the conveyor has a pneumatic diverter, close and lock the pneumatic supply valve.

#### scene 7 | 0:22 | NewLO-scene7-img.png
At each isolation point, apply your personal lockout device and tag. Your tag must identify three things: your name, the date, and the reason for the lockout. If something goes wrong or someone needs to know who's working on the equipment, that tag provides critical information.

#### scene 8 | 0:20 | NewLO-scene8-img.png
With all isolation devices locked and tagged, verify zero energy state. Attempt to start the conveyor from both the local control station and the main panel to confirm it does not run. If it starts, you missed an isolation point.

#### scene 9 | 0:30 | NewLO-scene9-img.png
Manual verification comes next. Attempt to move the belt by hand, staying within safe reach without crossing any guards. The belt should not move. Try to shift the take-up carriage manually. It should be locked solid by your mechanical block or pin. If your conveyor has pneumatics, check the pressure gauge at the diverter. It must show zero psi after you've locked the valve.

#### scene 10 | 0:12 | NewLO-scene10-img.png
Only after all verification steps confirm zero energy can you remove guards or access pinch points and nip points around pulleys and rollers.

#### scene 11 | 0:23 | NewLO-scene11-img.png
When your work is complete, restoring the conveyor requires just as much care as locking it out. Clear all tools, materials, and personnel from the conveyor. Check the take-up frame area and any incline sections where someone might be working out of your direct line of sight.

#### scene 12 | 0:39 | NewLO-scene12-img.png
Remove your lockout devices in reverse order from how you applied them. Start with the belt chock or clamp if you used one. Remove the mechanical block or pin from the take-up carriage. If you locked out a pneumatic valve, remove your lock and tag, then open the valve and confirm pressure returns. Remove your lock and tag from the control panel breaker and close it. Finally, remove your lock and tag from the motor disconnect switch and close it to re-energize the conveyor.

#### scene 13 | 0:30 | NewLO-scene13-img.png
Before you restart normal operations, notify the affected employees you contacted at the beginning. Then run a test cycle. Start the conveyor using the normal controls and observe it through a complete cycle to make sure everything operates correctly. Watch for unusual noises, vibrations, or any indication that something isn't right. Only after the test cycle confirms proper operation should you resume normal production.

#### scene 14 | 0:23 | NewLO-scene14-img.png
Your facility's machine-specific procedure captures all of these steps in written form and should be posted at or near the conveyor for your reference. That procedure has been reviewed and signed off by both EHS or Safety and the equipment owner before it was released for use.

#### scene 15 | 0:31 | NewLO-scene15-img.png
What makes this procedure different from a general guideline is specificity. It names the exact disconnect switch, the exact breaker number, the specific location of the take-up pin, and the precise pneumatic valve you need to isolate. It accounts for the unique hazards of that particular conveyor, whether that's belt tension stored in the take-up system, gravity loads on an incline, or pneumatic pressure in a diverter.

#### scene 16 | 0:28 | NewLO-scene16-img.png
As an authorized employee, you're trained to recognize hazardous energy, understand the type and magnitude of energy present, and know the methods used to isolate and control it. OSHA requires employers to establish an energy control program and use procedures that prevent unexpected energization, startup, or release of stored energy. Your conveyor procedure fulfills that requirement at the equipment level.

#### scene 17 | 0:25 | NewLO-scene17-img.png
The seven-step sequence, preparation, shutdown, isolation, lockout, stored energy check, verification, and release, forms the backbone of every safe lockout/tagout operation. When you apply these steps using your facility's machine-specific conveyor procedure, you're controlling all the hazardous energy types that could injure you: electrical, mechanical, pneumatic, hydraulic, thermal, chemical, and stored energy sources.

#### scene 18 | 0:26 | NewLO-scene18-img.png
The next time you approach a conveyor for maintenance, remember that your machine-specific procedure isn't just paperwork. It's a detailed map of every hazard on that equipment and the exact steps to control them. Follow it every time, verify every step, and you'll complete your work safely and return the conveyor to service with confidence.



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
