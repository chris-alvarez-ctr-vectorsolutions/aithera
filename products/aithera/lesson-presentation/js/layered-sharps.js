/* ============================================================================
   layered-sharps.js — Bloodborne Pathogens (RVCT-303B), Module 4 · BO-4
   "Contain the Sharp", built on js/layered-engine.js.

   The prototype module from the Knowledge Layer plan: ten objectives sitting
   in ten distinct sub-scales — three Know, four Feel, three Do — so every rule
   in the assessment strategy has something to act on.

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
    { id: 'K1', name: 'The safe handling procedure', domain: 'Know', sub: 'Recall', policy: 'gate', locked: false, where: 'Pre-module battery',
      lock: 'test-out eligible', theory: 'Procedural Knowledge', src: 'LO 4.1',
      text: 'Recall the safe sharps handling procedure: plan disposal in advance, use needle alternatives when possible, activate safety features, and immediately dispose of used sharps in a designated container.' },
    // The objective the module ran for months without. Every other outcome in
    // the re-composed course carries an Understand objective; sharps carries
    // none, so the four steps arrived with no stated hazard behind them. The
    // teach content is theirs — LO 4.1's first claim and LO 4.2's first —
    // sitting unused because no objective had claimed it.
    { id: 'K2', name: 'Why a used sharp is dangerous', domain: 'Know', sub: 'Understand', policy: 'remediate', locked: true, where: 'In-flow',
      lock: 'premise · never removed', theory: 'Causal Mechanism', src: 'LO 4.1 + LO 4.2 (unclaimed)',
      text: 'Explain why a used sharp is dangerous: it retains a trace of blood after use, its point breaks skin, and a pathogen only has to reach a bloodstream to infect — which is what a needlestick does.' },
    { id: 'K3', name: 'Spotting the conditions', domain: 'Know', sub: 'Observe', ext: 'No counterpart in the re-composed course. Recognition in the field is a different act from recalling the rule, and the training standard names it separately.',
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
    // The Feel objective the module had no screen for. Three of the four
    // determinants that predict this behaviour were covered — whether the
    // learner believes it protects somebody, whether they value the control,
    // what they think the room does — and the fourth was never asked: not
    // whether they agree, but whether they think they CAN do it while they
    // are behind. Bandura's can-do form, so the statement names the obstacle
    // rather than asking about confidence in the abstract, which measures
    // mood. Flagged `ask` because a self-report may never route content out,
    // and it is read ALONGSIDE the simulation rather than on its own: a high
    // rating here followed by a missed window there is the say-do gap, and it
    // is visible inside one module.
    { id: 'F4', name: 'Doing it when you are behind', domain: 'Feel', sub: 'Can',
      ext: 'No counterpart in the re-composed course, which rates agreement on four objectives and capability on none. Perceived capability under a named obstacle is what the shortcut actually rides on in the moment.',
      policy: 'ask', locked: false, sampled: true, where: 'In-flow',
      lock: 'reinforce only', theory: 'Self-Efficacy (Bandura)', src: 'none — our construct',
      text: 'Agree: I can carry a used sharp to the container even when I am behind, the line is waiting, and the container is on the other side of the building.' },
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
        src: '../../assets/images/sharps-account-education.jpg',
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
        src: '../../assets/images/sharps-account-aec.jpg',
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
        src: '../../assets/images/sharps-account-manufacturing.jpg',
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
    public: {
      label: 'Public Sector', premise: 'use',
      sharps: 'IV catheters, needles and lancets from the drug box. Broken ampoules. Anything sharp left on a rail by the crew before you.',
      facility: {
        gloves: 'Issue puncture-resistant gloves to every crew for gurney breakdown',
        boxes: 'Fit a second wall container within reach of the bench seat in every rig'
      },
      sustain: {
        conds: ['The rig is moving',
                'My partner needs a hand with the patient',
                'Restocking at the end of a call'],
        hint: 'clipped to the rail by the bench seat'
      },
      roles: 'EMS · fire · law enforcement', org: 'Kell County EMS', orgShort: 'Kell County EMS',
      coord: { name: 'Priya Raman', title: 'EMS Training Officer', email: 'training@kellcountyems.gov' },
      role: 'Paramedic', where: 'The back of a moving ambulance', when: 'A transfer',
      case1: 'You place a line in the back of a moving ambulance and set the used catheter on the bench seat — both hands are on the patient.',
      case2: 'The jump-bag container is packed past the fill line molded into its lid, and the wall unit is behind the stretcher you cannot reach from here.',
      case3: 'At the ED doors you find a used needle loose on the gurney rail, left from the run before yours.',
      case4: 'Your partner, breaking down the gurney at the ED, is stuck by that needle. It was from the previous crew’s run, and nobody had cleared the rail.',
      story: {
        by: 'Paramedic, county EMS. Told at a crew debrief.',
        paras: [
          'I placed a line in the back of a moving rig on a transfer. Patient was stable, the road was bad, and both my hands were doing something. I set the used catheter on the bench seat beside me. Two seconds, I thought.',
          'We got busy at the doors. I broke down the gurney and never went back for it.',
          'My partner Renata caught it with the side of her hand pulling the stretcher rail. She said “that’s mine, isn’t it” before I had even turned around.',
          'She did the protocol. Twelve weeks. She rode with me the whole time and never once brought it up on a call.',
          'I have run that transfer a hundred times since. The sharp goes in the box first now, even with a hand on the patient. It costs about four seconds.'
        ]
      },
      // Its own incident, and deliberately NOT the IV catheter the cases and
      // the account use: a broken ampoule out of the drug box.
      // What counts as a sharp HERE, in prose, for the hazard article.
      jobPara: 'A catheter or lancet out of the drug box has been in someone within the last hour. An ampoule you snapped open leaves glass on the edge, with the dose and whatever else was on your gloves still on it. The crew before you may have left something on a rail without meaning to. None of these look dramatic. That is the hazard. Something that looks like trash is easier to pick up than something that looks like a syringe.',
      photo: {
        src: '../../assets/images/sharps-account-public.jpg',
        alt: 'A used IV catheter lying on the bench seat in the back of an ambulance at night, with the gurney rail and a rain-streaked window behind it.'
      },
      chain: {
        end: 'Remember, you may never meet the crew that cleans the rig after you.',
        avoided: 'Amrit never has to find out whether that ampoule mattered.',
        setup: { time: '2:10 AM', body: 'You break an ampoule drawing up a dose in the back of the rig. The red sharps disposal container is on the wall behind the bench seat. There is also a trash bag on the rail at your knee.' },
        // Optional per sector. The decision screen renders the lockup only
        // where a hero exists, so the three sectors without one are unchanged.
        hero: {
          src: '../../assets/images/sharps-chain-public-setup.jpg',
          alt: 'The back of an ambulance at night. A gloved hand holds a broken glass ampoule ' +
               'over an open equipment case. A red sharps container is mounted on the far wall, ' +
               'across the compartment. An open black bin liner hangs directly below the hand.'
        },
        pick: {
          safe:  { t: 'The red sharps container behind the bench seat', icon: 'fa-shield-halved' },
          short: { t: 'The trash bag on the rail', icon: 'fa-trash-can' }
        },
        act: {
          safe:  { time: '2:11 AM', gap: 'a minute later', gapSize: 's',
                   body: 'You reach past the bench seat and put the glass in the wall container. It costs you about four seconds.' },
          short: { time: '2:11 AM', gap: 'a minute later', gapSize: 's',
                   body: 'You drop it into the bag on the rail. It is not a needle, and the run is nearly over.' }
        },
        safeAfter: [
          { time: '6:30 AM', gap: 'four hours later', gapSize: 'l',
            body: 'Amrit takes the rig over at shift change and restocks it for the day crew. He pulls the bag off the rail and squeezes it flat to get it into the barrel. There is nothing in it that can cut him, and he will never know that was ever in question.' }
        ],
        after: [
          { time: '6:30 AM', gap: 'four hours later', gapSize: 'l',
            body: 'Amrit takes the rig over at shift change and restocks it for the day crew. You have never met him — he comes on as you go off, and a bag on the rail is just a bag.' },
          { time: '6:31 AM', gap: 'a minute later', gapSize: 's', injury: 'Possible exposure',
            body: 'He pulls it off the rail and squeezes it flat to get it into the barrel. The broken edge goes through the plastic and into the side of his hand.' },
          { time: 'Over the next twelve weeks', gap: 'and then', gapSize: 'm',
            body: 'Amrit now has to be tested at six weeks and again at twelve to find out whether he caught anything. There was a patient\u2019s blood on that ampoule \u2014 a patient he never treated. He has done nothing wrong at any point in this chain.' }
        ]
      }
    }
  };

  // ==========================================================================
  //  Test-out state. K1 is the only objective the pre-module battery can buy
  //  anything with: it is mandated content, but D2 re-verifies it
  //  performatively in the simulation, so the beat may go and the floor holds.
  //  K2 is content-locked — a low score serves it HARDER, never removes it.
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
  var IMAGE_STEPS = { case4: 1, hazard: 1 };
  function imagesOn() {
    try { return sessionStorage.getItem('sh-images') !== 'off'; } catch (e) { return true; }
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
  // D6/item 15: F2 and F4 are "ask + sampled" — only part of the cohort is
  // asked, a real assessment-sampling pattern, rather than either asking
  // everyone or gating on it. Deterministic by sector (not random) so a
  // reviewer switching sectors sees a stable, reproducible sample rather
  // than a coin flip that changes on every reload.
  var SAMPLE_MAP = {
    F2: { manufacturing: true, education: true, aec: false, public: true },
    F4: { manufacturing: true, education: false, aec: false, public: true }
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
  // K2 and K3 are both content-locked, each on its own battery item now —
  // a strong K1 result no longer decides either (that was the bug: K3 was
  // never even IN the battery, and its harder-cases trigger was reading K1).
  function k2TestUp() {
    var b = readCourse().battery;
    if (b && typeof b.k2up === 'boolean') return b.k2up;
    // No battery record — the presenter forced the result from the Demo
    // menu, which moves all three (K1/K2/K3) together for one coherent
    // "proven" state rather than reporting proven with test-up silently
    // switched off, which put a KEPT chip on the same screen as a summary
    // line saying it got harder.
    return batteryResult() === 'proven';
  }
  function k3TestUp() {
    var b = readCourse().battery;
    if (b && typeof b.k3up === 'boolean') return b.k3up;
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
                    inflow: 'inflow', case2: 'case2', case3: 'case3', case4: 'case4',
                    controls: 'controls', debrief: 'debrief', remk1: 'remk1', remk2: 'remk2', walk: 'walk',
                    postbattery: 'hazard',
                    // `enact` has no key: the scenario runs on its own page and
                    // writes nothing back here, so the cover cannot honestly
                    // tick it. It used to borrow the timed screen's result,
                    // which was a tick for a different screen's work.
                    record: 'record' };
  // Durations are summed from the steps themselves so the rail can never drift
  // from the syllabus; the saving is exactly what the adaptive sections cost.
  function pathMinutes() {
    var full = 0, saved = 0;
    STEPS.forEach(function (st) {
      if (!st.mins) return;
      full += st.mins;
      // `adaptive` now marks anything the first five answers can change, and
      // two of those get HARDER rather than shorter. Only a step with a
      // when() predicate can actually vanish, so only those save time.
      if (st.adaptive && st.when) saved += st.mins;
    });
    return { full: full, saved: saved };
  }
  function initials(name) {
    return String(name || '').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  function INTRO_CONTENT() { var L = lens(), mins = pathMinutes(); return '' +
    '<main class="ll-object">' +
      '<div class="cp-page">' +
        '<header class="cp-hero-band">' +
          '<div class="cp-hero">' +
            '<p class="ll-eyebrow">Bloodborne Pathogens · Module 4 of 6</p>' +
            '<h1>Contain the Sharp</h1>' +
            '<p class="cp-desc">When I am about to use, handle, or dispose of a needle or sharp, I plan the ' +
              'disposal route before I start, activate the safety feature, and put it straight into a ' +
              'designated container — never into general waste.</p>' +
            '<div class="cp-chips">' +
              '<span class="cp-chip due"><i class="fa-solid fa-calendar-day"></i> Required · due Oct 3</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-wand-magic-sparkles"></i> AI-guided · CLARA</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-briefcase"></i> ' + esc(L.label) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="cp-art"><i class="fa-solid fa-syringe" aria-hidden="true"></i></div>' +
        '</header>' +
        '<div class="cp-grid">' +
          '<section class="cp-sections">' +
            '<div class="cp-sec-head"><h2>Course sections</h2></div>' +
            '<div id="cpRows"></div>' +
            '<p class="cp-adapt-note" id="cpAdaptNote"></p>' +
          '</section>' +
          '<aside class="cp-rail">' +
            // Item 17: the doc's own mastery rule, not the aptitude vision's
            // 80%-of-objectives threshold — the two are different documents
            // with different rules, and this module answers to the first.
            // Bystander still carries the 80% card; that inconsistency is
            // tracked, not swept here (a separate pass touches every module).
            '<div class="cp-card"><h3>Competency requirement</h3>' +
              '<ul class="cp-req">' +
                '<li><i class="fa-solid fa-list-check"></i><span>Every section completed.</span></li>' +
                '<li><i class="fa-solid fa-clipboard-check"></i><span>Each check passed.</span></li>' +
                '<li><i class="fa-solid fa-comments"></i><span>The end-of-shift scenario performed.</span></li>' +
                '<li><i class="fa-solid fa-circle-info"></i><span>No final test.</span></li>' +
              '</ul></div>' +
            '<div class="cp-card"><h3>Time needed to complete</h3>' +
              '<div class="cp-kv"><div class="kv" id="cpTime"></div></div></div>' +
            '<div class="cp-card cp-res"><h3>Resources</h3>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-file-pdf"></i> ' + esc(L.orgShort) + ' exposure control plan <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-kit-medical"></i> What to do after a needlestick <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<a href="#" onclick="return false" title="Mocked for the prototype"><i class="fa-solid fa-scale-balanced"></i> OSHA 1910.1030 <i class="fa-solid fa-arrow-up-right-from-square ext"></i></a>' +
              '<p class="cp-res-note">All resources open in a new window.</p></div>' +
            '<div class="cp-card"><h3>Course coordinator</h3>' +
              '<div class="cp-coord"><span class="ava">' + esc(initials(L.coord.name)) + '</span>' +
                '<span><b>' + esc(L.coord.name) + '</b><small>' + esc(L.coord.title) + ' · ' + esc(L.coord.email) + '</small></span></div></div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
    '</main>'; }
  function introInit(ctx) {
    var course = readCourse();
    // Render the FULL syllabus and MARK what the entry questions removed,
    // rather than rendering visiblePath(). visiblePath() is the
    // post-compression path, so once the battery proved the procedure both
    // adaptive sections simply vanished from this list — leaving no "adaptive"
    // label anywhere on the screen and a legend underneath pointing at
    // nothing, while the time card still offered to save time the learner had
    // already saved. Showing the cut is the entire demonstration; a
    // compression you cannot see is indistinguishable from a module that never
    // had those sections.
    var rows = STEPS.filter(function (st) { return st.id !== 'intro'; });
    var review = LE.reviewMode();
    var cutCount = 0, cutMins = 0;
    document.getElementById('cpRows').innerHTML = rows.map(function (st) {
      var gone = !!(st.when && !st.when());
      // An interstitial is a system screen with no news of its own, not a
      // section — off the syllabus whether or not it is running, so a
      // learner on the proven path never sees "Your Updated Path" advertised
      // as something to visit.
      if (st.interstitial) return '';
      // Only ADAPTIVE absences count toward this tally — the sentence below
      // reads "N sections marked adaptive came out because of your first
      // five answers", which is specifically about battery-driven
      // compression. A remediation card being gone (item 10) is a DIFFERENT
      // kind of absence — it depends on later in-module checks, not the
      // battery — and counting it here would claim credit the battery never
      // earned, or blame it for a card that was never coming out either way.
      if (gone && st.adaptive) { cutCount++; cutMins += (st.mins || 0); }
      var done = !gone && !!course[DONE_KEYS[st.id]];
      var meta = [];
      if (st.stage) meta.push('<span class="stage">' + esc(st.stage) + '</span>');
      if (st.mins) meta.push('<span>About ' + st.mins + ' min' + (st.mins > 1 ? 's' : '') + '</span>');
      if (st.adaptive) meta.push('<span class="adapt"><i class="fa-solid fa-wand-magic-sparkles"></i>adaptive</span>');
      var state = gone ? ['cut', 'Skipped'] : done ? ['done', 'Done'] : ['todo', 'Not started'];
      // A section already completed is a real destination — a learner
      // revisiting it is not "ahead of the gate" the way an untouched one
      // would be. Anything still ahead only opens in review mode, via the
      // Demo menu's Review mode toggle: a production build would unlock
      // exactly this same set (completed sections), nothing more.
      var jumpable = !gone && (done || review);
      var tag = jumpable ? 'button' : 'div';
      var attrs = jumpable ?
        ' type="button" data-step="' + esc(st.id) + '"' +
        ' aria-label="Go to ' + esc(st.lesson) + '"' : '';
      return '<' + tag + ' class="cp-row' + (done ? ' done' : '') + (gone ? ' is-cut' : jumpable ? ' is-jump' : '') + '"' + attrs + '>' +
        '<span class="cp-row-ico"><i class="fa-solid ' + (st.icon || 'fa-circle') + '"></i></span>' +
        '<span class="cp-row-main"><b>' + esc(st.lesson) + '</b>' +
          '<span class="cp-row-meta">' + meta.join('') + '</span></span>' +
        '<span class="cp-row-state ' + state[0] + '">' + state[1] + '</span>' +
      '</' + tag + '>';
    }).join('');

    // PROTOTYPE CONVENIENCE — see the row markup above.
    document.getElementById('cpRows').addEventListener('click', function (e) {
      var row = e.target.closest('.cp-row.is-jump');
      if (!row || !row.dataset.step) return;
      LE.goTo(row.dataset.step);
    });

    // Both the legend and the time card are written for the state the learner
    // is actually in. In the future tense they were addressing somebody who
    // had not answered yet, which after test-out is the wrong person.
    var mins = pathMinutes();
    var cutPhrase = cutCount === 1 ? 'The section marked <b>adaptive</b> came'
                  : cutCount === 2 ? 'Both sections marked <b>adaptive</b> came'
                  : 'All ' + cutCount + ' sections marked <b>adaptive</b> came';
    document.getElementById('cpAdaptNote').innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + (cutCount
        ? cutPhrase + ' out because your first five answers showed you already had the procedure. ' +
          'The other sections marked <b>adaptive</b> are still here \u2014 those get harder rather than shorter.'
        : 'Sections marked <b>adaptive</b> change with what you show in the first five questions: some come ' +
          'out, and some get harder instead. Nothing else on this list moves either way.');
    document.getElementById('cpTime').innerHTML = cutMins
      ? '<b>≈ ' + (mins.full - cutMins) + ' minutes on your path</b>' +
        cutMins + ' minute' + (cutMins > 1 ? 's' : '') + ' came out after the first five questions'
      : '<b>Typical ≈ ' + mins.full + ' minutes</b>Answer the first five well and save up to ' + mins.saved + ' minutes';

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
    // K2, diagnostic — a DIFFERENT framing of the misconception hzcheck tests
    // in-flow (that amount of blood is what makes a needlestick worse), so a
    // learner who already gets this isn't just recalling an answer they saw
    // ninety seconds ago when hzcheck (or its test-up permutation) runs.
    { obj: 'K2',
      stem: 'A coworker says a stick from a used needle is worse than a fresh cut because it carries more blood. Are they right?',
      cta: 'Check answer',
      options: [
        { t: 'No — it carries a trace, not more blood', icon: 'fa-circle-check', score: 2,
          reply: 'Right. The amount barely changes; the skin puncture is the real difference.' },
        { t: 'Yes — a used needle carries more blood', icon: 'fa-droplet', score: 0,
          reply: 'Actually, no. A used needle carries a trace but what makes it dangerous is the puncture, not the amount.' },
        { t: 'Neither — any broken skin is equally risky', icon: 'fa-hand', score: 0,
          reply: 'Not quite. Intact skin stops most exposures, but a puncture changes that.' }
      ] },
    // K3, diagnostic — recognition, not recall: can the learner already spot
    // the condition case 2 is built on (a container past its fill line)? The
    // two wrong answers are the conditions people mistake for the real signal
    // (time, quantity) rather than the one that actually matters (fill level).
    { obj: 'K3',
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
      hint: 'Answer honestly, and we come back to this later with the real figure for your sector.',
      cta: 'Lock it in',
      options: [
        { t: 'Most do', icon: 'fa-users', score: 3, reply: 'Noted. We’ll see how that compares to what your sector actually reports.' },
        { t: 'About half', icon: 'fa-users-slash', score: 2, reply: 'Noted. The real number surprises most people in both directions.' },
        { t: 'Hardly anyone', icon: 'fa-user-slash', score: 1, reply: 'Noted. If that’s true where you work, it matters more than the procedure does.' }
      ] }
  ];
  function batteryInit(ctx) {
    var res = { k1: 'unproven', k1score: 0, k2up: false, k3up: false, f1: 3, f3: 3 };
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var hintEl = document.getElementById('blHint');
    var optsEl = document.getElementById('blOptions');
    var checkEl = document.getElementById('blCheck');
    var sceneEl = document.getElementById('blScene');
    var k1 = [];

    // The eyebrow counts the questions. What it cannot say is that half of
    // them have no right answer, which is what decides whether the Feel items
    // get an honest answer or a flattering one.
    ctx.setCoachSay('Two questions about the procedure, two about how you see it. ' +
      'These questions aren\u2019t graded.');
    ctx.floatClose();
    render(0);

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
        if (q.obj === 'K3') res.k3up = sel.opt.score >= 2;
        if (q.obj === 'F1') res.f1 = sel.opt.score;
        if (q.obj === 'F3') res.f3 = sel.opt.score;
        ctx.floatOpen();
        ctx.setCoachSay(esc(sel.opt.reply));
        ctx.positionOrb(true);
        if (i + 1 < BATTERY.length) offerNext(i + 1);
        else done();
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
        ctx.floatOpen();
        ctx.setCoachSay(esc(right ? q.okReply : q.badReply));
        ctx.positionOrb(true);
        offerNext(i + 1);
      }
    }

    function swapTo(i) {
      askEl.classList.add('swapping');
      setTimeout(function () {
        render(i);
        askEl.classList.remove('swapping');
        ctx.floatClose();
        ctx.positionOrb(true);
      }, T(320));
    }
    // The way forward is the footer, relabelled — CLARA's bubble carries only
    // the reaction to the answer that just landed, never the move past it.
    function offerNext(i) { ctx.setNextAction('Next question', function () { swapTo(i); }); }
    function done() {
      // K1 is proven only on a clean sweep — it is mandated content, and the
      // simulation still re-verifies it performatively either way. One item
      // now that the second K1 question moved to the in-flow bank (D4), so
      // the threshold is that item's own max score, not a fixed 4 left over
      // from when two items fed this sum.
      res.k1score = k1.reduce(function (a, b) { return a + b; }, 0);
      res.k1 = (res.k1score >= 2) ? 'proven' : 'unproven';
      // K2 and K3 are both content-locked: their own item decides whether
      // they get served HARDER, not K1's result — res.k2up/k3up are already
      // set by their own options above.
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
    harder:  '<span class="adj-chip adj-chip--harder"><i class="fa-solid fa-arrow-trend-up"></i> Harder</span>',
    kept:    '<span class="adj-chip adj-chip--keep">Kept</span>'
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
    { id: 'hazard',    state: function () { return k2TestUp() ? 'harder' : 'kept'; } },
    { id: 'hzcheck',   state: function () { return k2TestUp() ? 'dropped' : 'kept'; } },
    { id: 'procedure', state: function () { return batteryResult() === 'proven' ? 'dropped' : 'kept'; } },
    { id: 'case1',     state: function () { return batteryResult() === 'proven' ? 'dropped' : 'kept'; } },
    { id: 'inflow',    state: function () { return batteryResult() === 'proven' ? 'dropped' : 'kept'; } },
    { id: 'case2',     state: function () { return k3TestUp() ? 'harder' : 'kept'; } },
    { id: 'case3',     state: function () { return k3TestUp() ? 'harder' : 'kept'; } },
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
    var rows = adjustRows();
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
  var PROCEDURE_VIDEO = '../../assets/videos/sharps-procedure.mp4';

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
  //  the labels, icons and stated costs cannot drift between them. `label` is
  //  what a LEARNER sees on the picker button.
  //
  //  The TRADEOFF line is the part that makes a chooser honest. A learner
  //  picking a carrier needs to know what it costs them, not just what it is
  //  called — a video is short but demands your eyes, a read is skimmable and
  //  self-paced, audio runs in the background but takes longer and has to
  //  interrupt to ask you anything. Offering the choice without the cost is
  //  just a menu.
  var MODALITIES = {
    video:   { label: 'Watch', icon: 'fa-circle-play',
               cost: '2 min',
               tradeoff: 'Two minutes, but you have to be looking at it.',
               note: 'The reference rendering — the point in the variant space the SME signed.' },
    article: { label: 'Read', icon: 'fa-file-lines',
               cost: '1 min',
               tradeoff: 'About a minute, skimmable, and you set the pace.',
               note: 'Pre-rendered. The same content, read rather than watched.' },
    tutor:   { label: 'Step through it', icon: 'fa-comments',
               cost: 'Slower \u00b7 asks questions',
               tradeoff: 'Slower, and CLARA asks you questions on the way.',
               note: 'CLARA walks the procedure one step at a time.' },
    podcast: { label: 'Listen', icon: 'fa-podcast', declined: true,
               cost: 'Longest \u00b7 hands free',
               tradeoff: 'Runs while you do something else, but takes longer and stops to ask you things.',
               note: 'Declined at module level. Audio is offered one level up, across the course.' }
  };

  //  The chooser. One implementation, so a second beat offering a choice
  //  cannot invent a different one. A beat declares which keys it offers and
  //  in what order; every label and cost comes from the table above.
  //
  //  It PERSISTS rather than gating. A one-shot chooser would either hide the
  //  default carrier behind a click or vanish once used, and both are worse:
  //  the learner arrives on the default and can still see, at any point, what
  //  the other option is and what it costs. Each option carries its own cost
  //  inline, so the tradeoff is visible for the route NOT taken too — which is
  //  the half that actually informs a choice.
  function modalityPicker(id, keys, costs) {
    return '<div class="md-pick" id="' + id + '" role="group" ' +
        'aria-label="How do you want to take this?">' +
      keys.map(function (k) {
        var m = MODALITIES[k];
        // A beat may override the duration: the same carrier is not the same
        // length on every screen, and a shared table cannot know that.
        var cost = (costs && costs[k]) || m.cost;
        return '<button class="md-opt" type="button" data-m="' + k + '" aria-pressed="false">' +
          '<i class="fa-solid ' + m.icon + '" aria-hidden="true"></i>' +
          '<span class="md-opt-t"><b>' + esc(m.label) + '</b>' +
            '<span class="md-cost">' + esc(cost) + '</span></span>' +
        '</button>';
      }).join('') +
    '</div>';
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
  // the learner-facing picker in procedureInit is now the writer.
  var MODALITY_ORDER = ['video', 'article', 'tutor', 'podcast'];
  function modalityId() {
    try { var m = sessionStorage.getItem('sh-modality'); if (MODALITIES[m]) return m; } catch (e) {}
    return MODALITY_ORDER[0];
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
      // branch is recorded separately rather than replacing it.
      saveResult('chain', { walked: true, took: took, bothRoutes: replayed });
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
      if (replayed) { ctx.positionOrb(true); return; }
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
  var HAZARD_VIDEO = '../../assets/videos/sharps-controls-cut.mp4';
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
              ? photoFigure('../../assets/images/sharps-hazard-route.jpg',
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

    // K2 test-up (D4/item 9): no check follows this screen, so the leading
    // line stops setting up a trap for a question that was never going to be
    // asked and states the mechanism directly instead.
    var testUp = k2TestUp();
    return '<main class="ll-object ll-object--chain"><div class="pr-wrap">' +
      '<p class="ll-eyebrow" id="hzEyebrow">Before the procedure' + (testUp ? ' · no check after this' : '') + '</p>' +
      '<h1 class="pr-h">It only takes a trace.</h1>' +
      // NOT the objective statement. This used to print obj('K2').text
      // verbatim — an instruction written for a designer ("Explain why a used
      // sharp is dangerous: ...") shown to a learner, which also handed them
      // the answer to the check. It poses the question the page answers, and
      // poses it in terms of AMOUNT, which is the misconception the check's
      // distractors are built from — so it sets the trap up rather than
      // giving the answer away. On test-up there is no check to protect, so
      // the harder permutation states the conclusion instead of leading to it.
      '<p class="pr-sub">' + (testUp
        ? 'A trace carries everything a large exposure would — the amount was never the mechanism.'
        : 'How much blood is enough to be dangerous?') + '</p>' +

      // Item 19/D7: Listen joins the picker here — 'podcast' key, shared
      // MODALITIES entry (label "Listen"), cost overridden for this beat's
      // actual length. Declined at the course level (K1's procedure) does
      // not mean declined everywhere; this is the one place the doc's own
      // "first cut" actually calls for it.
      modalityPicker('hzPick', ['video', 'article', 'podcast'], { article: '4 min', podcast: '2 min' }) +

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
              'Narration uses your browser’s built-in speech — a stand-in for the produced voice track. ' +
              'The check on this one waits until the end of the module.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div></main>';
  }

  function hazardInit(ctx) {
    var eyebrow = document.getElementById('hzEyebrow');
    var pick = document.getElementById('hzPick');
    var carrier = document.getElementById('hzCarrier');
    var vWrap = document.getElementById('hzVideoWrap');
    var wWrap = document.getElementById('hzWritten');
    var aWrap = document.getElementById('hzAudioWrap');
    // Separate flags: video mounts once, audio mounts once, and each is a
    // real network/synthesis cost that should not gate on the other having
    // already happened — the original single `mounted` meant Listen never
    // mounted at all once the default video carrier had already run once.
    var mounted = false, audioMounted = false, showing = null, podcastTimer = null;
    // K2 test-up: show() below overwrites the eyebrow the moment a carrier
    // is picked, so the "no check after this" signal has to ride along with
    // whichever text it sets rather than living only in the static markup.
    var testUp = k2TestUp();
    var noCheckTag = testUp ? ' · no check after this' : '';

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
      // Item 13: which carrier they actually used, for the record. Merged
      // rather than overwritten — hzcheck's own pass/fail lands in this same
      // `hazard` key, before or after this, in either order.
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

      if (m === 'video') {
        eyebrow.textContent = 'Watch: 2 minutes' + noCheckTag;
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
          // The real duration, read off the file rather than typed into the
          // label, so it cannot go stale when the asset is swapped.
          var vid = document.getElementById('hzVideo');
          if (vid) vid.addEventListener('loadedmetadata', function () {
            if (!isFinite(vid.duration) || !vid.duration) return;
            var mm = Math.round(vid.duration / 60);
            eyebrow.textContent = 'Watch: ' + (mm < 1 ? 'under a minute' : mm + ' minute' + (mm > 1 ? 's' : '')) + noCheckTag;
          });
        }
      } else if (m === 'podcast') {
        // Item 19/D7: the transcript is fully visible on arrival — same
        // reasoning as the article, nothing forces a listen. Choosing this
        // carrier defers the K2 check to a postbattery step (see hzcheck's
        // and postbattery's own `when()`), which the note in the markup
        // already tells the learner.
        eyebrow.textContent = 'Listen: about 2 minutes' + noCheckTag;
        if (!audioMounted) { audioMounted = true; mountAudio(); }
        // Held so leaving Listen before it fires can cancel it — see the
        // top of show().
        podcastTimer = setTimeout(done, T(700));
      } else {
        eyebrow.textContent = 'Read: about 4 minutes' + noCheckTag;
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
    if (HAZARD_PLACEHOLDER && !LE.reviewMode()) {
      var vBtn = pick.querySelector('.md-opt[data-m="video"]');
      if (vBtn) vBtn.hidden = true;
    }

    // Read is the default carrier while the video is a placeholder — video was
    // the default before there was a real clip behind it, which meant every
    // learner's first tap landed on a COMING SOON poster. Swaps back to video
    // automatically the day HAZARD_PLACEHOLDER flips false.
    show(HAZARD_PLACEHOLDER ? 'article' : 'video');

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
  //  WHAT MAKES IT WORSE — K2's check, on its own screen.
  //
  //  It used to appear at the foot of the teaching page once the video
  //  finished: a third block sliding in under a video and a diagram, with a
  //  two-line question and three full-sentence answers. Nothing about that
  //  read as a question — it read as more page.
  //
  //  Its own screen, on the same pattern as the K1 in-flow check, and the
  //  wording cut to what a learner can scan: the question is one line and each
  //  answer is three or four words. The DETAIL did not disappear, it moved to
  //  CLARA's replies, which is where an explanation belongs — the option list
  //  only has to be pickable.
  //
  //  Tests the MIDDLE link of the chain, which is where the real misconception
  //  lives: people believe a large amount of blood is needed, and that blood
  //  on a hand is comparable to blood on a point. Two attempts, and the second
  //  miss gets a different framing rather than the same sentence again — that
  //  is K2's remediate policy firing at the beat.
  // ==========================================================================
  var HZCHECK_CONTENT =
    '<main class="ll-object">' +
      '<div class="cs-wrap">' +
        '<p class="ll-eyebrow">Check: 1 question · two tries</p>' +
        '<h2 class="cs-q cs-q--lead">Why is a needlestick worse than blood on the surface of your skin?</h2>' +
        '<div class="cs-opts" id="hzOpts"></div>' +
      '</div>' +
    '</main>';

  function hzcheckInit(ctx) {
    var wrap = document.getElementById('hzOpts');
    // Silent. The eyebrow states the rule now, so there is nothing left for
    // CLARA to say that is not already on the screen.
    var tries = 0, settled = false;
    var HZ_OPTS = [
      { t: 'It gets past your skin', ok: true,
        reply: 'Right. Skin is a protective barrier and a puncture breaks through it. The amount of blood matters far less than whether it got in.' },
      { t: 'There is more blood on a needle', ok: false,
        reply: 'Actually, it’s the opposite: a used point can only carry a trace. It’s where that trace ends up being delivered that’s consequential.' },
      { t: 'They are the same risk', ok: false,
        reply: 'Washing matters either way, and blood on broken skin or in your eyes is a real exposure. But on intact skin a pathogen has nowhere to go — the needle is what gives it somewhere.' }
    ];
    var buttons = [];
    HZ_OPTS.forEach(function (o) {
      var b = csOption(o.t);
      buttons.push(b);
      b.addEventListener('click', function () {
        if (settled) return;
        if (o.ok) {
          settled = true;
          wrap.classList.add('answered');
          wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
          csMark(b, 'ok');
          // Still written to the `hazard` key: the record's K2 line reads
          // passed/attempts from there, and splitting the screen should not
          // change what the record says. Merged, not replaced — the
          // explainer already wrote this key's `carrier` field.
          mergeResult('hazard', { passed: true, attempts: tries + 1 });
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
            HZ_OPTS.forEach(function (opt, i) { if (opt.ok) csMark(buttons[i], 'ok'); });
            wrap.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
            mergeResult('hazard', { passed: false, attempts: tries });
            ctx.setCoachSay('The bottom line: if it gets past your skin, the amount barely matters.');
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
      d: 'Know where the container is and how you reach it before the sharp is ever in your hand — and the same applies before you clear up broken glass. Distance is a problem you solve early, not one you discover holding a used needle.' },
    { t: 'Use a needle alternative where one exists', onlyOn: 'use',
      d: 'The safest sharp is the one that was never used. Where a blunt or needle-free option does the job, it is the option.',
      note: 'On this job the sharp is usually already used and already somewhere it should not be, so there is no alternative to choose. The step still matters for whoever is holding one.' },
    { t: 'Activate the safety feature',
      d: 'At the point of use, before anything else happens — while the sharp is still under your control and nobody else is near it.' },
    { t: 'Dispose in a designated container',
      d: 'Straight in, and the container is a specific object: rigid, closeable, leak-proof, and either red or marked with the biohazard symbol. It is built to swallow the point so nothing can reach it again. A bag will not do that.' },
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

  // Item 26: one template, three learner-facing carriers plus the declined
  // banner — same shape as the hazard beat (HAZARD_CONTENT/hazardInit), swapped
  // in place by show() rather than re-rendering the whole step. The Demo
  // menu's Modality control used to be the only way to change this, which
  // meant a learner never saw the choice existed; the picker now does what
  // that control did, in the open.
  function PROCEDURE_CONTENT() {
    return '<main class="ll-object"><div class="pr-wrap">' +
      '<p class="ll-eyebrow" id="prEyebrow">Watch: 4 minute video</p>' +
      '<h1 class="pr-h">The order is the procedure.</h1>' +
      '<p class="pr-sub">Four steps, always in this order — plus two rules that hold no matter what.</p>' +

      // Item 26: podcast stays in the vocabulary (MODALITIES) so its own
      // decline banner can render, but the button itself is hidden from a
      // learner — see procedureInit. Declined, not offered, is the point.
      modalityPicker('prPick', ['video', 'article', 'tutor', 'podcast'], { article: '2 min' }) +

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
        '<div id="prWritten" hidden>' + procedureList() + '</div>' +
      '</div>' +
    '</div></main>';
  }
  // The live count, because a find-premise drops the alternatives step out of
  // the numbering and a heading that says "four" would then be wrong. Counts
  // only the numbered STEPS — the two rules after them were never a fifth
  // and sixth step to count.
  function procedureCount() {
    var use = lens() && lens().premise === 'use';
    return PROCEDURE.slice(0, 4).filter(function (s) {
      return !(s.onlyOn && s.onlyOn !== (use ? 'use' : 'find'));
    }).length;
  }

  function procedureInit(ctx) {
    var eyebrow = document.getElementById('prEyebrow');
    var pick = document.getElementById('prPick');
    var carrier = document.getElementById('prCarrier');
    var vWrap = document.getElementById('prVideoWrap');
    var tWrap = document.getElementById('prTutorWrap');
    var declined = document.getElementById('prDeclined');
    var written = document.getElementById('prWritten');
    var mounted = false, tutorMounted = false, showing = null, handed = false;

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

    function runTutor() {
      var host = document.getElementById('prTutor');
      var useP = lens() && lens().premise === 'use';
      var steps = PROCEDURE.slice(0, 4).filter(function (s) {
        return !(s.onlyOn && s.onlyOn !== (useP ? 'use' : 'find'));
      });
      var rules = PROCEDURE.slice(4);
      steps.forEach(function (s, i) {
        setTimeout(function () {
          if (!host) return;
          var d = document.createElement('div');
          d.className = 'pr-turn';
          d.innerHTML = '<span class="pr-n">' + (i + 1) + '</span>' +
            '<span class="pr-main"><b>' + esc(s.t) + '</b>' +
            '<span class="pr-d">' + esc(s.d) + '</span></span>';
          host.appendChild(d);
          requestAnimationFrame(function () { d.classList.add('in'); });
        }, T(350 + i * 850));
      });
      // The two rules land after the sequence, unnumbered — arriving turns
      // that carry no ordinal, not a fifth and sixth step.
      rules.forEach(function (s, j) {
        setTimeout(function () {
          if (!host) return;
          var d = document.createElement('div');
          d.className = 'pr-turn pr-turn--rule';
          d.innerHTML = '<span class="pr-n pr-rule-mark"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i></span>' +
            '<span class="pr-main"><b>' + esc(s.t) + '</b>' +
            '<span class="pr-d">' + esc(s.d) + '</span></span>';
          host.appendChild(d);
          requestAnimationFrame(function () { d.classList.add('in'); });
        }, T(350 + (steps.length + j) * 850));
      });
      setTimeout(done, T(350 + (steps.length + rules.length) * 850));
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

      if (m === 'video') {
        eyebrow.textContent = 'Watch: 4 minute video';
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
        eyebrow.textContent = 'Step through: ' + procedureCount() + ' steps';
        if (!handed) ctx.disableNext();
        ctx.setCoachSay('Let’s take the steps one at a time.');
        if (!tutorMounted) { tutorMounted = true; runTutor(); }
      } else if (m === 'podcast') {
        eyebrow.textContent = 'Not available as audio';
        // Silent — the declined-audio banner on screen already says the path
        // still runs on the article cut; CLARA repeating it added nothing.
        // Still has to clear the manifest's "Loading…" placeholder, though:
        // a returning learner whose last modality was Listen lands here
        // FIRST, with no earlier setCoachSay call to have cleared it.
        ctx.setCoachSay('');
        done();
      } else {
        eyebrow.textContent = 'Read: about 2 minutes';
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
      var harder = !!(cfg.harder && k3TestUp());
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
  //  THE ONE THAT LANDED — F1, and it runs for EVERY learner on every path:
  //  Feel never routes past content and does not currently vary this beat
  //  either. No judgment here; the account IS the argument.
  //
  //  This is the POST leg of the entry battery's F1 item. That is the only
  //  thing the battery answer is used for — a baseline to subtract from.
  // ==========================================================================
  function CASE4_CONTENT() {
    var L = lens();
    return '<main class="ll-object">' +
      '<div class="story-wrap">' +
        '<p class="ll-eyebrow">Read: 1 minute</p>' +
        '<h2 class="story-h">Somebody else found it.</h2>' +
        (L.photo
          ? photoFigure(L.photo.src, L.photo.alt, 'The gap this module is about \u2014 the sharp at rest, and whoever meets it next.')
          : figure(FIG_LEFT_BEHIND, 'The gap this module is about \u2014 the sharp at rest, and whoever meets it next.')) +
        '<blockquote class="story">' +
          L.story.paras.map(function (para) { return '<p>' + esc(para) + '</p>'; }).join('') +
          '<footer>' + esc(L.story.by) + '</footer>' +
        '</blockquote>' +
        '<p class="story-note">The person who was hurt did not use the sharp, did not leave it, and had no way ' +
          'to know it was there. That is why this is a professional responsibility and not a personal-safety ' +
          'rule — the risk you create is almost never carried by you.</p>' +

        // The post leg. The entry battery asked this exact statement with
        // these exact three answers, so the two are comparable and the
        // reportable figure is the MOVEMENT. Asking a different question here
        // would produce two numbers that cannot be subtracted.
        '<div class="ct-second" id="c4Post" hidden>' +
          '<p class="ll-eyebrow">You answered this at the start</p>' +
          '<h2 class="cs-q">Safe sharps disposal protects your coworkers, not just you.</h2>' +
          '<p class="bl-hint">Same question, same three answers. Say where you are now.</p>' +
          '<div class="bl-options" id="c4PostOpts" role="radiogroup"></div>' +
        '</div>' +
      '</div>' +
    '</main>';
  }
  function case4Init(ctx) {
    var post = document.getElementById('c4Post');
    var opts = document.getElementById('c4PostOpts');
    var done = false;
    // Silent through this whole beat — the account and the re-rate carry
    // it without CLARA narrating the read or the move. Still has to clear
    // the manifest's "Loading…" placeholder, though — nothing else does.
    ctx.setCoachSay('');

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
        if (done) return; done = true;
        b.setAttribute('aria-checked', 'true');
        opts.classList.add('answered');
        opts.querySelectorAll('.bl-option').forEach(function (x) { if (x !== b) x.disabled = true; });
        saveResult('case4', { read: true, post: o.score });
        ctx.enableNext();
        ctx.positionOrb(true);
      });
      opts.appendChild(b);
    });
    LE.pickGroup(opts);

    // WHEN IS THE READ DONE? The learner says so. This was a scroll observer
    // plus a word-count estimate, and both were proxies for a state we can
    // simply be told — a tall display made "reached the end" fire on arrival,
    // and a word count is an average applied to one person. The forward button
    // carries "Done reading" until it is pressed, so the footer has something
    // true to do during the read and the reveal happens on a real signal.
    //
    // It is trivially skippable, which is the right trade: the alternative is
    // holding a learner who genuinely has finished. How long they took is
    // recorded rather than enforced, which is the more useful number anyway.
    var landed = Date.now();
    ctx.setNextAction('Done reading', function () {
      // How long they took is recorded, not enforced.
      saveResult('case4', { read: true, readMs: Date.now() - landed });
      // No "Part 2 of 2": the first half was a read, not a numbered part —
      // a badge counting from 2 with no Part 1 anywhere implied one.
      reinforce(ctx, post, 1, 1);
      // No coach line: the layer carries its own eyebrow and question, and
      // setCoachSay() raises them whenever it runs after init — which is what
      // used to make them surface twice on this screen.
      ctx.positionOrb(true);
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
  //  COHORT DEBRIEF — F3. Their read of the room, then the sector's real
  //  number. The gap IS the teaching, and the numbers are lensed because the
  //  norm genuinely differs by sector.
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
  // ==========================================================================
  //  The entry answer, as a key into the same three bands the chart reports.
  //  That item asked what share of the room uses the container straight away,
  //  which is exactly what the FIRST band measures, so the two compare without
  //  rescaling anything. Null when the battery never finished — the screen
  //  then falls back to a plain reveal rather than inventing a guess.
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
  var DEBRIEF_DATA = {
    education:     [{ k: 'most', label: 'Use the container immediately', pct: 62 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 29 },
                    { k: 'few',  label: 'Routinely set it down', pct: 9 }],
    aec:           [{ k: 'most', label: 'Use the container immediately', pct: 48 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 37 },
                    { k: 'few',  label: 'Routinely set it down', pct: 15 }],
    manufacturing: [{ k: 'most', label: 'Use the container immediately', pct: 55 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 33 },
                    { k: 'few',  label: 'Routinely set it down', pct: 12 }],
    public:        [{ k: 'most', label: 'Use the container immediately', pct: 71 },
                    { k: 'half', label: 'Sometimes set it down first', pct: 22 },
                    { k: 'few',  label: 'Routinely set it down', pct: 7 }]
  };
  function debriefRows() { return DEBRIEF_DATA[LE.lensId()] || DEBRIEF_DATA.manufacturing; }
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
                : 'Want to see what your sector actually reports?') + '</p>' +
        '<button class="db-reveal" id="dbReveal" type="button">' +
          '<i class="fa-solid fa-chart-simple" aria-hidden="true"></i> Show me the numbers</button>' +
      '</div>' +

      '<div class="pr-wrap" id="dbChart" hidden>' +
        '<div class="pr-choices" id="prChoices">' +
          debriefRows().map(function (d) {
            // Read-only rows. The guess happened at the entry battery, so the
            // band the learner was estimating is MARKED here rather than
            // clicked — their answer sits on the same line as the real figure,
            // which is the whole comparison in one row. Bug fix: this
            // compared every row to the literal string 'most' rather than to
            // `said`, so a learner who guessed "Hardly anyone" had the
            // "most" row marked as theirs and tagged "You said Most do".
            var mine = said && d.k === said;
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
        // Illustrative, and labelled as such. No cohort data exists in the
        // source material for this objective — the figures are ours. That is
        // survivable in a prototype only while the screen says so, because
        // here the NUMBER is the intervention: a norm correction built on an
        // invented norm is teaching something we made up.
        //
        // Item 29: the disclaimer stops there. "A real deployment swaps in
        // the customer's own cohort data" is production process, not
        // something a learner needs to read on their way through a norm
        // correction — it moved to the step caption, where a reviewer looks.
        '<p class="pr-src"><i class="fa-solid fa-users" aria-hidden="true"></i> ' +
          'Illustrative figures for ' + esc(lens().label) + '</p>' +
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
        // Whether the sector's own figure is a MAJORITY decides what this
        // beat can honestly claim. One sector sits just under half, and the
        // copy used to tell that learner the shortcut was the outlier while
        // showing them data saying it was not — a norm correction arguing
        // against its own number. A minority figure is still a finding; it
        // is just the opposite finding, and it is the more useful one.
        var majority = top.pct >= 50;
        // Null when there is no entry answer to have been right or wrong.
        var matched = said ? ((said === 'most') === majority) : null;
        var pct = '<strong>' + top.pct + '%</strong>';
        ctx.setCoachSay(matched === null
          ? 'For ' + esc(lens().label) + ' it is ' + pct + '. ' + (majority
              ? 'Which means the person who sets one down is the outlier, not the norm.'
              : 'Just under half — in your sector the shortcut genuinely is common.')
          : majority
            ? (matched
                ? 'Your read matches the data — ' + pct + '. Which means the person who sets one down is the outlier, not the norm.'
                : 'The real figure is ' + pct + ' — higher than most people guess. The shortcut feels normal because you notice it; it is not what most of your shift does.')
            : (matched
                ? 'You read it right, and it is worth sitting with rather than being reassured about: ' + pct + '. Just under half. In your sector the shortcut genuinely is common — which makes the person who does not take it the one worth copying.'
                : 'Not quite — ' + pct + ', just under half. Yours is the sector where this is hardest, so the habit is not something the room will carry for you.'));
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
      shown.forEach(function (s, i) {
        setTimeout(function () {
          if (!host) return;
          var d = document.createElement('div');
          d.className = 'pr-turn';
          d.innerHTML = '<span class="pr-n">' + (i + 1) + '</span>' +
            '<span class="pr-main"><b>' + esc(s.t) + '</b><span class="pr-d">' + esc(s.d) + '</span></span>';
          host.appendChild(d);
          requestAnimationFrame(function () { d.classList.add('in'); });
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

  // K2's own remediation: one item, one try, then on regardless — the
  // remediate policy already governing hzcheck's two tries above it.
  var REMK2_ITEM = {
    stem: 'A used needle is dangerous mainly because of ___.',
    opts: [
      { t: 'the puncture, not the amount of blood on it', ok: true,
        reply: 'Right. The puncture is what makes the route in. The amount barely matters.' },
      { t: 'how sharp the point still is', ok: false,
        reply: 'A dull point can still puncture skin.' },
      { t: 'how long ago it was used', ok: false,
        reply: 'Time does not change the mechanism — a used point carries a trace whether it was an hour ago or a week ago. The puncture is what matters.' }
    ]
  };
  function REMK2_CONTENT() {
    return '<main class="ll-object"><div class="cs-wrap">' +
      '<p class="ll-eyebrow">Another look</p>' +
      '<h2 class="cs-q cs-q--lead">Not the amount. The route.</h2>' +
      '<p class="ll-sub">A needlestick is worse than blood on unbroken skin for one reason: the point punctures, so ' +
        'the route in is not stopped by intact skin the way it normally would be. That is true whether the trace ' +
        'on the point is large or small.</p>' +
      '<p class="cs-q" style="margin-top:24px">' + esc(REMK2_ITEM.stem) + '</p>' +
      '<div class="cs-opts" id="rk2Opts"></div>' +
    '</div></main>';
  }
  function remk2Init(ctx) {
    var opts = document.getElementById('rk2Opts');
    var settled = false;
    ctx.setCoachSay('Let’s take one more look at this.');
    REMK2_ITEM.opts.forEach(function (o) {
      var b = csOption(o.t);
      b.addEventListener('click', function () {
        if (settled) return;
        settled = true;
        opts.classList.add('answered');
        opts.querySelectorAll('.cs-opt').forEach(function (x) { x.disabled = true; });
        csMark(b, o.ok ? 'ok' : 'bad');
        saveResult('remk2', { passed: o.ok });
        ctx.setCoachSay(esc(o.reply));
        ctx.enableNext();
        ctx.positionOrb(true);
      });
      opts.appendChild(b);
    });
  }

  // ==========================================================================
  //  WHEN YOU ARE BEHIND — F4 (Feel / Can), sitting immediately before the
  //  simulation, which is the only place it belongs.
  //
  //  Bandura's can-do form: confidence rated against a NAMED obstacle rather
  //  than in the abstract. "How confident are you about sharps disposal"
  //  measures mood; "even when you are behind, the line is waiting, and the
  //  container is on the other side of the building" measures the thing that
  //  actually predicts whether the shortcut gets taken. Every clause in that
  //  statement is an obstacle the module has already shown.
  //
  //  Why it is HERE and not earlier: a rating on this screen followed by a
  //  missed window on the next one is the say-do gap, and putting the two
  //  back to back makes it visible inside a single module rather than across
  //  a pre/post pair nobody joins up. It is the pairing the measurement work
  //  asks for, and it costs forty seconds.
  //
  //  The rehearsal is THRESHOLD-GATED — at or below 3 it appears, above it
  //  the screen advances. Showing an if-then plan to a learner who already
  //  has one teaches nothing and tells them the module was not listening.
  //  Runs on the shared self-efficacy slider from css/layered-beats.css,
  //  which the Bystander module has used since it was built and this one
  //  never had a screen for.
  // ==========================================================================
  var WALK_THRESHOLD = 3;
  var WALK_WORDS = {
    1: 'Not a chance, not on a bad day', 2: 'Probably not', 3: 'Depends on the day',
    4: 'Most of the time', 5: 'Every time'
  };

  function WALK_CONTENT() {
    var L = lens();
    return '<main class="ll-object">' +
      '<div class="ef-wrap">' +
        // F4 is ask+sampled (D6/item 15): only part of the cohort rates this
        // statement at all. Wrapped so a non-sampled learner never sees it —
        // they land straight on the plan below, which runs for everyone.
        '<div id="wkRating">' +
          '<p class="ll-eyebrow">Rate: 1 statement</p>' +
          '<p class="ef-q">“I can carry a used sharp to the container ' +
            '<em>even when I am behind, the line is waiting, and the container is on the ' +
            'other side of the building.</em>”</p>' +
          '<div class="ef-slider">' +
            '<input type="range" id="wkRange" min="1" max="5" step="1" value="3" ' +
              'aria-label="How confident are you, from 1 to 5">' +
            '<div class="ef-scale"><span>1 · Not confident</span><span>5 · Completely</span></div>' +
          '</div>' +
          '<div class="ef-readout"><b id="wkNum">3</b><span id="wkWord">' + esc(WALK_WORDS[3]) + '</span></div>' +
          '<button class="ef-lock" id="wkLock" type="button">Lock it in</button>' +
        '</div>' +

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
    var range = document.getElementById('wkRange');
    var num = document.getElementById('wkNum');
    var word = document.getElementById('wkWord');
    var lock = document.getElementById('wkLock');
    var ratingBox = document.getElementById('wkRating');
    var part1 = document.getElementById('wkPart1');
    var part2 = document.getElementById('wkPart2');
    var conds = document.getElementById('wkConds');
    var route = document.getElementById('wkRoute');
    var commit = document.getElementById('wkCommit');
    var say = document.getElementById('wkSay');
    var note = document.getElementById('wkNote');
    var settled = false, committed = false, cond = null;

    // F4 is ask+sampled (D6/item 15): only part of the cohort rates this
    // statement. D3 (Sustain, the plan below) is a different, unsampled
    // objective and runs for everyone regardless — a non-sampled learner
    // lands straight on it with no rating to react to first.
    if (!sampled('F4')) {
      ratingBox.hidden = true;
      saveResult('walk', { rating: null, sampled: false });
      // Silent — not everyone gets the rating (F4 is ask+sampled), and
      // saying so read as CLARA explaining her own sampling logic rather
      // than coaching the learner. Still has to clear the manifest's
      // "Loading…" placeholder, though.
      ctx.setCoachSay('');
      reinforce(ctx, part1, 1, 2);
      ctx.enableNext();
    } else {
      ctx.setCoachSay('Answer this the way a bad shift actually goes.');

      range.addEventListener('input', function () {
        if (settled) return;
        num.textContent = range.value;
        word.textContent = WALK_WORDS[range.value] || '';
      });

      // ---- the rating (F4, Feel / Can) ----
      lock.addEventListener('click', function () {
        if (settled) return;
        settled = true;
        var v = +range.value;
        range.disabled = true;
        lock.hidden = true;
        saveResult('walk', { rating: v, sampled: true });
        // The threshold decides only what CLARA says about the rating, not
        // whether the plan appears.
        ctx.setCoachSay(v <= WALK_THRESHOLD
          ? 'Plan the walk now, while nothing is pulling at you.'
          : 'A high rating is easiest to keep when the decision is already made. Plan the walk anyway.');
        // Ungated: Continue opens on the rating, so a plan nobody wanted to
        // write never holds the door. And the first part waits for a press
        // rather than covering the line CLARA just delivered.
        ctx.enableNext();
        ctx.setNextAction('Plan the walk', function () {
          reinforce(ctx, part1, 1, 2);
          // setNextAction hands the button back as Continue under the step's own
          // gate, which drops the enableNext() above — so re-open it here or the
          // learner is stranded on a screen that never required an answer.
          ctx.enableNext();
          ctx.positionOrb(true);
        });
        ctx.positionOrb(true);
      });
    }

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
    });
  }

  function low(t) {
    if (!t) return '';
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

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
      '<p class="ll-eyebrow">Perform: live roleplay, about 5 minutes</p>' +
      '<span class="ho-mark" aria-hidden="true"><i class="fa-solid fa-syringe"></i></span>' +
      '<p class="ho-lead">Chris is still on shift, and he is holding an uncapped syringe.</p>' +
      '<p class="ho-lead-sub">It is the end of the day, and he has already offered to walk out ' +
        'together. What you say next is the roleplay.</p>' +
      '<div class="ho-what">' +
        '<p class="ho-what-h">What will happen</p>' +
        '<p class="ho-what-d">You will talk this through with Chris in real time — no list ' +
          'of lines to pick from, just what you would actually say. It runs about five minutes ' +
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
  // ==========================================================================
  //  THE RECORD — ten objectives, each with the policy that governed it and
  //  where its evidence actually came from. D3 is deliberately still open.
  // ==========================================================================
  var RECORD_CONTENT =
    '<main class="ll-object" id="recordObject">' +
      '<p class="ll-eyebrow">Your results</p>' +
      '<h2 id="recHead">Here’s what you showed.</h2>' +
      '<p class="ll-sub">Ten things this module asked of you, and where each answer came from — not a tick for finishing.</p>' +
      '<div class="rec-groups" id="recList"></div>' +
      '<p class="res-basis" id="recBasis"></p>' +
    '</main>';
  // The learner's own record, in the learner's own words. Know / Feel / Do
  // survives as three plain headings and the row icon; the sub-level, the
  // theoretical construct and the assessment policy are gone from this screen —
  // they live in the step captions behind the footer "?" and in the Learning
  // Layer view, which is where a reviewer is looking for them anyway.
  var REC_GROUPS = [
    { head: 'What you know',   ids: ['K1', 'K2', 'K3'] },
    { head: 'How you see it',  ids: ['F1', 'F2', 'F3', 'F4'] },
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
  // what their sector reports — norm misperception is that gap and nothing
  // else. It used to be moveChip(entry answer, "better or worse than that
  // figure"), which are different scales: a learner who said "Most do" and
  // then "About the same" against a 55% majority had agreed with themselves
  // twice and was filed as having moved DOWN.
  //  Graded against the sector's actual figure, not against a majority/not
  //  binary. The binary called "Hardly anyone" CORRECT wherever the figure
  //  came in under half — so the AEC learner who guessed hardly anyone was
  //  filed as having read the room right about 48%, which is nearly half. No
  //  sector in the set sits under 30%, so "hardly anyone" is always an
  //  underestimate, and saying so IS the finding this beat exists to produce.
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
      return 'You saw the figure for your sector and, asked again, said ' + saidAgain + '. ' +
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
                              SILENT: 'stayed silent', BONUS: 'came back as a bonus, unscored' };
  var SCENARIO_TIER_RANK = { MISSED: 0, PARTIAL: 1, SOUND: 2 };
  function scenarioBeats() {
    try {
      var raw = JSON.parse(sessionStorage.getItem('scenario-result:end-of-shift-sharps') || 'null');
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
        ? ['Shown', 'band-exc', 'From the five questions',
           'You put the steps in the right order before the module even started.']
        : (c.remk1 && c.remk1.passed)
          ? ['Taught', 'band-ok', 'From the lesson, the quick check, and a second look',
             'Missed the first check, so the procedure came back a different way — passed on the second look, ' +
             (remk1Modality() === 'tutor' ? 'step by step' : 'in writing') + '.']
          : ['Taught', 'band-ok', 'From the lesson and the quick check',
             'Taught here as ' + (MODALITY_LABEL[c.procedure && c.procedure.modality] || 'a lesson') +
             ', then checked again straight afterwards.'],
      K2: k2TestUp()
        ? ['Shown', 'band-exc', 'From the five questions',
           'You showed you already had this at the start, so the explainer served its harder version with no check afterward.']
        : (c.hazard && c.hazard.passed)
          ? ['Shown',
             'band-exc',
             // Item 19/D7: the source line is honest about WHEN the check
             // actually ran — Listen defers it to the postbattery step, not
             // "after the explainer" like the other two carriers.
             c.hazard.carrier === 'podcast' ? 'From the explainer you listened to, checked later' : 'From the one question after the explainer',
             'You ' + (c.hazard.carrier === 'video' ? 'watched' : c.hazard.carrier === 'podcast' ? 'listened to' : 'read') + ' the explainer, then ' +
             (c.hazard.carrier === 'podcast' ? 'circled back to it at the end of the module and ' : '') +
             (c.hazard.attempts > 1 ? 'got there on the second go: ' : 'got it first go: ') +
             'a needle is dangerous because it makes a route into a bloodstream, not because of how much blood is on it.']
          : c.remk2
            ? (c.remk2.passed
                ? ['Shown', 'band-exc', 'From a second look, in writing',
                   'Missed the check twice, so we looked at it again — that time you had it: the puncture is the mechanism, not the amount.']
                : ['Taught', 'band-warn', 'From a second look, in writing',
                   'Still not landing after a second look. Worth a conversation before the rest of the module leans on it.'])
            : c.hazard
              ? ['Taught', 'band-ok', 'From the one question after the explainer',
                 'You had two tries at the mechanism and I explained it a second way.']
              : ['Taught', 'band-ok', 'From the explainer',
                 'Served in full. This one is the reason for the rest, so it is never shortened.'],
      // Item 16: the harder cases are a permutation, not a re-quiz — proven
      // at the start, served harder, not re-scored.
      K3: k3TestUp()
        ? ['Shown', 'band-exc', 'From the case screens',
           'Proven at the start, so both cases served harder — not re-scored, since you had already shown you get this one. This one is never taken away, only made harder.']
        : ['Taught', 'band-ok', 'From the case screens',
           'Served in full. This one is never shortened, whatever you answer.'],
      F1: (c.case4 && c.case4.post)
        ? ['Recorded', 'band-ok', 'Asked before and after the account',
           'You said where you stood at the start, read what happened to someone doing your job, and answered the same question again.' +
           // Item 15: F1 is remediate — the downstream follow-up only runs
           // when the post answer stayed at Somewhat or below, so a strong
           // agreement here genuinely means no named-person question came up.
           (c.downstream ? namedNote(c)
             : ' You already agreed strongly, so the follow-up question about who is downstream of you never came up.'),
           moveChip(b.f1, c.case4.post)]
        : (c.case4 && c.case4.read)
          ? ['Rated only', 'band-warn', 'From your answer at the start',
             'You read the account but the second answer did not come up in this run, so there is nothing to compare.' + namedNote(c)]
          : ['Rated only', 'band-warn', 'From your answer at the start',
             'You said where you stood at the start. The account from your own sector did not come up in this run.' + namedNote(c)],
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
        ? ['Recorded', 'band-ok', 'Your read at the start, checked against your sector',
           f3Note(b.f3, c.debrief, f3Pct(c.debrief)),
           moveChip(b.f3, c.debrief.post)]
        : c.debrief
          ? ['Rated only', 'band-warn', 'From your answer at the start',
             'You gave your read of the room and saw the figures, but the second answer did not come up in this run.']
          : ['Rated only', 'band-warn', 'From your answer at the start',
             'You gave your read of the room. The figures for your sector did not come up in this run.'],
      F4: (c.walk && c.walk.rating)
        ? [c.walk.rating >= 4 ? 'Recorded · high' : 'Recorded · low', 'band-ok',
           'From your own rating, against a named obstacle',
           c.walk.rating >= 4
             ? 'You rated yourself ' + c.walk.rating + ' of 5 on doing this while you are behind. Read that line next to the scenario below it rather than on its own — a high rating followed by a sharp left on a bench is the finding, and neither means much alone.'
             : 'You rated yourself ' + c.walk.rating + ' of 5 on doing this while you are behind, and got the if-then plan because of it. Recorded as you gave it; a low answer here is more useful than a high one nobody believes.']
        // D6/item 15: ask + sampled — sampled === false means the question
        // genuinely was not put to this sector this run, not that the run
        // is incomplete. The plan below (D3) still ran regardless.
        : (c.walk && c.walk.sampled === false)
          ? ['Not asked', 'band-ok', 'Sampled across your cohort',
             'Not asked of you this time — sampled across your cohort. You still planned the walk below, which every learner does regardless.']
          : ['Not asked', 'band-warn', 'No answer in this run',
             'The rating did not come up, so there is nothing on this line. It is not counted as confidence either way.'],
      // Both of these are shown on the scenario's own page now. The module
      // used to carry a scripted stand-in for them here \u2014 a six-second clock
      // on one button \u2014 and it was cut rather than rebuilt: the scenario's
      // first two beats (decision, pressure) ARE that decision, with a
      // character who argues back, and its third beat (container) takes the
      // route somewhere a multiple choice cannot. Read from the shared
      // player's own write-back (item 13) rather than asserted the same for
      // every run regardless of what actually happened.
      D1: (beats && (beats.decision || beats.pressure))
        ? ['Shown', SCENARIO_TIER_RANK[beats.decision] === 0 || SCENARIO_TIER_RANK[beats.pressure] === 0 ? 'band-warn' : 'band-ok',
           'From the end-of-shift scenario',
           'The decision beat ' + (SCENARIO_TIER_WORD[beats.decision] || 'did not come up') + ', and when he pushed back, the pressure beat ' +
           (SCENARIO_TIER_WORD[beats.pressure] || 'did not come up') + '.']
        : ['In the scenario', 'band-ok', 'From the end-of-shift scenario',
           'Shown where you actually did it, with somebody in front of you rather than a button on a page. The scenario\u2019s own debrief carries what happened.'],
      D2: (beats && beats.container)
        ? ['Shown', SCENARIO_TIER_RANK[beats.container] === 0 ? 'band-warn' : 'band-ok', 'From the end-of-shift scenario',
           'The container beat ' + SCENARIO_TIER_WORD[beats.container] +
           ' \u2014 the container above its fill line that would not close, which is the part no list of options can ask you.' +
           (beats.transfer ? ' The transfer that followed ' + SCENARIO_TIER_WORD[beats.transfer] + '.' : '')]
        : ['In the scenario', 'band-ok', 'From the end-of-shift scenario',
           'Same place \u2014 including the container that was above its fill line and would not close, which is the part no list of options can ask you.'],
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
    // the procedure or testing up on K3 is already visible in the bands
    // below, and CLARA restating it read as a fourth voice for one fact.
    // The one case that keeps a line is the plain one: nothing moved, and
    // nothing on screen already says so.
    var movedLine = (proven || k3TestUp())
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
      'That one came from the five questions at the start. Get those right and you skip the section that teaches it — which is the only place answering well buys you anything.',
      'Spotting unsafe conditions is named in the regulation, so it is never taken away. A strong answer makes it harder instead.',
      'The budget question is recorded and passed on without changing your path — what you chose, and how you rated it afterwards. Those are two different things and I keep them apart.',
      'The last line is your own plan, not a score. Whether it held is a question for the check after the course, and nothing today could answer it.'
    ]);
    ctx.positionOrb(false);
  }

  // ==========================================================================
  //  THE PATH. Entry → Learn → Check → Perform → Record, with the assessment
  //  policy deciding what is here at all.
  // ==========================================================================
  var STEPS = [
    { id: 'intro', mode: 'floating', lesson: 'Welcome', cover: true, nextLabel: 'Start module',
      caption: { title: 'Course title page', note: 'Module 4 of six behavioral outcomes decomposed from Bloodborne Pathogens (RVCT-303B). The sections list renders from the live path, so it foreshadows what the battery can remove.' },
      // Silent. The line here narrated the cover back to the learner \u2014 the
      // sections, the runtime, the exposure plan \u2014 all three of which are on
      // the page in larger type, and "ask me anything" is what the orb's own
      // cue already says. Nothing behind the dot means no dot.
      coach: { say: '' },
      content: INTRO_CONTENT, init: introInit },

    { id: 'battery', icon: 'fa-list-check', mins: 1, stage: 'Entry', lesson: 'Your Starting Point', mode: 'floating', gate: true,
      caption: { title: 'ENTRY · Pre-module battery', note: 'Four items: two gate-flagged Know and two remediate-flagged Feel. NEVER a Do objective — a question cannot credibly measure behavior. The policy chip above each item shows which rule put it here. K1 clean sweep = test-out; it also sets test-up on the content-locked K2.' },
      coach: { say: 'Loading\u2026', teaser: true },
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
      caption: { title: 'LEARN · The premise (K2, Know / Understand)', note: 'The objective the module ran without. Every other outcome in the re-composed course carries an Understand objective; sharps carries none, so its teach content — what a sharp is, that a used one keeps a trace of blood, what that trace can carry — sat in two of their teach lists with no objective claiming it, and this module taught a four-step sequence with no stated hazard behind it. Delivered as ONE screen because it is one chain of reasoning: trace → route → what it carries. The check tests the MIDDLE link, which is where the real misconception lives (people believe a large amount of blood is needed, and that blood on a hand is comparable to blood on a point). Never compressed: a module that removes its own premise to save ninety seconds is a list of rules again. The clip supplied for this beat was the course’s “Controls and Prevention” section video — 9 min 31 s and 145 MB, which is over GitHub’s per-file ceiling and was the largest single line item in the module. It is now cut to the one stretch that shows a sharp being handled at all (3:48–6:00, 2 min 12 s): the engineering-versus-administrative controls comparison and a syringe going into a red container. Worth knowing what that footage is and is not — it shows DISPOSAL, which is K1’s subject and the budget beat’s argument, and it does NOT teach this objective’s mechanism, because nothing in the source does. So the written chain runs ALONGSIDE it rather than as its fallback: dropping any clip onto this beat used to hide the content that actually teaches K2. Anything over 25 MB still STREAMS rather than being fetched whole to a blob, and the eyebrow reports the clip’s real duration read off the file rather than a typed-in estimate.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in hazardInit raises CLARA by itself.
      coach: { say: '' },
      content: HAZARD_CONTENT, init: hazardInit,
      onSkip: function () { saveResult('hazard', { skipped: true }); } },

    { id: 'hzcheck', icon: 'fa-circle-dot', mins: 1, stage: 'Learn', lesson: 'Why a Puncture Is Different', mode: 'floating', gate: true, adaptive: true,
      // K2 test-up (D4/item 9): a learner who already showed they get this at
      // the pre-battery skips the check entirely \u2014 the explainer served its
      // harder permutation instead, with no safety net after it. Item 19/D7:
      // a learner who chose the Listen carrier gets the SAME question later,
      // at the postbattery step \u2014 not skipped, deferred, so it never runs
      // twice for them here.
      when: function () {
        if (k2TestUp()) return false;
        if ((readCourse().hazard || {}).carrier === 'podcast') return false;
        return true;
      },
      caption: { title: 'LEARN \u00b7 The premise, checked (K2)', note: 'K2\u2019s check, lifted onto its own screen. It used to slide in at the foot of the teaching page once the video finished \u2014 a third block under a video and a diagram, carrying a two-line question and three full-sentence answers, which read as more page rather than as a question. Same pattern as the K1 in-flow check now, and the wording cut to what a learner can scan: one line of question, three or four words per answer. The DETAIL moved to CLARA\u2019s replies, which is where an explanation belongs \u2014 an option list only has to be pickable. Tests the MIDDLE link of the chain, where the real misconception lives: people believe a large amount of blood is needed, and that blood on a hand is comparable to blood on a point. Two attempts; a second miss now closes the item outright (item 11) \u2014 the correct option is marked, the set disables, and CLARA states the answer rather than leaving the last live button as a way to overwrite a miss with a pass. Writes to the same record key as before, so the K2 line on the record is unchanged. Gated off entirely on K2 test-up (D4) \u2014 see the battery\u2019s k2up flag. Also deferred, not skipped, when the learner chose the Listen carrier on the explainer (D7/item 19) \u2014 the identical question runs at the postbattery step instead.' },
      // Arrives silent \u2014 the eyebrow states the two-tries rule, so there is
      // no unread dot promising a line the screen already shows.
      coach: { say: '' },
      content: HZCHECK_CONTENT, init: hzcheckInit },

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
      caption: { title: 'LEARN · Case 2 (K3, content-locked)', note: 'Never removed. On test-up the three options are replaced with genuinely arguable ones — the same objective, served harder. 1910.1030(g)(2)(vii)(E): recognition is sector-specific, so a generic pass does not satisfy it. The fill-line specifics in each sector’s scene (three-quarters up the container, packed past a stamped or molded line) are invented for the prototype rather than pulled from a customer’s exposure control plan — chosen because three-quarters full is the common manufacturer convention for a sharps container’s fill line, not a fabricated fraction. A real deployment swaps these for the customer’s own container spec; the correct answer deliberately never states a number (“set by your site’s plan, not by eye”) so the lesson survives that swap unchanged.' },
      // Item 27/A2: same reasoning as case 1 — "this one is about the
      // container, not the sharp" is the posture for the scene, not a
      // reaction to anything the learner does.
      coach: { say: 'Loading…', lead: true },
      content: caseContent(CASE2), init: caseInit(CASE2) },

    { id: 'case3', icon: 'fa-clipboard-question', mins: 1, stage: 'Learn', lesson: 'Left by Someone Else', mode: 'floating', gate: true, adaptive: true,
      caption: { title: 'LEARN · Case 3 (K3)', note: 'The second half of the locked objective: recognizing a condition you did not create. Independent of the other cases — this is what makes Option B compressible without editorial repair.' },
      coach: { say: 'Loading…', lead: true },
      content: caseContent(CASE3), init: caseInit(CASE3) },

    { id: 'case4', icon: 'fa-book-open', mins: 1, stage: 'Learn', lesson: 'A Coworker Got Stuck', mode: 'floating', gate: true,
      // They LEAD here: "no judgment, read it and notice who got hurt" sets
      // the posture for the account, and a learner who skims it because the
      // line was behind the unread dot has missed the beat.
      caption: { title: 'LEARN · Case 4 (F1)', note: 'The Feel load, and the POST leg of the battery’s F1 item — same statement, same three answers, so the two subtract and the reportable figure is the MOVE. No judgment — the account is the argument. Runs identically on every path: Feel never routes past content, and it does not vary this beat either. It was described as “heavier on a low F1” and was not — nothing read the Feel scores except the adjustment screen’s Added row, which is why that row came off rather than being left to describe a difference no learner could see. Making it genuinely heavier here is a live option; if it happens, the row goes back with the weight. NOTE the deck’s own caution: F1 and the debrief carry the module’s entire Feel load, so cutting either for time reverts this to a Know course.' },
      coach: { say: 'Loading\u2026', lead: true },
      content: CASE4_CONTENT, init: case4Init },

    { id: 'controls', icon: 'fa-clipboard-question', mins: 1, stage: 'Learn', lesson: 'Gloves or Containers', mode: 'floating', gate: true,
      caption: { title: 'LEARN · The budget choice (F2, Feel / Value)', note: 'The beat that used to not exist. The record has always printed a line for this objective reading “Recorded · from your own answer”, and nothing in the module ever asked it — an invented line on the one screen whose entire argument is that every line points at a real moment. The scenario is the re-composed course’s own: gloves for every waste handler, or more containers. Their version assesses it with an agreement scale on an empirical claim, which measures knowledge and files it as a value; this splits the two, so the CHOICE is the evidence and the scale afterwards is the self-report. A learner who buys gloves and then rates high on “controls prevent injuries” has told us something one scale never could. Placed AFTER the account because all four sector accounts end with a needle going through a glove — the story earns the question.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in controlsInit raises CLARA by itself.
      coach: { say: '' },
      content: CONTROLS_CONTENT, init: controlsInit,
      onSkip: function () { saveResult('controls', { skipped: true }); } },

    { id: 'downstream', icon: 'fa-pen-to-square', mins: 1, stage: 'Learn', lesson: 'Who Handles Your Waste', mode: 'floating', gate: true,
      // Item 15/D6: F1's remediation, not a screen every learner meets. Fires
      // only when the account's post answer (case4) stayed at Somewhat or
      // below \u2014 a learner who already agreed strongly doesn't need the
      // belief reinforced a second time. Defaults to running when case4
      // hasn't resolved yet (post undefined), so it is never silently
      // dropped by a run that reaches this step out of order.
      when: function () { var p = (readCourse().case4 || {}).post; return p == null || p <= 2; },
      caption: { title: 'LEARN \u00b7 Who is downstream (F1 remediation, Feel / Believe)', note: 'F1 is remediate (D6): this only runs when the account\u2019s post answer (case4) stayed at Somewhat or below \u2014 a learner who already agreed strongly does not need the belief reinforced a second time. One open question, on its own screen. It used to be the sixth element at the foot of the chain beat \u2014 directly under a story about a named stranger on twelve weeks of bloodwork, so a fictional person you were told you hurt and a real person at your own site arrived back to back with nothing saying why the second was being asked. Lifting it out lets it state its own reason BEFORE it asks, which is the one thing it could not do down there: the question works because most people cannot answer it, and that line was previously delivered only after the answer was in. Scored for one thing and NOT by a model \u2014 whether a specific person downstream has a name. That is F1 operationalised; an agreement scale on the same idea has a ceiling nobody falls below. Placed after the budget choice because the account earns that question and the adjacency is deliberate, and the module then widens one step at a time: one real person, the whole room, then the learner under pressure. The answer now reaches the record \u2014 the chain used to save it and nothing ever read it.' },
      coach: { say: 'Loading\u2026' },
      content: DOWN_CONTENT, init: downInit,
      onSkip: function () { saveResult('downstream', { named: null }); } },

    { id: 'debrief', icon: 'fa-square-poll-vertical', mins: 1, stage: 'Learn', lesson: 'What Your Shift Does', mode: 'floating', gate: true,
      caption: { title: 'LEARN · Cohort debrief (F3)', note: 'The norm correction, and the POST leg of a Pre + post objective — the entry battery asked for their read of the room, and this asks them to place their own shift against a figure they now have, so the reportable number is the movement rather than either level. Figures are ILLUSTRATIVE and labelled as such on the screen: no cohort data exists in the source material, and here the number IS the intervention, so an invented norm presented as real would be teaching something we made up. AEC sits just under half on purpose — and the copy branches on whether the sector figure is a majority, because it previously told that learner the shortcut was the outlier while showing them data saying it was not. A real deployment swaps in the customer’s own cohort data in place of these figures — production detail, kept out of the learner-facing disclaimer, which only needs to say the numbers are illustrative.' },
      // Arrives silent — an empty line means no unread dot and no idle
      // hint. The reaction later in debriefInit raises CLARA by itself.
      coach: { say: '' },
      content: DEBRIEF_CONTENT, init: debriefInit },

    { id: 'remk1', icon: 'fa-rotate-left', mins: 2, stage: 'Learn', lesson: 'Another Look: The Procedure', mode: 'floating', gate: true,
      when: function () { var c = readCourse(); return !!(c.inflow && c.inflow.passed === false); },
      caption: { title: 'LEARN · Remediation (K1, gate)', note: 'D2/item 10. K1 gates, so failing the in-flow check does not get to stand: this re-teaches the procedure in whichever modality the learner was not taught in (a different carrier, not a repeat), then asks a fresh item from a 2-item bank. Loops — a new bank item on every miss — until passed, since a gate has no give-up path. Runs only when inflow.passed === false; a learner who passed on the first two tries never sees it.' },
      content: REMK1_CONTENT, init: remk1Init },

    { id: 'remk2', icon: 'fa-rotate-left', mins: 1, stage: 'Learn', lesson: 'Another Look: Why a Trace Matters', mode: 'floating', gate: true,
      when: function () { var c = readCourse(); return !!(c.hazard && c.hazard.passed === false); },
      caption: { title: 'LEARN · Remediation (K2, remediate)', note: 'D2/item 10. K2 is remediate, not gate: one fresh item, one try, then on regardless of the outcome — the same policy already running hzcheck\u2019s own two tries. Runs only when hazard.passed === false.' },
      content: REMK2_CONTENT, init: remk2Init },


    { id: 'walk', icon: 'fa-sliders', mins: 1, stage: 'Learn', lesson: 'When You Are Behind', mode: 'floating', gate: true,
      // They LEAD here too: this is a self-report that is recorded and routes
      // nothing, and saying so BEFORE they rate themselves is what keeps the
      // answer honest. Behind the dot it would arrive too late to matter.
      caption: { title: 'LEARN · Capability under pressure (F4, Feel / Can)', note: 'The objective the module had no screen for. Three of the four Feel determinants that predict this behaviour were covered and the fourth \u2014 whether the learner thinks they CAN do it while they are behind \u2014 was never asked. Bandura\u2019s can-do form, so every clause in the statement is an obstacle the module has already shown, rather than confidence in the abstract, which measures mood. Placed immediately before the simulation on purpose: a high rating here followed by a missed window there is the say-do gap, visible inside one module instead of across a pre/post pair nobody joins up. The rehearsal is threshold-gated at 3 \u2014 showing an if-then plan to a learner who already has one tells them the module was not listening. Flagged ask: it is recorded and never routes anything, because a self-report may not remove content. Runs on the shared self-efficacy slider the Bystander module has always used.' },
      coach: { say: 'Loading\u2026', lead: true },
      content: WALK_CONTENT, init: walkInit,
      onSkip: function () { saveResult('walk', { rating: null, rehearsed: false }); } },

    { id: 'handoff', icon: 'fa-comments', mins: 5, stage: 'Perform', lesson: 'End of Shift', mode: 'floating',
      nextLabel: 'Enter the scenario',
      caption: { title: 'PERFORM · The bridge into the scenario (D11)', note: 'Item 31. This module used to hand off to the culminating scenario with an external redirect and no screen of its own — Continue on “When You Are Behind” bounced the learner straight to the player, whose own establishing card was the only framing anybody got. This screen does that job instead: the moment, in two lines, and what the format actually is, before the one CTA that means it. The player is told to skip its own establishing card in turn (see enact’s ?handoff=1) — showing it too, and asking for a SECOND “step in” tap, would be a third framing of the same moment in a row.' },
      // Silent — the screen states its own purpose in its own copy; there is
      // nothing here for CLARA to react to before the learner has done
      // anything.
      coach: { say: '' },
      content: HANDOFF_CONTENT, init: handoffInit },

    { id: 'enact', icon: 'fa-comments', stage: 'Perform', lesson: 'End of Shift — Live Roleplay',
      // No `mins` here — the 5 minutes this activity takes is now carried by
      // the handoff step above (the one a learner and pathMinutes() both see);
      // this step never renders, so double-counting both would overstate the
      // course's total runtime by 5 minutes.
      // Not a section a learner ever sees — it hands off to another page in
      // the same tick showStep() reaches it (see the engine's `step.external`
      // branch). The handoff screen just above is the real, numbered section;
      // counting this one too would inflate "Section N of total" for a step
      // nobody looks at, the same reason `adjust` carries this flag.
      interstitial: true,
      // Item 19/D7: back to postbattery, not straight to record — the engine
      // walks forward past it automatically for a learner who does not need
      // it (see build()'s deep-link when() walk), so this one URL serves
      // both cases correctly regardless of whether Listen was chosen.
      external: '../../scenario-simulator/composed-scenarios/index.html'
        + '?type=mix-arc&scenario=end-of-shift-sharps&handoff=1&brand=clara'
        + '&back=' + encodeURIComponent('../../lesson-presentation/clara/sharps.html?step=postbattery'),
      caption: { title: 'PERFORM · The culminating activity, four beats (D2)', note: 'The full Scenario Simulator, which this module has always pointed at and never contained \u2014 the previous screen\u2019s caption said so. Four sequential roleplay beats with one AI character: the decision (Chris holding an uncapped syringe, offering to walk out with you), the pressure (his radio goes and he refuses the walk), the complication (the container is above its fill line and will not close) and the transfer (you pass Jacob pulling the break-room bags). Beat 3 is the one that separates following a rule from exercising judgment, which is why it is its own moment rather than a second action inside beat 2. Beat 4 cannot be failed: silence closes it, is not penalised, and is named in the debrief. Authored as a mix-arc curated example rather than a new page \u2014 the converged player already routes ?type= and ?scenario=, so this beat added a scenario and edited no player. Runs on its OWN page, so its rubric evidence lives in its debrief rather than on the record screen below; this beat is where BOTH Do objectives are evidenced now. The module used to carry a scripted stand-in ahead of it \u2014 a real-time scene, a six-second clock and one Dispose button \u2014 and that screen was deleted rather than rebuilt, because the concept was wrong rather than badly executed: the wrong behaviour was not choosable (setting the sharp down was what HAPPENED to a slow reader), the button took keyboard focus the instant it unlocked, and pressing immediately scored the same as pressing at 5.9s. Its route question went with it: this scenario asks the route better, against a container above its fill line that will not close. The record now says both Do lines are evidenced here rather than scoring them off a button.' },
      coach: { say: '' } },

    { id: 'postbattery', icon: 'fa-headphones', mins: 1, stage: 'Record', lesson: 'The Check You Listened Past',
      mode: 'floating', gate: true,
      // Item 19/D7: fires only for a learner who chose Listen on the
      // explainer AND did not test up out of the check entirely — test-up
      // already means no check at all, so a Listen choice there has nothing
      // to defer. Reuses hzcheck's own content/init unchanged: same
      // question, same two tries, same closure (item 11) — the only thing
      // that differs is when it runs.
      when: function () {
        if (k2TestUp()) return false;
        return (readCourse().hazard || {}).carrier === 'podcast';
      },
      caption: { title: 'RECORD · Deferred K2 check (D7)', note: 'The check the Listen carrier held back. Same question, same bank item, same two-tries-then-closure as hzcheck (item 11) — content: HZCHECK_CONTENT, init: hzcheckInit, unchanged. Exists only for a learner who chose Listen and did not already test out of the check via K2 test-up.' },
      coach: { say: 'Circling back to the question the explainer would have led into, since you listened to it instead.', lead: true },
      content: HZCHECK_CONTENT, init: hzcheckInit },

    { id: 'record', icon: 'fa-chart-simple', mins: 1, stage: 'Record', lesson: 'Your Record', mode: 'sidebar',
      caption: { title: 'RECORD · Objective-level record', note: 'Ten objectives, each with the policy that governed it and where its evidence came from. Nine closed, one deliberately open — objective-level performance data from day one, which is what turns provenance into evidence without re-authoring anything. The learner’s view of this screen carries none of that vocabulary: Know / Feel / Do survives as three plain headings and the row icon, and the sub-level, theoretical construct and assessment policy live here and in the Learning Layer view.' },
      coach: { say: '', ask: 'Ask CLARA about your record…' },
      content: RECORD_CONTENT, init: recordInit }
  ];

  // ==========================================================================
  //  Hand it to the engine.
  // ==========================================================================
  LE.register({
    course: COURSE,
    steps: STEPS,
    storageKey: 'sh-course',
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
    lensOrder: ['manufacturing', 'education', 'aec', 'public'],
    // Every beat with a scene in it moves with the sector.
    // Every screen with a scene in it moves with the sector. The chain walks
    // its own incident per sector; the rating screen borrows that chain's clock.
    lensedSteps: { intro: 1, chain: 1, hazard: 1, case1: 1, case2: 1, case3: 1, case4: 1,
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
      id: 'shImagesBtn', icon: 'fa-image', name: 'Visuals',
      note: 'Whether a beat carries art is a derivation decision, not a property of the beat',
      visibleOn: function (step) { return !!IMAGE_STEPS[step.id]; },
      state: function () { return imagesOn() ? 'On' : 'Off'; },
      onClick: function (api) {
        try { sessionStorage.setItem('sh-images', imagesOn() ? 'off' : 'on'); } catch (e) {}
        api.replay();
      }
    }, {
      id: 'shBatteryBtn', icon: 'fa-shuffle', name: 'Battery result',
      note: 'Force the pre-module result and replay the routing it drives',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      state: function () { return batteryResult() === 'proven' ? 'Procedure proven' : 'Not proven'; },
      onClick: function (api) {
        var next = batteryResult() === 'proven' ? 'unproven' : 'proven';
        try { sessionStorage.setItem('sh-battery', next); } catch (e) {}
        var c = readCourse();
        if (c.battery) saveResult('battery', { k1: next, k2up: next === 'proven', k3up: next === 'proven',
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
    }]
  });
})();
