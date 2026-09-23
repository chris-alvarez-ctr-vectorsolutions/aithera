# Pumps Introduction
sku: DEMO-PUMPINTR-101

<!--
  Source of truth for this demo.
  After editing:  node _kit/build-course.js pumps-introduction

  STATUS — initial buildout from a course table-of-contents screenshot
    · Title confirmed. SKU is DELIBERATELY FAKE (demos must never show a
      real catalog SKU). Keep any replacement fake too.
    · 5 sections / 11 LOs captured, plus a title card per section.
    · "Final Assessment" is intentionally NOT authored here — it is an
      appended item, not something authored in the Studio editor.

  STILL NEEDED
    · The click path: which LOs the rep actually opens on a call.
      Nothing is clickable yet — scenes get added once that is decided.
    · Scene detail (transcript + image) for those LOs only.
    · Real objectives. The ones below are drafted from LO titles and are
      PLAUSIBLE, NOT SOURCED — confirm the framing before customer use.

  CLICK PATHS
    An LO with "#### scene" blocks is CLICKABLE and opens the object
    manager. One without is a stub — plain text in the course overview.
    Build out only what the demo's path visits, so a stray click on a
    live call cannot dead-end on an unfinished screen.

  DURATIONS
    The source screenshot shows ROUNDED per-section values ("About 2
    Minutes"). The per-LO durations below are estimates apportioned
    within those rounded section totals, so computed section and course
    totals are approximations built from rounded parts and will not match
    Studio's exact figures. The computed value is the one to trust —
    never hand-total.

  TITLE CARDS
    One per section, sharing the section's name. Each is marked with
    `type: title-card` rather than relying on name-based detection.
-->

## Introduction
<!-- Source showed a rounded "About 1 Minute". -->

### Introduction
type: title-card
state: not-started
duration: 0:08

### Course Overview
objective: Describe the purpose and scope of this pumps course and identify the pump families it covers
state: not-started
duration: 0:52


## Pump Overview
<!-- Source showed a rounded "About 2 Minutes". -->

### Pump Overview
type: title-card
state: not-started
duration: 0:08

### Fluid Mechanics
objective: Explain the basic fluid mechanics principles — flow, pressure and head — that govern how a pump moves liquid
state: not-started
duration: 1:02

### Pump Types
objective: Distinguish the two major pump families, positive displacement and centrifugal, and describe how each moves fluid
state: not-started
duration: 0:50


## Positive Displacement Pumps
<!-- Source showed a rounded "About 3 Minutes". -->

### Positive Displacement Pumps
type: title-card
state: not-started
duration: 0:08

### Reciprocating Positive Displacement Pump
objective: Describe how a reciprocating pump uses a piston, plunger or diaphragm to displace a fixed volume of fluid per stroke
state: not-started
duration: 1:04

### Rotary Positive Displacement Pump
objective: Describe how rotary pumps use gears, lobes, vanes or screws to move fluid through a fixed displacement volume
state: not-started
duration: 1:00

### Characteristics and Applications
objective: Identify the operating characteristics of positive displacement pumps and the service conditions they suit
state: not-started
duration: 0:56


## Centrifugal Pumps
<!-- Source showed a rounded "About 4 Minutes". -->

### Centrifugal Pumps
type: title-card
state: not-started
duration: 0:08

### Centrifugal Pumps Overview
objective: Explain how a centrifugal pump converts impeller rotation into fluid velocity and then into discharge pressure
state: not-started
duration: 1:04

### Centrifugal Pump Types
objective: Classify centrifugal pumps by the flow of liquid through the impeller and compare the flow and head characteristics of radial, axial and mixed flow designs
state: not-started

#### scene 1 | 0:08 | PumpType-scene1.png | CentrifugalPumpTypes-intro.mp4
Centrifugal pumps can be classified by the flow of liquid through the impeller.

#### scene 2 | 0:21 | PumpType-scene2.png | CentrifugalPumpTypes-radial-flow.mp4
Radial flow. As mentioned, this is the most common design in which the liquid enters the impeller axially or parallel to the rotational drive is turned 90 degrees and exits the impeller radially. This type of centrifugal pump gives the highest increase in head.

#### scene 3 | 0:31 | PumpType-scene3.png | CentrifugalPumpTypes-axial-flow.mp4
Axial flow. In this type of pump, the liquid enters the impeller axially and exits axially. The impeller of this type of pump has fewer veins, and the veins have a twist on them. The veins resemble the propeller on a boat, leading to the name propeller pump. This type of pump can produce very high flow rates, but with only a relatively low head increase.

#### scene 4 | 0:26 | PumpType-scene4.png | CentrifugalPumpTypes-mixed-flow.mp4
Mixed flow. This type of pump is a hybrid of radial and axial flow designs. The flow enters the impeller axially and exits the impeller at an angle greater than 90 degrees, but not completely axially. Not surprisingly, this design has flow and head characteristics that are a blend of the radial and axial designs.

### Multistage Centrifugal Pump
objective: Explain how staging impellers in series builds discharge head and when a multistage pump is the right choice
state: not-started
duration: 0:56

### Characteristics and Applications
objective: Identify the operating characteristics of centrifugal pumps and the service conditions they suit
state: not-started
duration: 0:58


## Conclusion
<!-- Source showed a rounded "About 1 Minute". -->

### Conclusion
type: title-card
state: not-started
duration: 0:08

### Summary and Implications
objective: Summarize how pump selection follows from fluid properties and service conditions, and why correct selection matters
state: not-started
duration: 0:54

<!-- ============================================================
     THE AI-GENERATION REVEAL

     This LO is authored but `hidden: true`, so it stays out of the
     course overview AND out of the duration totals until the demo
     reveals it. It must remain LAST in this section so it reads as
     newly created when it appears.

     On a call: Add Learning Object -> AI Generation -> type anything
     -> (optionally upload a real file) -> Generate Transcript -> a
     progress state -> this LO opens and is now in the course.

     The typed prompt is ignored by design: the flow always reveals
     the first hidden LO in the section the rep clicked from, so the
     reveal cannot fail on a live call regardless of what is typed.

     SCENES STILL TO COME. Without `#### scene` blocks this LO opens
     to an empty object manager, so scene detail (transcript + image)
     is the remaining work before this path is demo-ready.
     ============================================================ -->
### Pump Systems at Crestview Corporate Campus
objective: Identify the pump types in service at Crestview, read a pump nameplate, locate key components and system connections, and recognize the conditions that require attention before and during pump work
state: not-started
hidden: true

#### scene 1 | 0:28 | NewLO-scene1.png
You probably pass them every day without much thought. Those humming units in mechanical rooms, equipment mounted on concrete pads outside, machinery tucked into utility spaces. But every pump at Crestview Corporate Campus plays a specific role in keeping this facility running. Whether you're in maintenance, operations, or recently joined the team, understanding these pumps makes your job considerably easier.

#### scene 2 | 0:23 | NewLO-scene2.png
At Crestview, we're running two main pump categories doing very different jobs. Centrifugal circulating pumps handle our chilled and hot water loops - essentially the workhorses of our HVAC system. Positive displacement chemical feed pumps manage cooling tower treatment. Different designs, different purposes, both critical to operations.

#### scene 3 | 0:37 | NewLO-scene3.png
Why centrifugal for the water loops? These pumps excel at moving large volumes of liquid. They spin an impeller inside a casing, accelerating water outward. That's perfect when you need consistent circulation of chilled water for cooling or hot water for heating throughout the building. They're reliable for these services because they handle the flow rates our HVAC system demands without excessive energy consumption. You'll find these units strategically positioned to maintain proper pressure and flow through our distribution systems.

#### scene 4 | 0:37 | NewLO-scene4.png
Positive displacement pumps serving the cooling towers work on a completely different principle. They move a fixed amount of fluid with each cycle or stroke. That makes them ideal when you need precise, consistent delivery - exactly what you want when injecting treatment chemicals into a cooling tower. Too much chemical wastes money and can cause problems. Too little means ineffective treatment. Positive displacement pumps give you that control, ensuring our towers receive proper chemical dosing regardless of system pressure variations.

#### scene 5 | 0:43 | NewLO-scene5.png
Here's where things get practical. Every pump in this facility has a nameplate packed with information you'll reference regularly. You'll find the manufacturer's name, model number, and serial number - essential for ordering parts or looking up specifications. The nameplate also shows rated speed, telling you how fast the pump should operate under normal conditions. Horsepower indicates the motor size driving the pump. And you'll see electrical data: voltage, frequency, and full-load current. All of this matters when you're troubleshooting, planning maintenance, or trying to understand why a pump might not be performing as expected.

#### scene 6 | 0:45 | NewLO-scene6.png
Before you can work effectively with any pump, you need to identify it correctly. That means knowing the pump's tag number - the unique identifier assigned to that specific unit. You should be able to locate the suction line, which is where fluid enters the pump, and the discharge line, where it exits. Connected valves control flow and allow isolation when needed. The driver type tells you what's powering the pump - typically an electric motor at Crestview. And there are associated local controls, which might include start/stop buttons, pressure switches, or other operating devices mounted near the equipment.

#### scene 7 | 0:42 | NewLO-scene7.png
Understanding the complete system matters because pumps rarely work in isolation. You've got incoming and outgoing lines to consider. Even after a pump stops, liquid can remain trapped in piping, valves, strainers, or filters. Some systems include bypass lines that allow flow to reroute around the pump. Recirculation lines might send some discharge back to suction. Drain lines provide a way to empty sections of the system. Each of these connections represents a potential path for fluid movement, and knowing where they are helps you understand how the whole system functions together.

#### scene 8 | 0:33 | NewLO-scene8.png
Let's talk about what normal operation looks like. A pump should be started and stopped using its designated controls, not by randomly disconnecting components or hitting emergency stops unless there's an actual emergency. During operation, rotating parts should move smoothly without excessive vibration. After shutdown, all rotating components must come to a complete stop before anyone approaches moving assemblies. This is basic operational awareness that keeps everyone safe and equipment functioning properly.

#### scene 9 | 0:36 | NewLO-scene9.png
Speaking of components, many of our pumps connect to electric motors. That means checking motor starter status, verifying local disconnect position, and understanding control circuit condition before servicing. Valve positions matter too - both suction side and discharge side valves control whether fluid can move through the system. Pressure can persist in pump casings, in the piping connected to them, and in instrumentation like gauges. Just because the pump stopped doesn't mean the system is fully depressurized.

#### scene 10 | 0:41 | NewLO-scene10.png
The fluid characteristics matter as much as the pump design. Water in HVAC loops can be hot - hot enough to cause burns if you're not careful when opening a system. Chemicals in cooling tower treatment pumps require specific handling precautions. Before working on any pump, you need to know what it's pumping. That information should be clearly labeled on the equipment or available in the site's operating documentation. If you're dealing with something beyond plain water, check the safety data sheet for proper handling procedures and exposure precautions.

#### scene 11 | 0:39 | NewLO-scene11.png
Pump seals deserve special attention. Mechanical seals keep fluid inside the pump casing where it belongs, but they can fail. A seal failure might cause spray, leakage, or sudden release of fluid, especially if pressure remains in the system. Packing glands are another sealing method you'll encounter, and they require controlled adjustment. Overtighten them, and you create excess heat and wear. Leave them too loose, and you get leakage. There's a proper adjustment procedure for each pump type, and following it prevents unnecessary damage.

#### scene 12 | 0:36 | NewLO-scene12.png
Couplings connect the pump to its motor, and they need periodic inspection. Check for proper alignment between the pump and driver - misalignment leads to premature bearing failure and excessive vibration. Look at fastener condition to ensure nothing's working loose. Examine the coupling itself for signs of wear or damage. And verify that guards are in place. Coupling guards aren't optional equipment - they're required whenever the pump operates, unless the equipment is in a controlled maintenance condition.

#### scene 13 | 0:36 | NewLO-scene13.png
Routine monitoring catches problems early, before they become major failures. Abnormal noise might indicate misalignment, cavitation, or bearing wear. Excessive vibration can signal loose mounting hardware, impeller damage, or inadequate suction conditions. Overheating suggests lubrication problems or mechanical binding. Any leakage around seals or connections needs attention. Bearing temperature and lubrication condition should be checked regularly. These aren't just maintenance tasks - they're how you prevent small issues from becoming expensive failures that shut down critical systems.

#### scene 14 | 0:30 | NewLO-scene14.png
Documentation ties everything together. Maintenance records should capture the date, equipment ID, what you observed, what corrective action you took, and what parts you replaced. Over time, these records reveal patterns. Maybe a particular pump develops bearing problems every eighteen months. Maybe another location sees repeated seal failures. That information helps you plan preventive maintenance better and budget more accurately for parts and labor.

#### scene 15 | 0:32 | NewLO-scene15.png
At Crestview specifically, you'll find clear labels on pump systems showing the service, flow direction, and isolation points. This labeling exists because pumps are often part of larger processes. Stopping one pump might affect upstream supply, downstream pressure, or process continuity in ways you need to anticipate. Understanding these connections helps you coordinate work with other departments and avoid disrupting operations unnecessarily. Communication matters as much as technical knowledge.

#### scene 16 | 0:39 | NewLO-scene16.png
One more thing worth understanding - some pumps can restart unexpectedly if controls are misapplied, switches are left in the wrong position, or stored pressure isn't fully relieved. That's why proper procedures matter. That's why following the exact sequence for your facility matters. Generic knowledge about pumps helps you understand principles, but specific knowledge of Crestview's systems - where the controls are, what the normal valve lineup looks like, which pumps serve which buildings - that's what keeps you and your coworkers working safely and effectively.

#### scene 17 | 0:39 | NewLO-scene17.png
When you walk through a mechanical room now, those pumps won't just be humming boxes anymore. You'll recognize the centrifugal units circulating chilled and hot water through our HVAC loops, maintaining comfort throughout the campus. You'll identify the positive displacement pumps feeding precisely measured treatment chemicals to cooling towers, protecting our equipment from scale and corrosion. You'll know how to read a nameplate, locate key components, trace system connections, and understand why each piece of information matters for safe and effective operations here at Crestview.
