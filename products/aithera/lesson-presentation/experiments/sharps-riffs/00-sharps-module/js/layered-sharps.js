/* ============================================================================
   layered-sharps.js — Bloodborne Pathogens (RVCT-303B), Module 4 · BO-4
   "Contain the Sharp", built on js/layered-engine.js.

   The prototype module from the Knowledge Layer plan: eight objectives sitting
   in eight distinct sub-scales — two Know, three Feel, three Do — matching the
   K&A Manufacturing script's own count (see clara/docs/SHARPS-ALIGNMENT-BRIEF.md,
   D1). A ninth Know objective (the mechanism behind why a used sharp is
   dangerous) and a fourth Feel objective (self-efficacy under time pressure)
   were cut to align — the mechanism content survives as plain, ungated
   narration; the self-efficacy rating was dropped outright.

       When I am about to use, handle, or dispose of a needle or sharp, I plan
       the disposal route before I start, activate the safety feature, and put
       it straight into a designated container — never into general waste.

   Instructional shape: OPTION B, the case set. Three short independent
   incidents, each isolating one failure mode, each ending in a judgment.
   Nothing depends on anything before it — which is what lets a case be
   dropped, hardened, or swapped for a sector-native one without touching the
   others, and is why the deck recommends it for regulated content.

   The thing this module demonstrates that the Bystander one does not:
   ASSESSMENT POLICY PER OBJECTIVE. Every objective carries a flag — gate,
   remediate, ask, never-skipped — and that flag, not the objective, decides
   where its question lives: the pre-module battery, in-flow, the simulation,
   or the follow-up after the module is over. Policy chips are shown on the
   beats themselves so a reviewer watches the rule fire.

   Loads AFTER js/layered-engine.js. See clara/sharps.html.
   ========================================================================== */
(function () {
  'use strict';

  var LE = window.Layered;
  var T = LE.T, esc = LE.esc, readCourse = LE.readCourse, saveResult = LE.saveResult,
      wireChat = LE.wireChat, typeFeedback = LE.typeFeedback,
      lens = LE.lens, visiblePath = LE.visiblePath;

  var COURSE = 'Bloodborne Pathogens';

  // ==========================================================================
  //  THE OBJECTIVES — the SME-signed substrate, with the metadata envelope
  //  that makes derivation safe. Nothing below is authored per permutation;
  //  every routing decision in this file reads these fields.
  //
  //  `policy` is the deck's Part Three: what the assessment strategy does with
  //  the objective, which is a different question from what the objective is.
  //    gate    — must be proven; asked before the module, drives test-out
  //    remediate — a low score adds a beat rather than removing one
  //    ask     — measured for the record, never routes anything
  //    never   — cannot be tested out of, in any profile
  //  `lock` is the compliance envelope: content-locked objectives are served
  //  harder rather than removed.
  // ==========================================================================
  //  `sub` uses the re-composed course's own type names wherever the two
  //  vocabularies overlap — Recall, Understand, Believe, Value, Perform,
  //  Respond in the moment. Three of ours have no counterpart there, and
  //  rather than quietly disagree they are marked `ext` and carry a reason.
  //  A reviewer holding both documents can then see which of our objectives
  //  are theirs and which are ours.
  var OBJECTIVES = [
    // Alignment brief D12: K&A's own script flags this exact shortcut as
    // contingent on a compliance determination neither team has actually
    // made — "proposed, not confirmed against 1910.1030(g)(2)(vii)(E)/(F)."
    // Decision: ship test-out live as built rather than lock K1 on a
    // regulatory reading nobody has verified. Reviewer-visible flag only
    // (the `lock` string below, and the battery step's caption) — a learner
    // has no reason to see a compliance caveat about their own test-out.
    { id: 'K1', name: 'The safe handling procedure', domain: 'Know', sub: 'Recall', policy: 'gate', locked: false, where: 'Pre-module battery',
      lock: 'test-out eligible — compliance unconfirmed, see D12', theory: 'Procedural Knowledge', src: 'LO 4.1',
      text: 'Recall the safe sharps handling procedure: plan disposal in advance, use needle alternatives when possible, activate safety features, and immediately dispose of used sharps in a designated container.' },
    // Alignment brief D1: this objective used to carry the module's mechanism
    // content ("why a used sharp is dangerous") as its own tracked, gated Know
    // objective — a screen and an in-flow check with no counterpart in K&A's
    // Manufacturing script, where the same content runs as plain narration
    // ahead of Case 1 with no check at all. Cut to align. The content itself
    // is not gone — see HAZARD_CONTENT — it simply no longer gates, remediates,
    // or reports on the record. Recognition (below) inherits the K2 id, since
    // that is what K&A's own K2 is.
    { id: 'K2', name: 'Spotting the conditions', domain: 'Know', sub: 'Observe', ext: 'No counterpart in the re-composed course. Recognition in the field is a different act from recalling the rule, and the training standard names it separately.',
      // D6: gate, not remediate — never removed and never given a second
      // chance on a miss (the cases just get harder on test-up), which is
      // closer to "mandatory, always evidenced" than to "one more try".
      policy: 'gate', locked: true, where: 'In-flow',
      lock: 'content-locked · test-up', theory: 'Hazard Recognition', src: 'LO 3.2 + LO 3.3 (adjacent)',
      text: 'Recognize the conditions that produce most sharps injuries: a container that has stopped containing, a sharp left on a work surface, a sharp travelling in linen or general waste.' },
    { id: 'F1', name: 'It protects your coworkers', domain: 'Feel', sub: 'Believe', policy: 'remediate', locked: false, where: 'Pre + post',
      lock: 'reinforce only', theory: 'Professional Norm', src: 'LO 4.2',
      text: 'Agree: safe sharps disposal is a professional responsibility that protects my coworkers, not just a procedural formality.' },
    { id: 'F2', name: 'Controls prevent the injury', domain: 'Feel', sub: 'Value', policy: 'ask', locked: false, sampled: true, where: 'In-flow',
      lock: 'reinforce only', theory: 'Outcome Expectancy', src: 'LO 4.3',
      text: 'Agree: using engineering controls for sharps disposal will prevent the serious injuries and infections that shortcuts cause.' },
    { id: 'F3', name: 'What your shift actually does', domain: 'Feel', sub: 'Perceive', ext: 'No counterpart in the re-composed course. Perceived norm is measurable, movable, and the thing the shortcut actually rides on.',
      policy: 'remediate', locked: false, where: 'Pre + post',
      lock: 'reinforce only', theory: 'Social Norm Perception', src: 'none — our construct',
      text: 'Agree: most people on my shift use the container immediately rather than setting a sharp down.' },
    { id: 'D1', name: 'Acting while the moment is open', domain: 'Do', sub: 'Respond in the moment', policy: 'gate', locked: true, where: 'Simulation',
      lock: 'never skipped', theory: 'Behavioral Cueing', src: 'LO 6.2 (type borrowed)',
      text: 'Recognize and act on the cue to dispose while the moment is still open.' },
    { id: 'D2', name: 'Doing it in context', domain: 'Do', sub: 'Perform', policy: 'gate', locked: true, where: 'Simulation',
      lock: 'never skipped', theory: 'Behavioral Capability (Bandura)', src: 'LO 4.4',
      text: 'Demonstrate safe sharps handling in context: plan disposal before use, activate safety features, and place used sharps in a designated container without recapping, bending, or placing in general waste.' },
    { id: 'D3', name: 'Keeping it up afterwards', domain: 'Do', sub: 'Sustain', ext: 'No counterpart in the re-composed course, which closes every objective on the day. Maintenance is the only thing a one-sitting module structurally cannot evidence.',
      // D6: none, not gate/remediate/ask — declared extension with no
      // pass/fail concept at all, even though the content itself is never
      // skipped (that is `locked`'s job, a separate axis).
      policy: 'none', locked: true, where: 'Follow-up',
      lock: 'never skipped', theory: 'Maintenance Self-Regulation', src: 'none — our construct',
      text: 'Keep the practice after the module ends — and raise a container or a hazard when you meet one.' }
  ];
  function obj(id) {
    for (var i = 0; i < OBJECTIVES.length; i++) if (OBJECTIVES[i].id === id) return OBJECTIVES[i];
    return null;
  }
  // D6/item 15: the doc's own four values (none|ask|remediate|gate) — 'never'
  // was ours, and conflated "not policy-gated" with "content never removed",
  // which is what the separate `locked` boolean is for now.
  var POLICY_CHIP = {
    gate:      { cls: 'pol-gate',  icon: 'fa-key',              label: 'Gate' },
    remediate: { cls: 'pol-remed', icon: 'fa-wand-magic-sparkles', label: 'Remediate' },
    ask:       { cls: 'pol-ask',   icon: 'fa-clipboard-list',   label: 'Ask' },
    none:      { cls: 'pol-none',  icon: 'fa-circle-minus',     label: 'Not assessed' }
  };
  // NOT shown to a learner. "Gate", "remediate", "K1 · Know / Recall" and
  // "pre-module battery" are how WE talk about routing; none of it answers a
  // question a learner has. The policy is demonstrated where it belongs — in
  // the step captions behind the footer "?", in the plain-English moves on the
  // adjustment screen (skipped / harder / kept), and in the Learning Layer
  // view. Kept here because those captions are generated from the same data.
  function policyRow(id) {
    var o = obj(id), c = POLICY_CHIP[o.policy];
    return '<div class="pol-row">' +
      '<span class="pol ' + c.cls + '"><i class="fa-solid ' + c.icon + '"></i> ' + c.label + '</span>' +
      // Item 15: reads the actual boolean now, not a string-equality check
      // against one specific `lock` description that happened to be the
      // only content-locked objective when this was written — K1's D2/
      // D1/D3 also carry "never skipped" style `lock` text but are not all
      // content-locked in the same sense, so the two fields stay separate.
      (o.locked ? '<span class="pol pol-lock"><i class="fa-solid fa-lock"></i> Content-locked</span>' : '') +
      (o.sampled ? '<span class="pol pol-sample"><i class="fa-solid fa-shuffle"></i> Sampled</span>' : '') +
      '<span class="pol-obj"><b>' + o.id + '</b> · ' + esc(o.domain + ' / ' + o.sub) + ' · ' + esc(o.where) + '</span>' +
    '</div>';
  }

  // ==========================================================================
  //  SECTORS — capability 2. Four, from the plan, and the reason there are
  //  four rather than one with swapped nouns: `premise` says whether the
  //  learner USES a sharp themselves or FINDS one somebody else left, and the
  //  procedure reads it — step 2 is "use a needle alternative", which is a
  //  live decision only for someone holding the syringe. On a find-premise it
  //  renders as context rather than as a step the learner can act on.
  //
  //  It used to say three sectors were find-premises. Two of those three open
  //  with the learner performing a finger-stick and changing a blade — both
  //  uses — and the re-composed course's own manufacturing character is a
  //  worker self-administering insulin. Only the renovation site genuinely
  //  finds one. The flag now matches the scenes it labels, and is read rather
  //  than merely declared.
  // ==========================================================================
  var LENSES = {
    education: {
      label: 'Education', premise: 'use',
      // What counts as a sharp HERE. The re-composed course's own list —
      // needles, broken glass, scalpels, dental wires, capillary tubes —
      // is what makes a non-clinical sector legitimate rather than decorative.
      sharps: 'Lancets and insulin needles from the health office. Broken glass from a science room. Craft and utility blades.',
      // The controls decision, lensed to something the district would argue about.
      facility: {
        gloves: 'Buy cut-resistant gloves for every custodian on the night shift',
        boxes: 'Put a wall container in every classroom that has a diabetic student'
      },
      sustain: {
        conds: ['A class is waiting and the container is in the prep room',
                'A student needs me right now',
                'Clearing up in a hurry at the end of the day'],
        hint: 'in the prep room, next to the sink'
      },
      roles: 'teacher · administrator', org: 'Riverbend Unified School District', orgShort: 'Riverbend Unified',
      coord: { name: 'Dana Whitfield', title: 'Health Services Coordinator', email: 'safety@riverbendusd.org' },
      role: 'Classroom teacher', where: 'A middle-school classroom', when: 'End of the day',
      case1: 'You finish a diabetic student’s finger-stick in the health office and set the lancet on the counter — the phone is ringing and the container is across the room.',
      case2: 'The sharps container in the health office is packed two inches past the line marked FILL TO HERE — three-quarters up the container. Someone has been pressing things down to make room.',
      case3: 'Clearing a classroom bin at the end of the day, you spot a used lancet sitting on top of the paper.',
      case4: 'A custodian emptying that same classroom bin at nine that night is stuck through the bag. He finds out whose lancet it was three weeks later, from a lab result.',
      story: {
        by: 'Health-office aide, elementary. Told at a district safety in-service.',
        paras: [
          'We do finger-sticks for two of our students. That afternoon the office phone went while I still had the lancet in my hand, so I set it on the counter and took the call. It was a parent. It ran long.',
          'The counter gets wiped down at the end of the day. The lancet went into the classroom bin with everything else on it.',
          'Gerald empties those bins at nine. He has done it for eleven years. He pushed the bag down to get the liner off — the way you do when it will not close — and it went through the bag and through his glove.',
          'He spent five months on testing. He kept working the whole time. He told me himself, months later, in the parking lot, and what he said was “I know it wasn’t on purpose.”',
          'That was worse than if he had been angry.'
        ]
      },
      // Its own incident, and deliberately NOT the lancet the cases and the
      // account use: glass off a science bench, from this sector's own list of
      // what counts as a sharp.
      // What counts as a sharp HERE, in prose, for the hazard article.
      jobPara: 'A lancet from a finger-stick in the health office has been in a student within the last hour. A craft or utility blade used all morning can pick up blood from a nick nobody reported. A science room produces ordinary broken glass: a cracked beaker, a snapped slide, a shard swept off a bench. None of these look dramatic. That is the hazard. Something that looks like trash is easier to pick up than something that looks like a syringe.',
      // The account's own photograph — this sector's sharp, at rest, where
      // its story leaves it. Real alt text: the image IS the argument of the
      // screen (a sharp nobody is watching), not decoration beside it.
      photo: {
        src: '../../../../assets/images/sharps-account-education.jpg',
        alt: 'A used lancet left on the counter of a school health office, its point exposed. A desk phone and a wall clock sit behind it, and the sharps container is at the far end of the counter.'
      },
      chain: {
        end: 'Remember, you may never meet the person who empties your classroom bins.',
        avoided: 'Marisol never has to find out whether that glass mattered.',
        setup: { time: '3:15 PM', body: 'You sweep up a broken beaker from the back bench of your classroom. The red sharps disposal container is through in the prep room. There is also a classroom bin under the sink, right here.' },
        pick: {
          safe:  { t: 'The red sharps container in the prep room', icon: 'fa-shield-halved' },
          short: { t: 'The classroom bin under the sink', icon: 'fa-trash-can' }
        },
        act: {
          safe:  { time: '3:16 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You carry it through to the prep room and drop it in the sharps bin. It costs you about thirty seconds and the walk back.' },
          short: { time: '3:16 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You fold it into a paper towel and put it in the classroom bin. It is glass, not a needle. Nobody would think twice.' }
        },
        safeAfter: [
          { time: '9:40 PM', gap: 'six hours later', gapSize: 'l',
            body: 'Marisol works the evening round, emptying bins one classroom at a time. She gathers the liner against her forearm to knot it, the way she always does. There is nothing in it that can cut her, and she will never know that was ever in question.' }
        ],
        after: [
          { time: '9:40 PM', gap: 'six hours later', gapSize: 'l',
            body: 'Marisol works the evening round, emptying bins one classroom at a time. She has never met you — she starts after the building empties, and nobody tells her what went in.' },
          { time: '9:41 PM', gap: 'a minute later', gapSize: 's', injury: 'Possible exposure',
            body: 'She lifts the liner out and gathers it against her forearm to knot it. The bag sags under its own weight, and the edge finds her through the plastic.' },
          { time: 'Over the next four months', gap: 'and then', gapSize: 'm',
            body: 'Marisol now has to be tested at six weeks, twelve weeks and four months to find out whether she caught anything. Nobody can tell her what was on that glass. She has done nothing wrong at any point in this chain.' }
        ]
      }
    },
    aec: {
      label: 'Commercial AEC', premise: 'find',
      sharps: 'Syringes left in wall cavities and voids. Broken glass and glazing offcuts. Utility blades.',
      facility: {
        gloves: 'Issue cut-resistant gloves to every labourer on demolition and clear-out',
        boxes: 'Mount a sharps container on every floor of an occupied renovation'
      },
      sustain: {
        conds: ['The container is on another floor',
                'My hands are full of tools',
                'A trade is waiting on me to clear the area'],
        hint: 'in the first-aid station on this floor'
      },
      roles: 'architect · engineer · construction', org: 'Halstead Build Group', orgShort: 'Halstead',
      coord: { name: 'Marcus Oyelaran', title: 'Site Safety Manager', email: 'safety@halsteadbuild.com' },
      role: 'Site supervisor', where: 'An occupied renovation', when: 'Punch-list walkthrough',
      case1: 'Mid-walkthrough you pull a syringe out of a wall cavity with your gloved hand and set it on a ledge — you will bag it on the way back.',
      case2: 'The first-aid kit’s small sharps container on this floor is packed past the fill line stamped on its label, lid domed where the last few went in sideways, and the spare is in the trailer two levels down.',
      case3: 'A needle is sitting in the demo debris pile the framing crew will clear at seven tomorrow morning.',
      case4: 'A labourer clearing that pile is stuck through his glove. The needle came out of a wall in an occupied building — nobody can say whose it was.',
      story: {
        by: 'Site supervisor, commercial fit-out. Told at a Monday toolbox talk.',
        paras: [
          'We were on punch list in an occupied building. I pulled a syringe out of a wall cavity — you find things — and set it on the ledge, because my hands were full and I would be back through in twenty minutes.',
          'I was not back through. The framing crew cleared that floor at seven the next morning.',
          'Danny picked the debris up by the armful, the way everybody does. It went through his glove and into the web of his hand.',
          'We never found out whose it was, or how long it had been in that wall. None of that mattered to the eleven weeks he spent waiting on bloodwork.',
          'He came back on the job. He wore double gloves for a year afterwards and nobody said a word about it.'
        ]
      },
      // Its own incident, and deliberately NOT the wall-cavity syringe the
      // cases and the account use: a blade left on a ledge by the glazers.
      // A FIND, because this sector's premise flag says find and the flag is
      // read rather than decorative — a scene where the learner uses their own
      // sharp would make it lie. It is also the harder decision of the two:
      // the sharp is not yours, and doing nothing looks free.
      // What counts as a sharp HERE, in prose, for the hazard article.
      jobPara: 'A utility blade used all morning can pick up blood from a nick nobody reported. An occupied renovation turns up syringes in wall cavities and voids, left by people you will never identify. Glazing work produces ordinary broken glass: offcuts, snapped panes, a shard already in the debris sack. None of these look dramatic. That is the hazard. Something that looks like trash is easier to pick up than something that looks like a syringe.',
      photo: {
        src: '../../../../assets/images/sharps-account-aec.jpg',
        alt: 'A used syringe left on a dusty concrete ledge in a stripped, mid-renovation corridor, with debris and bare studs behind it.'
      },
      chain: {
        end: 'Remember, you may never meet the person who clears your debris bags.',
        avoided: 'Teodoro never has to find out whether that blade mattered.',
        setup: { time: '2:40 PM', body: 'You find a used blade on a window ledge on the second floor, left by whoever glazed it. The red sharps disposal container is in the trailer, two levels down. There is also a debris bag at your feet.' },
        pick: {
          safe:  { t: 'The red sharps container in the trailer', icon: 'fa-shield-halved' },
          short: { t: 'The debris bag at your feet', icon: 'fa-trash-can' }
        },
        act: {
          safe:  { time: '2:41 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You take it down two levels to the container in the trailer. It costs you the stairs and about a minute, for a blade that was never yours.' },
          short: { time: '2:41 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You drop it in with the offcuts. It was not yours to begin with, and the whole bag is in a skip by six.' }
        },
        safeAfter: [
          { time: '6:15 PM', gap: 'three and a half hours later', gapSize: 'l',
            body: 'Teodoro clears the floors once the trades go home. He carries the bags against his chest, two at a time, the way everybody does. There is nothing in them that can cut him, and he will never know that was ever in question.' }
        ],
        after: [
          { time: '6:15 PM', gap: 'three and a half hours later', gapSize: 'l',
            body: 'Teodoro clears the floors once the trades go home. You have never met him — he works the levels you have already left, and the bags reach him closed.' },
          { time: '6:16 PM', gap: 'a minute later', gapSize: 's', injury: 'Possible exposure',
            body: 'He carries them against his chest, two at a time, the way everybody does. The blade comes through the sack and into his forearm.' },
          { time: 'Over the next eleven weeks', gap: 'and then', gapSize: 'm',
            body: 'Teodoro now has to be tested at six weeks and again at eleven to find out whether he caught anything. Nobody can tell him whose blade it was, or how long it sat on that ledge. He has done nothing wrong at any point in this chain.' }
        ]
      }
    },
    manufacturing: {
      label: 'Manufacturing', premise: 'use',
      sharps: 'Box-cutter and trimming blades. Insulin needles from workers who inject on shift. Contaminated glass from the plant clinic.',
      facility: {
        gloves: 'Buy cut-resistant gloves for the whole sanitation crew',
        boxes: 'Put a sharps container at every line station and in every break room'
      },
      sustain: {
        conds: ['The line is stopped and people are waiting',
                'The container is at the far end of the bay',
                'Changeover at the end of a shift'],
        hint: 'at the end of the bay, by the scrap bin'
      },
      roles: 'chemical · industrial', org: 'Acme Plant Operations', orgShort: 'Acme',
      coord: { name: 'Lena Moreau', title: 'Training Coordinator', email: 'training@acmemfg.com' },
      role: 'Line lead', where: 'The plant floor', when: 'Second shift',
      case1: 'You change a box-cutter blade at the line and set the old one on the bench — you will walk it to the container after this run.',
      case2: 'The container in the plant clinic is three fingers above its fill line, and the spare box is in the supply room.',
      case3: 'You find contaminated glass from the clinic bagged into general waste at the dock.',
      case4: 'A sanitation worker on second shift compresses that bag by hand and is cut through it. It was a blade change nobody logged.',
      story: {
        by: 'Maintenance tech, second shift. Told during a plant stand-down.',
        paras: [
          'I changed a blade at the line about ten minutes before the end of second shift. The container was at the other end of the bay and I had one more part to run, so I set the old blade on the bench and told myself I would walk it over on my way out.',
          'I did not. I do not remember deciding not to. I just clocked out.',
          'Somebody swept that bench into the general waste bin overnight. Ruben, on sanitation, compressed the bag by hand the way you do when it will not close, and the blade went through the plastic and into the base of his thumb.',
          'He was on post-exposure protocol for six months. Bloodwork every few weeks. He could not donate, and he had to tell his wife each time the results came back.',
          'Nobody ever asked me about it. There was no incident number with my name on it. I only know because he told me himself — and he was not angry. That was the part I could not get past.'
        ]
      },
      // Its own incident, and deliberately NOT the blade change the cases and
      // the account use: a worker injecting insulin on shift, which is the
      // re-composed course's own manufacturing character.
      // What counts as a sharp HERE, in prose, for the hazard article.
      jobPara: 'A trimmer or box-cutter used all morning can pick up blood from a nick nobody reported. A coworker who injects insulin on shift may leave a pen needle where it does not belong. The plant clinic produces ordinary medical waste: a cracked specimen tube, a used lancet, a shard of glass. None of these look dramatic. That is the hazard. Something that looks like trash is easier to pick up than something that looks like a syringe.',
      photo: {
        src: '../../../../assets/images/sharps-account-manufacturing.jpg',
        alt: 'A long used blade left on a workbench on a plant floor, with machining stations receding into the background.'
      },
      chain: {
        end: 'Remember, you may never meet the person who empties your break-room bin.',
        avoided: 'Jacob never has to find out whether that needle mattered.',
        // D10: the earlier version put the learner's OWN insulin injection on
        // screen as the hazard — a training beat that reads as commentary on a
        // coworker's routine medical care the moment it is re-used for someone
        // real. Chris (a colleague, not the learner) still injects on shift;
        // the decision point is what you do when he presses the used pen into
        // your hand because he has to go, not whether you should have used it.
        setup: { time: '4:52 PM', body: 'Chris, next to you on the line, gets a call he has to take. He presses his used insulin pen into your hand on his way out — “hang onto this a second” — and jogs off toward the office. The red sharps disposal container is across the plant floor, past the press line. There is also a lidded bin two feet away.' },
        pick: {
          safe:  { t: 'The red sharps container across the plant floor', icon: 'fa-shield-halved' },
          short: { t: 'The lidded bin two feet away', icon: 'fa-trash-can' }
        },
        act: {
          safe:  { time: '4:53 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You walk it across the floor and past the press line to the container. It costs you about two minutes holding a sharp that was never yours.' },
          short: { time: '4:53 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You drop it in the bin, under a paper towel. It was not yours to begin with, and Chris is already back on the phone.' }
        },
        safeAfter: [
          { time: '11:20 PM', gap: 'six and a half hours later', gapSize: 'l',
            body: 'Jacob empties the break-room bins on nights. He gathers the bag against his leg to lift it clear of the frame, the way he always does. There is nothing in it that can hurt him, and he will never know that was ever in question.' }
        ],
        after: [
          { time: '11:20 PM', gap: 'six and a half hours later', gapSize: 'l',
            body: 'Jacob empties the break-room bins on nights. You have never met him — he comes in after second shift clocks out, and a lidded bin tells him nothing.' },
          { time: '11:21 PM', gap: 'a minute later', gapSize: 's', injury: 'Possible exposure',
            body: 'He gathers the bag against his leg to lift it clear of the frame. The needle is somewhere in the middle of it, and it goes through the plastic into his thigh.' },
          { time: 'Over the next six months', gap: 'and then', gapSize: 'm',
            body: 'Jacob now has to be tested at six weeks, twelve weeks and six months to find out whether he caught anything. It was Chris’s blood on that needle, handed off in a hurry. He has done nothing wrong at any point in this chain.' }
        ]
      }
    },
    // Alignment brief D8, reopened 2026-09-21: K&A's Law Enforcement script
    // (`Contain_the_Sharp_Law_Enforcement.pdf`, final) is real per-role content
    // for one of this sector's three named roles — the thing D8 said to build
    // "once K&A/SME author real content and hand it to us." Rebuilt from the
    // ground up against that script: the sector previously ran an original,
    // EMS-flavored world (an ambulance crew, IV catheters, a jump bag) with no
    // source script behind it at all. `roles` narrows from the old umbrella
    // ('EMS · fire · law enforcement') to what this content actually depicts,
    // rather than claiming coverage of roles no scene here shows. EMS/fire
    // content for this sector would need its own source material the same way
    // this did — not invented to fill the old label.
    public: {
      label: 'Public Sector', premise: 'find',
      sharps: 'Needles and syringes recovered from a subject’s property during a search or booking. Anything sharp left where the last person didn’t secure it — a cell, an evidence locker, the back seat of a patrol vehicle.',
      facility: {
        gloves: 'Issue puncture-resistant gloves to every officer for property searches and booking intake',
        boxes: 'Add a second sharps container at the booking counter, within reach of the intake window'
      },
      sustain: {
        conds: ['The line at booking is backing up',
                'Another officer needs you across the lot',
                'Clearing your vehicle at the end of shift'],
        hint: 'at the booking counter, past the intake window'
      },
      roles: 'patrol · booking · property', org: 'Kell County Police Department', orgShort: 'Kell County PD',
      coord: { name: 'Marcus Whitfield', title: 'Training Sergeant', email: 'training@kellcountypd.gov' },
      role: 'Patrol officer', where: 'The station', when: 'Booking intake',
      case1: 'You recover a used needle from a subject’s property at the booking counter and set it down — the container is across the intake area, and the line behind you is backing up.',
      case2: 'The sharps container in the station’s processing area is packed past its fill line, and the spare is in the property room down the hall.',
      case3: 'On your way to the container, you pass a used syringe partly hidden in a general-waste bin near the booking counter.',
      case4: 'A custodian collecting that bin overnight is stuck through the bag. It was a needle nobody logged at intake.',
      story: {
        by: 'Patrol officer, county PD. Told at a shift briefing.',
        paras: [
          'I recovered a used needle from a subject’s property during a search, mid-arrest. Booking was backed up and both my hands were full processing the arrest, so I set it on the counter. Two minutes, I thought.',
          'The line moved. I never went back for it.',
          'Overnight, somebody swept the counter into the general trash. The custodian on the morning bag run got stuck through the bag pulling it out.',
          'He did the protocol. Twelve weeks of bloodwork. He never said a word to me about it — I only found out because the sergeant pulled the incident report.',
          'I walk it to the container now, every time, even with a line behind me. It costs about a minute.'
        ]
      },
      // What counts as a sharp HERE, in prose, for the hazard article — not
      // the booking-counter needle the cases and chain use, same pattern as
      // the other three sectors' own incident.
      jobPara: 'A needle or syringe recovered from a subject’s property during a search or booking has been in someone within the last hour. Broken glass from an evidence intake or a holding cell can carry the same risk. None of these look dramatic. That is the hazard. Something that looks like trash is easier to pick up than something that looks like a syringe.',
      // NOT regenerated this round — no image-generation tool available in
      // this session. src still points at the old ambulance photo, which no
      // longer matches; alt text describes what the real asset should show.
      // This field is not currently rendered anywhere live (see chat summary
      // 2026-09-21), so nothing on screen is broken by the mismatch, but it
      // needs a real photo before this field is ever wired up.
      photo: {
        src: '../../../../assets/images/sharps-account-public.jpg',
        alt: 'NEEDS A NEW PHOTO (see chat summary 2026-09-21) — a used hypodermic needle wedged into the back-seat upholstery of a patrol vehicle at night, dome light on.'
      },
      chain: {
        end: 'Remember, you may never meet whoever empties the booking counter’s trash after your shift.',
        avoided: 'Jacob never has to find out whether that needle mattered.',
        setup: { time: '9:40 PM', body: 'You recover a used needle from a subject’s property during a search at the booking counter. Intake is backed up behind you, and both hands are already on the next subject. The designated sharps container is across the intake area. There is also the general trash bin right at the counter.' },
        // No hero image this round — no image-generation tool available
        // this session (see chat summary 2026-09-21). Omitted rather than
        // pointed at a nonexistent file, same as Manufacturing, Education
        // and AEC, which also render without one.
        pick: {
          safe:  { t: 'The sharps container across the intake area', icon: 'fa-shield-halved' },
          short: { t: 'The general trash bin at the counter', icon: 'fa-trash-can' }
        },
        act: {
          safe:  { time: '9:41 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You cross the intake area to the container with the line still watching. It costs you about a minute, for a needle that was never yours to begin with.' },
          short: { time: '9:41 PM', gap: 'a minute later', gapSize: 's',
                   body: 'You drop it in under the counter. The line keeps moving, and intake never slows down.' }
        },
        safeAfter: [
          { time: '6:15 AM', gap: 'eight and a half hours later', gapSize: 'l',
            body: 'Jacob runs the trash on the morning custodial shift. He pulls the bag from under the counter the way he always does. There is nothing in it that can cut him, and he will never know that was ever in question.' }
        ],
        after: [
          { time: '6:15 AM', gap: 'eight and a half hours later', gapSize: 'l',
            body: 'Jacob runs the trash on the morning custodial shift. You have never met him — he comes in long after your shift ends, and a bag under the counter tells him nothing.' },
          { time: '6:16 AM', gap: 'a minute later', gapSize: 's', injury: 'Possible exposure',
            body: 'He pulls the bag clear to load the cart. The needle is somewhere in the middle of it, and it goes through the plastic into his hand.' },
          { time: 'Over the next twelve weeks', gap: 'and then', gapSize: 'm',
            body: 'Jacob now has to be tested at six weeks and again at twelve to find out whether he caught anything. Nobody can tell him whose needle it was, or how long it sat under that counter. He has done nothing wrong at any point in this chain.' }
        ]
      }
    }
  };
  // Named once so the engine's registration and the intro screen's own
  // "Your role" picker (D11) walk the same four sectors in the same order,
  // rather than a second literal that can drift from the first.
  var LENS_ORDER = ['manufacturing', 'education', 'aec', 'public'];
  // Alignment brief §6.3 (sector parity, 2026-09-17): D6 rebuilt Manufacturing
  // only; the other three sectors ran EXAMPLE_SHARPS (Manufacturing's own
  // plant-floor framing) regardless of the learner's actual sector. Each
  // sector now has its own scenario, authored against that sector's own
  // LENSES vocabulary in mix-arc.js — same four coach-led beats, same
  // calibration shape, different setting. One lookup, read wherever the
  // scenario key or its sessionStorage write-back key is needed, so the two
  // can never drift apart.
  var SCENARIO_KEY = {
    manufacturing: 'unclaimed-blade-sharps',
    education: 'unclaimed-blade-education-sharps',
    aec: 'unclaimed-blade-aec-sharps',
    public: 'unclaimed-blade-public-sharps'
  };
  function scenarioKey() { return SCENARIO_KEY[LE.lensId()] || SCENARIO_KEY.manufacturing; }

  // ==========================================================================
  //  Test-out state. K1 is the only objective the pre-module battery can buy
  //  anything with: it is mandated content, but D2 re-verifies it
  //  performatively in the simulation, so the beat may go and the floor holds.
  //  K2 (recognition) is content-locked — a low score serves it HARDER, never
  //  removes it.
  // ==========================================================================
  // ==========================================================================
  //  IMAGES — optional, and switchable. A beat declares a visual; the
  //  presenter can turn every visual in the module off to compare the two
  //  renderings side by side. That is not a gimmick: the plan's article
  //  modality is "an illustrated read" whose sector variance is explicitly a
  //  copy-AND-IMAGE pass, so whether a beat carries art is a derivation
  //  decision like any other, and worth being able to show.
  //
  //  The art here is authored SVG rather than photography. There is no sharps
  //  photo library in this repo, and a stock photo that is nearly right reads
  //  worse than a diagram that is exactly right. These are schematic on
  //  purpose: the moment, not the room.
  // ==========================================================================
  // Steps that carry art today. Adding one is a line here plus a figure()
  // call in its content builder.
  var IMAGE_STEPS = { hazard: 1 };
  function imagesOn() {
    try { return sessionStorage.getItem('sh-images') !== 'off'; } catch (e) { return true; }
  }
  // Design style: 'clara' (default) | 'vector-dark' | 'vector-light' — see
  // the html.ll-vector-style/html.ll-vector-light token overrides in
  // clara/sharps.html's <style>, and the boot snippet in its <head> that
  // applies the right class(es) before first paint. Mostly a CSS swap, so
  // the Demo menu control below never needs a replay/refresh — but the
  // Möbius orb (js/mobius-orb.js) is a WebGL canvas that reads no CSS
  // custom property, so its colours are re-set here too, live, via
  // LE.setOrbColors (MobiusOrb.setConfig — no recreate).
  //
  // The orb's default green/blue are tuned as glowing highlights against
  // CLARA's near-black stage — bright, light-value colour that pops out of
  // near-black. On Vector-light's near-white stage that relationship
  // inverts: the same light values read as pale and washed out, because
  // contrast against a light surface comes from lower value/more
  // saturation, not from brightness. So LIGHT_ORB_COLORS isn't a "brighter"
  // palette, it's a darker, more saturated one — Vector's own accent blue
  // (matches --ll-teal under html.ll-vector-style) and its documented
  // success green (--lumo-success-color fallback, interaction-style-
  // reference.html), leaving the shadow-toned `deep` channel alone since a
  // dark base tone reads fine against either surface.
  var LIGHT_ORB_COLORS = { blue: '#0271ce', green: '#158444' };
  function styleMode() {
    try {
      var v = sessionStorage.getItem('sh-style');
      return (v === 'vector-dark' || v === 'vector-light') ? v : 'clara';
    } catch (e) { return 'clara'; }
  }
  function applyStyleMode(mode) {
    var html = document.documentElement;
    html.classList.toggle('ll-vector-style', mode === 'vector-dark' || mode === 'vector-light');
    html.classList.toggle('ll-vector-light', mode === 'vector-light');
    if (LE.setOrbColors) LE.setOrbColors(mode === 'vector-light' ? LIGHT_ORB_COLORS : null);
  }
  // D10: off by default, so every learner gets the live scenario. Reviewer-
  // only, flipped from the Demo menu — see DOBASELINE_CONTENT/doBaselineInit.
  function doBaselineOn() {
    try { return sessionStorage.getItem('sh-doobject-mode') === 'baseline'; } catch (e) { return false; }
  }
  // D11: the learner's own self-assigned name, set on the title page or
  // seeded from a launch link's ?name=. Never required — every reader of
  // this falls back to an unnamed line when it comes back empty.
  function savedName() {
    try { return (sessionStorage.getItem('sh-name') || '').trim().slice(0, 40); } catch (e) { return ''; }
  }
  // Entry sequencing: whether the pre-check battery (and the path-adjustment
  // screen it can trigger) run BEFORE the module's own cover, or in their
  // usual place right after it. Off by default — "Battery at start" is
  // today's order. Read once at STEPS build time (see the reorder right
  // before LE.register), so flipping it needs a reload to take effect, the
  // same as every other structural Demo menu control.
  function batteryOrderBefore() {
    try { return sessionStorage.getItem('sh-battery-order') === 'before'; } catch (e) { return false; }
  }
  // ==========================================================================
  //  REINFORCEMENT — one extra question laid OVER the content that motivates
  //  it, instead of stacked underneath it.
  //
  //  Three screens ask twice: the account then the belief re-rate, the budget
  //  choice then its rating, the cohort figures then where your own shift
  //  sits. Underneath, the second ask competed with everything above it —
  //  worst on the account, which is a six-paragraph read the learner has
  //  already scrolled through.
  //
  //  The content is HELD, not replaced: it stays legible behind a light blur
  //  so the connection is visible, which is the same language the Scenario
  //  Simulator uses when its coach panel comes forward over a scene
  //  (.stage.is-frozen). Only for screens whose context is still live —
  //  deliberately NOT the culminating decision, where the moment has passed and
  //  freezing it would imply the learner can still act on it.
  // ==========================================================================
  // The nearest ancestor that genuinely scrolls, or the window. Guessing at
  // this is what made the first footer fix a no-op: it scrolled .ll-stage
  // (overflow hidden) and the window (body does not overflow) while the real
  // container was main.ll-object all along.
  // Nudge `el` out from under the fixed footer bar. Called after a card opens
  // AND again whenever one grows — appending the read-back to part 2 pushed
  // its own closing line back under the bar.
  function clearFooter(el) {
    try {
      var bar = document.querySelector('.ll-footer');
      if (!bar || !el) return;
      var lip = el.getBoundingClientRect().bottom - bar.getBoundingClientRect().top;
      if (lip <= 0) return;
      scrollHost(el).scrollBy({ top: lip + 16, behavior: 'auto' });
    } catch (e) {}
  }

  function scrollHost(el) {
    var n = el.parentElement;
    while (n && n !== document.body) {
      var oy = getComputedStyle(n).overflowY;
      if (/(auto|scroll|overlay)/.test(oy) && n.scrollHeight > n.clientHeight + 1) return n;
      n = n.parentElement;
    }
    return window;
  }

  function reinforce(ctx, el, stepNo, stepOf, opts) {
    if (!el) return;
    opts = opts || {};
    // Tuck the coach. Their bubble is anchored bottom-right and the layer is
    // a card in the column, so an open bubble sat ON the layer and covered the
    // third option outright. They have nothing to say at this moment anyway —
    // they speak when the answer lands.
    if (ctx && ctx.floatClose) ctx.floatClose();
    // Retire the parts of the held content this question does not need. The
    // blur says HELD, but a tall screen still has to FIT: on the cohort
    // figures the recall block has already been answered by the time the
    // layer opens, and leaving it in the column pushed the chart the question
    // is actually about off the top of the screen.
    (opts.spent || []).forEach(function (x) { if (x) x.hidden = true; });

    el.hidden = false;
    el.classList.add('rf-layer');
    if (el.parentElement) el.parentElement.classList.add('rf-on');

    // Where you are in a screen that asks more than once. Added only when the
    // caller says there IS more than one part, so a single-ask layer does not
    // carry a "1 of 1" that answers a question nobody had.
    if (stepOf > 1 && !el.querySelector('.rf-step')) {
      var m = document.createElement('span');
      m.className = 'rf-step';
      m.textContent = 'Part ' + stepNo + ' of ' + stepOf;
      el.insertBefore(m, el.firstChild);
    }

    // Focus the card rather than the first control inside it: a screen reader
    // then reads the question before the options, and a keyboard learner lands
    // at the top of what just appeared instead of halfway into it. But a bare
    // tabindex="-1" div has no accessible name of its own — focus would move
    // there silently, leaving the learner to read forward to find the
    // question. Point it at its own heading instead, so landing on it reads
    // the question aloud immediately.
    var heading = el.querySelector('h1, h2, h3');
    if (heading) {
      if (!heading.id) heading.id = (el.id || 'rf') + '-h';
      el.setAttribute('role', 'group');
      el.setAttribute('aria-labelledby', heading.id);
    }
    el.setAttribute('tabindex', '-1');
    // The held content may be taller than the viewport, so the ask can land
    // below the fold — leaving the learner looking at blurred text with no
    // visible question. Bring it into view with the LEAST movement that does
    // it: 'center' parked the card mid-screen and dragged the held content up
    // with it, which on the cohort figures left under a third of the chart
    // visible. 'nearest' scrolls only as far as it has to, so what the
    // question refers to stays where the learner last saw it.
    var soft = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      el.scrollIntoView({ block: 'nearest', behavior: soft ? 'smooth' : 'auto' });
    } catch (e) { el.scrollIntoView(); }
    // scrollIntoView measures against the VIEWPORT, and the bottom 80px of it
    // is the fixed footer bar. A card whose last control sits in that band
    // reads as fully visible to the browser and is covered on the screen —
    // which hid the commit button under Continue on a 940px-tall window.
    // Nudge by however much runs under the bar.
    // ...and then clear the footer bar, which scrollIntoView cannot know about.
    // It measures against the VIEWPORT; the bottom 80px of that is a FIXED
    // footer, so a card whose last control lands in that band reads as fully
    // visible to the browser and is covered on the screen — it hid the commit
    // button under Continue on a 940px-tall window. Measured after the smooth
    // scroll settles, because the lip is meaningless mid-animation, and
    // applied to the element that actually scrolls: neither the window nor
    // .ll-stage does here, it is main.ll-object with overflow-y:auto.
    setTimeout(function () { clearFooter(el); }, soft ? 380 : 0);
    try { el.focus({ preventScroll: true }); } catch (e) {}
  }

  function figure(svg, caption) {
    if (!imagesOn()) return '';
    return '<figure class="fig">' + svg +
      (caption ? '<figcaption>' + esc(caption) + '</figcaption>' : '') + '</figure>';
  }
  // Figures are cache-busted the same way the scripts and the stylesheet are.
  // Re-exporting an image writes new bytes to the SAME path, and without this
  // the browser keeps serving the copy it already has — the new art simply
  // never appears, with nothing on screen to say why. Bump ONCE after
  // replacing any figure; it covers every photograph in the module.
  var IMG_V = '2';
  function imgSrc(src) {
    return src + (src.indexOf('?') < 0 ? '?v=' + IMG_V : '');
  }
  // The same frame around a real image rather than an inline SVG, and on the
  // same Demo images gate so turning figures off still turns this one off.
  function photoFigure(src, alt, caption) {
    if (!imagesOn()) return '';
    return '<figure class="fig fig--photo">' +
        '<img src="' + esc(imgSrc(src)) + '" alt="' + esc(alt) + '" decoding="async">' +
      (caption ? '<figcaption>' + esc(caption) + '</figcaption>' : '') + '</figure>';
  }
  // The gap the whole module is about: a sharp at rest somewhere it was never
  // meant to be, and the hand that meets it next.
  var FIG_LEFT_BEHIND =
    '<svg viewBox="0 0 640 250" role="img" aria-label="A sharp left on a work surface, with a disposal container out of reach and a bare hand approaching from the other side">' +
      '<defs><linearGradient id="figGlow" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#2ee6cf" stop-opacity=".18"/>' +
        '<stop offset="1" stop-color="#2ee6cf" stop-opacity="0"/></linearGradient></defs>' +
      // the surface
      '<rect x="40" y="150" width="560" height="7" rx="3.5" fill="#22304a"/>' +
      '<rect x="40" y="157" width="560" height="26" fill="#141f33"/>' +
      // the sharp, left at rest
      '<g transform="translate(150 128)">' +
        '<rect x="0" y="14" width="86" height="9" rx="4.5" fill="#f1b34a"/>' +
        '<rect x="78" y="16.5" width="30" height="4" rx="2" fill="#f1b34a"/>' +
        '<circle cx="8" cy="18.5" r="7" fill="#f1b34a" opacity=".55"/>' +
      '</g>' +
      // its unused route to the container
      '<path d="M270 146 C 340 100, 430 100, 496 138" stroke="#2ee6cf" stroke-width="2" ' +
        'stroke-dasharray="7 9" fill="none" opacity=".45"/>' +
      // the container, out of the moment
      '<g transform="translate(470 78)" opacity=".8">' +
        '<rect x="0" y="18" width="74" height="72" rx="8" fill="none" stroke="#2ee6cf" stroke-width="2.5"/>' +
        '<rect x="-6" y="6" width="86" height="14" rx="7" fill="#2ee6cf" opacity=".85"/>' +
        '<rect x="28" y="0" width="18" height="8" rx="4" fill="#2ee6cf" opacity=".6"/>' +
        '<path d="M6 56 H68" stroke="#2ee6cf" stroke-width="1.5" stroke-dasharray="4 5" opacity=".7"/>' +
      '</g>' +
      // the next person, arriving without knowing
      '<g transform="translate(74 96)" opacity=".95">' +
        '<path d="M40 58 C 40 34, 24 28, 14 34 C 4 40, 6 56, 18 58 Z" fill="#ff8b6b" opacity=".85"/>' +
        '<rect x="36" y="50" width="34" height="10" rx="5" fill="#ff8b6b" opacity=".85"/>' +
      '</g>' +
      '<rect x="40" y="183" width="560" height="52" fill="url(#figGlow)"/>' +
    '</svg>';

  // Patch a result key rather than replace it — saveResult() overwrites the
  // whole value, and hazard in particular is written from three different
  // places (the explainer's carrier choice, hzcheck's pass, hzcheck's miss)
  // that each need to keep what the others already wrote.
  function mergeResult(key, patch) {
    var cur = readCourse()[key] || {};
    var out = {};
    for (var k in cur) out[k] = cur[k];
    for (var k2 in patch) out[k2] = patch[k2];
    saveResult(key, out);
  }
  // D6/item 15: F2 is "ask + sampled" — only part of the cohort is asked, a
  // real assessment-sampling pattern, rather than either asking everyone or
  // gating on it. Deterministic by sector (not random) so a reviewer
  // switching sectors sees a stable, reproducible sample rather than a coin
  // flip that changes on every reload. Alignment brief D3: Manufacturing is
  // sampled OUT — K&A's script is explicit that F2 (engineering controls) is
  // asked once for the whole course, in Module 2, and not repeated here.
  // The final Law Enforcement script (2026-09-21) carries the identical
  // instruction word-for-word, so Public Sector is sampled out on the same
  // basis — no source script confirms this either way for Education/AEC.
  var SAMPLE_MAP = {
    F2: { manufacturing: false, education: true, aec: false, public: false }
  };
  function sampled(objId) {
    var m = SAMPLE_MAP[objId];
    return !m || !!m[LE.lensId()];
  }
  function batteryResult() {
    try { var o = sessionStorage.getItem('sh-battery');
          if (o === 'proven' || o === 'unproven') return o; } catch (e) {}
    var b = readCourse().battery;
    if (b && b.k1) return b.k1 === 'proven' ? 'proven' : 'unproven';
    return 'unproven';
  }
  // K2 (recognition) is content-locked, on its own battery item — a strong K1
  // result does not decide it (that was the bug: K2 was never even IN the
  // battery, and its harder-cases trigger was reading K1).
  function k2TestUp() {
    var b = readCourse().battery;
    if (b && typeof b.k2up === 'boolean') return b.k2up;
    // No battery record — the presenter forced the result from the Demo
    // menu, which moves both (K1/K2) together for one coherent "proven"
    // state rather than reporting proven with test-up silently switched
    // off, which put a KEPT chip on the same screen as a summary line
    // saying it got harder.
    return batteryResult() === 'proven';
  }
  // There is deliberately no feelLow() here. The two Feel items set a
  // BASELINE and route nothing: their whole job is to be comparable to the
  // same question asked again later, and the reportable figure is the MOVE.
  // The adjustment screen used to print an "Added" row off a low score,
  // naming a beat that in fact runs for every learner — a claim with no
  // change behind it, on the one screen whose argument is that every line
  // points at a real moment. Feel may still make a beat heavier; when it
  // does, the row goes back with the weight, not ahead of it.

  // ==========================================================================
  //  TITLE PAGE — the same LMS anatomy as the Bystander module, rendered from
  //  the live path so it foreshadows compression honestly.
  // ==========================================================================
  var DONE_KEYS = { battery: 'battery', adjust: 'battery', chain: 'chain', hazard: 'hazard', case1: 'case1',
                    inflow: 'inflow', case2: 'case2', case3: 'case3',
                    controls: 'controls', debrief: 'debrief', remk1: 'remk1', walk: 'walk',
                    // `enact` has no key: the scenario runs on its own page and
                    // writes nothing back here, so the cover cannot honestly
                    // tick it. It used to borrow the timed screen's result,
                    // which was a tick for a different screen's work.
                    record: 'record' };
  // Durations are summed from the steps themselves so the rail can never
  // drift from the syllabus. `full` already includes remediation steps
  // (e.g. remk1) alongside every adaptive one — it's the worst-case total
  // with no test-out, which is exactly what "Max time" reports pre-battery.
  function pathMinutes() {
    var full = 0;
    STEPS.forEach(function (st) { if (st.mins) full += st.mins; });
    return { full: full };
  }
  function initials(name) {
    return String(name || '').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  // D-modidx: this list used to render Sharps' OWN sections (Learn/Practice/
  // Debrief) so a learner could see and jump back into what was inside the
  // one module they were on. It now renders the course's SIBLING modules
  // instead — Sharps is one row among six, distinguished only by the state
  // it's actually in — so the page reads as a course home, not a syllabus.
  // The old per-section list (with its adaptive-cut demonstration) still
  // has a job, just not here: it belongs AFTER the battery has actually run,
  // where "here's what came out of your path" is true. That screen doesn't
  // exist yet.
  // Every entry but 'sharps' is a stand-in — there's no real syllabus behind
  // the other five yet, so their names and minutes are illustrative, not
  // sourced. 'sharps' has no fixed mins: its row reads the live
  // pathMinutes() below like the old rail card did, so it can't drift from
  // the syllabus it's actually describing.
  var COURSE_MODULES = [
    { name: 'Understanding Bloodborne Pathogens', icon: 'fa-virus', mins: 15, state: 'done' },
    { name: 'Universal Precautions', icon: 'fa-shield-halved', mins: 20, state: 'done' },
    { name: 'Personal Protective Equipment', icon: 'fa-mask-face', mins: 18, state: 'done' },
    { name: 'Contain the Sharp', icon: 'fa-syringe', current: true },
    { name: 'Spill Response & Decontamination', icon: 'fa-spray-can-sparkles', mins: 12, state: 'locked' },
    { name: 'Exposure Incidents & Reporting', icon: 'fa-file-medical', mins: 10, state: 'locked' }
  ];
  function INTRO_CONTENT() { var L = lens(); return '' +
    '<main class="ll-object">' +
      '<div class="cp-page">' +
        '<header class="cp-hero-band">' +
          '<div class="cp-hero">' +
            '<p class="ll-eyebrow">' + COURSE_MODULES.length + ' Modules</p>' +
            '<h1>Bloodborne Pathogens</h1>' +
            '<p class="cp-desc">This course covers what OSHA’s Bloodborne Pathogens Standard (29 CFR ' +
              '1910.1030) requires of anyone who could contact blood or other potentially infectious ' +
              'materials on the job — recognizing exposure risks, applying universal precautions, using ' +
              'personal protective equipment correctly, and handling sharps, spills, and exposure incidents ' +
              'safely.</p>' +
            '<div class="cp-chips">' +
              '<span class="cp-chip due"><i class="fa-solid fa-calendar-day"></i> Required · due Oct 3</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-wand-magic-sparkles"></i> AI-guided · CLARA</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-briefcase"></i> ' + esc(L.label) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="cp-art"><img src="../../../../assets/images/sharps-header.jpg" alt="" /></div>' +
        '</header>' +
        '<div class="cp-grid">' +
          '<section class="cp-sections">' +
            '<div class="cp-sec-head"><h2>Course modules</h2></div>' +
            '<div id="cpRows"></div>' +
          '</section>' +
          '<aside class="cp-rail">' +
            // Set before anything else in the module runs, so the very first
            // screen that offers a choice (hazard) already opens on it rather
            // than on a hardcoded default the learner then has to notice and
            // correct. Writes to the SAME session value the in-beat pickers
            // already read and write (modalityId()/'sh-modality') rather than
            // a second, competing preference — changing it later on any one
            // screen IS changing it everywhere else too, which is the point.
            '<div class="cp-card cp-format"><h3>Preferred format</h3>' +
              // Collapsed to the current choice by default — a full four-way
              // picker on a page the learner has not started anything on yet
              // reads as a decision being demanded rather than a setting
              // already made on their behalf. "Change" expands the same
              // picker every in-beat screen uses (modalityDropdown — this
              // card is where that shape originated; hazardInit/
              // procedureInit below now share it rather than each rolling
              // their own), so all four options (including the declined
              // one, honestly labeled) are still one tap away.
              modalityDropdown({ now: 'introModNow', btn: 'introModChange', wrap: 'introModPickWrap',
                icon: 'introModNowIcon', label: 'introModNowLabel', pick: 'introModPick' },
                MODALITY_ORDER) +
            '</div>' +
            // D11 → moved to the Demo menu: sector/role and the self-assigned
            // name are reviewer/demo-driver settings, not a choice a real
            // learner makes on every visit — an LMS assigns the sector, and a
            // real name comes from SSO. Role rides the engine's own Context
            // lens control (already in the Demo menu on this step, since
            // `intro` is in lensedSteps); name gets its own row below. Both
            // still work as before via ?role=/?name= launch params and
            // sessionStorage (ll-lens/sh-name) — only the learner-facing
            // rail cards are gone.
            '<div class="cp-card cp-res"><h3>Resources</h3>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-file-pdf"></i> ' + esc(L.orgShort) + ' exposure control plan <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-kit-medical"></i> What to do after a needlestick <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-scale-balanced"></i> OSHA 1910.1030 <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
            '</div>' +
            '<div class="cp-card"><h3>Course coordinator</h3>' +
              '<div class="cp-coord"><span class="ava">' + esc(initials(L.coord.name)) + '</span>' +
                '<span><b>' + esc(L.coord.name) + '</b><small>' + esc(L.coord.title) + ' · ' + esc(L.coord.email) + '</small></span></div></div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
    '</main>'; }
  function introInit(ctx) {
    var course = readCourse();

    // D11: resumable progress now lives on the Sharps row itself (see the
    // "resume" state below) instead of a banner above the page. Battery-
    // before mode runs battery/adjust BEFORE this cover, so on the very
    // FIRST pass through the module `last` is already one of them by the
    // time we get here — that's this run continuing forward, not somebody
    // returning after having left. Only a real return visit (anything past
    // the cover, in the normal course content) counts as progress worth
    // resuming. LE.goTo refuses a step the current path no longer contains
    // (a when()-excluded remediation, say), which here just means Resume
    // quietly does nothing rather than stranding anyone; Start over always
    // works regardless.
    var last = LE.lastStepId();
    var justArrived = batteryOrderBefore() && (last === 'battery' || last === 'adjust');
    var hasProgress = !!(last && last !== 'intro' && !justArrived && LE.stepById(last));

    var mins = pathMinutes();

    document.getElementById('cpRows').innerHTML = COURSE_MODULES.map(function (m) {
      if (!m.current) {
        return '<div class="cp-row' + (m.state === 'locked' ? ' is-locked' : '') + '">' +
          '<span class="cp-row-ico"><i class="fa-solid ' + m.icon + '"></i></span>' +
          '<span class="cp-row-main"><b>' + esc(m.name) + '</b>' +
            '<span class="cp-row-meta"><span>About ' + m.mins + ' min' + (m.mins > 1 ? 's' : '') + '</span></span></span>' +
          '<span class="cp-row-state ' + m.state + '">' + (m.state === 'done' ? 'Complete' : 'Locked') + '</span>' +
        '</div>';
      }
      // Sharps is the only module with real content behind it, so it's the
      // only row this page can act on. Resume gets two separate buttons
      // ("Resume" and "Start over" are different actions, neither should be
      // guessable from tapping the row body) — but up next has exactly ONE
      // possible action, so the whole row can safely be that action.
      var icoMain = '<span class="cp-row-ico"><i class="fa-solid ' + m.icon + '"></i></span>' +
        '<span class="cp-row-main"><b>' + esc(m.name) + '</b>' +
          '<span class="cp-row-meta"><span>About ' + mins.full + ' min' + (mins.full > 1 ? 's' : '') + '</span></span></span>';
      if (hasProgress) {
        return '<div class="cp-row is-current">' + icoMain +
          '<span class="cp-row-state-wrap">' +
            '<button class="cp-row-state resume" type="button" data-action="resume">Resume</button>' +
            '<button class="cp-row-reset" type="button" data-action="reset" title="Start over" aria-label="Start over"><i class="fa-solid fa-rotate-left"></i></button>' +
          '</span>' +
        '</div>';
      }
      return '<button class="cp-row is-current is-startable" type="button" data-action="start" aria-label="Start ' + esc(m.name) + '">' + icoMain +
        '<span class="cp-row-state todo">Up next</span>' +
      '</button>';
    }).join('');

    document.getElementById('cpRows').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'resume') { LE.goTo(last); return; }
      if (btn.dataset.action === 'start') {
        // The same "one step forward" the footer's Start module button
        // does — found live off STEPS rather than hardcoded, so a reordered
        // syllabus can't strand this row on a step that moved.
        var introIdx = STEPS.findIndex(function (st) { return st.id === 'intro'; });
        var firstStep = STEPS[introIdx + 1];
        if (firstStep) LE.goTo(firstStep.id);
        return;
      }
      // Start over — the same reset the old welcome-back banner ran. ll-lens
      // and sh-name are Demo menu settings now (role, name), not this run's
      // progress — same reason Review mode survives a Start over. Only the
      // run itself and its learner-facing preferences reset.
      ['sh-course-riff00', 'sh-course-last', 'sh-images', 'sh-battery', 'sh-doobject-mode', 'sh-modality']
        .forEach(function (k) { try { sessionStorage.removeItem(k); } catch (err) {} });
      location.reload();
    });

    // The rail's format setting. Reads as "here is your current setting",
    // not "make a choice" — collapsed to the current pick until "Change" is
    // tapped, which reveals the same four-option picker every in-beat
    // screen uses (initModalityDropdown owns the collapse/expand chrome and
    // the outside-click close; picking an option still writes the
    // preference here, since that write is this card's own job, not
    // something a shared helper should do on every caller's behalf).
    var introPick = document.getElementById('introModPick');
    if (introPick) {
      var introDD = initModalityDropdown(
        { btn: 'introModChange', wrap: 'introModPickWrap', icon: 'introModNowIcon', label: 'introModNowLabel' });
      var markFmt = function (k) {
        [].forEach.call(introPick.querySelectorAll('.md-opt'), function (b) {
          var on = b.dataset.m === k;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
      introDD.render(modalityId());
      markFmt(modalityId());
      introPick.addEventListener('click', function (e) {
        var b = e.target.closest('.md-opt');
        if (!b) return;
        try { sessionStorage.setItem('sh-modality', b.dataset.m); } catch (err) {}
        markFmt(b.dataset.m);
        introDD.render(b.dataset.m);
        introDD.collapse();
      });
    }

    // Role (sector) is now set from the Demo menu's Context lens control
    // only — see CFG.lensedSteps below. Name has its own Demo menu row
    // (shNameBtn in CFG.demoControls).

    ctx.floatClose();
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  PRE-MODULE BATTERY — four items, and the composition is the point:
  //  gate-flagged Know and remediate-flagged Feel. NEVER a Do objective,
  //  because a question cannot credibly measure behavior.
  // ==========================================================================
  var BATTERY_CONTENT =
    '<main class="ll-object">' +
      // Card-STACK shell (sharps-only — see the CSS comment in
      // clara/sharps.html for why this doesn't live in the shared
      // css/layered-beats.css .bl-* pattern). Dots read the set size up
      // front. Two static preview cards sit behind #blAsk, receding
      // (smaller/dimmer/higher, Time-Machine style) — see swapTo() for how
      // their roles ping-pong as the stack advances.
      '<div class="bl-carousel" id="blCarousel">' +
        '<div class="bl-dots" id="blDots" role="presentation"></div>' +
        '<div class="bl-stage" id="blStage">' +
          '<div class="bl-ask sh-battery" id="blAsk">' +
            '<p class="ll-eyebrow" id="blStep">Quick question: 1 of 5</p>' +
            // The situation, when there is one. The module's case screens already
            // separate the setup from the question it leads to; a stem carrying
            // both broke across two lines mid-sentence, which is what this fixes.
            '<p class="bl-scene" id="blScene" hidden></p>' +
            '<h2 class="bl-q" id="blQ"></h2>' +
            '<p class="bl-hint" id="blHint" hidden></p>' +
            '<div class="bl-options" id="blOptions" role="radiogroup" aria-labelledby="blQ"></div>' +
            // Choosing and answering are two acts. Shown DISABLED from the start
            // rather than appearing on selection, so the second step is visible
            // before the learner commits to anything — the point is that a tap
            // cannot score them by accident.
            '<button class="bl-check" id="blCheck" type="button" hidden disabled></button>' +
          '</div>' +
          // Static previews of the ACTUAL upcoming questions — same
          // classes as #blAsk (via setPeekContent), so each is
          // pixel-identical in content and typography to what it becomes.
          // Never interactive: options render as plain elements, not
          // buttons, and aria-hidden keeps them out of the accessibility
          // tree — a question only becomes real (and reachable) once it's
          // promoted into #blAsk. Which node holds "one behind" vs "two
          // behind" ping-pongs each turn; see swapTo().
          '<div class="bl-peek sh-battery" id="blPeek1" aria-hidden="true" hidden></div>' +
          '<div class="bl-peek sh-battery" id="blPeek2" aria-hidden="true" hidden></div>' +
        '</div>' +
      '</div>' +
    '</main>';
  var BATTERY = [
    // K1 is sequence recall, so the item is an actual ordering task rather
    // than a choice between three written sequences. Reading a sequence and
    // producing one are different things, and only the second is the
    // objective. The list is on screen in the wrong order and the learner
    // rearranges it — an affordance that needs no instruction to read.
    { obj: 'K1', type: 'order',
      scene: 'You have just used a sharp.',
      stem: 'What do you do next?',
      hint: 'Put the next three actions in order by dragging or using arrows.',
      correct: ['feature', 'move', 'dispose'],
      actions: [
        { id: 'move',    icon: 'fa-person-walking', t: 'Walk to the container' },
        { id: 'dispose', icon: 'fa-inbox',          t: 'Drop it in' },
        { id: 'feature', icon: 'fa-shield-halved',  t: 'Activate the safety feature' }
      ],
      okReply: 'Exactly. Safety first, then disposal.',
      badReply: 'Not quite. The safety feature goes on FIRST, before the sharp moves: an unshielded point in transit is where most injuries happen.' },
    // K2, diagnostic — recognition, not recall: can the learner already spot
    // the condition case 2 is built on (a container past its fill line)? The
    // two wrong answers are the conditions people mistake for the real signal
    // (time, quantity) rather than the one that actually matters (fill level).
    { obj: 'K2',
      stem: 'Which of these is a sign a sharps container is no longer safe to use?',
      cta: 'Check answer',
      options: [
        { t: 'It is filled above the line marked full', icon: 'fa-triangle-exclamation', score: 2,
          reply: 'Right. Past the fill line, the safety feature can’t do its job even if the lid still closes.' },
        { t: 'It has been in place for more than a week', icon: 'fa-calendar', score: 0,
          reply: 'Not quite. A container is judged by how full it is, not how long it has been there.' },
        { t: 'It already has a few sharps inside it', icon: 'fa-box', score: 0,
          reply: 'Not quite. A container with a few sharps in it is simply doing its job.' }
      ] },
    { obj: 'F1',
      stem: 'Safe sharps disposal protects your coworkers, not just you.',
      hint: 'No right or wrong answer here, and nothing is graded. Answer honestly \u2014 we come back to this question later.',
      cta: 'Lock it in',
      options: [
        { t: 'Strongly agree', icon: 'fa-heart', score: 3, reply: 'Your answer also has to hold up when you’re in a hurry.' },
        { t: 'Somewhat', icon: 'fa-scale-balanced', score: 2, reply: 'Fair. We’ll explore who actually ends up carrying the risk.' },
        { t: 'It is mostly a formality', icon: 'fa-file-lines', score: 1, reply: 'That’s worth testing.' }
      ] },
    { obj: 'F3',
      stem: 'Of the people you work alongside, how many put a used sharp straight into the container?',
      hint: 'Answer honestly, and we come back to this later with the real figure.',
      cta: 'Lock it in',
      options: [
        { t: 'Most do', icon: 'fa-users', score: 3, reply: 'Noted. We’ll see how that compares to what the research actually found.' },
        { t: 'About half', icon: 'fa-users-slash', score: 2, reply: 'Noted. The real number surprises most people in both directions.' },
        { t: 'Hardly anyone', icon: 'fa-user-slash', score: 1, reply: 'Noted. If that’s true where you work, it matters more than the procedure does.' }
      ] }
  ];
  function batteryInit(ctx) {
    var res = { k1: 'unproven', k1score: 0, k2up: false, f1: 3, f3: 3 };
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var hintEl = document.getElementById('blHint');
    var optsEl = document.getElementById('blOptions');
    var checkEl = document.getElementById('blCheck');
    var sceneEl = document.getElementById('blScene');
    var dotsEl = document.getElementById('blDots');
    var k1 = [];
    // Time-machine stack: #blAsk is always the live, interactive depth-0
    // card. The two preview nodes are fixed DOM elements but their ROLE
    // (which one currently sits "one behind" vs "two behind") ping-pongs
    // every turn \u2014 see swapTo(). `near` always holds the question ABOUT to
    // be promoted (current index + 1); `far` holds the one behind that
    // (current index + 2).
    var near = document.getElementById('blPeek1');
    var far = document.getElementById('blPeek2');

    render(0);
    setPeekContent(near, 1); near.className = 'bl-peek sh-battery depth1';
    setPeekContent(far, 2); far.className = 'bl-peek sh-battery depth2';
    pinStageHeight();

    // .ll-object (the page's own wrapper) vertically centres on its TOTAL
    // content height — fine for a static screen, but the order task (K1)
    // renders noticeably taller than the three multiple-choice items, so
    // without this the whole page visibly re-centres, not just the card,
    // every time a turn promotes a differently-sized question. Measured
    // once against the real BATTERY content rather than hardcoded, so a
    // future copy edit that makes some question taller can't silently
    // reintroduce the jump. #blStage stays this height regardless of which
    // question is live; align-items:flex-start (added alongside this in
    // the CSS) keeps #blAsk at its own natural height inside it rather
    // than stretching to fill the reserved space.
    function pinStageHeight() {
      var stageEl = document.getElementById('blStage');
      if (!stageEl) return;
      var ruler = document.createElement('div');
      ruler.className = 'bl-peek sh-battery bl-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      stageEl.appendChild(ruler);
      var max = 0;
      for (var n = 0; n < BATTERY.length; n++) {
        setPeekContent(ruler, n);
        max = Math.max(max, ruler.getBoundingClientRect().height);
      }
      stageEl.removeChild(ruler);
      var padTop = parseFloat(getComputedStyle(stageEl).paddingTop) || 0;
      stageEl.style.minHeight = Math.ceil(padTop + max + 8) + 'px';
    }

    // One dot per question \u2014 filled for what's answered, enlarged on the
    // current one, hollow for what's ahead. Lives outside .bl-stage so it
    // never moves with the cards; it is the one piece of "where am I in
    // the set" chrome that stays put while the stack advances underneath it.
    function renderDots(i) {
      if (!dotsEl) return;
      dotsEl.innerHTML = BATTERY.map(function (_, n) {
        return '<span class="bl-dot' + (n < i ? ' is-done' : n === i ? ' is-now' : '') + '"></span>';
      }).join('');
    }

    // Fills a preview node with the ACTUAL question `i` \u2014 same
    // stem/hint/options markup as #blAsk, so at whatever depth it's sitting
    // at it reads as a real card glimpsed from behind, not a stand-in.
    // Every option renders as a plain element, never a <button>, so
    // nothing inside is a tab stop even though the node's own aria-hidden
    // already pulls it out of the accessibility tree. Hidden outright once
    // there's no such question (the set is short, or we're near the end).
    function setPeekContent(el, i) {
      if (!el) return;
      var q = BATTERY[i];
      if (!q) { el.hidden = true; return; }
      el.hidden = false;
      var html = '<p class="ll-eyebrow">Quick question: ' + (i + 1) + ' of ' + BATTERY.length + '</p>';
      if (q.scene) html += '<p class="bl-scene">' + esc(q.scene) + '</p>';
      html += '<h2 class="bl-q">' + esc(q.stem) + '</h2>';
      if (q.hint) html += '<p class="bl-hint">' + esc(q.hint) + '</p>';
      if (q.type === 'order') {
        // Numbered and with its own disabled "Check order" button — the
        // real render() shows both from the first frame (the list starts
        // in its unsolved, authored order; the button is visible-but-
        // disabled, not absent). Matching that here means promotion never
        // has to grow a control the learner didn't see coming.
        html += '<div class="ord-wrap"><ol class="ord-list">' + q.actions.map(function (a, n) {
          return '<li class="ord-item"><span class="ord-n">' + (n + 1) + '</span>' +
            '<i class="fa-solid fa-grip-vertical ord-grip" aria-hidden="true"></i>' +
            '<i class="fa-solid ' + a.icon + ' ord-ico" aria-hidden="true"></i>' +
            '<span class="ord-t">' + esc(a.t) + '</span>' +
            '<span class="ord-mv">' +
              '<button type="button" tabindex="-1"><i class="fa-solid fa-chevron-up"></i></button>' +
              '<button type="button" tabindex="-1"><i class="fa-solid fa-chevron-down"></i></button>' +
            '</span></li>';
        }).join('') + '</ol>' +
          '<button class="ord-check" type="button" disabled>Check order</button></div>';
      } else {
        // Same reasoning: the real check button is visible-but-disabled
        // from render(), never absent until a pick is made, so the preview
        // carries it too.
        html += '<div class="bl-options">' + q.options.map(function (o) {
          return '<div class="bl-option"><i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>' +
            '<span class="bl-option-label">' + esc(o.t) + '</span></div>';
        }).join('') + '</div>' +
          '<button class="bl-check" type="button" disabled>' + esc(q.cta || 'Check answer') + '</button>';
      }
      el.innerHTML = html;
    }

    // A spent control keeps its space. Hiding it outright (or removing it)
    // shortened a centred column and shifted every line on the screen at the
    // exact moment the learner was reading the verdict.
    function spend(el) {
      if (!el) return;
      el.classList.add('is-spent');
      el.disabled = true;
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
    }
    // The counterpart. render() reuses the same button for every question, so
    // without this the spent state (and its visibility:hidden) rode straight
    // into the next one and the control rendered blank.
    function arm(el) {
      if (!el) return;
      el.classList.remove('is-spent');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
    }

    function render(i) {
      var q = BATTERY[i];
      renderDots(i);
      stepEl.textContent = 'Quick question: ' + (i + 1) + ' of ' + BATTERY.length;
      sceneEl.textContent = q.scene || '';
      sceneEl.hidden = !q.scene;
      qEl.textContent = q.stem;
      hintEl.textContent = q.hint || '';
      hintEl.hidden = !q.hint;
      // The ordering item carries its own commit control inside its markup.
      checkEl.hidden = true;
      if (q.type === 'order') { renderOrder(i, q); return; }
      optsEl.className = 'bl-options';
      optsEl.innerHTML = '';
      // `sel` is the pick BEFORE it counts. Nothing is recorded, nothing is
      // disabled and CLARA says nothing until the commit — the selected-state
      // CSS already lights the choice, so the learner can see what they have
      // chosen and change it. The old behaviour scored the first tap, which
      // made a mis-tap on an attitude item route content in with no undo.
      var sel = null, settled = false;
      arm(checkEl);
      checkEl.hidden = false;
      checkEl.disabled = true;
      checkEl.textContent = q.cta || 'Check answer';
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'bl-option'; b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.setAttribute('aria-label', opt.t);
        b.innerHTML = '<i class="fa-solid ' + opt.icon + '" aria-hidden="true"></i>' +
                      '<span class="bl-option-label">' + esc(opt.t) + '</span>';
        b.addEventListener('click', function () {
          if (settled) return;
          if (sel) sel.btn.setAttribute('aria-checked', 'false');
          sel = { btn: b, opt: opt };
          b.setAttribute('aria-checked', 'true');
          checkEl.disabled = false;
        });
        optsEl.appendChild(b);
      });
      LE.pickGroup(optsEl);
      // Assigned rather than added: render() runs once per question on the
      // same node, and a listener per question would fire for every earlier
      // one as well.
      checkEl.onclick = function () {
        if (settled || !sel) return;
        settled = true;
        spend(checkEl);
        optsEl.classList.add('answered');
        optsEl.querySelectorAll('.bl-option').forEach(function (o) {
          if (o !== sel.btn) o.disabled = true;
        });
        if (q.obj === 'K1') k1.push(sel.opt.score);
        if (q.obj === 'K2') res.k2up = sel.opt.score >= 2;
        if (q.obj === 'F1') res.f1 = sel.opt.score;
        if (q.obj === 'F3') res.f3 = sel.opt.score;
        // This step carries no CLARA (noCoach, always — see the STEPS
        // entry): there's no reply to read between an answer and the next
        // card, so one click answers it. A brief pause shows the pick
        // register, then it advances on its own — select, confirm, next
        // question loads.
        setTimeout(function () {
          if (i + 1 < BATTERY.length) swapTo(i + 1); else done();
        }, T(700));
      };
    }
    // The three actions are on screen from the start, in the wrong order, and
    // the learner rearranges them. Nothing to place, so nothing to explain:
    // a drag handles a mouse, the arrow pair handles touch and keyboard, and
    // the order lives in the DOM rather than in a parallel array.
    function renderOrder(i, q) {
      optsEl.className = 'ord-wrap';
      var settled = false;
      optsEl.innerHTML =
        '<ol class="ord-list" id="ordList">' +
          q.actions.map(function (a) {
            return '<li class="ord-item" draggable="true" data-id="' + a.id + '">' +
              '<span class="ord-n"></span>' +
              '<i class="fa-solid fa-grip-vertical ord-grip" aria-hidden="true"></i>' +
              '<i class="fa-solid ' + a.icon + ' ord-ico" aria-hidden="true"></i>' +
              '<span class="ord-t">' + esc(a.t) + '</span>' +
              '<span class="ord-mv">' +
                '<button type="button" data-mv="-1" aria-label="Move “' + esc(a.t) + '” earlier"><i class="fa-solid fa-chevron-up"></i></button>' +
                '<button type="button" data-mv="1" aria-label="Move “' + esc(a.t) + '” later"><i class="fa-solid fa-chevron-down"></i></button>' +
              '</span></li>';
          }).join('') +
        '</ol>' +
        '<button class="ord-check" id="ordCheck" type="button">Check order</button>';

      var list = document.getElementById('ordList');
      var rows = function () { return [].slice.call(list.children); };
      renumber();

      // Renumbering after every move keeps the badges honest and parks the
      // arrows that would do nothing at the ends of the list.
      function renumber() {
        rows().forEach(function (li, n, all) {
          li.querySelector('.ord-n').textContent = n + 1;
          li.querySelector('[data-mv="-1"]').disabled = settled || n === 0;
          li.querySelector('[data-mv="1"]').disabled = settled || n === all.length - 1;
        });
      }
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-mv]');
        if (!btn || settled) return;
        var li = btn.closest('.ord-item');
        if (btn.dataset.mv === '-1') list.insertBefore(li, li.previousElementSibling);
        else list.insertBefore(li, li.nextElementSibling.nextElementSibling);
        renumber();
        // Moving a row to an end disables the arrow you just pressed, which
        // would drop keyboard focus; hand it to the row's other arrow.
        (btn.disabled ? li.querySelector('[data-mv]:not(:disabled)') : btn).focus();
      });

      // Drag: move the node itself rather than re-rendering, or the element
      // under the cursor disappears mid-gesture.
      var dragging = null;
      list.addEventListener('dragstart', function (e) {
        var li = e.target.closest('.ord-item');
        if (!li || settled) { e.preventDefault(); return; }
        dragging = li; li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', li.dataset.id); } catch (err) {}
      });
      list.addEventListener('dragend', function () {
        if (dragging) dragging.classList.remove('dragging');
        dragging = null; renumber();
      });
      list.addEventListener('dragover', function (e) {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var after = null;
        rows().forEach(function (li) {
          if (li === dragging) return;
          var box = li.getBoundingClientRect();
          if (e.clientY < box.top + box.height / 2 && !after) after = li;
        });
        if (after) list.insertBefore(dragging, after);
        else list.appendChild(dragging);
        renumber();
      });
      list.addEventListener('drop', function (e) { e.preventDefault(); });

      document.getElementById('ordCheck').addEventListener('click', grade);

      function grade() {
        if (settled) return;
        settled = true;
        var right = true;
        rows().forEach(function (li, n) {
          var ok = q.correct[n] === li.dataset.id;
          if (!ok) right = false;
          li.classList.add(ok ? 'is-right' : 'is-wrong');
          li.draggable = false;
        });
        // Item 23: on a miss, show the correct order rather than leaving the
        // learner's own wrong arrangement on screen — the amber mark stays on
        // whichever rows they had misplaced, now sitting where they actually
        // belong, so the miss is legible against the right answer instead of
        // against nothing.
        if (!right) {
          var byId = {};
          rows().forEach(function (li) { byId[li.dataset.id] = li; });
          q.correct.forEach(function (id) { list.appendChild(byId[id]); });
        }
        list.classList.add('settled');
        renumber();
        spend(document.getElementById('ordCheck'));
        k1.push(right ? 2 : 0);
        // See the matching comment in checkEl.onclick above — same reasoning,
        // and this item is always BATTERY[0], so there is always a next card.
        setTimeout(function () { swapTo(i + 1); }, T(700));
      }
    }

    // Sets `el`'s depth class WITHOUT animating there — used to snap a
    // recycled preview node straight to its new resting depth the instant
    // a turn finishes, rather than animating a second time from wherever
    // it just arrived. Standard disable/reflow/re-enable dance.
    function snapDepth(el, depthClass) {
      el.classList.add('no-anim');
      el.className = 'bl-peek sh-battery no-anim ' + depthClass;
      void el.offsetWidth;
      el.classList.remove('no-anim');
    }

    function swapTo(i) {
      // Time-machine turn: `near` is ALREADY showing the real upcoming
      // question at depth 1 (one behind, smaller/dimmer/higher); `far`
      // already shows the one after that at depth 2. Advancing moves every
      // card exactly one depth step on the SAME transition — near to
      // depth0 (i.e., #blAsk's own resting look), far to depth1 — so
      // nothing changes format mid-flight, only scale/position/opacity.
      // #blAsk (just answered) isn't part of that motion, only what it
      // reveals: it simply fades out of the stack.
      askEl.classList.add('is-leaving');
      near.classList.remove('depth1'); near.classList.add('depth0');
      far.classList.remove('depth2'); far.classList.add('depth1');
      setTimeout(function () {
        // `near` has finished landing exactly at #blAsk's resting pose.
        // Render real, interactive content into #blAsk (still invisible)
        // and swap everything in the SAME tick: #blAsk snaps to visible at
        // depth 0 exactly as `near` snaps away — same content, same
        // position, so the handoff has nothing to show. `near` is then
        // recycled as the new depth-2 card (two behind); `far`, having
        // just arrived at depth 1, simply stays there. Their roles
        // ping-pong every turn.
        render(i);
        askEl.classList.add('no-anim');
        askEl.classList.remove('is-leaving');
        void askEl.offsetWidth;
        askEl.classList.remove('no-anim');
        snapDepth(near, 'depth2');
        setPeekContent(near, i + 2);
        var tmp = near; near = far; far = tmp;
      }, T(440));
    }
    function done() {
      // K1 is proven only on a clean sweep — it is mandated content, and the
      // simulation still re-verifies it performatively either way. One item
      // now that the second K1 question moved to the in-flow bank (D4), so
      // the threshold is that item's own max score, not a fixed 4 left over
      // from when two items fed this sum.
      res.k1score = k1.reduce(function (a, b) { return a + b; }, 0);
      res.k1 = (res.k1score >= 2) ? 'proven' : 'unproven';
      // K2 (recognition) is content-locked: its own item decides whether it
      // gets served HARDER, not K1's result — res.k2up is already set by its
      // own option above.
      stepEl.textContent = 'Quick questions: all ' + BATTERY.length + ' done';
      saveResult('battery', res);
      ctx.enableNext();
    }
  }

  // ==========================================================================
  //  WHAT CHANGES — the same adjustment screen as the Bystander module, but
  //  reporting two kinds of move rather than one: a beat removed AND a beat
  //  made HARDER. Compression is not the only thing a policy can do.
  //
  //  It reported a third — a beat ADDED on a low Feel score — and that row
  //  came off, because nothing was behind it: the beat it named runs for every
  //  learner on every path. Only the Know items move anything, so this screen
  //  now appears only when the procedure was proven.
  // ==========================================================================
  //  The screen runs in two phases. FIRST the orb alone, large and low on the
  //  stage, with one line under it — there is nothing to read yet, so there is
  //  nothing else on screen. THEN it drops into its crown slot and the stack
  //  arrives beneath it. Entering the page should present one thing, not five.
  var ADJUST_CONTENT =
    '<main class="ll-object ll-object--crowned" id="adjustObject">' +
      '<div class="adj">' +
        '<p class="adj-reading" id="adjReading">Reading your answers…</p>' +
        '<div class="adj-body" id="adjBody">' +
          '<p class="ll-eyebrow adj-verdict" id="adjEyebrow">Path updated</p>' +
          '<h2 class="adj-head adj-verdict" id="adjHead"></h2>' +
          '<ol class="adj-stack" id="adjStack" aria-live="polite"></ol>' +
          '<p class="adj-saved" id="adjSaved">&nbsp;</p>' +
        '</div>' +
      '</div>' +
    '</main>';
  var ADJUST_CHIPS = {
    dropped: '<span class="adj-chip adj-chip--drop"><i class="fa-solid fa-forward"></i> Skipped</span>',
    harder:  '<span class="adj-chip adj-chip--harder"><i class="fa-solid fa-arrow-trend-up"></i> Adapted</span>'
  };
  // The row set for THIS result. Extracted so the step's `when` can ask the
  // same question the screen answers: did the four answers move anything?
  //
  // Each note now carries the REASON only. The chip beside it already carries
  // the verdict, so the old notes printed "kept" and "harder" a second time
  // in prose — the loudest of the duplications that made this read as noise.
  // Every entry names a STEP, so the label and mark on this screen are the
  // same ones the learner already read in the sections list. `state` is the
  // only thing this table owns.
  var ADJUST_ROWS = [
    { id: 'procedure', state: function () { return batteryResult() === 'proven' ? 'dropped' : 'kept'; } },
    { id: 'case1',     state: function () { return batteryResult() === 'proven' ? 'dropped' : 'kept'; } },
    { id: 'inflow',    state: function () { return batteryResult() === 'proven' ? 'dropped' : 'kept'; } },
    { id: 'case2',     state: function () { return k2TestUp() ? 'harder' : 'kept'; } },
    { id: 'case3',     state: function () { return k2TestUp() ? 'harder' : 'kept'; } },
    { id: 'enact',     state: function () { return 'kept'; } }
  ];
  function adjustRows() {
    return ADJUST_ROWS.map(function (r) {
      var st = LE.stepById(r.id) || {};
      return { icon: st.icon || 'fa-circle', label: st.lesson || r.id, state: r.state() };
    }).filter(function (r) { return r.label; });
  }

  // Did anything actually move? When the answer is no, this screen has no news
  // and the step drops out of the path — the same call the Bystander module
  // makes on its own version ("silence is the right output of an adaptive
  // system that decided not to act"). Without it, the learner on the LONGER
  // path pays an extra screen to be told that nothing happened.
  function adjustMoved() {
    return adjustRows().some(function (r) { return r.state !== 'kept'; });
  }

  function adjustInit(ctx) {
    var stack = document.getElementById('adjStack');
    // Only the rows that actually moved are worth a learner's attention on
    // this screen — a "Kept" chip is just a section named as unchanged, and
    // a list that's mostly unchanged sections reads as noise around the two
    // things that matter: what got skipped and what got harder.
    var rows = adjustRows().filter(function (r) { return r.state !== 'kept'; });
    var harder = rows.some(function (r) { return r.state === 'harder'; });
    var stageEl = ctx.stage;

    ctx.floatClose();

    // ---- Phase 1 -----------------------------------------------------------
    // The orb is sized by the slot it tracks, so growing that slot and
    // re-positioning IS the animation — no second orb, no engine change, and
    // the Bystander screen (same stylesheet) is untouched because every rule
    // hangs off this stage class.
    stageEl.classList.add('is-adj-reading');
    ctx.positionOrb(false);

    // Written now, revealed later. Filling the headline while it is invisible
    // means its box is already the right height when the verdict lands, so the
    // stack underneath never shifts.
    document.getElementById('adjHead').textContent = 'Here\u2019s what\u2019s next.';
    document.getElementById('adjSaved').textContent =
      'Adapted for you based on your previous answers.';

    // A row is a label and a verdict. The per-row reasons are gone: four of
    // them repeated in small grey text is most of what made this page feel
    // like a wall, and the chip already carries the only word that matters.
    stack.innerHTML = rows.map(function (r) {
      return '<li class="adj-row" data-state="pending">' +
               '<span class="adj-ico"><i class="fa-solid ' + r.icon + '" aria-hidden="true"></i></span>' +
               '<span class="adj-main"><span class="adj-label">' + esc(r.label) + '</span></span>' +
               '<span class="adj-state"><span class="adj-spin" aria-hidden="true"></span></span>' +
             '</li>';
    }).join('');
    var els = [].slice.call(stack.children);

    // ---- Phase 2: the orb drops in, the stack resolves one row at a time ----
    setTimeout(function () {
      stageEl.classList.remove('is-adj-reading');
      ctx.positionOrb(true);
      rows.forEach(function (r, i) {
        setTimeout(function () {
          // Guarded: this chain runs for ~2.5s and nothing cancels it on
          // teardown, so a learner who advances before it finishes was
          // dereferencing a DOM that had already been replaced.
          var li = els[i];
          if (!li || !li.isConnected) return;
          li.dataset.state = r.state;
          var st = li.querySelector('.adj-state');
          if (st) st.innerHTML = ADJUST_CHIPS[r.state];
        }, T(460 + i * 420));
      });

      // ---- Phase 3: the verdict ------------------------------------------
      setTimeout(function () {
        var eb = document.getElementById('adjEyebrow');
        if (!eb) return;              // screen already gone; nothing to reveal
        eb.classList.add('in');
        document.getElementById('adjHead').classList.add('in');
        document.getElementById('adjSaved').classList.add('in');
        ctx.setCoachSay(harder
          ? 'Notice what did not move: spotting the conditions got harder, not shorter. That section never comes off.'
          : 'Note what did not move: spotting the conditions and the simulation stay exactly where they were.');
        LE.refreshNav();
        ctx.enableNext();
      }, T(460 + rows.length * 420 + 260));
    }, T(1500));
  }

  // ==========================================================================
  //  MODALITIES — capability 4, Transformation. The wrapper never moves: the
  //  battery, the cases, the simulation and the record are identical in all
  //  four. What varies is the INSTRUCTION in the middle, which in this module
  //  is exactly one beat — so the toggle doubles as proof of the invariant.
  //
  //  Podcast is DECLINED rather than rendered. This module carries under a
  //  minute of expository Know content, and a sixty-second audio file is not a
  //  podcast, it is a clip. Audio's honest unit is the COURSE — six modules
  //  assembled into one listen, carried by the sector narratives — which is
  //  Assembly, not Transformation. Declining is the stronger demonstration: a
  //  system that refuses to render badly is more credible than four green cells.
  // ==========================================================================
  var PROCEDURE_VIDEO = '../../../../assets/videos/sharps-procedure.mp4';

  // ==========================================================================
  //  THE VIDEO CARRIER — one implementation, two beats. Was inline in the
  //  procedure beat; the hazard beat needs the identical behaviour, and a
  //  second copy of a loader with this many failure modes is a second copy of
  //  its bugs.
  //
  //  Do NOT stream these. A <video> reading at playback rate dies against the
  //  preview server with MEDIA_ERR_NETWORK about two seconds in, every time,
  //  while curl and fetch pull the whole file in milliseconds. So fetch it
  //  whole and play it from a blob — after that the network is out of the
  //  picture. Same approach as the Bystander course's preloadVideoFully.
  //
  //  A missing clip is a NORMAL state here, not an error: placeholder paths
  //  are how a beat gets built before its video exists, so a 404 reveals the
  //  written version and unlocks Continue rather than stranding anyone.
  // ==========================================================================
  function videoFrame(o) {
    return '<div class="ll-media" id="' + o.ids.wrap + '">' +
        '<video id="' + o.ids.video + '" class="cv-video" controls playsinline ' +
          (o.poster ? 'poster="' + esc(o.poster) + '" ' : '') +
          'data-src="' + esc(o.src) + '"></video>' +
        '<div class="cv-loader" id="' + o.ids.wrap + 'Loader">' +
          '<div class="cv-spinner" aria-hidden="true"></div>' +
          '<div>Loading video… <b id="' + o.ids.pct + '">0%</b></div>' +
        '</div>' +
        '<button class="cv-skip" id="' + o.ids.skip + '" type="button" aria-label="Skip video">Skip <i class="fa-solid fa-forward"></i></button>' +
      '</div>' +
      '<p class="pr-vfall" id="' + o.ids.note + '" hidden></p>';
  }
  function mountVideo(ctx, o) {
    var v = document.getElementById(o.ids.video);
    var wrap = document.getElementById(o.ids.wrap);
    var note = document.getElementById(o.ids.note);
    var fallback = o.ids.fallback ? document.getElementById(o.ids.fallback) : null;

    function ready() { if (wrap) wrap.classList.add('is-ready'); }
    function toText(msg) {
      if (note) {
        note.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + msg;
        note.hidden = false;
      }
      if (fallback) fallback.hidden = false;
      if (wrap) wrap.hidden = true;
      ctx.enableNext();            // never strand someone behind a broken beat
      if (o.onFallback) o.onFallback();
    }

    if (!v) { toText('Showing the written version.'); return; }

    var pct = document.getElementById(o.ids.pct);
    var url = v.dataset.src;

    // Fetching the whole file before playing is right for a short clip and
    // wrong for a long one: a 145 MB section video is a minutes-long spinner
    // and 145 MB of memory before a single frame. So ask how big it is first
    // and STREAM anything over the threshold. Streaming was avoided here
    // originally because it died with MEDIA_ERR_NETWORK against the preview
    // server; that no longer reproduces, and the blob path is still the
    // fallback if a stream errors, so the small-clip behaviour is unchanged.
    var STREAM_OVER = 25 * 1024 * 1024;
    fetch(url, { method: 'HEAD' }).then(function (h) {
      if (h.status === 404) { var e = new Error('missing'); e.missing = true; throw e; }
      return +h.headers.get('Content-Length') || 0;
    }).then(function (size) {
      if (size > STREAM_OVER) { stream(size); return; }
      blobLoad();
    }).catch(function (err) {
      if (err && err.missing) { toText('No clip at <code>' + esc(o.src) + '</code> yet — showing the written version instead.'); return; }
      blobLoad();                // HEAD blocked or unsupported: old path
    });

    // Play as it arrives. One error and we fall back to downloading it whole.
    function stream(size) {
      var fellBack = false;
      v.addEventListener('error', function () {
        if (fellBack) return; fellBack = true;
        blobLoad();
      });
      v.preload = 'metadata';
      v.src = url;
      ready();
      if (pct) pct.textContent = Math.round(size / 1048576) + ' MB';
    }

    function blobLoad() {
    fetch(url).then(function (resp) {
      if (resp.status === 404) { var e = new Error('missing'); e.missing = true; throw e; }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var total = +resp.headers.get('Content-Length') || 0;
      if (!resp.body || !total) return resp.blob();
      var reader = resp.body.getReader(), chunks = [], got = 0;
      return (function pump() {
        return reader.read().then(function (r) {
          if (r.done) return new Blob(chunks, { type: 'video/mp4' });
          chunks.push(r.value); got += r.value.length;
          if (pct) pct.textContent = Math.round(got / total * 100) + '%';
          return pump();
        });
      })();
    }).then(function (blob) {
      v.src = URL.createObjectURL(blob);
      ready();
    }).catch(function (err) {
      if (err && err.missing) {
        toText('No clip at <code>' + esc(o.src) + '</code> yet — showing the written version instead.');
        return;
      }
      v.src = url;                 // last resort: stream it and hope
      ready();
    });
    }

    // Continue stays shut until the clip finishes. The skip is the prototype's
    // way past that, and is not a learner affordance — hidden unless review
    // mode is on, same as the S-key skip.
    v.addEventListener('play', function () { ctx.floatClose(); });
    v.addEventListener('ended', function () { ctx.enableNext(); if (o.onEnded) o.onEnded(); });
    var skip = document.getElementById(o.ids.skip);
    if (skip) skip.hidden = !LE.reviewMode();
    if (skip) skip.addEventListener('click', function () {
      ready();
      try { v.pause(); if (isFinite(v.duration) && v.duration > 0) v.currentTime = v.duration; } catch (e) {}
      v.dispatchEvent(new Event('ended'));
    });
  }

  //  ONE modality vocabulary, shared by every beat that offers a choice, so
  //  the labels and icons cannot drift between them. `label` is what a
  //  LEARNER sees on the picker button. `cost`/`tradeoff` are authored but
  //  currently unrendered — the picker used to state each carrier's length
  //  next to its label, which read as clutter once the control got this
  //  compact (see modalityDropdown below). Left in the table rather than
  //  deleted, since it's still true and may still be useful somewhere else
  //  (the Learning Layer view, a dev note) even though this UI stopped
  //  showing it.
  var MODALITIES = {
    video:   { label: 'Watch', icon: 'fa-circle-play',
               cost: '2 min',
               tradeoff: 'Two minutes, but you have to be looking at it.',
               note: 'The reference rendering — the point in the variant space the SME signed.' },
    article: { label: 'Read', icon: 'fa-file-lines',
               cost: '1 min',
               tradeoff: 'About a minute, skimmable, and you set the pace.',
               note: 'Pre-rendered. The same content, read rather than watched.' },
    // Label shortened to "Step" \u2014 the four-word version was the only one
    // of the four that didn't fit the compact picker/dropdown on one line.
    tutor:   { label: 'Step', icon: 'fa-comments',
               cost: 'Self-paced \u00b7 recall checks',
               tradeoff: 'Self-paced \u2014 CLARA checks your recall on each step instead of just telling you the next one.',
               note: 'CLARA walks the procedure one step at a time, pausing to check what you remember.' },
    podcast: { label: 'Listen', icon: 'fa-podcast', declined: true,
               cost: 'Longest \u00b7 hands free',
               tradeoff: 'Runs while you do something else, but takes longer and stops to ask you things.',
               note: 'Declined at module level. Audio is offered one level up, across the course.' }
  };

  //  The chooser. One implementation, so a second beat offering a choice
  //  cannot invent a different one. A beat declares which keys it offers and
  //  in what order; every label comes from the table above.
  //
  //  It PERSISTS rather than gating. A one-shot chooser would either hide the
  //  default carrier behind a click or vanish once used, and both are worse:
  //  the learner arrives on the default and can still see, at any point,
  //  what the other option is.
  function modalityPicker(id, keys) {
    return '<div class="md-pick" id="' + id + '" role="group" ' +
        'aria-label="How do you want to take this?">' +
      keys.map(function (k) {
        var m = MODALITIES[k];
        return '<button class="md-opt" type="button" data-m="' + k + '" aria-pressed="false">' +
          '<i class="fa-solid ' + m.icon + '" aria-hidden="true"></i>' +
          '<span class="md-opt-t"><b>' + esc(m.label) + '</b></span>' +
        '</button>';
      }).join('') +
    '</div>';
  }

  //  THE DROPDOWN — same picker, collapsed. The three-way toggle used to sit
  //  open on every screen, which on the video carrier pushed a 16:9 player
  //  most of the way down the viewport. First fix reopened the exact same
  //  wide row behind a "Change" button, which still read as a full-width tab
  //  bar reappearing and still put real distance between the current pick
  //  and the control that changes it. This one instead REUSES the title-page
  //  rail's own "Preferred format" card verbatim — .cp-format-now/
  //  .cp-format-change/.cp-format-picker, the same markup and CSS, not a
  //  lookalike — and stacks the revealed list in a single compact column
  //  (.md-now .md-pick below) instead of the wide segmented row. .md-now
  //  only exists to opt OUT of .pr-wrap's stretch-to-680px so the control
  //  hugs its own content width the way it already does inside the rail's
  //  narrow card; the rail keeps using this same function so there is
  //  exactly one implementation, not three.
  //
  //  opts.corner pins the whole control to the top-right of the beat, over
  //  the content rather than in its own row — hazardInit/procedureInit pass
  //  it, the title-page rail (a setting among several cards, not a global
  //  page control) does not. See .md-now--corner in sharps.html.
  function modalityDropdown(ids, keys, opts) {
    var corner = opts && opts.corner;
    return '<div class="md-now' + (corner ? ' md-now--corner' : '') + '">' +
        '<div class="cp-format-now" id="' + ids.now + '">' +
          '<span class="cp-format-now-t"><i class="fa-solid" id="' + ids.icon + '" aria-hidden="true"></i>' +
            '<b id="' + ids.label + '"></b></span>' +
          '<button class="cp-format-change" type="button" id="' + ids.btn + '" ' +
            'aria-expanded="false" aria-controls="' + ids.wrap + '">' +
            'Change<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="cp-format-picker" id="' + ids.wrap + '" hidden>' + modalityPicker(ids.pick, keys) + '</div>' +
      '</div>';
  }
  // Wires the collapse/expand chrome only — picking an option still runs
  // through the caller's own click handling on the picker (show(m) for the
  // in-beat carriers, the rail's own sessionStorage write for the title
  // page); this just keeps the collapsed summary in sync, folds the list
  // back down once a pick lands, and closes it on an outside click.
  //
  // One document-level listener total, registered lazily and shared by
  // every dropdown this runs for (keyed by ids.wrap) — three separate
  // listeners would be harmless individually, but a beat revisited after
  // Back re-runs its init and would otherwise stack a fresh one per visit,
  // the exact trap the title-page rail's own outside-click code used to
  // guard against with a one-off flag. Re-registering the same key on a
  // revisit just replaces the stale DOM refs with the current ones.
  var modalityDropdowns = {};
  function initModalityDropdown(ids) {
    var btn = document.getElementById(ids.btn), wrap = document.getElementById(ids.wrap);
    var icon = document.getElementById(ids.icon), label = document.getElementById(ids.label);
    function setOpen(v) { wrap.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    btn.addEventListener('click', function () { setOpen(wrap.hidden); });
    modalityDropdowns[ids.wrap] = { btn: btn, wrap: wrap, close: function () { setOpen(false); } };
    if (!window.__modDropdownOutsideBound) {
      window.__modDropdownOutsideBound = true;
      document.addEventListener('click', function (e) {
        Object.keys(modalityDropdowns).forEach(function (key) {
          var d = modalityDropdowns[key];
          if (d.wrap.hidden || d.wrap.contains(e.target) || d.btn.contains(e.target)) return;
          d.close();
        });
      });
    }
    return {
      render: function (k) {
        var m = MODALITIES[k];
        icon.className = 'fa-solid ' + m.icon;
        label.textContent = m.label;
      },
      collapse: function () { setOpen(false); }
    };
  }

  //  A titled poster rather than a black rectangle. Deliberately does NOT
  //  state the mechanism: the check at the foot of this page tests it, and a
  //  poster that answers it is the same defect the objective-statement
  //  subtitle had.
  function videoPoster(chip, title, line) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">' +
        '<rect width="1280" height="720" fill="#0b1220"/>' +
        '<rect width="1280" height="5" fill="#2ee6cf"/>' +
        '<g font-family="Open Sans, Helvetica, Arial, sans-serif">' +
          '<text x="82" y="286" fill="#2ee6cf" font-size="19" font-weight="700" letter-spacing="5">' +
            esc(chip) + '</text>' +
          '<text x="82" y="368" fill="#ffffff" font-size="52" font-weight="700">' + esc(title) + '</text>' +
          '<text x="82" y="422" fill="#9fb0c4" font-size="23">' + esc(line) + '</text>' +
        '</g>' +
        '<g transform="translate(82 470)" opacity=".5">' +
          '<circle cx="25" cy="25" r="24" fill="none" stroke="#2ee6cf" stroke-width="2"/>' +
          '<path d="M19 15 L37 25 L19 35 Z" fill="#2ee6cf"/>' +
        '</g>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  // Item 26: 'sh-modality' persists which carrier actually served the
  // procedure beat — read by remk1Modality() ("a different way in") and by
  // this beat's own default on arrival. It used to be written only by the
  // Demo menu's Modality control (a reviewer-only cycle through all four);
  // the learner-facing picker in procedureInit was the writer, and the
  // title page's "Preferred format" card (introInit) now writes it first,
  // before any beat has run.
  var MODALITY_ORDER = ['video', 'article', 'tutor', 'podcast'];
  function modalityId() {
    try { var m = sessionStorage.getItem('sh-modality'); if (MODALITIES[m]) return m; } catch (e) {}
    return MODALITY_ORDER[0];
  }
  // Filters the preference against what THIS beat actually offers, so a
  // beat with its own constraints (hazard's placeholder-gated video; no
  // beat but procedure offers tutor) doesn't hand back a carrier it can't
  // render. Falls back to that beat's own default rather than teaching
  // this helper every beat's exceptions.
  function modalityDefault(offered, fallback) {
    var pref = modalityId();
    return offered.indexOf(pref) > -1 ? pref : fallback;
  }

  // ==========================================================================
  //  THE CHAIN — F1 (Feel / Believe), and the module's FIRST content screen.
  //
  //  CONSEQUENCE BEFORE RULE. The learner arrives having answered four
  //  questions about a procedure and meets the cost of skipping it before
  //  anybody teaches it to them. The order is the whole argument: the module
  //  used to teach the sequence at position five and deliver the consequence
  //  at position ten, and a learner taught the rule first has already filed
  //  the module as compliance — the one moment they were receptive is spent.
  //  This is the most common failure in compliance content and it is free to
  //  fix, because it is an ordering decision rather than a content one.
  //
  //  THE MECHANIC IS THE PEDAGOGY. Nodes revealed ONE TAP AT A TIME, earlier
  //  ones staying visible and dimmed so the sequence is always in view, with
  //  a clock on each and the elapsed gap named between them so time is
  //  visibly passing. Nothing plays on its own and there is no "play all":
  //  the learner advancing the consequence is a different act from watching
  //  it advance, and only the first one has them construct the causal link
  //  rather than read it. That distinction is the reason this objective gets
  //  a screen at all — it was previously served, here and in the re-composed
  //  course, by a statement on a slide, which asserts a belief instead of
  //  moving it.
  //
  //  THE DECISION IS REAL NOW, and that is the fix this screen needed most.
  //  The eyebrow has always read "one decision, followed all the way through"
  //  and there was no decision in it: the shortcut was narrated FOR the
  //  learner as node two, in a subjectless fragment ("Into the bag on the
  //  rail."), and the last node then held them responsible for it. A reader
  //  could not tell whether they had done it, watched it, or were being
  //  accused of it. So the setup now stops at the choice and they make it.
  //
  //  THE DECISION IS EDITABLE. Whichever route they take, the close offers
  //  the other one — the choice is binary, so there is no reason to make it
  //  final. That replaced a narrated counterfactual on the safe route
  //  ("what the other option would have cost", header and all): a learner
  //  taking the other branch DELIBERATELY is a second decision they made,
  //  which is the same argument as the first one and reads nothing like
  //  being told what might have happened to them.
  //
  //  The FIRST choice is what gets recorded. Replaying does not overwrite
  //  it — what a learner would actually do at the end of a shift is the
  //  datum, and exploring the other branch afterwards is a separate fact.
  //
  //  One consequence of the editable version, accepted rather than fixed: a
  //  learner who walks it to the container and declines the replay leaves
  //  this screen without meeting the chain. The close makes the offer the
  //  main thing on screen rather than a footnote, but it is NOT gated —
  //  only Know gates in this module, and a Feel beat holding the door would
  //  be routing content on a self-report.
  //
  //  THE INJURY HAPPENS ON SCREEN. Every sector's chain used to set up the
  //  hazard in node three and report bloodwork in node four with no puncture
  //  in between — the one event the whole screen exists to deliver was left
  //  to inference. The downstream worker now gets a node introducing who they
  //  are and why they cannot know, and the stick gets a node of its own.
  //
  //  VERTICAL, not the horizontal strip the spec drew. Four nodes of two
  //  lines each do not survive a phone laid out left to right, and this
  //  module is reviewed on both. The connector draws in as each node lands,
  //  which is what carries the sense of one thing causing the next.
  //
  //  Each sector walks its OWN incident, taken from that sector's own list of
  //  what counts as a sharp and deliberately not the incident its case
  //  screens and its first-person account already use. Three renderings of
  //  one event would read as repetition; two unrelated ones read as a
  //  pattern, which is the point being made.
  // ==========================================================================
  //  The frame the spec wanted as its own 15-second screen. It is the opening
  //  panel of this one instead: the module already opens on a full LMS course
  //  page carrying the target behaviour verbatim, and a separate orientation
  //  screen here would be the fourth thing in a row that teaches nothing
  //  (course page → four questions → what changed → frame). Tapped past
  //  rather than read around, so the line still gets its own moment. The
  //  debrief closes back on it.
  // The frame's job is to say what the learner is about to DO. It used to
  // state the module's thesis instead — a true sentence that told you nothing
  // about the next thirty seconds, so the timeline arrived unannounced.
  var CHAIN_LEAD = 'Choose how the story ends';
  var CHAIN_LEAD_SUB = 'Follow the timeline and make a choice that determines ' +
    'how the last few moments play out.';
  var CHAIN_CLOSE = 'One person decided. A different person paid.';
  // The safe route gets its own first line. "Nobody paid" described the
  // outcome; this says plainly that the decision was the right one, which is
  // the thing a learner who made it should be told.
  var CHAIN_CLOSE_SAFE = 'This is the best path.';
  var CHAIN_PICK_Q = 'Where do you put the sharp?';
  // A LABEL for the timeline, not a prompt. The frame screen one tap earlier
  // already asks for the choice, and two near-identical instructions in a row
  // read as a stutter. A label is also true in both states, which is why this
  // is one constant rather than the pair it briefly was.
  var CHAIN_RAIL = 'One sharp, two possible outcomes';

  function CHAIN_CONTENT() {
    var L = lens();
    // Top-aligned rather than centred. The nodes are APPENDED as they are
    // revealed, and a centred column re-centres on every append, which drags
    // everything the learner has already read upward. The old markup avoided
    // that by keeping every node in the DOM holding its space — which left
    // the advance button hundreds of pixels below the last readable line, at
    // its worst on the first node.
    return '<main class="ll-object ll-object--chain">' +
      '<div class="ch-wrap">' +

        '<div class="ch-frame" id="chFrame">' +
          '<span class="ch-frame-mark" aria-hidden="true">' +
            '<i class="fa-solid fa-timeline"></i></span>' +
          '<p class="ch-lead">' + esc(CHAIN_LEAD) + '</p>' +
          '<p class="ch-lead-sub">' + esc(CHAIN_LEAD_SUB) + '</p>' +
          '<button class="ch-start" id="chStart" type="button">Begin ' +
            '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
        '</div>' +

        '<div class="ch-run" id="chRun" hidden>' +
          '<p class="ll-eyebrow">' + esc(CHAIN_RAIL) + '</p>' +
          '<ol class="ch-chain" id="chChain"></ol>' +

          // One lockup: the scene and the two destinations bound together, so
          // the choice is read off the frame rather than off the prose above
          // it. The image is decorative-adjacent but NOT decorative — it is
          // where the two options actually are — so it carries real alt text.
          '<div class="ch-pick" id="chPick" hidden>' +
            '<div class="ch-lockup">' +
              (L.chain.hero
                ? '<img class="ch-hero" src="' + esc(imgSrc(L.chain.hero.src)) + '" ' +
                    'alt="' + esc(L.chain.hero.alt) + '" decoding="async">'
                : '') +
              '<div class="ch-lockup-body">' +
                '<p class="ch-pick-q">' + esc(CHAIN_PICK_Q) + '</p>' +
                '<div class="ch-pick-opts" id="chPickOpts" role="group" ' +
                  'aria-label="' + esc(CHAIN_PICK_Q) + '"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<button class="ch-next" id="chNext" type="button" hidden></button>' +

          '<div class="ch-close" id="chClose" hidden>' +
            '<p id="chCloseA">' + esc(CHAIN_CLOSE) + '</p>' +
            '<p id="chCloseB">' + esc(L.chain.end) + '</p>' +
          '</div>' +

          // The decision was binary and is not final. Offered on BOTH routes:
          // the learner who walked it needs to meet the chain, and the one who
          // binned it is owed the three seconds it would have taken.
          '<button class="ch-retry" id="chRetry" type="button" hidden></button>' +

          // Alignment brief D4: the F1 post-rating used to live on the
          // now-retired "A Coworker Got Stuck" case (Ruben). Moved here,
          // since chain is now F1's only touch — same question, same three
          // answers as the entry battery, so the two are comparable and the
          // reportable figure is the movement. Revealed once, after the
          // chain first settles; a replay of the other branch does not ask
          // it again.
          '<div class="ct-second" id="chPost" hidden>' +
            '<p class="ll-eyebrow">You answered this at the start</p>' +
            '<h2 class="cs-q">Safe sharps disposal protects your coworkers, not just you.</h2>' +
            '<p class="bl-hint">Same question, same three answers. Say where you are now.</p>' +
            '<div class="bl-options" id="chPostOpts" role="radiogroup"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</main>';
  }

  function chainInit(ctx) {
    var C = lens().chain;
    var frame = document.getElementById('chFrame');
    var runEl = document.getElementById('chRun');
    var list = document.getElementById('chChain');
    var pick = document.getElementById('chPick');
    var post = document.getElementById('chPost');
    var postOpts = document.getElementById('chPostOpts');
    var postAsked = false;

    // F1 post-rating (D4): identical wiring to the retired case4Init, just
    // saved under 'chain' instead of 'case4'.
    [
      { t: 'Strongly agree', icon: 'fa-heart', score: 3 },
      { t: 'Somewhat', icon: 'fa-scale-balanced', score: 2 },
      { t: 'It is mostly a formality', icon: 'fa-file-lines', score: 1 }
    ].forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'bl-option'; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', o.t);
      b.innerHTML = '<i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>' +
                    '<span class="bl-option-label">' + esc(o.t) + '</span>';
      b.addEventListener('click', function () {
        if (postOpts.classList.contains('answered')) return;
        b.setAttribute('aria-checked', 'true');
        postOpts.classList.add('answered');
        postOpts.querySelectorAll('.bl-option').forEach(function (x) { if (x !== b) x.disabled = true; });
        mergeResult('chain', { post: o.score });
        // Release the hold: nothing else on this screen uses .rf-layer
        // afterward (unlike the walk screen's part1→part2 handoff), so
        // leaving .rf-on on the parent forever blurs and pointer-events:none's
        // "Want to try the other path?" the instant it appears — it's
        // revealed on the SAME settle() that triggers this reinforcement, so
        // a learner could never have reached it. The choice was binary and
        // is not final; answering this shouldn't be what makes it final.
        if (post.parentElement) post.parentElement.classList.remove('rf-on');
        ctx.positionOrb(true);
      });
      postOpts.appendChild(b);
    });
    LE.pickGroup(postOpts);
    var advance = document.getElementById('chNext');
    var closer = document.getElementById('chClose');
    var retry = document.getElementById('chRetry');
    // `took` is the FIRST choice and never changes; `viewing` is the branch
    // currently on screen. Replaying the other one is a second decision, not
    // a correction of the first.
    var took = null, viewing = null, queue = [], replayed = false, started = false;

    // Why this screen comes FIRST is the only thing here the page does not
    // say for itself; "one sharp, one choice" was the eyebrow again.
    ctx.setCoachSay('Your decision is critical. Let’s play this out.');

    document.getElementById('chStart').addEventListener('click', function () {
      // Guarded on the DOM rather than a flag: a double-tap on Begin pushed
      // the setup node twice, and reading the list makes it idempotent however
      // many times the handler fires.
      if (started || list.querySelector('.ch-node')) return;
      // A flag as well as the DOM check: the swap is deferred behind the
      // frame's fade now, so for those few hundred milliseconds there is no
      // node on screen for the DOM guard to find and a double-tap would push
      // the setup twice.
      started = true;
      frame.classList.add('is-leaving');
      setTimeout(function () {
        frame.hidden = true;
        runEl.hidden = false;
        runEl.classList.add('is-entering');
        push(C.setup);
        pick.hidden = false;
        ctx.setCoachSay('Pick the one you would actually do at the end of a shift.');
        ctx.positionOrb(true);
        requestAnimationFrame(function () { runEl.classList.remove('is-entering'); });
      }, T(260));
    });

    // One node appended per call, with the elapsed gap named on the connector
    // above it. The gap is a SEPARATE row whose height scales with the size of
    // the jump, because the clocks alone never showed time passing: a one
    // minute gap, a four hour gap and a twelve week gap all rendered as the
    // same 22px of padding.
    function push(n) {
      if (n.gap) {
        var g = document.createElement('li');
        g.className = 'ch-gapline gap-' + (n.gapSize || 's');
        g.innerHTML = '<span>' + esc(n.gap) + '</span>';
        list.appendChild(g);
      }
      // Everything already on screen folds down to its time plus a peek line.
      // Five expanded nodes and their gap rows do not fit a laptop viewport,
      // and the node that matters is always the newest one. A node the learner
      // opened DELIBERATELY stays open — undoing that would be the module
      // overriding an action, which is the thing this whole beat is against.
      [].forEach.call(list.querySelectorAll('.ch-node'), function (el) {
        el.classList.add('is-past');
        var h = el.querySelector('.ch-head');
        if (h) {
          h.disabled = false;                       // now it IS a control
          h.setAttribute('aria-expanded', el.classList.contains('is-open') ? 'true' : 'false');
        }
      });
      [].forEach.call(list.querySelectorAll('.ch-gapline'), function (el) {
        el.classList.add('is-past');
      });

      var li = document.createElement('li');
      // n.injury marks the one node per chain that IS the puncture — the
      // rest of the sequence is setup and aftermath. A distinct dot colour,
      // a small alarm tag, and a bolder body give that single node a
      // different weight than "one more line in a timeline" — this is the
      // moment the whole beat exists to land.
      li.className = 'ch-node' + (n.injury ? ' ch-node--injury' : '');
      // The head is a real button but starts DISABLED: while a node is the
      // live one there is nothing to expand, and a focusable control that
      // does nothing is worse than no control.
      li.innerHTML = '<span class="ch-dot' + (n.injury ? ' ch-dot--injury' : '') + '" aria-hidden="true"></span>' +
        '<span class="ch-main">' +
          // aria-label rather than letting the name accumulate from the two
          // adjacent spans — they carry no separating text node, so the
          // computed name would run the time straight into the peek with no
          // space. Uses the full body, not the truncated peek: a screen
          // reader loses nothing to the ellipsis a sighted learner accepts
          // for space. The alarm tag is prepended so a screen reader hits it
          // before the time, the same order a sighted learner sees it in.
          '<button class="ch-head" type="button" disabled aria-expanded="true" ' +
            'aria-label="' + esc((n.injury ? n.injury + '. ' : '') + n.time + '. ' + n.body) + '">' +
            '<span class="ch-time">' + esc(n.time) + '</span>' +
            '<span class="ch-peek">' + esc(peek(n.body)) + '</span>' +
            '<i class="fa-solid fa-chevron-down ch-chev" aria-hidden="true"></i>' +
          '</button>' +
          // Sits outside the foldable head/body pair on purpose — it stays
          // on screen (dimmed, like the rest of a past node) even once the
          // full body folds away, so the marker survives the fold.
          (n.injury ? '<span class="ch-alarm"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' + esc(n.injury) + '</span>' : '') +
          '<span class="ch-body">' + esc(n.body) + '</span>' +
        '</span>';
      list.appendChild(li);
      // The entrance is a CSS animation rather than a class flipped on the
      // next frame: a hidden or backgrounded tab never fires rAF, and a node
      // whose reveal depends on one would stay at opacity 0 forever.
      return li;
    }

    // What a folded node shows instead of its body. Cut at a word boundary so
    // it does not fold mid-word, and let CSS ellipsis handle the narrow case.
    function peek(text) {
      var t = String(text || '');
      if (t.length <= 72) return t;
      var cut = t.slice(0, 72), sp = cut.lastIndexOf(' ');
      return (sp > 44 ? cut.slice(0, sp) : cut) + '\u2026';
    }

    // Delegated, so it survives the list being rebuilt on a replay.
    list.addEventListener('click', function (e) {
      var h = e.target && e.target.closest ? e.target.closest('.ch-head') : null;
      if (!h || h.disabled) return;
      var li = h.closest('.ch-node');
      if (!li) return;
      var open = li.classList.toggle('is-open');
      h.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    function label(text, icon) {
      advance.innerHTML = esc(text) + ' <i class="fa-solid ' + icon + '" aria-hidden="true"></i>';
    }

    // ---- the decision ------------------------------------------------------
    ['safe', 'short'].forEach(function (k) {
      var o = C.pick[k];
      var b = document.createElement('button');
      b.className = 'ch-pick-opt'; b.type = 'button'; b.dataset.k = k;
      b.innerHTML = '<i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>' +
                    '<span>' + esc(o.t) + '</span>';
      b.addEventListener('click', function () { run(k); });
      document.getElementById('chPickOpts').appendChild(b);
    });

    function other(k) { return k === 'safe' ? 'short' : 'safe'; }

    // Runs one branch from the decision. On a replay the list is rebuilt from
    // the setup node, so the second route reads as its own run rather than
    // being appended to the first one's wreckage.
    function run(k) {
      if (viewing === k) return;
      var isReplay = !!viewing;
      viewing = k;
      if (took === null) { took = k; saveResult('chain', { walked: false, took: k }); }
      if (isReplay) { replayed = true; list.innerHTML = ''; push(C.setup); }
      pick.hidden = true;
      closer.hidden = true;
      retry.hidden = true;
      retry.classList.remove('is-primary');
      // Retry is reachable before the F1 "One more question" borrow is ever
      // pressed (it sits un-blurred now — see settle()), so a replay can
      // land here with that borrow still pending. Withdraw it rather than
      // leave it stale: pressing the button mid-replay would otherwise fire
      // the OLD callback — reinforce()'s blur landing over a narrative that
      // has not even finished unfolding yet, the same jump this whole fix is
      // for. Only on a replay: on the FIRST run there is nothing to cancel,
      // and cancelNextAction()'s revert would reapply gate:true's disabled
      // default before the learner has earned Continue at all. On a replay
      // that default is wrong for the opposite reason — this route already
      // earned Continue once, by reaching the end of the first path, and
      // replaying the other one doesn't revoke it — so re-enable.
      if (isReplay) { ctx.cancelNextAction(); ctx.enableNext(); }
      ctx.els.next.classList.remove('ll-btn--ghost');
      ctx.els.next.classList.add('ll-btn--primary');
      push(C.act[k]);
      // Both routes now reach the person downstream, because that person IS
      // the objective. The shortcut runs the full chain to the testing window;
      // the safe route gets ONE node showing the same worker, at the same
      // hour, doing the same thing — unharmed. What the original rationale
      // forbade was narrating the downstream worker getting stuck ANYWAY on
      // the safe path, which would be a lie; naming them safe is the other
      // half of the same argument, and without it the module showed that the
      // bad choice has a victim and never that the good one protects somebody.
      queue = (k === 'short' ? C.after : (C.safeAfter || [])).slice();
      if (!queue.length) {
        advance.hidden = true;
        settle();
        return;
      }
      label('Then what', 'fa-arrow-down');
      ctx.setCoachSay(k === 'safe'
        ? 'Now the hidden impact of your decision: somebody handles that bag hours after you’ve gone home.'
        : isReplay
          ? 'Same sharp, let’s try the other decision.'
          // Not "good choice" — this is the shortcut branch. Neutral framing,
          // same as the safe branch above: the module doesn't judge the pick
          // up front, it lets the consequence (revealed next) do that.
          : 'That’s the choice most people make. Keep going to see where this decision lands.');
      // The advance button lands where the option the learner just pressed was
      // standing. Revealing it in the same tick means one physical click can
      // take the choice AND the first consequence node with it, so it arrives
      // after the chosen node has settled.
      setTimeout(function () { advance.hidden = false; }, T(420));
      ctx.positionOrb(true);
    }

    advance.addEventListener('click', function () {
      if (!queue.length) return;
      push(queue.shift());
      if (!queue.length) { advance.hidden = true; settle(); }
    });

    function settle() {
      // The close reads differently on the two routes, because on one of them
      // nobody paid. Telling a learner who walked it that a different person
      // paid is the same defect the narrated shortcut had.
      document.getElementById('chCloseA').textContent = viewing === 'safe'
        ? CHAIN_CLOSE_SAFE
        : CHAIN_CLOSE;
      // The safe route's second line names what was actually avoided rather
      // than repeating the generic "you may never meet them" reminder — that
      // line is written for the route where harm really did travel, and
      // reusing it here would flatten the one node where nothing happened.
      document.getElementById('chCloseB').textContent = viewing === 'safe'
        ? C.avoided
        : C.end;
      closer.hidden = false;
      // The first choice is the datum; whether they went on to walk the other
      // branch is recorded separately rather than replacing it. Merged, not
      // overwritten: a replay re-runs this on every settle(), and a plain
      // saveResult would wipe out the F1 post-rating below once it's answered.
      mergeResult('chain', { walked: true, took: took, bothRoutes: replayed });
      // Ungated on purpose. Only KNOW gates in this module, and a Feel screen
      // that holds the door would be routing content out on a self-report.
      ctx.enableNext();
      ctx.setCoachSay(viewing === 'safe'
        ? (replayed
            ? 'The right choice may only take a few more seconds.'
            : 'Great decision. You prevented a real injury here.')
        : 'Your decision can affect your colleagues, which makes this a professional ' +
          'responsibility, rather than just a personal-safety rule.');

      // The choice was binary, so there is no reason for it to be final.
      if (!replayed) {
        retry.hidden = false;
        retry.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ' +
          'Want to try the other path?';
        // Only on the safe route does seeing the shortcut outweigh moving on —
        // there, retry takes the primary look and Continue steps back to a
        // plain secondary button for as long as retry is the stronger offer.
        if (viewing === 'safe') {
          retry.classList.add('is-primary');
          ctx.els.next.classList.remove('ll-btn--primary');
          ctx.els.next.classList.add('ll-btn--ghost');
        }
      }

      // D4: reveal the F1 post-rating once, on the first settle() — a replay
      // of the other branch doesn't ask it a second time. Bug fix 2026-09-21:
      // this used to call reinforce() right here, in the same tick that the
      // close line above first lands — so the blur (and reinforce()'s own
      // scrollIntoView) covered "This is the best path"/"One person decided…"
      // before it had ever been on screen long enough to read. Every other
      // reinforce() in this module either opens on a screen with nothing
      // said before it yet (walk's part 1) or waits for the learner's own
      // next press (F2's belief scale, the debrief re-rate) — same device
      // here, borrowing the forward button. enableNext() is re-armed inside
      // the callback because revertNextBtn() reapplies this step's gate:true
      // default on the press that reveals the rating, and that rating is
      // explicitly not meant to gate anything.
      if (!postAsked) {
        postAsked = true;
        ctx.els.next.classList.remove('ll-btn--ghost');
        ctx.setNextAction('One more question', function () {
          reinforce(ctx, post, 1, 1);
          ctx.enableNext();
          ctx.positionOrb(true);
        });
      }
      ctx.positionOrb(true);
    }

    retry.addEventListener('click', function () { run(other(viewing)); });
  }

  // ==========================================================================
  //  WHY IT IS DANGEROUS — K2, the module's premise, taught to everyone.
  //
  //  The module ran for months with no answer to "why does any of this
  //  matter". It taught a sequence of steps and never said what a sharp is,
  //  that a used one keeps a trace of blood, or what that trace can carry.
  //  Every other outcome in the re-composed course has an Understand
  //  objective; sharps had none, so the content sat in two of their teach
  //  lists with no objective claiming it.
  //
  //  The argument is ONE chain and is delivered as one screen, because split
  //  across three it stops being an argument: a used point keeps a trace →
  //  the point opens a route into a bloodstream → what the trace can carry.
  //  The check tests the middle link, since that is where the real
  //  misconception lives — people believe a lot of blood is needed, and that
  //  blood on a hand is comparable to blood on a point.
  //
  //  Not compressible. A learner who tests out of the procedure still gets
  //  this: it is the reason the procedure exists, and a module that removes
  //  its own premise to save ninety seconds is just a list of rules again.
  // ==========================================================================
  //  NOTE ON THIS CLIP. The file supplied was the course's "Controls and
  //  Prevention" section video — 9 min 31 s, 145 MB, covering universal
  //  precautions, housekeeping, HBV vaccination, engineering vs
  //  administrative controls, handwashing, eye exposure and three solid
  //  minutes of PPE. At 10 minutes it was the single largest line item in the
  //  module and it was over GitHub's 100 MB per-file ceiling, so it could
  //  never have shipped whole in any case.
  //
  //  Cut to 3:48–6:00 (2 min 12 s, 7 MB), which is the only stretch of the
  //  source that shows a sharp being handled at all: the engineering-versus-
  //  administrative controls comparison, and a syringe going into a red
  //  container. Read the honest limit of that footage before relying on it —
  //  it shows DISPOSAL, which is K1's subject and the F2 budget beat's
  //  argument. It still does NOT teach this objective's mechanism (a used
  //  point keeps a trace → the point opens a route into a bloodstream → what
  //  the trace can carry), because no footage in the source does. The written
  //  chain below therefore runs ALONGSIDE it rather than as its fallback, so
  //  K2 is taught whatever clip sits on the beat. The uncut original is kept
  //  next to it and is not referenced by anything.
  //  PLACEHOLDER. The explainer built for THIS objective does not exist yet.
  //  What sits here is the 2:12 cut of the source course's "Controls and
  //  Prevention" section video, which is about administrative versus
  //  engineering controls and disposal — K1's subject and the budget beat's
  //  argument, not this one's mechanism. It is labelled as a placeholder on
  //  the poster and under the frame rather than passed off as the real thing.
  //  Drop the produced explainer in at this path and the label comes off.
  var HAZARD_VIDEO = '../../../../assets/videos/sharps-controls-cut.mp4';
  var HAZARD_PLACEHOLDER = true;

  // The two-panel skin cross-section that carries the middle link lives in
  // assets/images/sharps-hazard-route.jpg now. It replaced a hand-rolled
  // inline SVG of the same idea — the diagram was doing the work of the one
  // claim the check tests, and a two-rectangle drawing was not up to it.

  //  THE ARTICLE. Supplied whole by the LXD; restructured here rather than
  //  rewritten. What changed is presentation, not prose: the pathogen
  //  comparison became a scannable block because three items with different
  //  behaviours are a table pretending to be a paragraph, the two strongest
  //  lines became pull-quotes, the illustration sits where the comparison it
  //  draws is complete, and "In short" became the summary box.
  var HAZARD_ARTICLE = [
    { h: 'Why a used sharp is not a small hazard', p: [
      'A sharp is hazardous because it can cut or puncture skin. A needle poke often feels ' +
        'like a brief, sharp sting. The pain fades. There may be little or no bleeding. That ' +
        'is why the injury gets treated as minor.',
      'The size of the wound is the wrong measure. What matters is what was already on the ' +
        'point, and whether that material reached a bloodstream. A used sharp can hold a ' +
        'trace of blood from the last place it went in. That trace is often invisible. It ' +
        'does not have to be visible to be enough.',
      'If you have never handled a needle, a blade, or clinic glass at work, “sharp” ' +
        'can sound like hospital equipment. In this setting it means any object that can ' +
        'break skin and may already have someone else’s blood on it. The shape is ' +
        'secondary. A box-cutter blade, an insulin needle, a shard of vial glass, and a ' +
        'capillary tube all qualify for the same two reasons: they can open a route into the ' +
        'body, and they can carry a residue with them.'
    ] },
    { h: 'The residue people miss', p: [
      'After a needle or blade has been in contact with blood, a thin film can stay on the ' +
        'surface. On a hollow needle, a little fluid can also sit in the bore — the ' +
        'channel down the middle. You are not looking at a puddle. You are looking at a ' +
        'fraction of a drop. For the viruses that matter here, that can still be enough to ' +
        'infect.',
      'That is the part a small poke hides. The wound looks trivial, so the contamination ' +
        'looks trivial. Those are different questions.'
    ] },
    { h: 'Why unbroken skin usually protects you', p: [
      'The same residue on intact skin is a different problem. The outer layer of skin, the ' +
        'stratum corneum, is a stack of dead, tightly packed cells. It is not a perfect wall, ' +
        'but it is a real one. Bloodborne viruses cannot cross it the way a splash sits on ' +
        'your hand. They have no path into the body unless they reach living tissue and, in ' +
        'practice, a bloodstream.',
      'That is why a drop of blood on unbroken skin is treated as contact, not as an ' +
        'inoculation. Wash it off. The surface did its job. The virus never got a route.',
      'A hangnail, a paper cut, or chapped skin is a weaker version of the same idea: the ' +
        'barrier is already open. That is why broken skin gets more caution than intact skin. ' +
        'The main case here is still the puncture. A puncture does not wait for a gap. It ' +
        'makes one.'
    ] },
    { h: 'What a puncture actually does', p: [
      'A puncture changes two things in one motion. It opens a channel through the barrier ' +
        'that was stopping the residue at the surface. And it carries that residue with it.',
      'Set a dirty pin on a table and the contamination stays put. Push the same pin into a ' +
        'fingertip and the point drags whatever was on it — or inside it — into the ' +
        'dermis, where capillaries sit close to the wound. You do not need a dramatic bleed ' +
        'for that to happen. A poke that barely stings can still put material under the skin.',
      'Hollow needles make this easiest to picture, because they can deliver a small column ' +
        'of leftover fluid. Blades and broken glass work more simply: a contaminated edge ' +
        'slices, and the film on that edge is wiped into the cut. Different tools, same ' +
        'event. A route skin does not normally provide, plus a trace that would have been ' +
        'harmless if it had stayed outside.'
    ], figure: true }
  ];

  //  Three items that behave differently is a comparison, and a comparison
  //  set as one paragraph makes the reader hold all of it at once.
  var HAZARD_PATHOGENS = [
    { n: 'Hepatitis B', d: 'Makes the tiny-trace point most concrete. It survives on surfaces ' +
        'longer than people expect, and a very small amount of infected blood can be enough.' },
    { n: 'Hepatitis C', d: 'Also transmitted well by a sharp going through the skin, even ' +
        'though it is less hardy outside the body than hepatitis B.' },
    { n: 'HIV', d: 'The least stable of the three on surfaces, and the least likely to ' +
        'transmit from one needlestick. Least likely is not impossible.' }
  ];

  var HAZARD_CARRY_LEAD =
    'The three bloodborne pathogens in this picture are hepatitis B, hepatitis C, and HIV. ' +
    'All three can be present in blood. All three can be transmitted when that blood reaches ' +
    'another person’s bloodstream. They are not equally sturdy, and they are not equally ' +
    'likely to pass from a single poke.';
  var HAZARD_CARRY_TAIL = [
    'The exposure is handled as real until it is ruled out. You do not need to see blood for ' +
      'any of that to be possible. A point too small to make you bleed can still carry a film.',
    'That is also why an accidental poke is treated as the same kind of exposure as sharing a ' +
      'needle. The item does not become safer because nobody meant to use it twice. If a used ' +
      'point breaks skin, the question is what was on the point and where it went — not ' +
      'whether the motion was clumsy, hurried, or deliberate.'
  ];
  var HAZARD_PULL = 'The intent is different. The physics is not.';

  var HAZARD_JOB_LEAD =
    'People new to this work often picture a hospital syringe and stop there. The list is ' +
    'wider, and the familiar items are the ones that get handled carelessly.';
  var HAZARD_JOB_TAIL =
    'Broken glass, scalpels, blades, and capillary tubes belong on the same list. If it can ' +
    'cut or puncture, and if it may have blood on it, it is a sharp. The category is not ' +
    '“needles.” It is contaminated points.';

  //  "In short", as the summary box. The recap is five sequential claims, so
  //  it is set as five lines rather than one dense paragraph.
  var HAZARD_SHORT = [
    'The poke can be small. The risk is not measured by how much you bled.',
    'A used point can keep a trace of blood you will not see.',
    'Intact skin stops that trace at the surface.',
    'A puncture opens a route and delivers the trace into the tissue below.',
    'That is enough, in principle, for hepatitis B, hepatitis C, or HIV — which is why a ' +
      'poke you did not mean to take is still treated as an exposure.'
  ];
  var HAZARD_HABIT =
    'If you have never handled this kind of object at work, the habit is simple: do not touch ' +
    'it with bare hands, do not guess whether it is clean enough, and treat anything that can ' +
    'break skin and might have blood on it as a sharp until it is in the right container.';
  var HAZARD_CODA = 'The science is small-scale. The mistake is assuming small means safe.';
  // Item 19/D7: the Listen carrier's script. Built from the article's own
  // "In short" recap rather than a separately authored passage — the five
  // claims are already the condensed form of the full argument, so reading
  // them aloud is the narration, not a new summary of one.
  var HAZARD_AUDIO_TEXT = HAZARD_SHORT.join(' ') + ' ' + HAZARD_CODA;

  function HAZARD_CONTENT() {
    var L = lens();
    // The mechanism, in three links. This is the objective's teaching and it
    // is now the READ carrier rather than a slab under a video: one page, one
    // carrier at a time, the learner choosing which.
    // An article. The prose is the main body and every pull-out is
    // subordinate to it: the illustration lands where the comparison it draws
    // is complete, the pathogen block is a comparison set as a comparison, the
    // two strongest lines are quoted, and "In short" closes as a summary.
    var written =
      '<article class="hz-article">' +

        HAZARD_ARTICLE.map(function (sec, i) {
          return '<h2 class="hz-h">' + esc(sec.h) + '</h2>' +
            sec.p.map(function (para, k) {
              return '<p' + (i === 0 && k === 0 ? ' class="hz-lede"' : '') + '>' + para + '</p>';
            }).join('') +
            // Placed at the end of the puncture section, which is the first
            // point at which both halves of the picture have been explained.
            (sec.figure
              ? photoFigure('../../../../assets/images/sharps-hazard-route.jpg',
                  'A cross-section of skin in two halves. On the left, a drop of blood sits ' +
                  'on top of unbroken skin and goes no further than the surface. On the ' +
                  'right, a needle has pierced the same skin and blood is spreading through ' +
                  'the tissue underneath, above a layer of blood vessels.',
                  'Left: a drop of blood on unbroken skin, stopped at the surface. Right: a ' +
                  'puncture past it, delivering the trace into the tissue below.')
              : '');
        }).join('') +

        '<h2 class="hz-h">What that trace can carry</h2>' +
        '<p>' + HAZARD_CARRY_LEAD + '</p>' +
        '<div class="hz-path">' +
          HAZARD_PATHOGENS.map(function (p) {
            return '<div class="hz-path-row"><b>' + esc(p.n) + '</b>' +
              '<span>' + esc(p.d) + '</span></div>';
          }).join('') +
        '</div>' +
        '<p>' + HAZARD_CARRY_TAIL[0] + '</p>' +
        '<blockquote class="hz-pull">' + esc(HAZARD_PULL) + '</blockquote>' +
        '<p>' + HAZARD_CARRY_TAIL[1] + '</p>' +

        '<h2 class="hz-h">What this looks like on a real job</h2>' +
        '<p>' + HAZARD_JOB_LEAD + '</p>' +
        // Lensed: the supplied examples were manufacturing's, and every sector
        // has its own list of what counts as a sharp.
        '<p>' + esc(L.jobPara) + '</p>' +
        '<p>' + HAZARD_JOB_TAIL + '</p>' +

        '<aside class="hz-keys">' +
          '<p class="hz-keys-h">In short</p>' +
          '<ul>' +
            HAZARD_SHORT.map(function (line) { return '<li>' + line + '</li>'; }).join('') +
          '</ul>' +
          '<p class="hz-habit">' + HAZARD_HABIT + '</p>' +
          '<p class="hz-coda">' + esc(HAZARD_CODA) + '</p>' +
        '</aside>' +
      '</article>';

    // Alignment brief D1: this screen used to be K2's own teaching beat, with
    // a check following it and a test-up permutation for a learner who'd
    // already shown they got it. Both are gone — the mechanism is no longer a
    // tracked objective, so this is now plain, ungated narration, identical
    // for every learner, matching K&A's own Manufacturing script (the "why
    // it's dangerous" content runs as background before Case 1, no check).
    return '<main class="ll-object ll-object--chain"><div class="pr-wrap">' +
      '<h1 class="pr-h">It only takes a trace.</h1>' +
      '<p class="pr-sub">A trace carries everything a large exposure would — the amount was never the mechanism.</p>' +

      // Item 19/D7: Listen joins the picker here — 'podcast' key, shared
      // MODALITIES entry (label "Listen"). Declined at the course level
      // (K1's procedure) does not mean declined everywhere; this is the one
      // place the doc's own "first cut" actually calls for it. Collapsed to
      // the current pick and pinned to the top-right corner (modalityDropdown,
      // opts.corner) rather than left open in the flow — see that function's
      // comment for why: an always-open toggle pushed the video carrier well
      // down the page, and even collapsed-but-inline still reflowed the beat
      // (and everything below it) every time the pick changed carrier.
      modalityDropdown({ now: 'hzModNow', btn: 'hzModBtn', wrap: 'hzModWrap', icon: 'hzModIcon', label: 'hzModLabel', pick: 'hzPick' },
        ['video', 'article', 'podcast'], { corner: true }) +

      '<div id="hzCarrier" hidden>' +
        '<div id="hzVideoWrap" hidden>' +
          videoFrame({ ids: { wrap: 'hzMedia', video: 'hzVideo', note: 'hzVfall', pct: 'hzPct', skip: 'hzSkip' },
                       src: HAZARD_VIDEO,
                       // The poster is where the placeholder is declared, so
                       // there is one thing to change when the footage lands.
                       poster: HAZARD_PLACEHOLDER
                         ? videoPoster('COMING SOON', 'It only takes a trace.',
                             'A two-minute explainer on how a used sharp stays dangerous. Footage still to be produced.')
                         : '' }) +
        '</div>' +
        '<div id="hzWritten" hidden>' + written + '</div>' +
        '<div id="hzAudioWrap" hidden>' +
          '<div class="aud-wrap">' +
            '<button class="aud-play" id="hzAudioPlay" type="button">' +
              '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> Read to me</button>' +
            '<p class="aud-text" id="hzAudioText"></p>' +
            '<p class="aud-note" id="hzAudioNote"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' +
              'Narration uses your browser’s built-in speech — a stand-in for the produced voice track.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div></main>';
  }

  function hazardInit(ctx) {
    var pick = document.getElementById('hzPick');
    var carrier = document.getElementById('hzCarrier');
    var vWrap = document.getElementById('hzVideoWrap');
    var wWrap = document.getElementById('hzWritten');
    var aWrap = document.getElementById('hzAudioWrap');
    var dd = initModalityDropdown(
      { btn: 'hzModBtn', wrap: 'hzModWrap', icon: 'hzModIcon', label: 'hzModLabel' });
    // Separate flags: video mounts once, audio mounts once, and each is a
    // real network/synthesis cost that should not gate on the other having
    // already happened — the original single `mounted` meant Listen never
    // mounted at all once the default video carrier had already run once.
    var mounted = false, audioMounted = false, showing = null, podcastTimer = null;

    // Silent on arrival. "Watch the clip or read the short version below" is
    // a description of two controls the learner can see, and "here is why the
    // procedure exists" is the headline. CLARA speaks on this screen once the
    // clip has run \u2014 see the trace line below, which is a reaction.

    // One carrier at a time. This beat used to render the video AND the
    // written chain together, which is what made the page unreadable: two
    // carriers of the same argument stacked, plus a diagram, plus a sector
    // list, on one screen.
    function show(m) {
      if (showing === m) return;
      // Leaving a carrier before it naturally finishes retracts whatever it
      // armed, so an unrelated, LATER completion can never fire behind the
      // learner's back and collide with the one they are actually looking
      // at. Two things can be armed: Read's borrowed footer button (undone
      // by cancelNextAction — a manual class/label revert alone left the
      // engine's pendingNext still pointed at the stale callback, so the
      // button READ as live but the next press re-ran old "Done reading"
      // logic instead of navigating), and Listen's bare setTimeout(done)
      // (undone by clearing it directly — left running, it could call
      // done() while Read's OWN "Done reading" press was mid-click, so by
      // the time that press's run() reached done(), `handed` was already
      // true, its enableNext() never fired, and Continue stayed disabled
      // from the click handler's own revert).
      if (!handed) {
        if (showing === 'article') ctx.cancelNextAction();
        if (showing === 'podcast' && podcastTimer) { clearTimeout(podcastTimer); podcastTimer = null; }
      }
      showing = m;
      // Item 13: which carrier they actually used, for the record.
      mergeResult('hazard', { carrier: m });
      carrier.hidden = false;
      vWrap.hidden = m !== 'video';
      wWrap.hidden = m !== 'article';
      aWrap.hidden = m !== 'podcast';
      [].forEach.call(pick.querySelectorAll('.md-opt'), function (b) {
        var on = b.dataset.m === m;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      dd.render(m);
      dd.collapse();

      if (m === 'video') {
        // Mounted once, on first selection rather than at page load — there is
        // no reason to fetch a clip for a learner who chose to read.
        if (!mounted) {
          mounted = true;
          mountVideo(ctx, {
            ids: { wrap: 'hzMedia', video: 'hzVideo', note: 'hzVfall', pct: 'hzPct', skip: 'hzSkip' },
            src: HAZARD_VIDEO,
            onFallback: done,           // no clip at that path: do not strand anyone
            onEnded: done               // Skip dispatches 'ended', so it counts
          });
        }
      } else if (m === 'podcast') {
        // Item 19/D7: the transcript is fully visible on arrival — same
        // reasoning as the article, nothing forces a listen.
        if (!audioMounted) { audioMounted = true; mountAudio(); }
        // Held so leaving Listen before it fires can cancel it — see the
        // top of show().
        podcastTimer = setTimeout(done, T(700));
      } else {
        // Item 25/D1: gated on the learner's own word, the same footer
        // relabel the account screen's "Done reading" uses — a fixed delay
        // could not tell a skim from an actual read, and the other two
        // carriers already gate on something real (watched to the end,
        // stood in this modality long enough to have heard it start). Only
        // borrows the button if the gate is not already open — a learner who
        // already finished a different carrier and then looks at Read too
        // should not have a working Continue re-locked behind a second ask.
        if (!handed) ctx.setNextAction('Done reading', function () { done(); });
      }

      ctx.positionOrb(true);
    }

    // Item 19/D7: the Listen carrier — byte-copied mechanics from Bystander's
    // own audioInit (js/layered-course.js), same word-highlighting and the
    // same MutationObserver cleanup, since there is no per-step teardown
    // hook and a running utterance would keep talking over the next screen.
    function mountAudio() {
      var words = HAZARD_AUDIO_TEXT.split(' ');
      var textEl = document.getElementById('hzAudioText');
      var offsets = []; var pos = 0;
      textEl.innerHTML = words.map(function (w, i) {
        offsets.push(pos); pos += w.length + 1;
        return '<span class="w" data-i="' + i + '">' + esc(w) + '</span>';
      }).join(' ');
      var spans = textEl.querySelectorAll('.w');
      var playBtn = document.getElementById('hzAudioPlay');
      var noteEl = document.getElementById('hzAudioNote');
      var playing = false;

      function wordAt(charIndex) {
        for (var i = offsets.length - 1; i >= 0; i--) if (charIndex >= offsets[i]) return i;
        return 0;
      }
      function highlight(i) {
        spans.forEach(function (sp, j) { sp.classList.toggle('hot', j === i); });
      }
      function label(icon, text) {
        playBtn.innerHTML = '<i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + text;
      }
      function stop(icon, text) {
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        playing = false;
        playBtn.classList.remove('on');
        spans.forEach(function (sp) { sp.classList.remove('hot'); });
        label(icon, text);
      }
      playBtn.addEventListener('click', function () {
        if (noteEl) noteEl.classList.add('show');
        if (!('speechSynthesis' in window)) {
          playBtn.disabled = true;
          label('fa-circle-exclamation', 'Narration unavailable');
          return;
        }
        if (playing) { stop('fa-volume-high', 'Read to me'); return; }
        var u = new SpeechSynthesisUtterance(HAZARD_AUDIO_TEXT);
        u.rate = 1.0;
        u.onboundary = function (e) { if (e.name === 'word' || e.charIndex != null) highlight(wordAt(e.charIndex)); };
        u.onend = function () { stop('fa-rotate-left', 'Read it again'); };
        playing = true;
        playBtn.classList.add('on');
        label('fa-pause', 'Pause');
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      });

      var stageEl = document.querySelector('.ll-stage');
      if (stageEl && window.MutationObserver) {
        var mo = new MutationObserver(function () {
          if (document.body.contains(textEl)) return;
          mo.disconnect();
          if ('speechSynthesis' in window) speechSynthesis.cancel();
        });
        mo.observe(stageEl, { childList: true });
      }
    }

    [].forEach.call(pick.querySelectorAll('.md-opt'), function (b) {
      b.addEventListener('click', function () { show(b.dataset.m); });
    });

    // Item 25: while the clip is still a placeholder, it is not a real choice
    // — offering it reads as "watch the real thing" and hands back a poster
    // that says COMING SOON. Stays reachable for a presenter (review mode,
    // same gate as the video Skip pill above) so the placeholder is still
    // demonstrable; a learner never sees the button at all.
    var videoHidden = HAZARD_PLACEHOLDER && !LE.reviewMode();
    if (videoHidden) {
      var vBtn = pick.querySelector('.md-opt[data-m="video"]');
      if (vBtn) vBtn.hidden = true;
    }

    // Preferred-format card default, filtered to what this beat can actually
    // show right now — video stays off the table while it's a placeholder
    // even if that's the saved preference. Falls back to the same
    // read-while-video's-a-placeholder default as before.
    show(modalityDefault(videoHidden ? ['article', 'podcast'] : ['video', 'article', 'podcast'],
      HAZARD_PLACEHOLDER ? 'article' : 'video'));

    // Gated on the carrier being consumed, not on a question. The check used
    // to live at the foot of this page and did the gating; it is its own
    // screen now, so this beat holds the door until the learner has actually
    // watched or read the thing.
    var handed = false;
    function done() {
      if (handed) return; handed = true;
      ctx.enableNext();
      // Silent on finishing — restating the mechanism here duplicated the
      // hzcheck answer one screen early, so CLARA holds it for that check.
      ctx.positionOrb(true);
    }
  }

  // ==========================================================================
  //  THE PROCEDURE — K1, taught. The beat the adjustment screen has always
  //  promised ("The procedure · kept · not proven yet — 2 min") and the module
  //  never contained: a learner who did NOT test out was routed straight past
  //  the instruction into being corrected against it. Case 1's feedback cites
  //  "the procedure says plan the route before you start" — a procedure the
  //  learner had never been shown.
  //
  //  K1 is a mandated four-step sequence. There is nothing to reason toward,
  //  so it is taught before it is practised; K2, which IS discoverable, keeps
  //  the case ladder. Structure per objective, the way policy already is.
  //
  //  Nothing below is new content. The four steps are K1.text — the sentence
  //  the SME signed — decomposed into its clauses, and every modality renders
  //  THESE. That is the whole claim: one signed source, several carriers.
  // ==========================================================================
  //  Step 2 is the one clause that is not universal: choosing a needle-free
  //  alternative is a live decision for whoever is about to use the sharp, and
  //  no decision at all for whoever just pulled one out of a wall. It carries
  //  `onlyOn: 'use'` and the list renders it as context on a find-premise
  //  rather than as an instruction the learner cannot follow. The clause stays
  //  in K1's text either way — it is the signed sentence — but the screen
  //  stops asking a renovation supervisor to pick an alternative to somebody
  //  else's syringe.
  var PROCEDURE = [
    { t: 'Plan disposal before you start',
      d: 'Know where the container is and how you reach it before the sharp is ever in your hand — and the same applies before you clear up broken glass. Distance is a problem you solve early, not one you discover holding a used needle.',
      check: { q: 'Quick check — when do you work out where the sharps container is?',
               options: [ { t: 'Before you pick up the sharp', ok: true },
                          { t: 'Once you’re already holding it', ok: false } ],
               note: 'Distance is a problem you solve early, not one you discover holding a used needle.' } },
    { t: 'Use a needle alternative where one exists', onlyOn: 'use',
      d: 'The safest sharp is the one that was never used. Where a blunt or needle-free option does the job, it is the option.',
      note: 'On this job the sharp is usually already used and already somewhere it should not be, so there is no alternative to choose. The step still matters for whoever is holding one.',
      check: { q: 'If a blunt or needle-free option would do the job here, do you use it?',
               options: [ { t: 'Yes, if it does the job', ok: true },
                          { t: 'No, stick with the needle', ok: false } ],
               note: 'The safest sharp is the one that was never used.' } },
    { t: 'Activate the safety feature',
      d: 'At the point of use, before anything else happens — while the sharp is still under your control and nobody else is near it.',
      check: { q: 'When do you activate the safety feature?',
               options: [ { t: 'Immediately, before anything else', ok: true },
                          { t: 'Later, once it’s set down', ok: false } ],
               note: 'Before anything else happens — while it’s still under your control.' } },
    { t: 'Dispose in a designated container',
      d: 'Straight in, and the container is a specific object: rigid, closeable, leak-proof, and either red or marked with the biohazard symbol. It is built to swallow the point so nothing can reach it again. A bag will not do that.',
      check: { q: 'Would a strong plastic bag work if there’s no sharps container in reach?',
               options: [ { t: 'No — it has to be the container', ok: true },
                          { t: 'Yes, in a pinch', ok: false } ],
               note: 'A bag will not do that — the container is built to swallow the point so nothing can reach it again.' } },
    { t: 'Never do these five things',
      d: 'A used needle is never bent, broken, recapped, removed, or separated from its syringe. Not carefully, not briefly, not to make it safer to carry. All five put a hand near the point.' },
    { t: 'If there is no container within reach',
      d: 'It does not go in general waste and it does not get wrapped in anything soft. Activate the safety feature, keep it in your own hand, and walk it to a proper container. Carrying a shielded sharp is allowed; parking an unshielded one is not.' }
  ];

  // Item 26: the sequence is four steps, full stop — the two lines after it
  // are not a fifth and sixth step, they are rules that hold at every point
  // in the sequence. Numbering them 1-6 in one list read as one more
  // instruction to follow in order, which is not what "never" or "if there
  // is no container" mean.
  function procedureList() {
    var use = lens() && lens().premise === 'use';
    var n = 0;
    var steps = PROCEDURE.slice(0, 4).map(function (s) {
      var inert = s.onlyOn && s.onlyOn !== (use ? 'use' : 'find');
      if (!inert) n++;
      return '<li class="pr-item' + (inert ? ' is-context' : '') + '">' +
        '<span class="pr-n">' + (inert ? '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>' : n) + '</span>' +
        '<span class="pr-main"><b>' + esc(s.t) + '</b>' +
        '<span class="pr-d">' + esc(inert && s.note ? s.note : s.d) + '</span></span></li>';
    }).join('');
    var rules = PROCEDURE.slice(4).map(function (s) {
      return '<li class="pr-rule">' +
        '<span class="pr-n pr-rule-mark"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i></span>' +
        '<span class="pr-main"><b>' + esc(s.t) + '</b>' +
        '<span class="pr-d">' + esc(s.d) + '</span></span></li>';
    }).join('');
    return '<ol class="pr-list">' + steps + '</ol>' +
      '<ul class="pr-rules">' + rules + '</ul>';
  }

  // The Read carrier used to BE procedureList() — the bare numbered steps
  // and nothing else, which reads as a checklist rather than something
  // anyone would sit and read. Wrapped in the same article shell as the
  // hazard beat's own Read carrier (.hz-article / .hz-h / .hz-lede, see
  // HAZARD_CONTENT) so the two Read experiences in this module feel like
  // one publication instead of two different treatments of text. The list
  // itself is unchanged — this only adds the prose around it.
  // Shared by the podcast-declined fallback and the video's failed-fetch
  // fallback too, since both already point at #prWritten.
  function procedureArticle() {
    return '<article class="hz-article pr-article">' +
      '<p class="hz-lede">The previous page made the case that it only takes a trace. This one is ' +
        'what keeps that trace off you: four moves, always in the same order, because each one only ' +
        'does its job if the one before it already happened.</p>' +
      procedureList() +
      '<p class="hz-coda">None of the four take long, and none of them undo a decision made a step ' +
        'too late — which is the whole reason the order is not a suggestion.</p>' +
    '</article>';
  }

  // Item 26: one template, three learner-facing carriers plus the declined
  // banner — same shape as the hazard beat (HAZARD_CONTENT/hazardInit), swapped
  // in place by show() rather than re-rendering the whole step. The Demo
  // menu's Modality control used to be the only way to change this, which
  // meant a learner never saw the choice existed; the picker now does what
  // that control did, in the open.
  function PROCEDURE_CONTENT() {
    return '<main class="ll-object"><div class="pr-wrap">' +
      '<h1 class="pr-h">The order is the procedure.</h1>' +
      '<p class="pr-sub">Four steps, always in this order — plus two rules that hold no matter what.</p>' +

      // Item 26: podcast stays in the vocabulary (MODALITIES) so its own
      // decline banner can render, but the button itself is hidden from a
      // learner — see procedureInit. Declined, not offered, is the point.
      // Collapsed and corner-pinned (modalityDropdown, opts.corner) for the
      // same reason as the hazard beat above: an always-open toggle pushed
      // the video carrier well down the page.
      modalityDropdown({ now: 'prModNow', btn: 'prModBtn', wrap: 'prModWrap', icon: 'prModIcon', label: 'prModLabel', pick: 'prPick' },
        ['video', 'article', 'tutor', 'podcast'], { corner: true }) +

      '<div id="prCarrier" hidden>' +
        '<div id="prVideoWrap" hidden>' +
          videoFrame({ ids: { wrap: 'prMedia', video: 'prVideo', note: 'prVfall', pct: 'prPct', skip: 'prSkip' },
                       src: PROCEDURE_VIDEO }) +
        '</div>' +
        '<div id="prTutorWrap" hidden><div class="pr-tutor" id="prTutor"></div></div>' +
        '<div id="prDeclined" class="pr-declined" hidden>' +
          '<p class="pr-dec-h"><i class="fa-solid fa-circle-minus"></i> Not available as audio</p>' +
          '<p>This module is mostly practice. There is less than a minute of it to listen to, which ' +
            'would make for a very short listen.</p>' +
          '<p>Audio is available for the whole of <b>Bloodborne Pathogens</b>, where all six modules ' +
            'run together.</p>' +
          '<p class="pr-dec-fall">Showing the written version below.</p>' +
        '</div>' +
        // Doubles as the video carrier's fallback target on a failed fetch.
        '<div id="prWritten" hidden>' + procedureArticle() + '</div>' +
      '</div>' +
    '</div></main>';
  }
  function procedureInit(ctx) {
    var pick = document.getElementById('prPick');
    var carrier = document.getElementById('prCarrier');
    var vWrap = document.getElementById('prVideoWrap');
    var tWrap = document.getElementById('prTutorWrap');
    var declined = document.getElementById('prDeclined');
    var written = document.getElementById('prWritten');
    var mounted = false, tutorMounted = false, showing = null, handed = false;
    var dd = initModalityDropdown(
      { btn: 'prModBtn', wrap: 'prModWrap', icon: 'prModIcon', label: 'prModLabel' });

    // Item 26: declined, not offered — the banner below still exists for a
    // reviewer to check, same review-mode gate as the hazard beat's hidden
    // video button, but a learner never sees the button that reaches it.
    if (!LE.reviewMode()) {
      var pBtn = pick.querySelector('.md-opt[data-m="podcast"]');
      if (pBtn) pBtn.hidden = true;
    }

    function done() {
      if (handed) return; handed = true;
      ctx.enableNext();
    }

    // The picker bills this carrier as "CLARA asks you questions on the
    // way" — it used to just replay all four steps on a stagger with nothing
    // to answer, which was not that. Each numbered step (not the two closing
    // rules, which hold at every point rather than being next in line) now
    // pauses on a short, ungraded check before the walkthrough continues:
    // a click advances it, not a timer. Nothing here writes to the record —
    // it is the Learn-modality version of a question, not a battery item.
    function runTutor() {
      var host = document.getElementById('prTutor');
      var useP = lens() && lens().premise === 'use';
      var steps = PROCEDURE.slice(0, 4).filter(function (s) {
        return !(s.onlyOn && s.onlyOn !== (useP ? 'use' : 'find'));
      });
      var rules = PROCEDURE.slice(4);

      // Each turn used to just land wherever the page's natural scroll left
      // it, which on a short viewport meant a question could arrive already
      // half below the fold — visible enough to notice, not enough to read
      // or click. scrollIntoView pulls the newest turn up to the bottom of
      // the scroller (#prTutor's ancestor .ll-object) rather than centering
      // it, so whatever context fits above — the step the question is
      // about — stays on screen instead of being scrolled past.
      //
      // A manual scrollBy(delta) computed here was the first attempt, and
      // it measured the right delta, but the animation kept getting cut
      // short a few pixels in — turns out the page was in a backgrounded
      // tab at the time, where rAF stalls and a CSS "smooth" scroll can
      // freeze mid-flight rather than finish (confirmed via document.hidden
      // during testing; see [[project_browser_pane_hidden_trap]] in
      // memory). Two changes make this hold up regardless of tab focus:
      // the call happens synchronously, right after the element lands in
      // the DOM, instead of waiting on a rAF that a hidden tab may defer
      // indefinitely; and it drops the animation (jumps straight there)
      // whenever the tab is not the visible one, since an animation nobody
      // can see is just a slower way to get stuck. Breathing room below
      // each turn (clearing the floating "Ask CLARA" cue/orb, pinned
      // bottom-right of the stage) comes from scroll-margin-bottom on
      // .pr-turn (see sharps.html), which scrollIntoView respects natively.
      function scrollToTurn(el) {
        if (!el) return;
        var instant = T(1) === 0 || document.hidden;
        el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end', inline: 'nearest' });
      }

      function addTurn(s, n, isRule) {
        if (!host) return;
        var d = document.createElement('div');
        d.className = 'pr-turn' + (isRule ? ' pr-turn--rule' : '');
        d.innerHTML = '<span class="pr-n' + (isRule ? ' pr-rule-mark' : '') + '">' +
            (isRule ? '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' : n) + '</span>' +
          '<span class="pr-main"><b>' + esc(s.t) + '</b>' +
          '<span class="pr-d">' + esc(s.d) + '</span></span>';
        host.appendChild(d);
        scrollToTurn(d);
        requestAnimationFrame(function () { d.classList.add('in'); });
      }

      function addCheck(check, onContinue) {
        if (!host) { onContinue(); return; }
        var d = document.createElement('div');
        d.className = 'pr-turn pr-check';
        d.innerHTML = '<span class="pr-n pr-check-mark"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i></span>' +
          '<span class="pr-main"><b class="pr-check-q">' + esc(check.q) + '</b>' +
          '<span class="pr-check-opts">' +
            check.options.map(function (o, i) {
              return '<button type="button" class="pr-check-opt" data-i="' + i + '">' + esc(o.t) + '</button>';
            }).join('') +
          '</span>' +
          '<span class="pr-check-note" hidden></span></span>';
        host.appendChild(d);
        scrollToTurn(d);
        requestAnimationFrame(function () { d.classList.add('in'); });

        var opts = [].slice.call(d.querySelectorAll('.pr-check-opt'));
        var note = d.querySelector('.pr-check-note');
        opts.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var chosen = check.options[Number(btn.dataset.i)];
            opts.forEach(function (b, i) {
              b.disabled = true;
              if (check.options[i].ok) b.classList.add('is-correct');
            });
            if (!chosen.ok) btn.classList.add('is-wrong', 'is-picked');
            note.textContent = (chosen.ok ? '' : 'Actually — ') + check.note;
            note.hidden = false;
            scrollToTurn(d);
            requestAnimationFrame(function () { note.classList.add('in'); });
            setTimeout(onContinue, T(650));
          });
        });
      }

      var i = 0;
      function nextStep() {
        if (i >= steps.length) { revealRules(); return; }
        var s = steps[i], n = i + 1;
        i++;
        setTimeout(function () {
          addTurn(s, n, false);
          if (s.check) {
            setTimeout(function () { addCheck(s.check, nextStep); }, T(500));
          } else {
            setTimeout(nextStep, T(700));
          }
        }, T(350));
      }

      // The two rules land after the sequence, unnumbered — arriving turns
      // that carry no ordinal, not a fifth and sixth step. No check-ins here:
      // they hold at every point rather than being something to recall next.
      function revealRules() {
        rules.forEach(function (s, j) {
          setTimeout(function () { addTurn(s, null, true); }, T(350 + j * 850));
        });
        setTimeout(done, T(350 + rules.length * 850));
      }

      nextStep();
    }

    function show(m) {
      if (showing === m) return;
      showing = m;
      // Item 13: which modality actually taught K1, for the record and for
      // remk1's "a different way in" choice. Podcast is declined and falls
      // back to the article, so that is what actually served them — recording
      // the literal preference would claim they heard something they did not.
      var served = m === 'podcast' ? 'article' : m;
      mergeResult('procedure', { modality: served });
      // remk1Modality() and the Learning Layer view read the LAST modality
      // through sessionStorage, the same key the retired Demo control wrote —
      // this is now the only writer.
      try { sessionStorage.setItem('sh-modality', served); } catch (e) {}

      carrier.hidden = false;
      vWrap.hidden = m !== 'video';
      tWrap.hidden = m !== 'tutor';
      declined.hidden = m !== 'podcast';
      written.hidden = (m !== 'article' && m !== 'podcast');
      [].forEach.call(pick.querySelectorAll('.md-opt'), function (b) {
        var on = b.dataset.m === m;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      dd.render(m);
      dd.collapse();

      if (m === 'video') {
        if (!handed) ctx.disableNext();
        // "Watch the order" was the heading with a verb bolted on. The claim
        // after it is the one that changes how the clip gets watched.
        ctx.setCoachSay('Most of the procedure happens before the sharp is ever used.');
        if (!mounted) {
          mounted = true;
          mountVideo(ctx, {
            ids: { video: 'prVideo', wrap: 'prMedia', note: 'prVfall', fallback: 'prWritten', pct: 'prPct', skip: 'prSkip' },
            src: PROCEDURE_VIDEO,
            onFallback: done,
            onEnded: done
          });
        }
      } else if (m === 'tutor') {
        if (!handed) ctx.disableNext();
        ctx.setCoachSay('Let’s take the steps one at a time.');
        if (!tutorMounted) { tutorMounted = true; runTutor(); }
      } else if (m === 'podcast') {
        // Silent — the declined-audio banner on screen already says the path
        // still runs on the article cut; CLARA repeating it added nothing.
        // Still has to clear the manifest's "Loading…" placeholder, though:
        // a returning learner whose last modality was Listen lands here
        // FIRST, with no earlier setCoachSay call to have cleared it.
        ctx.setCoachSay('');
        done();
      } else {
        ctx.setCoachSay('Pay attention to the order of the steps too. Most of them happen before the sharp is ever used.');
        done();
      }
      ctx.positionOrb(false);
    }

    [].forEach.call(pick.querySelectorAll('.md-opt'), function (b) {
      b.addEventListener('click', function () { show(b.dataset.m); });
    });

    show(modalityId());
  }

  // ==========================================================================
  //  THE CASES — Option B. Each is a scene, a judgment, and a verdict; none
  //  refers to any other. `harder` swaps in the ambiguous variant when the
  //  battery earned test-up on the locked objective.
  // ==========================================================================
  // Numbering is computed, not fixed — case1 is the only one ever skipped
  // (K1 test-out removes it), so a learner who never saw it must not land
  // on a screen reading "case 2 of 3": that names a case they were never
  // shown and reads as something they missed, not something adaptive.
  function caseLabel(num) {
    var skipped = batteryResult() === 'proven';
    var total = skipped ? 2 : 3;
    var shown = skipped ? num - 1 : num;
    return 'Decide: case ' + shown + ' of ' + total;
  }
  function caseContent(cfg) {
    return function () {
      var L = lens();
      return '<main class="ll-object">' +
        '<div class="cs-wrap">' +
          '<p class="ll-eyebrow">' + esc(caseLabel(cfg.num)) + '</p>' +
          '<div class="cs-scene">' +
            '<div class="cs-tag"><i class="fa-solid ' + cfg.icon + '"></i> ' + esc(L.where) + ' · ' + esc(L.when) + '</div>' +
            '<p>' + esc(L[cfg.scene]) + '</p>' +
          '</div>' +
          '<p class="cs-q">' + esc(cfg.question) + '</p>' +
          '<div class="cs-opts" id="csOpts"></div>' +
        '</div>' +
      '</main>';
    };
  }
  // Case-style choice: a selection mark plus a label. The mark is what tells
  // the eye these three are pressable and the scene above them is not, and on
  // grading it carries the verdict as a glyph rather than colour alone.
  function csOption(text) {
    var b = document.createElement('button');
    b.className = 'cs-opt'; b.type = 'button';
    // An explicit label rather than relying on descendant text to accumulate
    // into the accessible name — that computation came back empty in an
    // automated pass, and this option is graded, so a screen reader learner
    // has to hear it before choosing.
    b.setAttribute('aria-label', text);
    b.innerHTML = '<span class="cs-mark" aria-hidden="true"></span><span class="cs-opt-t"></span>';
    b.querySelector('.cs-opt-t').textContent = text;
    return b;
  }
  // 'neutral' (item 16): a plain pick, no verdict — served harder, not
  // quizzed, so a check/minus/x would all overclaim.
  var CS_GLYPH = { ok: 'fa-check', near: 'fa-minus', bad: 'fa-xmark', neutral: 'fa-circle' };
  function csMark(b, grade) {
    b.classList.add('pick-' + grade);
    var m = b.querySelector('.cs-mark');
    if (m) m.innerHTML = '<i class="fa-solid ' + (CS_GLYPH[grade] || CS_GLYPH.bad) + '" aria-hidden="true"></i>';
  }

  function caseInit(cfg) {
    return function (ctx) {
      // Item 16: harder is a PERMUTATION, not a re-quiz — content-locked
      // objectives serve harder on test-up, they don't get graded harder.
      var harder = !!(cfg.harder && k2TestUp());
      var opts = harder ? cfg.harder : cfg.options;
      var wrap = document.getElementById('csOpts');
      // Silent on the harder permutation — flagging "you earned the harder
      // version" turned out to read as a reward, not a heads-up. cfg.coach
      // is also optional now (case3 has none): a case can open silent.
      // Always call setCoachSay, even with '' — the manifest primes this
      // bubble with a literal "Loading…" placeholder, and only this call
      // clears it; skipping the call on the silent branches left it stuck.
      ctx.setCoachSay(harder ? '' : (cfg.coach || ''));
      var settled = false;
      opts.forEach(function (o) {
        var b = csOption(o.t);
        b.addEventListener('click', function () {
          if (settled) return; settled = true;
          wrap.classList.add('answered');
          wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
          // A plain pick on the harder permutation — no verdict colour, no
          // grade saved. It was proven at the start; this is a discussion,
          // not a second chance to fail it.
          csMark(b, harder ? 'neutral' : o.grade === 'ok' ? 'ok' : o.grade === 'near' ? 'near' : 'bad');
          ctx.setCoachSay(esc(o.coach || o.reply));
          if (!harder) saveResult(cfg.key, { grade: o.grade });
          else saveResult(cfg.key, { servedHarder: true, picked: o.t });
          ctx.enableNext();
          ctx.positionOrb(true);
        });
        wrap.appendChild(b);
      });
    };
  }

  var CASE1 = {
    key: 'case1', obj: 'K1', num: 1, icon: 'fa-clock',
    scene: 'case1', question: 'What is wrong with this, specifically?',
    coach: 'What is the actual failure here?',
    options: [
      { t: 'The sharp was set down instead of disposed at the point of use', grade: 'ok',
        reply: 'Right. Everything that goes wrong later starts with the sharp existing somewhere it was not planned to be.' },
      { t: 'The container was too far away', grade: 'near',
        reply: 'No, that’s an excuse. The procedure says plan the route before you start, which means solving for distance earlier.' },
      { t: 'Nothing, as long as it gets disposed of eventually', grade: 'bad',
        reply: 'No, that’s not guaranteed. Between setting it down and coming back, the sharp belongs to whoever finds it.' }
    ]
  };
  var CASE2 = {
    key: 'case2', obj: 'K2', num: 2, icon: 'fa-box-open',
    scene: 'case2', question: 'What do you do?',
    coach: 'Now let’s focus on the container…',
    options: [
      { t: 'Stop using it, seal it, and get the replacement before anything else', grade: 'ok',
        reply: 'Right. That container is an engineering control, and past its limit it stops containing — a hazard wearing a safeguard’s label. Where the limit sits is set by your site’s plan, not by eye.' },
      { t: 'Use it carefully until someone swaps it', grade: 'bad',
        reply: 'No — once it’s past the fill line, the container stops containing. The next thing in comes right back out; that’s a property of the box, not of how carefully you use it.' },
      { t: 'Press the contents down to make room', grade: 'bad',
        reply: 'No. Never place your hand inside a sharps container.' }
    ],
    // Content-locked → test-up. The harder variant makes the call arguable.
    harder: [
      { t: 'Seal it and go for the replacement, leaving the area uncovered for four minutes', grade: 'ok',
        reply: 'That is the stronger call, and the tension is real — four minutes uncovered beats one sharp going somewhere undesignated.' },
      { t: 'Seal it and wait for someone to bring the spare so the area stays covered', grade: 'near',
        reply: 'Defensible, and in some settings it is the standing rule. But nothing gets used in the meantime — the moment you accept “just this one”, you are back at case 1.' },
      { t: 'Use the unit in the next room until the spare arrives', grade: 'near',
        reply: 'Workable if the route is planned and everyone knows. It fails the moment somebody who was not told needs it.' }
    ]
  };
  var CASE3 = {
    key: 'case3', obj: 'K2', num: 3, icon: 'fa-magnifying-glass',
    scene: 'case3', question: 'This one was not yours. What now?',
    // No opening line — case1/case2 name what the case is about before the
    // choice; this one's premise ("this wasn't yours") is already the
    // question heading, so CLARA had nothing to add before the pick.
    options: [
      { t: 'Secure it yourself, then report the condition that let it happen', grade: 'ok',
        reply: 'Yes, both parts matter. Securing it protects the next person; reporting it is the only thing that stops the third one.' },
      { t: 'Secure it and move on — no harm done', grade: 'near',
        reply: 'You protected one person, but the condition that put it there is still running, and it will produce another.' },
      { t: 'Leave it and tell whoever is responsible', grade: 'bad',
        reply: 'Between now and them, it is in reach of whoever comes next. Secure first, report second.' }
    ],
    // Content-locked -> test-up, the second half of it. The deck hardens BOTH
    // K2 cases, not one: recognition is the locked objective, and case 3 is
    // where it is hardest, because you did not cause this one.
    harder: [
      { t: 'Secure it, then report the route that let a sharp reach a paper bin', grade: 'ok',
        reply: 'That is the fuller call. The sharp is one event; the route that delivers them there is the condition — and only the second one has a fix.' },
      { t: 'Secure it and file it as an individual incident', grade: 'near',
        reply: 'Defensible, and most places would accept it. But an incident closes on a person, and nothing here was a person — it was a path that lets a sharp travel.' },
      { t: 'Secure it, then find out who was working the room before deciding what to report', grade: 'near',
        reply: 'Understandable, and it is the wrong first move. Whose it was does not change what you do next — and asking is exactly what makes the next person slower to say they found one.' }
    ]
  };

  // ==========================================================================
  //  IN-FLOW CHECK — the deck's Part Three, middle band: everyone is checked
  //  on what gates. Two attempts, a different explanation on a miss.
  //
  //  A bank of two now, not one fixed question (D4): the second item is the
  //  battery's old "which is never acceptable" K1 item, moved here rather
  //  than asked once and never again. Picked once per session and stable
  //  across Back/Continue, not re-rolled on every visit.
  // ==========================================================================
  var INFLOW_BANK = [
    { stem: 'Before you pick up a sharp, what should you already have decided?',
      opts: [
        { t: 'Which container the sharp goes in, and my route there', ok: true,
          reply: 'Right. The disposal route is a decision you make before the sharp is ever in your hand.' },
        { t: 'How to carry the sharp safely once I am done', ok: false,
          reply: 'Carrying is already the risky part — the procedure exists so there is as little carrying as possible.' },
        { t: 'Who to tell if the sharp injures somebody', ok: false,
          reply: 'Reporting matters afterwards. The decision you make in advance is the route to the container.' }
      ] },
    { stem: 'Which of these is never acceptable with a used sharp?',
      opts: [
        { t: 'Recapping it by hand', ok: true,
          reply: 'Exactly right. Recapping is dangerous because it places your hand near the point.' },
        { t: 'Carrying it to a container in the next room', ok: false,
          reply: 'That one is allowed, and sometimes it is the only option — provided the safety feature is on and you planned the route. Carrying a shielded sharp is fine; recapping one never is.' },
        { t: 'Sealing a full container and starting a fresh one', ok: false,
          reply: 'That is correct practice, not a violation. The five that are never acceptable are bending, breaking, recapping, removing, or separating a needle from its syringe.' }
      ] }
  ];
  function inflowBankPick() {
    try {
      var v = sessionStorage.getItem('sh-inflow-bank');
      if (v === '0' || v === '1') return +v;
    } catch (e) {}
    var i = Math.random() < 0.5 ? 0 : 1;
    try { sessionStorage.setItem('sh-inflow-bank', String(i)); } catch (e) {}
    return i;
  }
  function INFLOW_CONTENT() {
    var q = INFLOW_BANK[inflowBankPick()];
    return '<main class="ll-object">' +
      '<div class="cs-wrap">' +
        '<p class="ll-eyebrow">Check: 1 question · two tries</p>' +
        '<h2 class="cs-q cs-q--lead">' + esc(q.stem) + '</h2>' +
        '<div class="cs-opts" id="ifOpts"></div>' +
      '</div>' +
    '</main>';
  }
  function inflowInit(ctx) {
    var wrap = document.getElementById('ifOpts');
    var q = INFLOW_BANK[inflowBankPick()];
    // Silent. "Everyone gets this question" is the routing talking, which
    // never belongs on a learner screen, and the eyebrow already carries the
    // tries rule — CLARA restating it would be a second voice for one line.
    var tries = 0, settled = false;
    var buttons = [];
    q.opts.forEach(function (o) {
      var b = csOption(o.t);
      buttons.push(b);
      b.addEventListener('click', function () {
        if (settled) return;
        if (o.ok) {
          settled = true;
          wrap.classList.add('answered');
          wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
          csMark(b, 'ok');
          saveResult('inflow', { passed: true, attempts: tries + 1 });
          ctx.setCoachSay(esc(o.reply));
          ctx.enableNext();
        } else {
          tries++;
          csMark(b, 'bad'); b.disabled = true;
          if (tries >= 2) {
            // Closure: mark the correct option, disable the set, and state
            // the answer rather than leaving the last live button as a way
            // to overwrite a miss with a pass by wandering into it.
            settled = true;
            wrap.classList.add('answered');
            q.opts.forEach(function (opt, i) { if (opt.ok) csMark(buttons[i], 'ok'); });
            wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
            saveResult('inflow', { passed: false, attempts: tries });
            var correct = q.opts.filter(function (opt) { return opt.ok; })[0];
            ctx.setCoachSay(esc(correct.reply) + ' This comes back for another look before we move on.');
            ctx.enableNext();
          } else {
            ctx.setCoachSay(esc(o.reply));
          }
        }
        ctx.positionOrb(true);
      });
      wrap.appendChild(b);
    });
  }

  // ==========================================================================
  //  GLOVES OR CONTAINERS — F2, and the beat that used to not exist.
  //
  //  The record has always printed a line for this objective reading "Recorded
  //  · from your own answer". Nothing ever asked it. The entry battery carries
  //  two Know items and two Feel items, and this was not one of them, so the
  //  module was reporting an answer the learner never gave — on the one screen
  //  whose whole argument is that every line points at a real moment.
  //
  //  The scenario is the re-composed course's own: a facility choosing between
  //  cut-resistant gloves for every waste handler and more containers. Their
  //  version assesses it with an agreement scale on an empirical claim, which
  //  measures knowledge and calls it a value. So this beat splits the two:
  //  the CHOICE is the evidence, the scale afterwards is the self-report. A
  //  learner who picks gloves and then rates high on "controls prevent
  //  injuries" has told us something a single scale never could.
  //
  //  It sits after the account rather than before it, because all four sector
  //  accounts end with a needle going through a glove. The story earns the
  //  question.
  // ==========================================================================
  function CONTROLS_CONTENT() {
    var L = lens();
    return '<main class="ll-object">' +
      // Part 1 of 2 from the start, not just "Part 2 of 2" appearing later
      // with no Part 1 anywhere — the badge is static here because this half
      // of the screen is visible on arrival, not raised by reinforce().
      '<div class="cs-wrap">' +
        '<span class="rf-step">Part 1 of 2</span>' +
        '<p class="ll-eyebrow">Decide: 1 choice</p>' +
        '<h2 class="cs-q cs-q--lead">' + esc(L.orgShort) + ' has budget for one of these this year.</h2>' +
        '<p class="ll-sub ct-sub">Both are real proposals and both would help. Pick the one that prevents more injuries ' +
          'like the one you just read about.</p>' +
        '<div class="cs-opts" id="ctOpts"></div>' +

        '<div class="ct-second" id="ctSecond" hidden>' +
          '<p class="ll-eyebrow">And one on how you see it</p>' +
          '<h2 class="cs-q">Proper containers and safety-engineered needles prevent more of these injuries than PPE or training alone.</h2>' +
          '<p class="bl-hint">Your view, not the textbook answer. Nothing you pick here changes your path.</p>' +
          '<div class="bl-options" id="ctAgree" role="radiogroup"></div>' +
        '</div>' +
      '</div>' +
    '</main>';
  }
  function controlsInit(ctx) {
    var L = lens();
    var opts = document.getElementById('ctOpts');
    var second = document.getElementById('ctSecond');
    var picked = null;
    // Silent through this whole beat, both the choice and the belief scale
    // below it \u2014 the screen's own hint states the choice's argument, and
    // neither pick nor rating gets a CLARA reaction on top of it.

    [
      { k: 'boxes', t: L.facility.boxes, grade: 'ok' },
      { k: 'gloves', t: L.facility.gloves, grade: 'near' }
    ].forEach(function (o) {
      var b = csOption(o.t);
      b.addEventListener('click', function () {
        if (picked) return;
        picked = o.k;
        opts.classList.add('answered');
        opts.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
        csMark(b, o.grade);
        saveResult('controls', { choice: o.k, sampled: sampled('F2') });
        ctx.positionOrb(true);
        // F2 is ask+sampled (D6/item 15): only part of the cohort gets the
        // belief-scale question at all. The choice above is the real
        // evidence either way — sampling decides only whether the
        // self-report on top of it gets asked.
        if (!sampled('F2')) { ctx.enableNext(); return; }
        // The scale arrives only after the choice, so the choice is made
        // without the wording of the statement steering it — and it waits for
        // the learner to ask for it. On a clock it opened 900ms after a
        // sixty-word explanation of why containers beat gloves, closing that
        // explanation to make room for a question that assumes it was read.
        ctx.setNextAction('One more question', function () {
          reinforce(ctx, second, 2, 2);
          ctx.positionOrb(true);
        });
      });
      opts.appendChild(b);
    });

    var agreeEl = document.getElementById('ctAgree');
    var done = false;
    [
      { t: 'Strongly agree', icon: 'fa-heart', score: 3 },
      { t: 'Somewhat', icon: 'fa-scale-balanced', score: 2 },
      { t: 'Training matters more', icon: 'fa-chalkboard-user', score: 1 }
    ].forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'bl-option'; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', o.t);
      b.innerHTML = '<i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>' +
                    '<span class="bl-option-label">' + esc(o.t) + '</span>';
      b.addEventListener('click', function () {
        if (done) return; done = true;
        b.setAttribute('aria-checked', 'true');
        agreeEl.classList.add('answered');
        agreeEl.querySelectorAll('.bl-option').forEach(function (x) { if (x !== b) x.disabled = true; });
        ctx.clearCoachAction();
        // Merged, not replaced — the choice handler above already wrote
        // `sampled` for this key, and this only ever runs when sampled was
        // true (the belief scale is what sampling gates).
        mergeResult('controls', { choice: picked, agree: o.score });
        ctx.enableNext();
        ctx.positionOrb(true);
      });
      agreeEl.appendChild(b);
    });
    LE.pickGroup(agreeEl);
  }

  // ==========================================================================
  //  SOMEBODY EMPTIES IT — F1, and its own screen.
  //
  //  This prompt used to sit at the foot of the chain, directly under a story
  //  about a named stranger spending twelve weeks on bloodwork. Two different
  //  people in two different registers back to back — a fictional one you
  //  were told you hurt, then a real one at your own site — with no statement
  //  of why the second was being asked. It read as an accusation with a text
  //  box under it, and it made an already five-part screen six.
  //
  //  On its own screen it can say what it is FOR before it asks, which is the
  //  one thing it could never do at the bottom of another beat: the reason
  //  this question works is that most people cannot answer it, and that line
  //  was previously delivered only AFTER the answer had been given.
  //
  //  Placed after the budget choice rather than before it, because the
  //  account earns that question and the adjacency is deliberate. From here
  //  the module widens a step at a time — one real person, then the whole
  //  room (the cohort debrief), then the learner under pressure.
  //
  //  Scored for ONE thing and not by a model: whether a specific person
  //  downstream of them has a name. That is F1 operationalised — an
  //  agreement scale on the same idea has a ceiling nobody falls below.
  // ==========================================================================
  var DOWN_ASK = 'Who handles your waste?';

  function DOWN_CONTENT() {
    return '<main class="ll-object">' +
      '<p class="ll-eyebrow">One question</p>' +
      '<h2>' + esc(DOWN_ASK) + '</h2>' +
      '<p class="ll-sub">Most people cannot answer this, and that is most of why the ' +
        'shortcut feels like it costs nothing.</p>' +
      '<div class="dn-wrap">' +
        '<p class="dn-hint">Name them if you can. If you do not know their name, say what they do.</p>' +
        '<textarea class="ch-input" id="dnInput" rows="2" placeholder="A name, or what they do" ' +
          'aria-label="' + esc(DOWN_ASK) + '"></textarea>' +
        '<button class="ch-send" id="dnSend" type="button">Done</button>' +
        '<p class="ch-echo" id="dnEcho" hidden></p>' +
      '</div>' +
    '</main>';
  }

  function downInit(ctx) {
    var input = document.getElementById('dnInput');
    var send = document.getElementById('dnSend');
    var echo = document.getElementById('dnEcho');
    var recorded = false;

    // Silent on arrival. A free-text box invites a careful answer, and a
    // learner who thinks it is being marked writes for the marker \u2014 saying
    // so, or anything else about the question, was CLARA narrating her own
    // prompt back at the learner. Still has to clear the manifest's
    // "Loading\u2026" placeholder, though.
    ctx.setCoachSay('');
    // Ungated: only Know gates here, and a Feel prompt that held the door
    // would be routing content on a self-report. Recorded as unanswered up
    // front so a learner who reads it and moves on is not reported as asked
    // but missing.
    ctx.enableNext();
    saveResult('downstream', { named: null });

    send.addEventListener('click', function () {
      var text = String(input.value || '').trim();
      if (!text || recorded) return;
      recorded = true;
      input.disabled = true;
      send.disabled = true;
      saveResult('downstream', { named: text });
      // Their words, back to them. No grading and no model call: the value is
      // that a specific person now has a name in this module, and quoting it
      // is a stronger move than a verdict on whether they got it right.
      echo.hidden = false;
      echo.textContent = 'That is who the chain you walked at the start ends with.';
      ctx.setCoachSay('\u201c' + esc(text) + '\u201d \u2014 noted.');
      ctx.positionOrb(true);
    });
  }

  // ==========================================================================
  //  COHORT DEBRIEF — F3. Their read of the room, then the real number.
  //
  //  This screen used to ask for the guess itself, which made it the SECOND
  //  time the module asked how common the shortcut is — the entry battery's
  //  fourth question had already asked, eight screens earlier, and nothing
  //  ever referred back to it. So the reveal corrected a guess made ten
  //  seconds ago while the real one sat unused.
  //
  //  Now the entry answer IS the guess. It is quoted back before anything is
  //  shown, and the learner asks for the numbers rather than being handed
  //  them — which is why the question stays at entry and the figures stay
  //  here: a norm figure shown in the first minute is a statistic, and the
  //  same figure shown after the account of somebody in their trade getting
  //  stuck is a correction. The gap between those two moments is what gives
  //  the reveal its weight.
  //
  //  2026-09-21: both final K&A scripts (Manufacturing and Law Enforcement)
  //  cite the same real, published figure for this exact belief — Gershon et
  //  al. (2000), a U.S. study of sharps-disposal compliance — rather than the
  //  per-sector illustrative numbers this screen used to show. That source
  //  reports one aggregate compliance rate, not a three-way breakdown, so the
  //  three original guess-bands (most/half/few) collapse to the two the
  //  citation actually supports: always uses the container right away, or
  //  doesn't. Inventing sub-splits within "doesn't" to keep three rows would
  //  be fabricating what the study never measured — worse than the old
  //  illustrative numbers, not better, since it would look sourced when it
  //  is not. The figure is no longer sector-lensed either: the citation is
  //  one national number, not four.
  // ==========================================================================
  //  The entry answer, as a key into the two bands the chart reports. That
  //  item asked what share of the room uses the container straight away,
  //  which is exactly what the FIRST band measures, so the two compare
  //  without rescaling anything. Null when the battery never finished — the
  //  screen then falls back to a plain reveal rather than inventing a guess.
  var F3_KEYS  = { 3: 'most', 2: 'half', 1: 'few' };
  var F3_WORDS = { most: 'Most do', half: 'About half', few: 'Hardly anyone' };
  // Item 14: quoted directly from the battery item rather than a separately
  // hand-typed sentence — the two had drifted apart (one a statement, one a
  // question), which is exactly what a recall block quoting itself cannot
  // afford to get wrong.
  var F3_STEM = (BATTERY.filter(function (q) { return q.obj === 'F3'; })[0] || {}).stem || '';
  function entryF3() {
    var b = readCourse().battery;
    return (b && F3_KEYS[b.f3]) || null;
  }
  // Real, cited data (2026-09-21 final decks) — the same figure for every
  // sector, so this is no longer a per-sector table. 'half' and 'few' both
  // key into the one honest "everyone else" row; see debriefRows() below.
  var DEBRIEF_STAT = [
    { k: 'most', label: 'Always use the container right away', pct: 92.7 },
    { k: 'other', label: 'Sometimes or rarely do', pct: 7.3 }
  ];
  var DEBRIEF_SOURCE = 'Gershon et al. (2000), “Hospital Safety Climate and Its Relationship ' +
    'with Safe Work Practices and Workplace Exposure Incidents,” American Journal of Infection ' +
    'Control, 28(3), 211–221.';
  function debriefRows() { return DEBRIEF_STAT; }
  // 'half' and 'few' both read as the single 'other' row above — see the
  // DEBRIEF_STAT comment. The render loop's own row-vs-guess match (below)
  // goes through this rather than a plain `===`, so whichever of the three
  // original guesses the learner picked, the right row still gets tagged
  // "Your guess".
  function debriefRowKey(said) { return said === 'most' ? 'most' : said ? 'other' : null; }
  function DEBRIEF_CONTENT() {
    var said = entryF3();
    return '<main class="ll-object">' +
      '<p class="ll-eyebrow">Compare: 1 question</p>' +
      '<h2>What does your shift actually do?</h2>' +

      // Their own answer, quoted back before anything is revealed. The guess
      // has been sitting unresolved since before the module started, and
      // naming it is what makes the figure land as a correction of something
      // they said rather than as a number on a chart.
      (said
        ? '<div class="db-recall" id="dbRecall">' +
            '<p class="db-recall-h"><i class="fa-solid fa-quote-left" aria-hidden="true"></i> ' +
              'You answered this before we started</p>' +
            '<p class="db-recall-q">' + esc(F3_STEM) + '</p>' +
            '<p class="db-recall-a">' + esc(F3_WORDS[said]) + '</p>' +
          '</div>'
        : '') +

      // Asked, not handed over. The figure is the intervention on this beat,
      // and a learner who has just asked to see it reads it differently from
      // one it was shown to.
      '<div class="db-invite" id="dbInvite">' +
        '<p class="db-invite-q">' +
          (said ? 'Want to see what the real numbers are?'
                : 'Want to see what the research actually found?') + '</p>' +
        '<button class="db-reveal" id="dbReveal" type="button">' +
          '<i class="fa-solid fa-chart-simple" aria-hidden="true"></i> Show me the numbers</button>' +
      '</div>' +

      '<div class="pr-wrap" id="dbChart" hidden>' +
        '<div class="pr-choices" id="prChoices">' +
          debriefRows().map(function (d) {
            // Read-only rows. The guess happened at the entry battery, so the
            // band the learner was estimating is MARKED here rather than
            // clicked — their answer sits on the same line as the real figure,
            // which is the whole comparison in one row. 'half' and 'few' both
            // read onto the 'other' row now (debriefRowKey) since the real
            // citation only supports two bands — see the DEBRIEF_STAT comment.
            var mine = said && debriefRowKey(said) === d.k;
            // Item 29: "Your guess: about half" — a tag beside a figure reads
            // as metadata, not as a quoted sentence, so it takes the lower-
            // cased form rather than the capitalized recall-block phrasing.
            var guessWord = F3_WORDS[said] ? F3_WORDS[said].charAt(0).toLowerCase() + F3_WORDS[said].slice(1) : '';
            return '<div class="pr-choice pr-static' + (mine ? ' picked' : '') + '" data-k="' + d.k + '">' +
              '<span class="pr-head">' +
                '<span class="pr-lab">' + esc(d.label) + '</span>' +
                (mine ? '<span class="pr-tag">Your guess: ' + esc(guessWord) + '</span>' : '') +
                '<span class="pr-pct">' + d.pct + '%</span>' +
              '</span>' +
              '<span class="pr-track"><span class="pr-fill" data-w="' + d.pct + '"></span></span>' +
            '</div>';
          }).join('') +
        '</div>' +
        // Real, cited research (2026-09-21) rather than the illustrative
        // per-sector figures this screen used to show — see the DEBRIEF_DATA
        // comment above. The citation is a production detail worth a reviewer
        // reading the full title; a learner just needs to see it is a real
        // source, not an invented one.
        '<p class="pr-src"><i class="fa-solid fa-book" aria-hidden="true"></i> ' +
          esc(DEBRIEF_SOURCE) + '</p>' +
      '</div>' +

      // Item 14: the post leg of a Pre + post objective is the SAME item
      // asked again, not a different question about where their own shift
      // sits — a mismatched pair (see moveChip's own note below) filed a
      // learner who re-confirmed their entry answer as having "moved down".
      // The reportable figure is the movement between the two identical
      // asks, not either one alone.
      '<div class="db-post ct-second" id="dbPost" hidden>' +
        '<p class="ll-eyebrow">Same question, now you have the number</p>' +
        '<h2 class="cs-q">' + esc(F3_STEM) + '</h2>' +
        '<div class="bl-options" id="dbPostOpts" role="radiogroup"></div>' +
      '</div>' +
    '</main>';
  }
  function debriefInit(ctx) {
    var said = entryF3();
    var choices = document.getElementById('prChoices');
    var chart = document.getElementById('dbChart');
    var invite = document.getElementById('dbInvite');
    var top = debriefRows()[0];
    var revealed = false;

    // Silent on arrival, in both cases. With no entry answer the line listed
    // the screen's two parts; with one it announced the recall block sitting
    // directly below it, which quotes the question AND the answer. CLARA's
    // moment on this screen is the figure itself \u2014 see the reveal handler.

    document.getElementById('dbReveal').addEventListener('click', function () {
      if (revealed) return;
      revealed = true;
      invite.hidden = true;
      chart.hidden = false;
      choices.classList.add('answered');
      debriefRows().forEach(function (d) {
        var el = choices.querySelector('.pr-choice[data-k="' + d.k + '"]');
        if (el && d.pct >= 50) el.classList.add('is-top');
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        choices.querySelectorAll('.pr-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      }); });
      setTimeout(function () {
        // Real, universal data (2026-09-21) is always a majority (92.7%), so
        // the old minority branch — one sector's illustrative figure sat just
        // under half, and the copy had to avoid calling the shortcut "the
        // outlier" while showing data that said otherwise — is no longer
        // reachable. Left as a plain majority check rather than hardcoded
        // `true`, so this still degrades correctly if the figure ever changes.
        var majority = top.pct >= 50;
        // Null when there is no entry answer to have been right or wrong.
        var matched = said ? ((said === 'most') === majority) : null;
        var pct = '<strong>' + top.pct + '%</strong>';
        ctx.setCoachSay(matched === null
          ? 'The real number is ' + pct + '. Which means the person who sets one down is the outlier, not the norm.'
          : matched
            ? 'Your read matches the data — ' + pct + '. Which means the person who sets one down is the outlier, not the norm.'
            : 'The real figure is ' + pct + ' — higher than most people guess. The shortcut feels normal because you notice it; it is not what most of your shift does.');
        saveResult('debrief', { guess: said, majority: majority, pct: top.pct });
        ctx.positionOrb(true);
        // The figure IS the intervention on this beat, and it used to be
        // covered 1.1s after it arrived — numbers half off the screen, the
        // line explaining them closed, by a clock nobody set. The forward
        // button carries the second question until the learner presses it,
        // the same signal the account screen's "Done reading" uses. They read
        // the number for as long as they want to.
        ctx.setNextAction('One more question', openPost);
      }, T(1300));
    });

    // ---- the post leg (item 14: the identical entry item, reused) ----
    var post = document.getElementById('dbPost');
    var postOpts = document.getElementById('dbPostOpts');
    var postDone = false;
    var entryScore = (readCourse().battery || {}).f3;
    (BATTERY.filter(function (q) { return q.obj === 'F3'; })[0] || {}).options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'bl-option'; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', o.t);
      b.innerHTML = '<i class="fa-solid ' + o.icon + '" aria-hidden="true"></i>' +
                    '<span class="bl-option-label">' + esc(o.t) + '</span>';
      b.addEventListener('click', function () {
        if (postDone) return; postDone = true;
        b.setAttribute('aria-checked', 'true');
        postOpts.classList.add('answered');
        postOpts.querySelectorAll('.bl-option').forEach(function (x) { if (x !== b) x.disabled = true; });
        // Same scale as the entry item now, so the move is a real one: up,
        // down, or held against their own earlier answer. Silent on the
        // result either way — CLARA already made her case in the reveal
        // above; the re-rate is recorded, not reacted to.
        var moved = entryScore ? (o.score > entryScore ? 'up' : o.score < entryScore ? 'down' : 'held') : null;
        var c = readCourse();
        saveResult('debrief', { guess: (c.debrief && c.debrief.guess) || said,
                                majority: !!(c.debrief && c.debrief.majority),
                                pct: (c.debrief && c.debrief.pct) || debriefRows()[0].pct,
                                post: o.score });
        ctx.enableNext();
        ctx.positionOrb(true);
      });
      postOpts.appendChild(b);
    });
    LE.pickGroup(postOpts);

    // Reveal only. They have just said what the figure means, and that line
    // is the whole point of the beat — overwriting it a second later with "one
    // more question" spent the finding to announce a control the screen's own
    // eyebrow already announces.
    function openPost() {
      // The recall block is spent: it asked what they said before the module,
      // and the line CLARA just delivered already answered it. Retiring it
      // buys the chart the room to stay on screen behind the question.
      // No "Part 2 of 2" here either — the reveal is not a numbered part.
      reinforce(ctx, post, 1, 1, { spent: [document.getElementById('dbRecall')] });
      ctx.positionOrb(true);
    }
  }

  // ==========================================================================
  //  REMEDIATION — Know only, inserted live before Perform (D2). K1 is a
  //  gate: it loops with a fresh item, in whichever modality the learner did
  //  NOT get taught in, until passed — there is no give-up path. K2 is
  //  remediate: one retry, then on regardless of the outcome, which is the
  //  same policy hzcheck's own two tries already runs at the beat above it.
  //
  //  Both live between the debrief and walk, gated on the check they are
  //  remediating having actually failed (inflow.passed / hazard.passed),
  //  so a learner who passed either check on the first pass never sees them.
  // ==========================================================================
  var REMK1_BANK = [
    { stem: 'Which comes first: activating the safety feature, or walking to the container?',
      opts: [
        { t: 'Activating the safety feature', ok: true,
          reply: 'Right. The feature goes on while the sharp is still under your control, before it moves anywhere.' },
        { t: 'Walking to the container', ok: false,
          reply: 'That’s the second move, not the first. An unshielded point in transit is where most injuries happen.' }
      ] },
    { stem: 'You reach for a container and there is none within reach. What do you do?',
      opts: [
        { t: 'Keep it in your own hand and walk it to one', ok: true,
          reply: 'Right. A shielded sharp is safe to carry; the alternative is setting it down somewhere, which is exactly the gap this module is about.' },
        { t: 'Set it down somewhere safe until you can come back', ok: false,
          reply: 'No, a sharp set down is a sharp somebody else finds. Keep it in hand and walk it to a container instead.' }
      ] }
  ];
  // The modality they did NOT get: video's closest substitute is the tutor
  // walkthrough (both show the steps happening rather than listing them),
  // and everything else contrasts with a plain written list.
  function remk1Modality() {
    var served = modalityId();
    return served === 'tutor' ? 'article' : 'tutor';
  }
  function REMK1_CONTENT() {
    var m = remk1Modality();
    return '<main class="ll-object"><div class="pr-wrap">' +
      '<p class="ll-eyebrow">Another look, a different way</p>' +
      '<h1 class="pr-h">The procedure again' + (m === 'tutor' ? ' — step by step this time.' : ' — in writing this time.') + '</h1>' +
      (m === 'tutor' ? '<div class="pr-tutor" id="rk1Tutor"></div>' : procedureList()) +
      '<div class="cs-wrap" id="rk1Q" style="margin-top:28px">' +
        '<p class="ll-eyebrow">Check: 1 question</p>' +
        '<h2 class="cs-q cs-q--lead" id="rk1Stem"></h2>' +
        '<div class="cs-opts" id="rk1Opts"></div>' +
      '</div>' +
    '</div></main>';
  }
  function remk1Init(ctx) {
    var m = remk1Modality();
    // Silent on arrival — the screen's own eyebrows already say "Another
    // look, a different way" and "Check: 1 question".
    if (m === 'tutor') {
      var host = document.getElementById('rk1Tutor');
      var useP = lens() && lens().premise === 'use';
      var shown = PROCEDURE.filter(function (s) { return !(s.onlyOn && s.onlyOn !== (useP ? 'use' : 'find')); });
      // Bug found 2026-09-17: this reveal used to just append each turn and
      // leave the scroll wherever it was, so by the time all six steps had
      // landed the fixed question below (#rk1Q) had been pushed clean off
      // the bottom of the scroller with nothing to bring it back.
      // procedure's own tutor mode (runTutor, above) hit the identical
      // problem and already carries the fix — same approach here: pull the
      // newest thing to the bottom of the scroller as it lands, and once
      // the LAST step is in, pull the question itself into view rather than
      // the turn before it.
      function scrollToEl(el) {
        if (!el) return;
        var instant = T(1) === 0 || document.hidden;
        el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end', inline: 'nearest' });
      }
      shown.forEach(function (s, i) {
        setTimeout(function () {
          if (!host) return;
          var d = document.createElement('div');
          d.className = 'pr-turn';
          d.innerHTML = '<span class="pr-n">' + (i + 1) + '</span>' +
            '<span class="pr-main"><b>' + esc(s.t) + '</b><span class="pr-d">' + esc(s.d) + '</span></span>';
          host.appendChild(d);
          requestAnimationFrame(function () { d.classList.add('in'); });
          scrollToEl(i === shown.length - 1 ? document.getElementById('rk1Q') : d);
        }, T(300 + i * 700));
      });
    }
    var bankIdx = 0, tries = 0;
    var stemEl = document.getElementById('rk1Stem');
    var optsEl = document.getElementById('rk1Opts');
    function render() {
      var q = REMK1_BANK[bankIdx % REMK1_BANK.length];
      stemEl.textContent = q.stem;
      optsEl.innerHTML = '';
      var settled = false;
      q.opts.forEach(function (o) {
        var b = csOption(o.t);
        b.addEventListener('click', function () {
          if (settled) return;
          settled = true;
          tries++;
          if (o.ok) {
            optsEl.classList.add('answered');
            optsEl.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
            csMark(b, 'ok');
            saveResult('remk1', { passed: true, attempts: tries });
            ctx.setCoachSay(esc(o.reply));
            // refreshNav (which re-arms the gate via updateFooter) before
            // enableNext, or updateFooter's own reset clobbers the unlock —
            // same ordering Bystander's own remediation uses.
            LE.refreshNav();
            ctx.enableNext();
          } else {
            csMark(b, 'bad'); b.disabled = true;
            ctx.setCoachSay(esc(o.reply) + ' Let’s try another one on the same procedure.');
            setTimeout(function () { bankIdx++; render(); }, T(1400));
          }
          ctx.positionOrb(true);
        });
        optsEl.appendChild(b);
      });
    }
    render();
  }

  // ==========================================================================
  //  WHEN YOU ARE BEHIND — D3 (Do / Sustain), sitting immediately before the
  //  simulation.
  //
  //  Alignment brief D1 note: this screen used to open with an F4 (Feel / Can)
  //  self-efficacy rating — confidence rated against a NAMED obstacle rather
  //  than in the abstract. "How confident are you about sharps disposal"
  //  measures mood; "even when you are behind, the line is waiting, and the
  //  container is on the other side of the building" measures the thing that
  //  actually predicts whether the shortcut gets taken. Every clause in that
  //  statement was an obstacle the module had already shown.
  //
  //  Alignment brief D1: F4 is cut, so this screen now opens directly on the
  //  D3 (Do / Sustain) plan below — no rating, no threshold gate ahead of it.
  //  Still runs as a two-part reinforcement (pick the shift, then write the
  //  plan) for the same reason it always did: one thing to read and one thing
  //  to do at a time.
  // ==========================================================================

  function WALK_CONTENT() {
    var L = lens();
    return '<main class="ll-object">' +
      '<div class="ef-wrap">' +

        // TWO parts, not one card with two questions in it. Splitting them is
        // the reinforcement layer this module already uses on the account read
        // and the budget choice — each part rises as a card over the held
        // content, carrying its own "Part N of 2" marker, so the learner has
        // one thing to read and one thing to do at a time.
        //
        // The card's own heading is gone with the split: "Decide the walk now,
        // not while you are holding a sharp" was CLARA's line on the rating in
        // different words, and she says it as a reaction to what they rated.
        // #wkHeld went too — it acknowledged a high rating back when the plan
        // was hidden from those learners, and everybody gets the plan now.
        '<div id="wkPart1" hidden>' +
          '<h2 class="cs-q">Which shift is most likely to end with a sharp set down?</h2>' +
          '<div class="wk-conds" id="wkConds" role="radiogroup" ' +
            'aria-label="The shift most likely to end with a sharp set down"></div>' +
        '</div>' +

        '<div id="wkPart2" hidden>' +
          '<h2 class="cs-q">Finish the sentence in your own words.</h2>' +
          // The stem, shown rather than described: the field's job is obvious
          // once the sentence it completes is on the screen above it.
          '<p class="wk-stem">“The container is …”</p>' +
          '<input class="wk-route" id="wkRoute" type="text" maxlength="80" ' +
            'placeholder="' + esc(((L.sustain || {}).hint) || 'in the nearest container') + '" ' +
            'aria-label="Where the container is">' +
          '<button class="ef-lock" id="wkCommit" type="button" disabled>Commit it</button>' +
          '<p class="wk-say" id="wkSay" hidden></p>' +
          '<p class="wk-plan-note" id="wkNote" hidden>You just made that call with nothing ' +
            'pulling at you. That is the point of making it now — the shift where it counts ' +
            'is the worst time to be working it out.</p>' +
        '</div>' +
      '</div>' +
    '</main>';
  }

  function walkInit(ctx) {
    var L = lens();
    var part1 = document.getElementById('wkPart1');
    var part2 = document.getElementById('wkPart2');
    var conds = document.getElementById('wkConds');
    var route = document.getElementById('wkRoute');
    var commit = document.getElementById('wkCommit');
    var say = document.getElementById('wkSay');
    var note = document.getElementById('wkNote');
    var committed = false, cond = null;

    // D3 (Sustain)'s ASSESSMENT POLICY is ungated and unsampled — it runs
    // the same for every learner, with nothing to react to before it, so
    // this clears the manifest's "Loading…" placeholder and opens straight
    // on the plan. That is a fact about which OBJECTIVE policy governs this
    // beat, not about whether the SCREEN gates Continue — this step's own
    // STEPS entry still carries gate:true, same as every other Learn beat.
    // Bug found 2026-09-17: enableNext() used to live here unconditionally,
    // a leftover from before the F4 rating UI was removed (that rating used
    // to be the thing that unlocked Continue). With F4 gone, this let a
    // learner move on having picked nothing and written nothing. Moved to
    // the actual completion of the plan, in the commit handler below.
    ctx.setCoachSay('');
    reinforce(ctx, part1, 1, 2);

    // ---- part 1: the shift (D3, Do / Sustain) ----
    ((L.sustain || {}).conds || []).forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'wk-cond'; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.textContent = t;
      b.addEventListener('click', function () {
        if (cond) return;
        cond = t;
        conds.querySelectorAll('.wk-cond').forEach(function (x) {
          x.disabled = true;
          x.classList.toggle('picked', x === b);
          x.setAttribute('aria-checked', x === b ? 'true' : 'false');
        });
        // Their press IS the signal, so part 2 follows it directly. Part 1
        // gives up its layer so it recedes behind the blur with everything
        // else the second question is about.
        part1.classList.remove('rf-layer');
        reinforce(ctx, part2, 2, 2);
        route.focus();
        ctx.positionOrb(true);
      });
      conds.appendChild(b);
    });

    // ---- part 2: the route ----
    route.addEventListener('input', function () { commit.disabled = !route.value.trim(); });

    commit.addEventListener('click', function () {
      if (committed || commit.disabled) return;
      committed = true;
      var where = route.value.trim();
      route.disabled = true;
      commit.hidden = true;
      // Read back in their own words. The point of the sentence is that they
      // wrote it, so rendering our version would undo the only thing this
      // screen does.
      say.hidden = false;
      say.innerHTML = 'When ' + esc(low(cond)) + ': <b>“The container is ' + esc(where) +
        '. I am walking there when I am done.”</b>';
      note.hidden = false;
      clearFooter(part2);
      saveResult('sustain', { cond: cond, route: where });
      // D12: dropped the "check-in after the course" promise — nothing in
      // this module actually schedules or runs one, so the line was a
      // commitment CLARA had no standing to make. The written plan is the
      // artifact; whether it held is a separate, later fact this module
      // cannot claim to have.
      ctx.setCoachSay('This plan is on your record, in your own words — not a promise it will ' +
        'hold, just what you intend to do.');
      ctx.positionOrb(true);
      ctx.enableNext();
    });
  }

  function low(t) {
    if (!t) return '';
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  // §6.3: the one-line hook a learner reads right before the live scenario
  // (and the stand-in question's stem, when the Do-object baseline is on)
  // has to match whichever scenario scenarioKey() is about to hand off to —
  // Manufacturing's "blade on the next bench" reads as a continuity error
  // for a classroom teacher or a paramedic. One line per sector, matching
  // each scenario's own opening beat in mix-arc.js.
  var HANDOFF_HOOK = {
    manufacturing: 'You spot a used blade on the next bench over. It is not yours.',
    education: 'You spot a craft blade left on the back table. It is not yours.',
    aec: 'You spot a utility blade left on a windowsill. It is not yours.',
    public: 'You spot a needle wedged into the back seat of your patrol vehicle. It is not yours.'
  };
  function handoffHook() { return HANDOFF_HOOK[LE.lensId()] || HANDOFF_HOOK.manufacturing; }

  // ==========================================================================
  //  THE HANDOFF — D11/item 31. A real screen where the module used to hand
  //  straight off to the culminating scenario with nothing of its own: the
  //  scenario player's own establishing card was the only framing a learner
  //  ever got before being dropped into a live roleplay. This screen does
  //  that job — the moment, in two lines, and what the format actually is —
  //  and tells the player (?handoff=1, appended to the `enact` step's
  //  external URL) to skip ITS establishing card in turn, since showing both
  //  would frame the same moment twice in a row.
  // ==========================================================================
  function HANDOFF_CONTENT() {
    return '<main class="ll-object ll-object--chain"><div class="ho-wrap">' +
      '<p class="ll-eyebrow">Perform: live scenario, about 5 minutes</p>' +
      '<span class="ho-mark" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>' +
      '<p class="ho-lead">' + esc(handoffHook()) + '</p>' +
      '<p class="ho-lead-sub">Nobody is asking you about it — you have to notice it, decide what ' +
        'to do, and carry it through. What you do next is the scenario.</p>' +
      '<div class="ho-what">' +
        '<p class="ho-what-h">What will happen</p>' +
        '<p class="ho-what-d">You will describe what you do and say in real time — no list ' +
          'of lines to pick from, just what you would actually do. It runs about five minutes ' +
          'and closes with a debrief of what happened.</p>' +
      '</div>' +
    '</div></main>';
  }
  function handoffInit(ctx) {
    // Ungated — there is nothing to answer here, only to read before moving
    // on. Silent on arrival: the screen states its own purpose in its own
    // copy, and CLARA has no reaction to a page nobody has acted on yet.
    ctx.enableNext();
  }

  // ==========================================================================
  //  DO-OBJECT BASELINE (D10) — a reviewer-only stand-in for `enact`. Off by
  //  default; every learner still gets the live scenario. Switched on from
  //  the Demo menu's "Do-object baseline" row (offered on the handoff screen
  //  above), it swaps `enact`'s external hand-off for a short video plus one
  //  stand-in multiple-choice question, in place — this is the PRD's literal
  //  Do-object ask, made demonstrable on request without maintaining it as a
  //  second real path a learner could ever land on.
  //
  //  The video is illustrative, not the gate — same split as every other
  //  video+check beat here (see PROCEDURE_CONTENT). A missing clip at this
  //  placeholder path unlocks Continue on its own (mountVideo's normal
  //  never-strand behaviour); the question below is what a reviewer is
  //  actually here to see.
  // ==========================================================================
  var DOBASELINE_VIDEO = '../../../../assets/videos/sharps-doobject-baseline.mp4';
  var DOBASELINE_Q = {
    // §6.3: no hardcoded stem — built from handoffHook() so the reviewer-only
    // baseline stays in sync with whichever sector's scenario scenarioKey()
    // would otherwise hand off to. Options/replies stay sector-neutral
    // ("the hazard," not "the blade") for the same reason.
    options: [
      { t: 'Leave it — it isn’t yours to handle', icon: 'fa-hand',
        reply: 'Not quite. An unclaimed sharp is still a hazard on the floor — whoever notices it owns the next step.' },
      { t: 'Keep eyes on it and go get a container', icon: 'fa-eye',
        reply: 'Right. Keep it in sight, get the container, and carry it through yourself.' },
      { t: 'Ask around to find out whose it is first', icon: 'fa-people-arrows',
        reply: 'Not quite. Tracking down whose it is can wait — the hazard sitting exposed can’t.' }
    ]
  };
  function DOBASELINE_CONTENT() {
    return '<main class="ll-object"><div class="dob-wrap">' +
      '<p class="ll-eyebrow">Perform: demonstration video, then one question</p>' +
      '<h1 class="pr-h">Watch it handled, then answer.</h1>' +
      '<p class="pr-sub">Stand-in for the live scenario — review only, a learner never sees this version.</p>' +
      videoFrame({ ids: { wrap: 'dobMedia', video: 'dobVideo', note: 'dobVfall', pct: 'dobPct', skip: 'dobSkip' },
                   src: DOBASELINE_VIDEO }) +
      '<div class="bl-ask" id="dobAsk">' +
        '<h2 class="bl-q">' + esc(handoffHook() + ' What do you do first?') + '</h2>' +
        '<div class="bl-options" id="dobOptions" role="radiogroup" aria-labelledby="dobAsk"></div>' +
      '</div>' +
    '</div></main>';
  }
  function doBaselineInit(ctx) {
    mountVideo(ctx, { ids: { wrap: 'dobMedia', video: 'dobVideo', note: 'dobVfall', pct: 'dobPct', skip: 'dobSkip' },
                       src: DOBASELINE_VIDEO });
    var optsEl = document.getElementById('dobOptions');
    var settled = false;
    DOBASELINE_Q.options.forEach(function (opt) {
      var b = document.createElement('button');
      b.className = 'bl-option'; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.innerHTML = '<i class="fa-solid ' + opt.icon + '" aria-hidden="true"></i>' +
                    '<span class="bl-option-label">' + esc(opt.t) + '</span>';
      b.addEventListener('click', function () {
        if (settled) return;
        settled = true;
        b.setAttribute('aria-checked', 'true');
        optsEl.classList.add('answered');
        optsEl.querySelectorAll('.bl-option').forEach(function (o) { if (o !== b) o.disabled = true; });
        ctx.floatOpen();
        ctx.setCoachSay(esc(opt.reply));
        ctx.positionOrb(true);
        ctx.enableNext();
      });
      optsEl.appendChild(b);
    });
    LE.pickGroup(optsEl);
  }

  // ==========================================================================
  // ==========================================================================
  //  THE RECORD — eight objectives, each with the policy that governed it and
  //  where its evidence actually came from. D3 is deliberately still open.
  // ==========================================================================
  var RECORD_CONTENT =
    '<main class="ll-object" id="recordObject">' +
      '<p class="ll-eyebrow">Your results</p>' +
      '<h2 id="recHead">Here’s what you showed.</h2>' +
      '<p class="ll-sub">Eight things this module asked of you, and where each answer came from — not a tick for finishing.</p>' +
      '<div class="rec-groups" id="recList"></div>' +
      '<p class="res-basis" id="recBasis"></p>' +
    '</main>';
  // The learner's own record, in the learner's own words. Know / Feel / Do
  // survives as three plain headings and the row icon; the sub-level, the
  // theoretical construct and the assessment policy are gone from this screen —
  // they live in the step captions behind the footer "?" and in the Learning
  // Layer view, which is where a reviewer is looking for them anyway.
  var REC_GROUPS = [
    { head: 'What you know',   ids: ['K1', 'K2'] },
    { head: 'How you see it',  ids: ['F1', 'F2', 'F3'] },
    { head: 'What you did',    ids: ['D1', 'D2', 'D3'] }
  ];
  // The two Feel objectives asked before and after now report the MOVE rather
  // than the level, because the level on its own says more about the person
  // than about the module. `held` is not a failure and is not dressed up as
  // one — somebody who arrived agreeing had nowhere to go.
  var MOVE = {
    up:   { cls: 'up',   icon: 'fa-arrow-trend-up',   label: 'Moved up' },
    held: { cls: 'held', icon: 'fa-minus',            label: 'Held' },
    down: { cls: 'down', icon: 'fa-arrow-trend-down', label: 'Moved down' }
  };
  // F3's reportable figure is how far the learner's read of the room was from
  // the real, cited figure — norm misperception is that gap and nothing
  // else. It used to be moveChip(entry answer, "better or worse than that
  // figure"), which are different scales: a learner who said "Most do" and
  // then "About the same" against a 92.7% majority had agreed with themselves
  // twice and was filed as having moved DOWN.
  //  Graded against the real figure (92.7%, Gershon et al. 2000 — see
  //  DEBRIEF_STAT), not against a majority/not binary. The thresholds below
  //  predate that real figure, from when this was graded per sector against
  //  four different illustrative numbers (as low as 48%); kept as thresholds
  //  rather than collapsed to a flat 92.7% check so this still degrades
  //  correctly if the figure is ever revised. With today's number, "most" is
  //  always right and "half"/"hardly anyone" are always underestimates.
  function f3Read(f3, pct) {
    if (!f3) return null;
    if (f3 === 3) return pct >= 55 ? 'right' : 'better';           // said most
    if (f3 === 2) return pct >= 62 ? 'worse' : pct >= 45 ? 'right' : 'better';
    return pct < 30 ? 'right' : 'worse';                           // said hardly anyone
  }
  function f3Pct(d) { return (d && d.pct) || debriefRows()[0].pct; }
  // Item 14: the post leg re-asks the entry item, so the note reports what
  // they said the second time rather than a "where does your shift sit"
  // placement that no longer matches the question on screen.
  function f3Note(f3, d, pct) {
    var saidAgain = low(F3_WORDS[F3_KEYS[d.post]] || '');
    if (!f3) {
      return 'You saw the real figure and, asked again, said ' + saidAgain + '. ' +
             'There is no earlier reading to compare it against in this run.';
    }
    var r = f3Read(f3, pct);
    return 'Before the module started you read the room as \u201c' + F3_WORDS[F3_KEYS[f3]] + '\u201d, ' +
           'against an actual ' + pct + '%' +
           (r === 'right' ? '' : r === 'worse'
             ? ' \u2014 fewer people take the shortcut than you thought'
             : ' \u2014 more people take the shortcut than you thought') + '. ' +
           'Asked the same question again after seeing the number, you said ' + saidAgain + '.';
  }
  // The open answer, folded into F1's evidence line. The chain used to save a
  // `named` field and NOTHING ever read it — the one question in the module
  // whose answer is a specific human being went to a dead key. Plain text on
  // purpose: st[3] is escaped at render, so the learner's own words are safe
  // to pass through and must not carry markup.
  function namedNote(c) {
    var nm = c.downstream && c.downstream.named;
    return nm ? ' You also named the person downstream of you: \u201c' + nm + '\u201d.' : '';
  }
  function moveChip(before, after) {
    if (!before || !after) return '';
    var m = MOVE[after > before ? 'up' : after < before ? 'down' : 'held'];
    return '<span class="apt-mom ' + m.cls + '"><i class="fa-solid ' + m.icon + '" aria-hidden="true"></i>' +
      esc(m.label) + '</span>';
  }
  // Item 13: which carrier actually taught them, named in the record rather
  // than left as an internal field nobody surfaces.
  var MODALITY_LABEL = { video: 'a video', article: 'an article', tutor: 'a step-through' };
  // Item 13/D3: the shared scenario player's own additive write-back, read
  // here rather than assumed. Absent whenever the scenario has not run yet
  // (or hasn't reached its real debrief) — every caller below falls back to
  // the pre-item-13 generic line in that case, same as before this existed.
  var SCENARIO_TIER_WORD = { MISSED: 'missed', PARTIAL: 'landed partially', SOUND: 'landed sound',
                              BRIEF: 'kept it brief', REFLECTIVE: 'gave it real thought' };
  var SCENARIO_TIER_RANK = { MISSED: 0, PARTIAL: 1, SOUND: 2 };
  function scenarioBeats() {
    try {
      var raw = JSON.parse(sessionStorage.getItem('scenario-result:' + scenarioKey()) || 'null');
      if (!raw || !raw.beats) return null;
      var out = {};
      raw.beats.forEach(function (bt) { out[bt.id] = bt.tier; });
      return out;
    } catch (e) { return null; }
  }
  function recordInit(ctx) {
    var c = readCourse();
    var b = c.battery || {};
    var proven = batteryResult() === 'proven';
    var ctrl = c.controls || null;
    var beats = scenarioBeats();
    // Item 20/D8: reaching the record marks Module 4 mastered for the
    // composite shell (clara/bloodborne.html), the same "arriving here is
    // completion" convention this record screen already runs on. Additive
    // and namespaced under its own key — nothing else reads or writes
    // `bo-progress`, so this cannot collide with `sh-course`.
    try {
      var prevProgress = JSON.parse(sessionStorage.getItem('bo-progress') || 'null') || {};
      if (prevProgress.bo4 !== 'mastered') {
        prevProgress.bo4 = 'mastered';
        prevProgress.bo4At = Date.now();
        sessionStorage.setItem('bo-progress', JSON.stringify(prevProgress));
      }
    } catch (e) {}
    // [ status, band, where it came from, what happened, move-chip ]
    var state = {
      K1: proven
        ? ['Shown', 'band-exc', 'From the four questions',
           'You put the steps in the right order before the module even started.']
        : (c.remk1 && c.remk1.passed)
          ? ['Taught', 'band-ok', 'From the lesson, the quick check, and a second look',
             'Missed the first check, so the procedure came back a different way — passed on the second look, ' +
             (remk1Modality() === 'tutor' ? 'step by step' : 'in writing') + '.']
          : ['Taught', 'band-ok', 'From the lesson and the quick check',
             'Taught here as ' + (MODALITY_LABEL[c.procedure && c.procedure.modality] || 'a lesson') +
             ', then checked again straight afterwards.'],
      // Item 16: the harder cases are a permutation, not a re-quiz — proven
      // at the start, served harder, not re-scored.
      K2: k2TestUp()
        ? ['Shown', 'band-exc', 'From the case screens',
           'Proven at the start, so both cases served harder — not re-scored, since you had already shown you get this one. This one is never taken away, only made harder.']
        : ['Taught', 'band-ok', 'From the case screens',
           'Served in full. This one is never shortened, whatever you answer.'],
      F1: (c.chain && c.chain.post)
        ? ['Recorded', 'band-ok', 'Asked before and after the chain',
           'You said where you stood at the start, walked the chain to see where the decision lands, and answered the same question again.' +
           // Item 15: F1 is remediate — the downstream follow-up only runs
           // when the post answer stayed at Somewhat or below, so a strong
           // agreement here genuinely means no named-person question came up.
           (c.downstream ? namedNote(c)
             : ' You already agreed strongly, so the follow-up question about who is downstream of you never came up.'),
           moveChip(b.f1, c.chain.post)]
        : (c.chain && c.chain.walked)
          ? ['Rated only', 'band-warn', 'From your answer at the start',
             'You walked the chain but the second answer did not come up in this run, so there is nothing to compare.' + namedNote(c)]
          : ['Rated only', 'band-warn', 'From your answer at the start',
             'You said where you stood at the start. The chain did not come up in this run.' + namedNote(c)],
      F2: ctrl
        ? (ctrl.sampled === false
            // D6/item 15: ask + sampled — the choice is still real evidence
            // either way, the self-report on top of it just was not asked
            // of this sector this run.
            ? ['Shown', 'band-ok', 'From the budget choice',
               (ctrl.choice === 'boxes'
                 ? 'You put the money on containers rather than gloves — the control that removes the hazard instead of resisting it. '
                 : 'You put the money on gloves. ') +
               'Not asked of you this time — sampled across your cohort.']
            : [ctrl.choice === 'boxes' ? 'Shown' : 'Recorded',
               ctrl.choice === 'boxes' ? 'band-exc' : 'band-ok',
               'From the budget choice, then your own rating',
               ctrl.choice === 'boxes'
                 ? 'You put the money on containers rather than gloves — the control that removes the hazard instead of resisting it.'
                 : ctrl.agree >= 3
                   // The reason this objective is asked in two parts. A single
                   // agreement scale files this learner as fully on board.
                   ? 'Two answers that point different ways: you rated containers above PPE and then spent the budget on gloves. That gap is the finding, and it is a purchasing habit rather than a belief.'
                   : 'You put the money on gloves and rated it accordingly. Recorded as you gave it; the containers are the buy that stops the injury happening at all.'])
        : ['Not asked', 'band-warn', 'No answer in this run',
           'The budget choice did not come up, so there is nothing on this line. It is not counted as agreement.'],
      F3: (c.debrief && c.debrief.post)
        ? ['Recorded', 'band-ok', 'Your read at the start, checked against the real figure',
           f3Note(b.f3, c.debrief, f3Pct(c.debrief)),
           moveChip(b.f3, c.debrief.post)]
        : c.debrief
          ? ['Rated only', 'band-warn', 'From your answer at the start',
             'You gave your read of the room and saw the figures, but the second answer did not come up in this run.']
          : ['Rated only', 'band-warn', 'From your answer at the start',
             'You gave your read of the room. The figures did not come up in this run.'],
      // Both of these are shown on the scenario's own page now. D6: beat ids
      // changed with the rebuild (decision / execution / container / close,
      // was decision / pressure / container / transfer) \u2014 read from the
      // shared player's own write-back (item 13) rather than asserted the
      // same for every run regardless of what actually happened. `close` is
      // sentiment only, not a KFD objective per K&A's script, so it has no
      // row of its own here.
      D1: (beats && beats.decision)
        ? ['Shown', SCENARIO_TIER_RANK[beats.decision] === 0 ? 'band-warn' : 'band-ok',
           'From the scenario',
           'The decision beat ' + SCENARIO_TIER_WORD[beats.decision] + ' \u2014 what you did with the hazard the moment you were pulled away.']
        : ['In the scenario', 'band-ok', 'From the scenario',
           'Shown where you actually did it, with a real interruption rather than a button on a page. The scenario\u2019s own debrief carries what happened.'],
      D2: (beats && (beats.execution || beats.container))
        ? ['Shown', SCENARIO_TIER_RANK[beats.execution] === 0 || SCENARIO_TIER_RANK[beats.container] === 0 ? 'band-warn' : 'band-ok', 'From the scenario',
           'The walk-through beat ' + (SCENARIO_TIER_WORD[beats.execution] || 'did not come up') +
           ', and the container beat ' + (SCENARIO_TIER_WORD[beats.container] || 'did not come up') +
           ' \u2014 the container above its fill line, which is the part no list of options can ask you.']
        : ['In the scenario', 'band-ok', 'From the scenario',
           'Same place \u2014 including the container that was above its fill line, which is the part no list of options can ask you.'],
      // D12: dropped the "check after the course" reference on both branches
      // \u2014 no such check is scheduled by anything this module does, so the
      // row should not promise one. D3 stays open either way; the written
      // plan is the artifact this run actually has.
      D3: (c.sustain && c.sustain.route)
        ? ['Committed', 'band-ok', 'From the plan you wrote',
           'You named ' + esc(low(c.sustain.cond)) + ' as the shift most likely to break it, and said the container is ' +
           esc(c.sustain.route) + '. Still open \u2014 nothing today can show whether it held. The plan itself is the record.']
        : ['Open', 'band-warn', 'No plan written in this run',
           'Nothing you did today can answer this one, and no plan was written either. It stays open, with nothing on ' +
           'your record to show either way.']
    };
    // Item 13: the count is computed, not asserted. D3 (Sustain) is excluded
    // from it outright rather than status-matched — it structurally cannot
    // close in one sitting (nothing today can show whether a commitment
    // held), even on a run where the learner filled it in and its own row
    // reads "Committed". The other nine landing anywhere but "answered"
    // means the learner reached this screen before finishing the rest of
    // the module (a deep link, mostly a review convenience) — the old fixed
    // "seven here, two in the scenario, nine of ten" claimed the same count
    // regardless.
    var UNRESOLVED = { 'Not asked': 1, 'Open': 1 };
    var NUM_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var closable = Object.keys(state).filter(function (id) { return id !== 'D3'; });
    var answered = closable.filter(function (id) { return !UNRESOLVED[state[id][0]]; }).length;
    document.getElementById('recList').innerHTML = REC_GROUPS.map(function (g) {
      return '<h3 class="rec-head">' + esc(g.head) + '</h3>' +
        '<ul class="apt-list">' + g.ids.map(function (id) {
          var o = obj(id), st = state[id];
          return '<li class="apt-row">' +
            '<span class="apt-ico"><i class="fa-solid ' +
              (o.domain === 'Know' ? 'fa-book-open' : o.domain === 'Feel' ? 'fa-heart' : 'fa-bolt') + '" aria-hidden="true"></i></span>' +
            '<div class="apt-main">' +
              '<div class="apt-head"><h4>' + esc(o.name) + '</h4>' + (st[4] || '') + '</div>' +
              '<div class="apt-bands"><span class="band ' + st[1] + '">' + esc(st[0]) + '</span>' +
                '<span class="rec-src">' + esc(st[2]) + '</span></div>' +
              '<p class="apt-evidence">' + esc(st[3]) + '</p>' +
            '</div>' +
          '</li>';
        }).join('') + '</ul>';
    }).join('');
    document.getElementById('recBasis').innerHTML =
      '<i class="fa-solid fa-circle-info"></i> Every line points at a moment rather than a tick for finishing ' +
      'anything. ' + NUM_WORD[answered].charAt(0).toUpperCase() + NUM_WORD[answered].slice(1) +
      ' of the ' + NUM_WORD[closable.length] + ' that can close are answered, and ' +
      '<b>the last one stays open on purpose</b> — nothing a module does in one sitting can tell you what you ' +
      'keep doing afterwards.';
    // Silent on the path-change opener in three of the four cases — proving
    // the procedure or testing up on K2 is already visible in the bands
    // below, and CLARA restating it read as a fourth voice for one fact.
    // The one case that keeps a line is the plain one: nothing moved, and
    // nothing on screen already says so.
    var movedLine = (proven || k2TestUp())
      ? ''
      : 'Based on the initial assessment, nothing about your path changed.';
    // The count is stated once, in recBasis above — CLARA repeating the same
    // number would be a second voice for one line. Her opening says what the
    // caption cannot: the one thing that actually moved on this run.
    typeFeedback(ctx, [
      movedLine,
      'Ask me about any line and I will tell you where it came from.'
    ].filter(Boolean));
    wireChat(ctx, [
      'That one came from the four questions at the start. Get those right and you skip the section that teaches it — which is the only place answering well buys you anything.',
      'Spotting unsafe conditions is named in the regulation, so it is never taken away. A strong answer makes it harder instead.',
      'The budget question is recorded and passed on without changing your path — what you chose, and how you rated it afterwards. Those are two different things and I keep them apart.',
      'The last line is your own plan, not a score. Whether it held stays open — nothing today can show that, one way or the other.'
    ]);
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  BATTERY-BEFORE ONLY: two screens ahead of the pre-check. Neither is a
  //  real learner-facing beat outside the Demo menu's "Battery before"
  //  toggle — spliced onto the front of STEPS below, never part of the
  //  base array. See batteryOrderBefore() and the splice near the bottom.
  //
  //  PRIORMOD sells the premise: the pre-check has to feel like it is
  //  running after something, not opening the module cold, so this is a
  //  stand-in "you just finished Module 3" screen — same course chrome,
  //  a different (invented) lesson. LOADING then sells the jump into THIS
  //  module as a real transition rather than a cut, and hands off to
  //  'battery' on its own after a beat, no click required.
  // ==========================================================================
  var PRIORMOD_CONTENT =
    '<main class="ll-object">' +
      '<div class="pm-page">' +
        '<div class="pm-badge"><i class="fa-solid fa-check" aria-hidden="true"></i></div>' +
        '<p class="ll-eyebrow">Bloodborne Pathogens · Module 3 of 6</p>' +
        '<h1>Personal Protective Equipment</h1>' +
        '<p class="pm-sub">Module complete.</p>' +
        '<div class="pm-stats">' +
          '<div class="pm-stat"><span class="pm-stat-val">100%</span><span class="pm-stat-lbl">Final check</span></div>' +
          '<div class="pm-stat"><span class="pm-stat-val">6 min</span><span class="pm-stat-lbl">Time spent</span></div>' +
        '</div>' +
      '</div>' +
    '</main>';

  var LOADING_CONTENT =
    '<main class="ll-object">' +
      '<div class="ld-page">' +
        '<div class="ld-spinner" aria-hidden="true"></div>' +
        '<p class="ll-eyebrow">Next up: Contain the Sharp</p>' +
        '<p class="ld-label">Checking what you already know…</p>' +
      '</div>' +
    '</main>';

  function batteryLoadingInit(ctx) {
    // No click required — a load screen a learner has to dismiss isn't
    // selling a transition, it's just another step. LE.goTo, not ctx.go:
    // this step has no engine-exposed nav helper of its own, and the id
    // it names never changes regardless of what runs before it.
    setTimeout(function () { LE.goTo('battery'); }, T(1400));
  }

  var PRIORMOD_STEP = {
    id: 'priorModule', icon: 'fa-clipboard-check', lesson: 'Personal Protective Equipment',
    mode: 'floating', noCoach: true, interstitial: true,
    caption: { title: 'DEMO · Simulated prior module', note: 'Battery-before only. A stand-in "Module 3 complete" screen — invented, never authored content — so the pre-check has something believable to follow instead of opening the module cold. Reuses this course’s own chrome rather than looking like a different product.' },
    content: PRIORMOD_CONTENT
  };
  var BATTERYLOADING_STEP = {
    id: 'batteryLoading', icon: 'fa-spinner', lesson: 'Progress assessment',
    mode: 'floating', noCoach: true, interstitial: true,
    caption: { title: 'DEMO · Transition into the pre-check', note: 'Battery-before only. A brief loader between the simulated prior module and the real pre-check; advances itself after a beat (batteryLoadingInit) — nothing for a learner to click through.' },
    content: LOADING_CONTENT, init: batteryLoadingInit
  };

  // ==========================================================================
  //  THE PATH. Entry → Learn → Check → Perform → Record, with the assessment
  //  policy deciding what is here at all.
  // ==========================================================================
  var STEPS = [
    { id: 'intro', mode: 'floating', lesson: 'Welcome', cover: true, nextLabel: 'Start module',
      caption: { title: 'Course title page', note: 'Module 4 of six behavioral outcomes decomposed from Bloodborne Pathogens (RVCT-303B). The list below now renders the course’s sibling modules rather than Sharps’ own sections — Sharps is the only row wired to real content, and carries its own Resume/Start-over state.' },
      // Silent. The line here narrated the cover back to the learner \u2014 the
      // sections, the runtime, the exposure plan \u2014 all three of which are on
      // the page in larger type, and "ask me anything" is what the orb's own
      // cue already says. Nothing behind the dot means no dot.
      coach: { say: '' },
      content: INTRO_CONTENT, init: introInit },

    { id: 'battery', icon: 'fa-list-check', mins: 1, stage: 'Entry', lesson: 'Progress assessment', mode: 'floating', gate: true,
      // No CLARA on this screen, in either entry-sequencing mode: a rapid-
      // fire stack of four quick questions has no room for a reaction
      // between one and the next, so it runs as a plain one-click battery
      // instead — select, confirm, next question loads (see batteryInit).
      noCoach: true,
      caption: { title: 'ENTRY · Pre-module battery', note: 'Four items: two gate-flagged Know and two remediate-flagged Feel. NEVER a Do objective — a question cannot credibly measure behavior. The policy chip above each item shows which rule put it here. K1 clean sweep = test-out; K2 (recognition, content-locked) sets its own test-up from its own item — neither derives from the other. D12: K1’s test-out shortcut ships live as built. The compliance question K&A’s script raises — whether 1910.1030(g)(2)(vii)(E)/(F) actually locks this content — is unconfirmed either way, not resolved in K1’s favor; if compliance later rules it locked, this item’s `policy`/`locked` fields are the only thing that needs to change.' },
      content: BATTERY_CONTENT, init: batteryInit,
      onSkip: function () { saveResult('battery', { k1: 'unproven', skipped: true }); } },

    { id: 'adjust', icon: 'fa-diagram-project', mins: 1, stage: 'Entry', lesson: 'Your Updated Path', mode: 'crown', gate: true, interstitial: true,
      when: adjustMoved,
      caption: { title: 'ENTRY · Knowledge Layer', note: 'Two different moves in one screen, which is the point: a beat REMOVED (test-out) and a beat made HARDER (content-locked → test-up). Compression is only one of the things an assessment policy can do. It reported a THIRD — a beat added on a low Feel score — and that row is gone: the beat it named (“The One That Landed”) runs for every learner on every path, so the screen was telling a learner their answer had changed something it had not. Both Feel items now set a baseline and route nothing, which means only the two Know items can move the path and this screen appears only when the procedure was proven. Runs ONLY when something actually fired: a learner whose answers moved nothing never sees it, because a page reporting that nothing happened is a non-event, and it would land as an EXTRA screen on the path that is already longer. Presenter control: Demo → Battery result; flipping to a result that moves nothing advances past this screen, which is itself the demonstration.' },
      coach: { say: '' },
      content: ADJUST_CONTENT, init: adjustInit },

    { id: 'chain', icon: 'fa-hand-pointer', mins: 3, stage: 'Learn', lesson: 'Why Disposal Shortcuts Are Risky', mode: 'floating', gate: true,
      caption: { title: 'LEARN · The chain (F1, Feel / Believe)', note: 'The module\u2019s first content screen, and the ordering is the argument: consequence before rule. D9: Feel leads Know here on purpose, departing from the doc\u2019s conventional Know \u2192 Feel \u2192 Do \u2014 the procedure is not yet taught, and the case for needing it has to land before the rule does, or the rule is just an instruction to follow. The procedure used to be taught at position five with the consequence arriving at position ten, which spends the only moment a learner is receptive. Nodes revealed one tap at a time, earlier ones dimmed rather than removed, a clock on each and the elapsed gap named on the connector between them \u2014 the learner advancing the consequence is a different act from watching it advance, and only the first constructs the belief rather than asserting it. THE DECISION IS REAL: the eyebrow always promised one and there was none, because the shortcut was narrated FOR the learner in a subjectless fragment (\u201cInto the bag on the rail.\u201d) and the final node then held them responsible for it \u2014 so a reader could not tell whether they had done it, watched it, or were being accused of it. The setup now stops at the choice. A learner who picks the container still sees the whole chain, under a header naming it as the route they did NOT take, which is a different act from being told they caused it. The injury also happens on screen now: every sector set up the hazard and then reported bloodwork with no puncture in between, leaving the one event the screen exists to deliver to inference. The downstream worker gets a node introducing who they are and why they cannot know, and the stick gets its own. This objective was previously served by a statement on a slide, here and in the re-composed course, which is the failure the spec\u2019s own rule names. Each sector walks its own incident, drawn from that sector\u2019s list of what counts as a sharp and deliberately NOT the one its cases and its first-person account use. The open prompt is scored for one thing and not by a model: whether a specific person downstream now has a name. Ungated \u2014 only Know gates in this module.' },
      // hint:false \u2014 each node is a few sentences to read between taps, and a
      // reader who pauses on one past 7s should not be interrupted mid-brief.
      coach: { say: 'Loading\u2026', hint: false },
      content: CHAIN_CONTENT, init: chainInit,
      onSkip: function () { saveResult('chain', { walked: false, named: null }); } },

    { id: 'hazard', icon: 'fa-photo-film', mins: 4, stage: 'Learn', lesson: 'Why Sharps Are Dangerous', mode: 'floating', gate: true,
      caption: { title: 'LEARN · The premise (ungated)', note: 'Alignment brief D1: this used to be K2’s own teaching beat, gated, with an in-flow check and a test-up permutation. The mechanism content — what a sharp is, that a used one keeps a trace of blood, what that trace can carry — is no longer a tracked objective, so it now runs as plain narration, identical for every learner, matching K&A’s Manufacturing script (this content runs ahead of Case 1 with no check at all). Delivered as ONE screen because it is one chain of reasoning: trace → route → what it carries. The clip supplied for this beat was the course’s “Controls and Prevention” section video — 9 min 31 s and 145 MB, which is over GitHub’s per-file ceiling and was the largest single line item in the module. It is now cut to the one stretch that shows a sharp being handled at all (3:48–6:00, 2 min 12 s): the engineering-versus-administrative controls comparison and a syringe going into a red container. Worth knowing what that footage is and is not — it shows DISPOSAL, which is K1’s subject and the budget beat’s argument, and it does NOT teach this beat’s mechanism, because nothing in the source does. So the written chain runs ALONGSIDE it rather than as its fallback. Anything over 25 MB still STREAMS rather than being fetched whole to a blob, and the eyebrow reports the clip’s real duration read off the file rather than a typed-in estimate.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in hazardInit raises CLARA by itself.
      coach: { say: '' },
      content: HAZARD_CONTENT, init: hazardInit,
      onSkip: function () { saveResult('hazard', { skipped: true }); } },

    { id: 'procedure', icon: 'fa-shapes', mins: 4, stage: 'Learn', lesson: 'Safe Handling, Step by Step', mode: 'floating', gate: true, adaptive: true,
      when: function () { return batteryResult() !== 'proven'; },
      caption: { title: 'LEARN · The procedure (K1, taught)', note: 'The instruction the adjustment screen has always promised and the module never contained. K1 is a mandated four-step sequence — there is nothing to reason toward, so it is TAUGHT before it is practised; K2 is discoverable, so it keeps the case ladder. Structure declared per objective, the way policy already is. Dropped whole on test-out, alongside its case. This is also the module’s only modality-varying beat, and item 26 exposed the Watch/Read/Step-through choice to the learner directly (same in-place swap as the hazard beat) rather than leaving it behind a reviewer-only Demo control. Podcast is DECLINED rather than rendered — under a minute of instruction is a clip, not an episode. Audio’s honest unit is the COURSE, six modules assembled into one listen, which is Assembly and not Transformation — the decline banner is still there to check, just behind review mode rather than a learner-visible button. Nothing on the learner’s side of this beat names an objective, a policy or a capability; that vocabulary lives here and in the Learning Layer view.' },
      // hint:false — a step list read at a still mouse should not be
      // interrupted at 7s.
      coach: { say: 'Loading…', hint: false },
      content: PROCEDURE_CONTENT, init: procedureInit,
      onSkip: function () { saveResult('procedure', { skipped: true }); } },

    { id: 'case1', icon: 'fa-clipboard-question', mins: 1, stage: 'Learn', lesson: 'A Sharp Set Down', mode: 'floating', gate: true, adaptive: true,
      when: function () { return batteryResult() !== 'proven'; },
      caption: { title: 'LEARN · Case 1 (K1)', note: 'The procedure case. Compressed out when the battery proved K1 — the only beat in the module that test-out can remove, and only because the simulation re-verifies it performatively.' },
      // Item 27/A2: the opener ("read it and tell me what the actual failure
      // is") sets how to read the scene below it — tucked behind the unread
      // dot, a learner could answer the case without ever seeing it.
      coach: { say: 'Loading…', lead: true },
      content: caseContent(CASE1), init: caseInit(CASE1),
      onSkip: function () { saveResult('case1', { skipped: true }); } },

    { id: 'inflow', icon: 'fa-circle-dot', mins: 1, stage: 'Learn', lesson: 'Planning the Route', mode: 'floating', gate: true, adaptive: true,
      // Item 12: the pre-battery proof stands. K1 tested out — proven once,
      // performatively, in the battery's ordering task — used to be checked
      // again here regardless, which is the doc's rule broken twice over:
      // K1 was verified twice, and the "checked again straight afterwards"
      // record line (see recordInit) described a check that never ran for
      // that learner.
      when: function () { return batteryResult() !== 'proven'; },
      caption: { title: 'LEARN · In-flow check (K1)', note: 'Only for a learner who did NOT test out — the pre-battery proof stands (item 12), where it used to run for everyone regardless and re-check a learner the battery had already proven. Two attempts, a bank of two items (D4 — the battery’s old "never acceptable" item moved here); a second miss closes the item outright rather than reframing (item 11): the correct option is marked, the set disables, and the answer is stated.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in inflowInit raises CLARA by itself.
      coach: { say: '' },
      content: INFLOW_CONTENT, init: inflowInit },

    { id: 'case2', icon: 'fa-clipboard-question', mins: 1, stage: 'Learn', lesson: 'Past the Fill Line', mode: 'floating', gate: true, adaptive: true,
      caption: { title: 'LEARN · Case 2 (K2, content-locked)', note: 'Never removed. On test-up the three options are replaced with genuinely arguable ones — the same objective, served harder. 1910.1030(g)(2)(vii)(E): recognition is sector-specific, so a generic pass does not satisfy it. The fill-line specifics in each sector’s scene (three-quarters up the container, packed past a stamped or molded line) are invented for the prototype rather than pulled from a customer’s exposure control plan — chosen because three-quarters full is the common manufacturer convention for a sharps container’s fill line, not a fabricated fraction. A real deployment swaps these for the customer’s own container spec; the correct answer deliberately never states a number (“set by your site’s plan, not by eye”) so the lesson survives that swap unchanged.' },
      // Item 27/A2: same reasoning as case 1 — "this one is about the
      // container, not the sharp" is the posture for the scene, not a
      // reaction to anything the learner does.
      coach: { say: 'Loading…', lead: true },
      content: caseContent(CASE2), init: caseInit(CASE2) },

    { id: 'case3', icon: 'fa-clipboard-question', mins: 1, stage: 'Learn', lesson: 'Left by Someone Else', mode: 'floating', gate: true, adaptive: true,
      caption: { title: 'LEARN · Case 3 (K2)', note: 'The second half of the locked objective: recognizing a condition you did not create. Independent of the other cases — this is what makes Option B compressible without editorial repair.' },
      coach: { say: 'Loading…', lead: true },
      content: caseContent(CASE3), init: caseInit(CASE3) },

    { id: 'controls', icon: 'fa-clipboard-question', mins: 1, stage: 'Learn', lesson: 'Gloves or Containers', mode: 'floating', gate: true,
      caption: { title: 'LEARN · The budget choice (F2, Feel / Value)', note: 'The beat that used to not exist. The record has always printed a line for this objective reading “Recorded · from your own answer”, and nothing in the module ever asked it — an invented line on the one screen whose entire argument is that every line points at a real moment. The scenario is the re-composed course’s own: gloves for every waste handler, or more containers. Their version assesses it with an agreement scale on an empirical claim, which measures knowledge and files it as a value; this splits the two, so the CHOICE is the evidence and the scale afterwards is the self-report. A learner who buys gloves and then rates high on “controls prevent injuries” has told us something one scale never could. Placed AFTER the account because all four sector accounts end with a needle going through a glove — the story earns the question.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in controlsInit raises CLARA by itself.
      coach: { say: '' },
      content: CONTROLS_CONTENT, init: controlsInit,
      onSkip: function () { saveResult('controls', { skipped: true }); } },

    { id: 'downstream', icon: 'fa-pen-to-square', mins: 1, stage: 'Learn', lesson: 'Who Handles Your Waste', mode: 'floating', gate: true,
      // Item 15/D6: F1's remediation, not a screen every learner meets.
      // Alignment brief D4: the F1 post-rating moved from the retired case4
      // onto chain, much earlier in the flow — this still fires off that
      // same signal, just read from 'chain' now instead of 'case4'. Fires
      // only when the post answer stayed at Somewhat or below — a learner
      // who already agreed strongly doesn't need the belief reinforced a
      // second time. Defaults to running when chain's post hasn't resolved
      // yet (undefined), so it is never silently dropped by a run that
      // reaches this step out of order.
      when: function () { var p = (readCourse().chain || {}).post; return p == null || p <= 2; },
      caption: { title: 'LEARN · Who is downstream (F1 remediation, Feel / Believe)', note: 'F1 is remediate (D6): this only runs when chain’s post answer stayed at Somewhat or below — a learner who already agreed strongly does not need the belief reinforced a second time. One open question, on its own screen. Scored for one thing and NOT by a model — whether a specific person downstream has a name. That is F1 operationalised; an agreement scale on the same idea has a ceiling nobody falls below. D4: previously placed for adjacency to the now-retired case4 account; that reasoning no longer applies since F1’s post-ask moved to chain, much earlier — left in its current position for this round rather than restructuring the debrief/walk sequence around it, so the gap between the ask and its remediation is wider than before. Worth revisiting. The answer reaches the record.' },
      coach: { say: 'Loading…' },
      content: DOWN_CONTENT, init: downInit,
      onSkip: function () { saveResult('downstream', { named: null }); } },

    { id: 'debrief', icon: 'fa-square-poll-vertical', mins: 1, stage: 'Learn', lesson: 'What Your Shift Does', mode: 'floating', gate: true,
      caption: { title: 'LEARN · Cohort debrief (F3)', note: 'The norm correction, and the POST leg of a Pre + post objective — the entry battery asked for their read of the room, and this asks them to place their own shift against a figure they now have, so the reportable number is the movement rather than either level. 2026-09-21: figures are now REAL, cited data — both final K&A scripts (Manufacturing and Law Enforcement) quote the same figure, Gershon et al. (2000), a U.S. study of sharps-disposal compliance (92.7% always use the container). That source reports one aggregate rate, not a three-way breakdown, so the original three illustrative per-sector bands (most/half/few, as low as 48% for one sector) collapsed to the two the citation actually supports — always, or not — and the figure is no longer sector-lensed, since the citation is one national number. Sub-splitting "not" into fake half/few bands to keep three rows would be fabricating what the study never measured. The full citation renders in the learner-facing disclaimer now, in place of the old "illustrative figures for [sector]" line — it is real, so there is nothing left to caveat.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in debriefInit raises CLARA by itself.
      coach: { say: '' },
      content: DEBRIEF_CONTENT, init: debriefInit },

    { id: 'remk1', icon: 'fa-rotate-left', mins: 2, stage: 'Learn', lesson: 'Another Look: The Procedure', mode: 'floating', gate: true,
      when: function () { var c = readCourse(); return !!(c.inflow && c.inflow.passed === false); },
      caption: { title: 'LEARN · Remediation (K1, gate)', note: 'D2/item 10. K1 gates, so failing the in-flow check does not get to stand: this re-teaches the procedure in whichever modality the learner was not taught in (a different carrier, not a repeat), then asks a fresh item from a 2-item bank. Loops — a new bank item on every miss — until passed, since a gate has no give-up path. Runs only when inflow.passed === false; a learner who passed on the first two tries never sees it.' },
      content: REMK1_CONTENT, init: remk1Init },

    { id: 'walk', icon: 'fa-sliders', mins: 1, stage: 'Learn', lesson: 'When You Are Behind', mode: 'floating', gate: true,
      // Alignment brief D1: F4 (the self-efficacy rating this screen used to
      // open with) is cut, so it now arrives silent and opens directly on the
      // D3 (Sustain) plan — same pattern as hazard/controls/debrief.
      caption: { title: 'LEARN · Planning the walk (D3, Do / Sustain)', note: 'The objective the module had no screen for. Placed immediately before the simulation on purpose: an if-then plan written here, then tested for real a few screens later, is the closest a one-sitting module gets to evidencing maintenance. Policy: none — recorded, never gates, never routes. Two parts, reinforced in sequence: which shift is riskiest, then the plan itself in the learner’s own words.' },
      coach: { say: '' },
      content: WALK_CONTENT, init: walkInit },

    { id: 'handoff', icon: 'fa-comments', mins: 5, stage: 'Perform', lesson: 'The Unclaimed Hazard', mode: 'floating',
      nextLabel: 'Enter the scenario',
      caption: { title: 'PERFORM · The bridge into the scenario (D11)', note: 'Item 31. This screen frames the moment before the one CTA that means it. The player is told to skip its own establishing card in turn (see enact’s ?handoff=1) — showing it too would be a third framing of the same moment in a row.' },
      // Silent — the screen states its own purpose in its own copy; there is
      // nothing here for CLARA to react to before the learner has done
      // anything.
      coach: { say: '' },
      content: HANDOFF_CONTENT, init: handoffInit },

    { id: 'enact', icon: 'fa-comments', stage: 'Perform', lesson: 'The Unclaimed Hazard — Live Scenario',
      // Never mattered while this step only ever redirected externally —
      // D10's baseline content is the first time `enact` actually mounts
      // CLARA's chrome, and it needs a mode to do that (same as handoff's).
      mode: 'floating',
      // No `mins` here — the 5 minutes this activity takes is now carried by
      // the handoff step above (the one a learner and pathMinutes() both see);
      // this step never renders, so double-counting both would overstate the
      // course's total runtime by 5 minutes.
      // Not a section a learner ever sees — it hands off to another page in
      // the same tick showStep() reaches it (see the engine's `step.external`
      // branch). The handoff screen just above is the real, numbered section;
      // counting this one too would inflate "Section N of total" for a step
      // nobody looks at, the same reason `adjust` carries this flag. Still
      // true with D10's toggle on: the in-page baseline below stays
      // uncounted too, since it exists only for a reviewer to demonstrate.
      interstitial: true,
      // D10: a function, not a fixed string — checked fresh on every visit so
      // the Demo menu's "Do-object baseline" toggle (set on the handoff
      // screen above) takes effect without a reload. Live is the only path a
      // learner ever takes; a falsy return here falls through to this step's
      // own content/init below (see the engine's showStep). §6.3: the
      // scenario key is sector-derived (scenarioKey()), not fixed to
      // Manufacturing's own — each sector runs its own scenario now.
      external: function () {
        return doBaselineOn() ? null
          : '../../../../scenario-simulator/composed-scenarios/index.html'
            + '?type=mix-arc&scenario=' + scenarioKey() + '&handoff=1&brand=clara'
            + '&back=' + encodeURIComponent('../../lesson-presentation/experiments/sharps-riffs/00-sharps-module/index.html?step=record');
      },
      gate: true,
      content: DOBASELINE_CONTENT, init: doBaselineInit,
      caption: { title: 'PERFORM · The culminating activity, four beats (D1/D2)', note: 'Alignment brief D6: rebuilt from a version keyed end-of-shift-sharps that re-staged chain’s own Chris/Jacob incident as the final exam — a redundancy, since the learner had already resolved that exact dilemma once. This version matches K&A’s script: an unclaimed blade, no character to negotiate with. Four coach-led beats, not roleplay — nobody is in the scene to react, only a decision (D1), a step-by-step description (D2), a complication testing Recovery (D2), and a closing sentiment question that is explicitly not a KFD objective and carries no Record row. Runs on its OWN page, so its rubric evidence lives in its debrief rather than on the record screen below; this beat is where both Do objectives are evidenced now. §6.3: Education, AEC and Public sector each run their own sector-authored scenario now (scenarioKey()), not Manufacturing’s. D10: the Demo menu’s "Do-object baseline" toggle swaps this for an in-page video plus one stand-in question — the PRD’s literal Do-object ask, reviewer-only and never on a learner’s path.' },
      coach: { say: '' } },
    { id: 'record', icon: 'fa-chart-simple', mins: 1, stage: 'Record', lesson: 'Your Record', mode: 'sidebar',
      caption: { title: 'RECORD · Objective-level record', note: 'Eight objectives, each with the policy that governed it and where its evidence came from. Seven closed, one deliberately open — objective-level performance data from day one, which is what turns provenance into evidence without re-authoring anything. The learner’s view of this screen carries none of that vocabulary: Know / Feel / Do survives as three plain headings and the row icon, and the sub-level, theoretical construct and assessment policy live here and in the Learning Layer view.' },
      coach: { say: '', ask: 'Ask CLARA about your record…' },
      content: RECORD_CONTENT, init: recordInit }
  ];

  // ==========================================================================
  //  Entry sequencing (Demo menu: "Battery timing"). Default order is
  //  Cover → Pre-check → Updated path → the rest — the array above, as
  //  authored. "Battery before" moves the cover to AFTER the pre-check and
  //  its path-adjustment screen instead: Pre-check → Updated path → Cover →
  //  the rest. Splicing here rather than re-authoring the array keeps one
  //  source of truth for both orders, and every position-based mechanic in
  //  the engine (section numbering, back-button disable, the resume banner)
  //  already reads off the array's actual order rather than fixed ids, so
  //  moving the cover is enough — nothing else needs to know which mode ran.
  // ==========================================================================
  if (batteryOrderBefore()) {
    var introAt = STEPS.findIndex(function (s) { return s.id === 'intro'; });
    var introStep = STEPS.splice(introAt, 1)[0];
    var afterAdjust = STEPS.findIndex(function (s) { return s.id === 'adjust'; }) + 1;
    STEPS.splice(afterAdjust, 0, introStep);

    // CLARA hasn't been met yet — that's still the cover's job, and the
    // cover now runs AFTER these two. Battery is noCoach unconditionally
    // (see its STEPS entry); adjust only needs it here, since in the
    // default order it follows the cover and CLARA is already around by
    // then. hideProgress blanks battery's own "Section N of N" + bar, since
    // there's no course open yet for that count to mean anything (adjust
    // needs no such flag — interstitial already blanks its footer normally).
    var bStep = STEPS[STEPS.findIndex(function (s) { return s.id === 'battery'; })];
    bStep.hideProgress = true;
    var aStep = STEPS[STEPS.findIndex(function (s) { return s.id === 'adjust'; })];
    aStep.noCoach = true;

    // The simulated prior module + its loader run BEFORE all of the above —
    // 'battery' is index 0 at this point, so the front of the array is
    // exactly where they belong.
    STEPS.splice(0, 0, PRIORMOD_STEP, BATTERYLOADING_STEP);
  }

  // ==========================================================================
  //  D11: URL-prefillable launch params — role (sector), name, media (format).
  //  A stamped link (an LMS enrollment, a shared demo link) can hand the
  //  learner a pre-set context without them touching anything on arrival.
  //  Seeds the SAME session values the in-module pickers already read and
  //  write (ll-lens, sh-modality, sh-name) rather than a second, competing
  //  source of truth — an in-module change afterward still wins over this.
  // ==========================================================================
  (function applyLaunchParams() {
    var p;
    try { p = new URLSearchParams(location.search); } catch (e) { return; }
    var role = p.get('role');
    if (role && LENSES[role]) { try { sessionStorage.setItem('ll-lens', role); } catch (e) {} }
    var media = p.get('media');
    // Podcast is declined at module level (item 26) — not a valid launch
    // value either, the same reason it is hidden from the picker itself.
    if (media && MODALITY_ORDER.slice(0, 3).indexOf(media) > -1) {
      try { sessionStorage.setItem('sh-modality', media); } catch (e) {}
    }
    var name = p.get('name');
    if (name) { try { sessionStorage.setItem('sh-name', name.trim().slice(0, 40)); } catch (e) {} }
  })();

  // ==========================================================================
  //  Hand it to the engine.
  // ==========================================================================
  LE.register({
    course: COURSE,
    steps: STEPS,
    storageKey: 'sh-course-riff00',
    // The <head> boot snippet already applied the right html classes before
    // paint (see applyStyleMode); this is what syncs the orb's own colours
    // to match on a page that loaded straight into Vector-light, since
    // buildOrb() itself always starts from MobiusOrb's plain default.
    onOrbReady: function () { applyStyleMode(styleMode()); },
    // CLARA no longer speaks on arrival — the default is the unread dot, and
    // only two beats declare coach.lead. This is the other half: if a screen
    // is WAITING on the learner and they have not touched anything, that line
    // comes up by itself as a hint. Once per screen, never after the learner
    // has dismissed it, and never on a screen with nothing pending.
    coachHint: { delay: 7000 },
    // The S-key skip and the Demo menu's Review mode toggle are opt-in per
    // course — see CFG.reviewGate in the engine. Sharps asks for both; the
    // video Skip pill (this file's own videoFrame/mountVideo) reads
    // LE.reviewMode() directly and needs no engine-side gate.
    reviewGate: true,
    lenses: LENSES,
    lensOrder: LENS_ORDER,
    // Every beat with a scene in it moves with the sector.
    // Every screen with a scene in it moves with the sector. The chain walks
    // its own incident per sector; the rating screen borrows that chain's clock.
    lensedSteps: { intro: 1, chain: 1, hazard: 1, case1: 1, case2: 1, case3: 1,
                   controls: 1, debrief: 1, walk: 1 },
    replies: [
      'Short version: the sharp should never exist outside a container for longer than it takes to walk there. Decide the route before you start.',
      'Five things are absolute: a used needle is never bent, broken, recapped, removed, or separated from its syringe.',
      'A container is an engineering control. Past the limit your site’s plan sets, it stops containing — so sealing it and walking is always better than one more.',
      'I’m recording what each answer showed, not a score — your administrator sees the same chain you do.'
    ],
    // Item 26: the Modality control that used to live here is retired — the
    // procedure beat's Watch/Read/Step-through picker is a learner-facing
    // control now (procedureInit), the same as the hazard beat's, and needs
    // no reviewer-only cycle to reach it.
    demoControls: [{
      id: 'shImagesBtn', icon: 'fa-image', name: 'Show visuals',
      note: 'Whether a beat carries art is a derivation decision, not a property of the beat',
      visibleOn: function (step) { return !!IMAGE_STEPS[step.id]; },
      type: 'toggle', on: imagesOn,
      onClick: function (api) {
        try { sessionStorage.setItem('sh-images', imagesOn() ? 'off' : 'on'); } catch (e) {}
        api.replay();
      }
    }, {
      // A one-click switch, not a toggle SWITCH WIDGET — the state pill
      // names the OTHER order (the one a click lands you on), not an
      // on/off reading of the current one. Visible on priorModule/
      // batteryLoading too: those only exist mid-preview, and without this
      // row reachable there, "Try it" was a one-way door — see item on
      // 2026-09-22. Reorders the array itself (see the splice right after
      // STEPS above), so it needs a fresh boot rather than a replay/refresh
      // — same treatment as Start Over, which is why this reload also
      // clears the run's progress keys: landing on a re-sequenced path
      // holding answers recorded under the OLD sequence is the confusing
      // state to avoid, not the one to build for.
      id: 'shBatteryOrderBtn', icon: 'fa-arrow-down-up-across-line', name: 'Battery before module',
      note: 'Preview the pre-check (and the path it can adjust) running before the module’s own cover, instead of in their usual place right after it',
      visibleOn: function (step) {
        return step.id === 'intro' || step.id === 'battery' ||
               step.id === 'priorModule' || step.id === 'batteryLoading';
      },
      state: function () { return batteryOrderBefore() ? 'Battery inside module' : 'Try it'; },
      onClick: function (api) {
        try {
          sessionStorage.setItem('sh-battery-order', batteryOrderBefore() ? 'start' : 'before');
          ['sh-course-riff00', 'sh-course-last', 'sh-images', 'sh-battery', 'sh-doobject-mode', 'sh-modality']
            .forEach(function (k) { sessionStorage.removeItem(k); });
        } catch (e) {}
        // A plain reload() keeps this tab's current URL, which carries a
        // ?step= deep link the engine writes on every navigation (so a
        // refresh mid-course returns you to where you were) — and that
        // param wins over STEPS[0] in the engine's own boot(), landing back
        // on the step just left instead of the new sequence's actual start.
        // Dropping it here is what makes the reorder visible immediately.
        var u = new URL(location.href);
        u.searchParams.delete('step');
        location.href = u.pathname + u.search + u.hash;
      }
    }, {
      id: 'shBatteryBtn', icon: 'fa-shuffle', name: 'Procedure proven',
      note: 'Force the pre-module result and replay the routing it drives',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      type: 'toggle', on: function () { return batteryResult() === 'proven'; },
      onClick: function (api) {
        var next = batteryResult() === 'proven' ? 'unproven' : 'proven';
        try { sessionStorage.setItem('sh-battery', next); } catch (e) {}
        var c = readCourse();
        if (c.battery) saveResult('battery', { k1: next, k2up: next === 'proven',
                                                f1: c.battery.f1, f3: c.battery.f3 });
        if (api.step && api.step.id === 'adjust') {
          // This screen only exists when something moved, so flipping to a
          // result that moves nothing deletes it out from under us. Advancing
          // IS the demonstration — the same way the Bystander module does it.
          if (!adjustMoved()) { api.go(1); return; }
          api.replay();
          return;
        }
        api.refresh();
      }
    }, {
      // D10: offered on the handoff screen — the last screen before `enact`
      // decides, at render time, which path to take (see `enact`'s external
      // function). Off by default; a learner only ever gets the live scenario.
      id: 'shDoBaselineBtn', icon: 'fa-clapperboard', name: 'Do-object baseline',
      note: 'Swap the live scenario for a video plus one stand-in question — the PRD’s literal Do-object ask (D10)',
      visibleOn: function (step) { return step.id === 'handoff'; },
      type: 'toggle', on: doBaselineOn,
      onClick: function (api) {
        try { sessionStorage.setItem('sh-doobject-mode', doBaselineOn() ? 'live' : 'baseline'); } catch (e) {}
        api.refresh();
      }
    }, {
      // D11, relocated: a real learner's name comes from SSO, not a text
      // field on the cover screen — self-assignment is a demo convenience.
      // Still only read by the "welcome back" banner on a return visit.
      id: 'shNameBtn', icon: 'fa-signature', name: 'Learner name',
      note: 'Self-assigned stand-in for SSO — only the welcome-back banner reads it',
      visibleOn: function (step) { return step.id === 'intro'; },
      state: function () { return savedName() || 'Not set'; },
      onClick: function (api) {
        var next = window.prompt('Learner name (optional):', savedName());
        if (next === null) return;
        try { sessionStorage.setItem('sh-name', next.trim().slice(0, 40)); } catch (e) {}
        api.replay();
      }
    }, {
      // A pure CSS swap (see html.ll-vector-style/html.ll-vector-light in
      // clara/sharps.html), so unlike every other row here it touches no
      // content and needs no replay/refresh — flipping the class(es) is the
      // entire effect, live, without a reload. Shown on every step, not
      // just one. Three named states rather than a toggle, since Vector
      // itself splits into a dark and a light option.
      id: 'shStyleBtn', icon: 'fa-palette', name: 'Design style',
      note: 'Swap CLARA’s teal for Vector’s own palette + control shape — the same pass already shipped on the scenario-simulator system, dark or light',
      type: 'select', value: styleMode,
      options: [
        { value: 'clara', label: 'CLARA (teal, dark)' },
        { value: 'vector-dark', label: 'Vector, dark' },
        { value: 'vector-light', label: 'Vector, light' }
      ],
      onChange: function (mode) {
        try { sessionStorage.setItem('sh-style', mode); } catch (e) {}
        applyStyleMode(mode);
      }
    }]
  });
})();
