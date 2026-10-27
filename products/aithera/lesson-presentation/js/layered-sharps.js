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
  //  SECTORS — capability 2. Two since 2026-10-01: Manufacturing and Public
  //  Sector (law enforcement), the two the decks, podcast scripts and videos
  //  were produced for. Education and AEC were dropped from the prototype's
  //  scope; their sector lenses and scenario keys came out with them (their
  //  scenarios still exist in scenario-simulator's mix-arc.js). And the
  //  reason there is more than one with swapped nouns: `premise` says whether the
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
      label: 'Law Enforcement', premise: 'find',
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
        src: '../../assets/images/sharps-account-public.jpg',
        alt: 'NEEDS A NEW PHOTO (see chat summary 2026-09-21) — a used hypodermic needle wedged into the back-seat upholstery of a patrol vehicle at night, dome light on.'
      },
      chain: {
        end: 'Remember, you may never meet whoever empties the booking counter’s trash after your shift.',
        avoided: 'Jacob never has to find out whether that needle mattered.',
        setup: { time: '9:40 PM', body: 'You recover a used needle from a subject’s property during a search at the booking counter. Intake is backed up behind you, and both hands are already on the next subject. The designated sharps container is across the intake area. There is also the general trash bin right at the counter.' },
        // No hero image this round — no image-generation tool available
        // this session (see chat summary 2026-09-21). Omitted rather than
        // pointed at a nonexistent file, same as Manufacturing, which also
        // renders without one.
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
  // "Your role" picker (D11) walk the same sectors in the same order,
  // rather than a second literal that can drift from the first.
  var LENS_ORDER = ['manufacturing', 'public'];
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
  var IMAGE_STEPS = {};
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
  // D11: the learner's name — in production it comes from SSO. Here it's a
  // stand-in, seeded from a launch link's ?name= or set from the Demo menu,
  // and "Chris" until either says otherwise. Cleared to empty, every reader
  // falls back to an unnamed line. Read by the path-ready line ("You're all
  // set, Chris").
  var DEFAULT_LEARNER_NAME = 'Chris';
  function savedName() {
    try {
      var v = sessionStorage.getItem('sh-name');
      return (v === null ? DEFAULT_LEARNER_NAME : v).trim().slice(0, 40);
    } catch (e) { return DEFAULT_LEARNER_NAME; }
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
  // basis.
  var SAMPLE_MAP = {
    F2: { manufacturing: false, public: false }
  };
  function sampled(objId) {
    var m = SAMPLE_MAP[objId];
    return !m || !!m[LE.lensId()];
  }
  // 'proven' now means the K1 pre-check question was answered correctly,
  // which serves case 1's harder (test-up) version. Kept under its old name
  // for the Demo menu's sh-battery override and the code that reads it.
  function batteryResult() { return k1TestUp() ? 'proven' : 'unproven'; }
  // K2's own pre-check question decides case 2's test-up, independently of K1.
  function k2Correct() {
    try { var o = sessionStorage.getItem('sh-battery');
          if (o === 'proven') return true; if (o === 'unproven') return false; } catch (e) {}
    return !!(readCourse().battery || {}).k2up;
  }
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
  // Deck-aligned 2026-09-22: every case now has alternate versions (base /
  // test-up / reinforced) of which a learner sees ONE, so summing every step
  // double-counted them. Counts the path as it currently stands instead —
  // before the pre-check, that is the standard path.
  function pathMinutes() {
    var full = 0;
    STEPS.forEach(function (st) { if (st.mins && (!st.when || st.when())) full += st.mins; });
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
  // Names (2026-09-23): the six behavioral-outcome modules from the ideal
  // prototype deck's recomposition slide (BO-1 to BO-6), matching
  // clara/bloodborne.html. Minutes (2026-09-23, stakeholder feedback): fixed per module, roughly
  // proportional to each module's LO count in the source material. They
  // sum to 59, down from the ~92 the old illustrative numbers added up to. Sharps shows its
  // fixed 10 too, not the live pathMinutes() total.
  // Tags (2026-09-25): which modules adapt to the pre-check, and which can
  // be taken as one continuous podcast. Illustrative on every row but
  // Sharps, whose two are real — partly here to see how learners react to
  // "podcast" named as a way to take a module, before it is ever offered.
  var COURSE_MODULES = [
    { id: 'm1', name: 'Know the Risk', icon: 'fa-virus', mins: 11, state: 'done', adaptive: true },
    { id: 'm2', name: 'Barrier First', icon: 'fa-shield-halved', mins: 10, state: 'done' },
    { id: 'm3', name: 'Control the Hazard', icon: 'fa-sitemap', mins: 11, state: 'done', adaptive: true, podcast: true },
    { id: 'm4', name: 'Contain the Sharp', icon: 'fa-syringe', mins: 10, current: true, adaptive: true, podcast: true },
    { id: 'm5', name: 'Gear Up, Gear Down', icon: 'fa-mask-face', mins: 8, state: 'locked', podcast: true },
    { id: 'm6', name: 'Act on Exposure', icon: 'fa-file-medical', mins: 9, state: 'locked', adaptive: true }
  ];
  // The rows this cover lists. An admin preview shows only the modules the
  // assignment picked, as a new learner would meet them: nothing done yet,
  // and every module but this one marked as not in the preview, since only
  // Contain the Sharp is built.
  function courseModules() {
    if (!AP) return COURSE_MODULES;
    return COURSE_MODULES.filter(function (m) { return AP.modules.indexOf(m.id) > -1; })
      .map(function (m) { return m.current ? m : { id: m.id, name: m.name, icon: m.icon, mins: m.mins, adaptive: m.adaptive, state: 'preview' }; });
  }
  // Tags only on modules still to take: they help a learner decide how to
  // take one, and on a finished module they're noise (2026-09-25 review).
  // No audio tag (2026-10-27): the preference card already says Listening
  // applies to modules that offer it, so the row doesn't repeat it.
  function moduleMeta(m) {
    var tags = m.state !== 'done';
    return '<span class="cp-row-meta"><span>About ' + m.mins + ' min' + (m.mins > 1 ? 's' : '') + '</span>' +
      (tags && m.adaptive ? '<span class="adapt"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>Adaptive</span>' : '') +
    '</span>';
  }
  function INTRO_CONTENT() { var L = lens(); return '' +
    '<main class="ll-object">' +
      '<div class="cp-page">' +
        '<header class="cp-hero-band">' +
          '<div class="cp-hero">' +
            '<p class="ll-eyebrow">' + courseModules().length + (courseModules().length === 1 ? ' Module' : ' Modules') + '</p>' +
            '<h1>Bloodborne Pathogens</h1>' +
            '<p class="cp-desc" id="cpDesc">Bloodborne pathogens are microorganisms such as viruses or bacteria that, if ' +
              'present in blood, can cause disease in humans. These pathogens can be transmitted from an ' +
              'infected person to a healthy person by contact with infected blood or other bodily fluids. ' +
              'There are a number of relatively simple actions which can be taken to drastically reduce the ' +
              'chance of exposure to bloodborne pathogens. Depending on the type of work being done, workplace ' +
              'practices and methods can be modified to minimize the chance of exposure. Proper personal ' +
              'protective equipment is an important component in preventing the transfer of bloodborne ' +
              'pathogens from an infected person to a healthy person.</p>' +
            '<div class="cp-chips">' +
              '<span class="cp-chip due"><i class="fa-solid fa-calendar-day"></i> Required · due Oct 3</span>' +
              '<span class="cp-chip"><i class="fa-solid fa-briefcase"></i> ' + esc(L.label) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="cp-art"><img src="../../assets/images/sharps-header.jpg" alt="" /></div>' +
        '</header>' +
        '<div class="cp-grid">' +
          '<section class="cp-sections">' +
            '<div class="cp-sec-head"><h2>Course modules</h2></div>' +
            '<div id="cpRows"></div>' +
          '</section>' +
          '<aside class="cp-rail">' +
            // 2026-09-29: the card sets the learner's MODE preference (the
            // one the "How do you prefer to learn?" screen reads), not a
            // per-screen format. 2026-10-27: it offers that screen's own
            // three options — Watching / Listening / Reading — rather than
            // Classic / Listen mode.
            '<div class="cp-card cp-format"><h3>How you prefer to learn</h3>' +
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
                offeredKeys(), null, MODE_CARD) +
              // The current choice's one-line description, the same line the
              // "How do you prefer to learn?" screen shows under it (OFFER
              // sub). It replaced Listening's own note + help tooltip
              // (2026-10-27); Listening adds only its "modules that offer
              // it" caveat.
              '<p class="cp-format-note" id="introModNote" aria-live="polite"></p>' +
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

    // 2026-10-24: a long course description (the official one is a full
    // paragraph) shows three lines, cut at a word with "… More" sitting at
    // the end of the third line; More expands it in place with "Less" at
    // the end. Fitted by measuring, not CSS line-clamp, so the button lands
    // exactly where the text stops. A short description shows no button.
    var desc = document.getElementById('cpDesc');
    if (desc) {
      var full = desc.textContent, words = full.split(' '), open = false;
      var more = document.createElement('button');
      more.type = 'button'; more.className = 'cp-desc-more';
      more.setAttribute('aria-controls', 'cpDesc');
      // offsetHeight, not the bounding box: the screen scales in on entry,
      // and a transformed box would under-count lines mid-animation.
      var lines = function () { return Math.round(desc.offsetHeight / parseFloat(getComputedStyle(desc).lineHeight)); };
      var fit = function () {
        desc.textContent = full;
        if (open) { desc.append(' '); }
        else if (lines() <= 3) { return; }
        else {
          // Longest run of whole words that still leaves room for "… More".
          var lo = 1, hi = words.length - 1;
          while (lo < hi) {
            var mid = Math.ceil((lo + hi) / 2);
            desc.textContent = words.slice(0, mid).join(' ').replace(/[,.;:]$/, '') + '\u2026 ';
            desc.appendChild(more);
            if (lines() <= 3) lo = mid; else hi = mid - 1;
          }
          desc.textContent = words.slice(0, lo).join(' ').replace(/[,.;:]$/, '') + '\u2026 ';
        }
        more.textContent = open ? 'Less' : 'More';
        more.setAttribute('aria-expanded', String(open));
        desc.appendChild(more);
      };
      more.addEventListener('click', function () { open = !open; fit(); more.focus(); });
      fit();
      // Again once the web font is in: it sets wider than the fallback.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (document.body.contains(desc)) fit(); });
      var fitT, onResize = function () {
        if (!document.body.contains(desc)) { window.removeEventListener('resize', onResize); return; }
        clearTimeout(fitT); fitT = setTimeout(fit, 120);
      };
      window.addEventListener('resize', onResize);
    }

    // D11: resumable progress now lives on the Sharps row itself (see the
    // "resume" state below) instead of a banner above the page. Anything
    // past the cover counts as progress worth resuming. LE.goTo refuses a step the current path no longer contains
    // (a when()-excluded remediation, say), which here just means Resume
    // quietly does nothing rather than stranding anyone; Start over always
    // works regardless.
    var last = LE.lastStepId();
    var hasProgress = !!(last && last !== 'intro' && LE.stepById(last));


    document.getElementById('cpRows').innerHTML = courseModules().map(function (m) {
      if (!m.current) {
        return '<div class="cp-row' + (m.state === 'done' ? '' : ' is-locked') + '">' +
          '<span class="cp-row-ico"><i class="fa-solid ' + m.icon + '"></i></span>' +
          '<span class="cp-row-main"><b>' + esc(m.name) + '</b>' + moduleMeta(m) + '</span>' +
          '<span class="cp-row-state ' + (m.state === 'preview' ? 'locked' : m.state) + '">' +
            (m.state === 'done' ? 'Complete' : m.state === 'preview' ? 'Not in preview' : 'Locked') + '</span>' +
        '</div>';
      }
      // Sharps is the only module with real content behind it, so it's the
      // only row this page can act on. Resume gets two separate buttons
      // ("Resume" and "Start over" are different actions, neither should be
      // guessable from tapping the row body) — but up next has exactly ONE
      // possible action, so the whole row can safely be that action.
      var icoMain = '<span class="cp-row-ico"><i class="fa-solid ' + m.icon + '"></i></span>' +
        '<span class="cp-row-main"><b>' + esc(m.name) + '</b>' + moduleMeta(m) + '</span>';
      if (hasProgress) {
        return '<div class="cp-row is-current">' + icoMain +
          '<span class="cp-row-state-wrap">' +
            '<button class="cp-row-reset" type="button" data-action="reset" title="Start over" aria-label="Start over"><i class="fa-solid fa-rotate-left"></i></button>' +
            '<button class="cp-row-state resume" type="button" data-action="resume">Resume</button>' +
          '</span>' +
        '</div>';
      }
      return '<button class="cp-row is-current is-startable" type="button" data-action="start" aria-label="Start ' + esc(m.name) + '">' + icoMain +
        '<span class="cp-row-state todo">Start</span>' +
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
      ['sh-course', 'sh-course-last', 'sh-images', 'sh-battery', 'sh-feel', 'sh-doobject-mode', 'sh-modality']
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
        { btn: 'introModChange', wrap: 'introModPickWrap', icon: 'introModNowIcon', label: 'introModNowLabel' },
        MODE_CARD);
      // No saved preference reads as Watching, the default — the offer
      // screen still treats it as unsaved and offers to save one.
      var curMode = function () { var k = offerPref() || 'video'; return offeredKeys().indexOf(k) > -1 ? k : offeredKeys()[0]; };
      var markFmt = function (k) {
        [].forEach.call(introPick.querySelectorAll('.md-opt'), function (b) {
          var on = b.dataset.m === k;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
      var note = document.getElementById('introModNote');
      var showNote = function (k) {
        if (!note) return;
        var o = OFFER.filter(function (x) { return x.key === k; })[0];
        note.textContent = (o ? o.sub : '') + (k === 'listen' ? ' Applies to modules that offer it.' : '');
      };
      introDD.render(curMode());
      markFmt(curMode());
      showNote(curMode());
      introPick.addEventListener('click', function (e) {
        var b = e.target.closest('.md-opt');
        if (!b) return;
        setOfferPref(b.dataset.m);
        markFmt(b.dataset.m);
        showNote(b.dataset.m);
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
  //  THE DECK BEATS (2026-09-22). Every learner-facing screen between the
  //  pre-check and the scenario hand-off is now authored straight from the
  //  stakeholder deck, Contain_the_Sharp_Manufacturing (2).pdf, slides 2–22.
  //  Copy below is the deck's own, verbatim — questions, choices, narration
  //  and correct-answer feedback. The previous cut of these screens (the
  //  chain, the hazard article, the procedure, the case ladder, the budget
  //  choice, the walk plan…) is preserved as a frozen snapshot in
  //  experiments/sharps-riffs/00-sharps-module/.
  //
  //  One shape for every content screen: a Watch or Read carrier of the
  //  slide's narration — whichever the learner chose on the format screen,
  //  the same one on every screen (see THE STAGE) — and, when the slide has
  //  one, a question laid over it with the reinforcement layer once the
  //  carrier is finished. Watch finishes when the clip ends (no learner-facing
  //  way past it; Skip exists only in review mode), Read on the learner's own
  //  "Done reading" (the in-flow button on the last paragraph).
  // ==========================================================================

  // One placeholder clip for every screen until the produced videos exist.
  // Short on purpose, so the video → question hand-off is quick to review.
  var DECK_VIDEO = '../../assets/videos/sharps-doobject-baseline.mp4';
  // The Watch videos (2026-10-01): the pipeline's generated renders from
  // https://d3kztbm322cbfq.cloudfront.net/learning-layer-poc/reports/bbp-module4-example-videos.html
  // — every screen, both sectors, in two art styles. Each one narrates the
  // LED transcript for its objective / sector / version word for word. Used
  // as delivered: the generator's own checks flagged issues in most of them
  // (listed on that page) and none were fixed. Hot-linked from CloudFront
  // (CORS open, a year's cache) rather than copied into the repo — the set is
  // ~400 MB. Page → screen: K1/K2 Base / Test-up / Remediation → c1/c2 base /
  // up / rem; F2 → controls; F1 → case3 / case3rf; F3 → debrief / debriefrf.
  // The two "our own authoring" K1 remediation cuts on that page are not used.
  // Demo → "Video style" switches photoreal (default; fewer flagged issues) / 2D.
  var VIDEO_BASE = 'https://d3kztbm322cbfq.cloudfront.net/learning-layer-poc/';
  var DECK_VIDEOS = {
    manufacturing: {
      c1base: {
        photo: '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/3ce15d61-3eb2-5f30-8596-519241f42322/344642d0-ade6-4df7-bea2-2f628f16d926/final.mp4',
        '2d': '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/a6e195be-9744-5201-b9ff-905e1eba8b3b/413d1239-825d-4b75-a444-d5539ce3c7f5/final.mp4'
      },
      c1up: {
        photo: '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/70f3ac7c-85a7-5965-8875-388d253d5127/82f86490-fe82-47e3-b330-b957c9652682/final.mp4',
        '2d': '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/07c50edd-b566-5d9f-97a0-780e09d15ee3/3ab0b39a-f832-4603-8435-2023b2889a94/final.mp4'
      },
      c1rem: {
        photo: '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/b59b005f-be46-5a9f-b84f-c5ab484f4897/b1c18168-6011-4af4-9b14-5be67c6692e7/final.mp4',
        '2d': '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/f9512dd1-984d-5f11-89cb-a92dbe9eb307/299fcd7f-a9d8-406f-9d3d-25baad37b45f/final.mp4'
      },
      c2base: {
        photo: 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/c7e8a8ad-7ef9-50f4-8d72-07c6243b613f/12c4b164-2744-46c5-90ef-58dbbd22b958/final.mp4',
        '2d': 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/93a1abf8-c3fd-53c1-b624-8490ddfd4303/b4c53aad-4721-46d6-8e1c-def6bff3847a/final.mp4'
      },
      c2up: {
        photo: 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/60d878d7-93dc-5c20-a039-c04622cda883/0552fa6f-3fab-4c40-b6b2-c4b7ef0d8ff7/final.mp4',
        '2d': 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/10c1ea17-9a96-5397-895f-deef61cab14e/aec4edd4-5c06-4670-b464-f50667ea7309/final.mp4'
      },
      c2rem: {
        photo: 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/69483584-64a0-507f-a4a8-1738caff497b/423b9f5e-9831-4d04-9a71-3c005f220d74/final.mp4',
        '2d': 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/5218956c-4302-5d51-8c9b-efb8a5c6546a/4e3925b1-8db1-477c-b6da-254179a20856/final.mp4'
      },
      controls: {
        photo: '7b8e4ee3-cbed-51fd-b8af-a7ec2aef8b1f/video/fedeab61-bda5-5e25-9492-1a024481a93b/d525b4ae-72d4-4ba8-83f2-717b23750d09/final.mp4',
        '2d': '7b8e4ee3-cbed-51fd-b8af-a7ec2aef8b1f/video/365b5a0a-e089-5e8c-98fd-8b061b5523ed/ef9e1b32-0032-4b5a-a774-a32f42eb72b5/final.mp4'
      },
      case3: {
        photo: '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/d701591d-ed75-5574-943c-323a40a9ca00/0ad62db9-46da-4a30-bad7-4b10adc1139c/final.mp4',
        '2d': '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/c8a3eb19-99f4-5fcd-9c65-7eb276be9987/ac5cf2b9-3700-4fb3-bb1c-e67edc0d5a77/final.mp4'
      },
      case3rf: {
        photo: '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/795cd3d3-0e75-533e-8887-fd488efc4cda/62a167af-0197-4bbc-8658-0538d0077a99/final.mp4',
        '2d': '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/3e5a8838-3aa2-547d-96f2-c1cf75ee3b54/d0f76416-4b41-4d2e-8643-aae1f8bf2603/final.mp4'
      },
      debrief: {
        photo: '83c5c679-76ba-59ff-81db-dd810847bf46/video/c8086b94-140e-5f60-a38d-35f8e1548800/5945f93f-7989-41aa-97cc-bfc392203a38/final.mp4',
        '2d': '83c5c679-76ba-59ff-81db-dd810847bf46/video/ff4622d6-4b65-530d-bcc4-a560967385ab/28c40aba-5eb7-4f81-9476-5dd6d5b83b7d/final.mp4'
      },
      debriefrf: {
        photo: '83c5c679-76ba-59ff-81db-dd810847bf46/video/0704a45c-a338-5116-af63-47331c012787/a1f38a78-61be-4638-bf53-81b3783c49c5/final.mp4',
        '2d': '83c5c679-76ba-59ff-81db-dd810847bf46/video/274c20a3-338b-51b7-b446-071ab9958fbb/a2fb6da4-b125-4c4e-8409-7de9cfe59a75/final.mp4'
      }
    },
    public: {
      c1base: {
        photo: '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/905d14fa-fdb3-58ee-a293-36e2dcc1a741/f26e8a64-918d-4f81-a06e-e08d8d44b74d/final.mp4',
        '2d': '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/52d1e36c-cb28-53de-9158-33f7fa0bcece/a0ce19dd-8428-4387-90b9-31db01ef6078/final.mp4'
      },
      c1up: {
        photo: '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/ad3b2279-1cea-50ab-9cd6-a07eb1f4cb12/eb1da384-ca05-4641-ba53-76d6c2c46239/final.mp4',
        '2d': '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/a687ed27-a07d-5cc7-828d-7c392b327e7f/31a31fb7-4729-40e3-9ead-9fe44766a0f4/final.mp4'
      },
      c1rem: {
        photo: '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/d5420273-9f20-55ea-9324-6cd7a7854bea/a28e33bc-6f6e-4653-9c0d-bffa80b657e4/final.mp4',
        '2d': '47a3bd19-4b28-5368-957a-0ee8a540b3b6/video/9045eb88-5418-5ed8-af5b-aa06f0715982/a5166fb4-7519-46f3-9383-4c64f58c1def/final.mp4'
      },
      c2base: {
        photo: 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/25e5d2b5-842d-50c9-ae09-38efcbef4f0e/345d1d47-5c40-4137-aa99-306711603f28/final.mp4',
        '2d': 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/2fdede5c-eb98-534a-b55d-67cb6f12df7e/ce294485-733c-4c06-95a7-8a3fa0b61246/final.mp4'
      },
      c2up: {
        photo: 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/bf32aa09-c3b9-58c8-a94b-61e30880ebf2/3874735c-945c-41d2-860a-a3b4f8586f7e/final.mp4',
        '2d': 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/bb751edf-7e98-515b-9aa5-35ce53e5998a/1b8ba614-d569-4d4d-84bf-88d0cc2bb308/final.mp4'
      },
      c2rem: {
        photo: 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/3c3a52e7-153c-505d-8225-41833af50505/36f74b38-2dbd-488c-b8a8-f02dd0715055/final.mp4',
        '2d': 'd54f4602-895c-5c04-86f0-0664acddb0e9/video/ec9603c0-1e25-519c-b190-a7cceb50f743/5f58eb4e-29ba-4702-ba81-c61340c15047/final.mp4'
      },
      controls: {
        photo: '7b8e4ee3-cbed-51fd-b8af-a7ec2aef8b1f/video/33371f4e-30af-536c-9654-45fecf8a5555/af6caa95-75ea-4aa9-82bc-379b159962ed/final.mp4',
        '2d': '7b8e4ee3-cbed-51fd-b8af-a7ec2aef8b1f/video/2b5abf5a-6bd1-50ef-bca7-416fca4c4cde/bbe0aa23-ee4f-42b0-81b3-0c179ee23cf9/final.mp4'
      },
      case3: {
        photo: '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/cfa91e3a-2783-5814-ad6b-4d9c09bd4e07/9344f44f-6414-4d18-82db-db2683cacd0b/final.mp4',
        '2d': '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/0bb597d1-db11-5738-b87f-ae02f92bf911/3a6223a4-4478-48af-9e94-a23a75cf2a87/final.mp4'
      },
      case3rf: {
        photo: '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/18934b17-e1b1-563c-aa84-502f1a18f751/072a8a73-96db-4463-b303-52c0d4dd905e/final.mp4',
        '2d': '4e514fec-8d29-5db5-a15d-cf43a3b6ecb7/video/a8c9cba8-16de-5dfb-a89d-4458b7d70a4d/d56259ca-72f6-4ecb-988b-43feb364527c/final.mp4'
      },
      debrief: {
        photo: '83c5c679-76ba-59ff-81db-dd810847bf46/video/7fd5d3bc-cb04-5748-aad5-8a9e62e66b0b/327abac0-b7e5-4225-bdf5-ba2d34d075f9/final.mp4',
        '2d': '83c5c679-76ba-59ff-81db-dd810847bf46/video/2c074218-05d0-513f-8457-4ff66cd33871/5a4c7de1-d8fd-4574-9eb2-e4dc6d446cc7/final.mp4'
      },
      debriefrf: {
        photo: '83c5c679-76ba-59ff-81db-dd810847bf46/video/7f8d1684-bcf5-5797-99b8-fbecfb9b5b5e/4af28e23-0bf1-4507-be6f-bb65c787a718/final.mp4',
        '2d': '83c5c679-76ba-59ff-81db-dd810847bf46/video/df7fc3c6-1e19-5f29-91df-a73413d42cf4/51e40195-4064-480d-bd23-11ea6aa839d6/final.mp4'
      }
    }
  };
  function videoStyle() {
    try { return sessionStorage.getItem('sh-video-style') === '2d' ? '2d' : 'photo'; } catch (e) { return 'photo'; }
  }
  // This screen's video in the current sector and style; the placeholder only
  // if a screen has none.
  function deckVideo(id) {
    var v = (DECK_VIDEOS[LE.lensId()] || DECK_VIDEOS.manufacturing)[id];
    return v ? VIDEO_BASE + v[videoStyle()] : DECK_VIDEO;
  }
  // Buffering ahead (2026-10-01): while one screen plays, quietly download
  // the NEXT Watch video on the learner's path into the browser cache
  // (CloudFront sends a year's cache-control), so it starts at once instead
  // of streaming in from cold. One clip ahead, low priority, never twice.
  // "Next" is judged on the path as it stands now — a remedial screen that
  // a later miss adds isn't warmed, which only costs it the head start.
  // Skipped on the Listen-mode path, which has no Watch screens.
  var warmed = {};
  function warmNextVideo(afterId) {
    if (podcastPath()) return;
    var i = STEPS.findIndex(function (s) { return s.id === afterId; });
    for (var k = i + 1; k > 0 && k < STEPS.length; k++) {
      var st = STEPS[k];
      if (st.when && !st.when()) continue;
      if (!DECK_VIDEOS.manufacturing[st.id]) continue;
      var url = deckVideo(st.id);
      if (warmed[url]) return;
      warmed[url] = true;
      try {
        fetch(url, { mode: 'cors', priority: 'low' })
          .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
          .catch(function () { delete warmed[url]; });
      } catch (e) {}
      return;
    }
  }
  var LIKERT_ENDS = ['Strongly Disagree', 'Strongly Agree'];
  var LETTERS = 'ABCDEFGH';

  // ---- The question formats ------------------------------------------------
  // Two formats, shared by the pre-check stack and the questions laid over
  // the videos, so the same question looks the same wherever it is asked.
  // `live` false renders the static preview the battery stack peeks behind
  // the current card: same markup, no buttons, nothing focusable.
  function mcqHtml(options, live) {
    return '<div class="cs-opts dk-opts"' + (live ? ' role="radiogroup"' : '') + '>' +
      options.map(function (o, i) {
        var inner = '<span class="cs-mark dk-letter" aria-hidden="true">' + LETTERS.charAt(i) + '</span>' +
                    '<span class="cs-opt-t">' + esc(o.t) + '</span>';
        return live
          ? '<button class="cs-opt" type="button" role="radio" aria-checked="false" data-i="' + i + '" ' +
              'aria-label="' + esc(LETTERS.charAt(i) + '. ' + o.t) + '">' + inner + '</button>'
          : '<div class="cs-opt">' + inner + '</div>';
      }).join('') +
    '</div>';
  }
  function likertHtml(live) {
    var pts = '';
    for (var v = 1; v <= 5; v++) {
      var name = v + (v === 1 ? ', ' + LIKERT_ENDS[0] : v === 5 ? ', ' + LIKERT_ENDS[1] : '');
      pts += live
        ? '<button class="lk-pt" type="button" role="radio" aria-checked="false" data-v="' + v + '" ' +
            'aria-label="' + esc(name) + '">' + v + '</button>'
        : '<span class="lk-pt">' + v + '</span>';
    }
    return '<div class="lk"' + (live ? ' role="radiogroup" aria-label="' +
        esc('1, ' + LIKERT_ENDS[0] + ', to 5, ' + LIKERT_ENDS[1]) + '"' : '') + '>' +
      '<div class="lk-pts">' + pts + '</div>' +
      '<div class="lk-ends" aria-hidden="true"><span>' + esc(LIKERT_ENDS[0]) + '</span>' +
        '<span>' + esc(LIKERT_ENDS[1]) + '</span></div>' +
    '</div>';
  }
  // Wires a rendered question: a pick lights the choice and arms the submit
  // button, and only the submit counts — a mis-tap never scores anyone.
  // Calls onCommit(value, pickedEl), value being the option index (multiple
  // choice) or 1–5 (likert).
  function wireChoice(host, btn, onCommit) {
    var sel = null, settled = false;
    var radios = [].slice.call(host.querySelectorAll('[role="radio"]'));
    radios.forEach(function (r) {
      r.addEventListener('click', function () {
        if (settled) return;
        if (sel) sel.setAttribute('aria-checked', 'false');
        sel = r;
        r.setAttribute('aria-checked', 'true');
        btn.disabled = false;
      });
    });
    LE.pickGroup(host);
    btn.disabled = true;
    btn.onclick = function () {
      if (settled || !sel) return;
      settled = true;
      host.classList.add('answered');
      radios.forEach(function (r) { r.disabled = true; });
      onCommit(sel.dataset.v ? +sel.dataset.v : +sel.dataset.i, sel);
    };
  }

  // ---- The pre-check items (slides 2–4) ------------------------------------
  // Two knowledge questions that decide test-up (K1 → case 1, K2 → case 2)
  // and two agreement statements that set the baseline for the same
  // statements asked again after case 3 and the debrief. A low agreement
  // (neutral or below) serves the longer, reinforced version of that video.
  var K1_PRE = {
    obj: 'K1', type: 'mcq',
    stem: 'Which of these correctly describes how to dispose of a used hypodermic needle?',
    correct: 0,
    options: [
      { t: 'Place it in a designated sharps container immediately or as soon as possible.' },
      { t: 'Recap the needle carefully, then place it in the nearest trash can.' },
      { t: 'Bend or break the needle so it can’t poke anyone, then throw it away.' },
      { t: 'Wrap it in a paper towel and put it in a sealed plastic bag before disposal.' }
    ]
  };
  var K2_PRE = {
    obj: 'K2', type: 'mcq',
    stem: 'Which of these should be treated as a sharps hazard?',
    correct: 0,
    options: [
      { t: 'A used sharp set down on a work surface.' },
      { t: 'A used sharp already dropped into a designated sharps container.' },
      { t: 'A used sharp in hand, on its way to the sharps container.' },
      { t: 'A work surface cleared and wiped down at the end of the last shift.' }
    ]
  };
  var F1_STATEMENT = 'When I dispose of a sharp, I am making a safety decision that affects not just ' +
    'myself, but every coworker who handles waste downstream.';
  var F3_STATEMENT = 'Most people on my shift use the sharps container right away instead of setting ' +
    'a used sharp down for a moment.';
  // Learner-facing copy on every deck screen is the deck's own — nothing is
  // added around it (no hints, no wrong-answer lines, no invented labels).
  var F1_ITEM = { obj: 'F1', type: 'likert', stem: '\u201c' + F1_STATEMENT + '\u201d' };
  var F3_ITEM = { obj: 'F3', type: 'likert', stem: '\u201c' + F3_STATEMENT + '\u201d' };

  // ---- Routing ---------------------------------------------------------------
  // The Demo menu can force either side of a routing decision (sh-battery for
  // the two knowledge questions, sh-feel for the two agreement statements);
  // otherwise the pre-check's own record decides.
  // Admin preview (js/admin-preview.js): the assignment's own settings. Off
  // for a learner, where every rule below runs as authored.
  var AP = window.AdminPreview || null;
  function testUpOn() { return !AP || AP.testUp; }
  function testOutOn() { return !AP || AP.testOut; }
  function extraOn() { return !AP || AP.extra; }
  // k1Correct/k2Correct: what the pre-check answer was. k1TestUp/k2TestUp:
  // whether that answer serves the harder version, which "Harder checks" off
  // (an admin setting) prevents. Listen mode's skip reads the raw answer.
  function k1TestUp() { return testUpOn() && k1Correct(); }
  function k2TestUp() { return testUpOn() && k2Correct(); }
  function k1Correct() {
    try { var o = sessionStorage.getItem('sh-battery');
          if (o === 'proven') return true; if (o === 'unproven') return false; } catch (e) {}
    return !!(readCourse().battery || {}).k1up;
  }
  function feelLow(key) {
    try { var o = sessionStorage.getItem('sh-feel');
          if (o === 'low') return true; if (o === 'high') return false; } catch (e) {}
    var v = (readCourse().battery || {})[key];
    return v != null && v <= 3;
  }
  // A knowledge check the learner missed, on either permutation, serves that
  // case's remedial video (slides 6/9 → 7, 11/14 → 12).
  function checkMissed(key) {
    var r = readCourse()[key];
    return !!(r && r.passed === false);
  }

  // ---- Screen content (slides 5–22) -----------------------------------------
  // `narration` is the slide's NARRATION block, verbatim, split into
  // paragraphs only where the Read carrier needs a breath.
  var DECK = {
    c1base: {
      title: 'The blade at the bench',
      narration: [
        'You’ve just changed out a used box-cutter blade at your bench. The designated sharps container is down at the end of the line, and the used blade is still at your bench. Like a needle or other sharp object, the blade is considered a sharp because it can puncture or cut the skin.',
        'Whether or not it’s visibly contaminated, an exposed blade left on a surface is a hazard to the next person who reaches for that spot — which is why the safe-handling procedure applies to every sharp, every time.',
        'Plan how you’ll dispose of it, use a safer alternative when one exists, and activate any available safety feature. Once used, don’t recap, bend, or break a sharp. Put it directly into a designated sharps container.'
      ],
      check: { kind: 'mcq', key: 'k1check', variant: 'base',
        stem: 'You have a used sharp to deal with, and the designated sharps container is at the other end of your work area. What do you do with it right now?',
        correct: 0,
        options: [
          { t: 'Dispose of it in the sharps container following your workplace’s approved procedure.' },
          { t: 'Set it down where you’re working and get back to the task.' },
          { t: 'Wrap it and drop it in the general-waste bin.' },
          { t: 'Bend or break it so it can’t cut anyone, then put it in the regular bin.' }
        ],
        okFb: 'Plan the disposal route before you handle the sharp, then place the used sharp directly into a designated sharps container following your workplace’s approved procedure.' }
    },
    c1rem: {
      recheck: { of: 'k1check', key: 'k1recheck', base: 'c1base', up: 'c1up' },
      title: 'The blade at the bench',
      narration: [
        'You’re cleaning up your workstation after changing a cutting blade. The used blade is still in your hand, and you’re deciding how to handle it before moving on.',
        'Snapping it or setting it aside might seem like ways to make it safer, but they don’t properly contain the sharp. Depending on your facility’s procedures, you may need to wrap the exposed edge before disposal.',
        'Once a sharp is used, don’t recap, bend, or break it, and don’t leave it on a work surface or place it in general waste. The safe-handling procedure is to move it directly to a designated sharps container.'
      ]
    },
    c1up: {
      title: 'When the container is a walk away',
      narration: [
        'You’ve just changed out a used box-cutter blade at your bench. The designated sharps container is several workstations away. Your line is about to restart, and a coworker is waving you back to your station.',
        'Nothing about setting the blade down at your own workstation feels careless: you can see exactly where it is, and you’re planning to carry it down on your next scheduled break. But the safe-handling procedure doesn’t change when work gets busy.',
        'Once a sharp is used, don’t recap, bend, or break it, and don’t set it aside for later. It should go directly into a designated sharps container. Leaving the blade at your workstation, even temporarily, creates a hazard for anyone who reaches for that spot before you return.'
      ],
      check: { kind: 'mcq', key: 'k1check', variant: 'up',
        stem: 'You have a used sharp to deal with. The designated sharps container is a walk away, and someone is calling you over to help with something that can’t wait. What do you do right now?',
        correct: 0,
        options: [
          { t: 'Make the walk to the sharps container before taking the other task.' },
          { t: 'Set it down where you can see it and carry it down on your next break.' },
          { t: 'Ask a coworker to keep an eye on it until you can get back to it.' },
          { t: 'Keep it in your hand for now and deal with it after you’ve helped.' }
        ],
        okFb: 'A few extra steps don’t change the procedure. Plan the disposal route before you handle the sharp, then put the used sharp directly into a designated sharps container.' }
    },
    c2base: {
      title: 'At the fill line',
      narration: [
        'You’re carrying a used sharp to a designated sharps container on the production floor. As you approach, you notice the container is full. On the way there, you also pass a piece of contaminated glass sitting in a general-waste bin. Both are sharps hazards, even though they look very different.',
        'A sharps container at its fill line should no longer be used because there is less room to place another sharp safely without coming into contact with the sharps already inside. A sharp left where it doesn’t belong, whether on a work surface, concealed in other material, or mixed into general waste, can also put the next person who encounters it at risk.',
        'Recognizing these conditions before someone is injured is an important part of preventing sharps exposures.'
      ],
      check: { kind: 'mcq', key: 'k2check', variant: 'base',
        stem: 'Which of these is a sharps hazard, even though it might not look like one?',
        correct: 0,
        options: [
          { t: 'A sharps container filled right up to its marked fill line.' },
          { t: 'A sealed replacement sharps container still in its packaging on the supply shelf.' },
          { t: 'A sharps container mounted on the wall, about a quarter full.' },
          { t: 'A general-waste bin emptied and relined at the start of the shift.' }
        ],
        okFb: 'Once a sharps container reaches its marked fill line, it should be treated as full and should not be used. Trying to add another sharp could bring you into contact with the sharps already inside.' }
    },
    c2rem: {
      recheck: { of: 'k2check', key: 'k2recheck', base: 'c2base', up: 'c2up' },
      title: 'At the fill line',
      narration: [
        'You arrive at a designated sharps container and notice that several used sharps are already crowded near the top. One is resting near the opening, leaving little room to add another safely. Pressing the sharps down or trying to fit another one in could bring your hand into contact with a used sharp.',
        'When a container reaches its fill line, it should be treated as full and should not be used. Use another designated sharps container instead.',
        'A sharp can also become a hazard when it is left somewhere it doesn’t belong. A sharp left on a work surface, concealed in other material, or placed in general waste can expose someone who doesn’t expect it to be there. Whether the hazard is a full container or a misplaced sharp, recognizing the unsafe condition is the first step in preventing a sharps injury.'
      ]
    },
    c2up: {
      title: 'When the hazard is less obvious',
      narration: [
        'You’re carrying a used sharp toward a designated sharps container on the production floor. As you approach, you notice that the container is nearing its marked fill line. There appears to be room for another sharp, but the contents are already crowded near the top.',
        'On the way, you also notice something partially concealed in a general-waste bin. It looks like it could be a piece of contaminated glass, but you can’t tell without disturbing the contents.',
        'Sharps hazards aren’t always obvious. A container nearing capacity can leave less room to place another sharp safely, while a possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside. Recognizing the warning signs matters even when the hazard isn’t immediately clear.'
      ],
      check: { kind: 'mcq', key: 'k2check', variant: 'up',
        stem: 'The sharps container is nearing its fill line. Nearby, you notice something partially concealed in a general-waste bin that could be contaminated glass. What should you recognize?',
        correct: 0,
        options: [
          { t: 'Both conditions could present a sharps hazard, even though neither is immediately obvious.' },
          { t: 'Only the container is a concern because the object in the bin hasn’t been confirmed as a sharp.' },
          { t: 'Only the object in the bin is a concern because the container hasn’t reached its fill line.' },
          { t: 'Neither is a concern yet because the container still has room and the object hasn’t been identified.' }
        ],
        okFb: 'Sharps hazards aren’t always obvious. A container nearing its fill line leaves less room for safe disposal, while something that could be a sharp concealed in general waste may put someone at risk if the contents are disturbed or handled.' }
    },
    controls: {
      title: 'Why the container beats the gloves',
      narration: [
        'A facility is looking for ways to better protect employees who may come into contact with used sharps. One option is to provide heavier protective gloves. Another is to make designated sharps containers more accessible throughout the facility. Both can provide protection, but they don’t control the hazard in the same way.',
        'Heavy-duty gloves can help protect against cuts, punctures, and exposure, but even thick gloves can be penetrated by a needle. A designated sharps container is an engineering control. It contains the sharp after disposal, reducing the chance that another person will come into contact with it.',
        'That provides stronger protection against needlestick injuries than relying on PPE alone.'
      ],
      // Slide 16. Climate data, reported at the cohort level — never graded
      // and never routes. Looks like any other question to the learner.
      check: { kind: 'insight', key: 'insight', label: 'What you\u2019ve seen on the floor',
        stem: 'In the last 12 months, how many times have you come across a sharp that was improperly disposed of?',
        options: [ { t: 'Never' }, { t: 'Once or twice' }, { t: 'Three to five times' }, { t: 'More than five times' } ] }
    },
    case3: {
      title: 'A risk Jacob never chose',
      narration: [
        'Chris works on the line and manages his diabetes with insulin. One afternoon, he can’t find a sharps container nearby. He’s in the middle of a task, so just this once, he tosses the used needle into the general trash.',
        'Later, Jacob collects the bag for sanitation. The needle sticks him through the bag. Jacob never used the needle. He never even saw it. But a needlestick can expose someone to bloodborne pathogens such as HIV, hepatitis B, and hepatitis C.',
        'The shortcut was Chris’s. The risk became Jacob’s. One decision. Someone else’s injury.'
      ],
      check: { kind: 'likert', key: 'f1post', stem: '“' + F1_STATEMENT + '”' }
    },
    case3rf: {
      title: 'Beyond the needlestick',
      narration: [
        'Chris works on the line and manages his diabetes with insulin. One afternoon, he can’t find a sharps container nearby. He’s in the middle of a task, so just this once, he tosses the used needle into the general trash.',
        'Later, Jacob collects the bag for sanitation. The needle sticks him through the bag. Jacob never used the needle. He never even saw it. For Jacob, it didn’t end with the stick. It meant reporting the injury, a medical evaluation, blood tests, and weeks of waiting to learn whether he’d been exposed to HIV, hepatitis B, or hepatitis C — weeks his family spent waiting with him, the same question sitting at their dinner table every night.',
        'Jacob had no part in the shortcut, but he was left carrying its consequences, and so did the people who love him. He couldn’t see the needle, avoid the shortcut, or choose differently. Chris saved himself a trip to the sharps container. Jacob inherited the risk. That is how far one disposal choice can reach.',
        'If it had been you waiting on those results — you, or someone in your family — how would those weeks have felt?'
      ],
      check: { kind: 'likert', key: 'f1post', stem: '“' + F1_STATEMENT + '”' }
    },
    debrief: {
      title: 'The shortcut is the exception',
      narration: [
        'There’s a common assumption that when a sharps container isn’t nearby, everyone takes the shortcut and drops the sharp in the nearest trash. Making the trip to a designated container can feel unrealistic when work is moving quickly.',
        'But that shortcut isn’t necessarily the norm. In a U.S. study, 92.7% of workers surveyed reported always disposing of sharp objects in a sharps container.',
        'The shortcut stands out because it’s memorable and because of what can happen when someone takes it, not because it’s how the work normally gets done. Safe disposal is the norm, even when the container isn’t convenient.'
      ],
      source: true,
      check: { kind: 'likert', key: 'f3post', stem: '“' + F3_STATEMENT + '”' }
    },
    debriefrf: {
      title: 'Memorable isn\u2019t the same as normal',
      narration: [
        'When a sharps container isn’t nearby, it can feel like taking the shortcut is simply what people do, and that expecting everyone to make the trip is unrealistic. But what stands out isn’t always what’s most common.',
        'In a U.S. study, 92.7% of workers surveyed reported always disposing of sharp objects in a sharps container. The shortcut feels common because it’s the behavior that gets noticed and remembered. The one time someone cuts a corner becomes the story people retell. The routine trips to the sharps container don’t.',
        'Memorable isn’t the same as normal. Safe disposal is the expected practice, even when the container isn’t convenient.'
      ],
      source: true,
      check: { kind: 'likert', key: 'f3post', stem: '“' + F3_STATEMENT + '”' }
    }
  };
  // ---- Public Sector (law enforcement) ------------------------------------
  // Contain_the_Sharp_Law_Enforcement.pdf, slides 5–22, verbatim. Same
  // screens, questions and routing as Manufacturing; only what differs is
  // listed here and laid over the Manufacturing screen (deckFor). Identical
  // in both decks, so not repeated: the pre-check, the case 1 / case 2 base
  // questions and feedback, the case 2 remedial (slide 12) and both debriefs.
  var DECK_LENS = {
    public: {
      c1base: { title: 'The needle at the counter', narration: [
        'You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. The designated sharps container is across the intake area, and the needle is still in your gloved hand. A used needle retains a small amount of blood after use, and its sharpness makes it likely to penetrate someone else’s skin and expose them to that retained blood.',
        'Whether or not it looks contaminated, a needle left on the counter or dropped into a property tray is a hazard to the next person who reaches for that spot — which is why the safe-handling procedure applies to every sharp, every time.',
        'Plan how the sharp will be disposed of before you handle it, use a needle alternative when one is available, and activate any available safety feature. Once used, don’t recap, bend, or break a sharp. Put it directly into a designated sharps container.'
      ] },
      c1rem: { title: 'The needle at the counter', narration: [
        'You’ve recovered a used needle during a property search, and it’s still in your gloved hand while you decide how to handle it before moving on. Recapping it or setting it aside might seem like ways to make it safer, but they don’t properly contain the sharp.',
        'If no designated sharps container is immediately available, don’t place the needle in general waste, and don’t improvise a wrapping out of soft material such as a paper towel or a plastic bag.',
        'Once a sharp is used, don’t recap, bend, or break it, and don’t leave it on a work surface or place it in general waste. The safe-handling procedure is to seek a designated sharps container and move the sharp directly into it.'
      ] },
      c1up: { title: 'When the container is across the room', narration: [
        'You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. The designated sharps container is at the far end of the intake area. The queue behind you is backing up, and another officer is calling you over to help with a subject in the next room.',
        'Nothing about setting the needle down on the counter feels careless: you can see exactly where it is, and you’re planning to deal with it as soon as you’re back. But the safe-handling procedure doesn’t change when the room gets busy.',
        'Once a sharp is used, don’t recap, bend, or break it, and don’t set it aside for later. It should go directly into a designated sharps container. Leaving the needle on the counter, even briefly, creates a hazard for anyone who reaches for that spot before you return.'
      ] },
      c2base: { narration: [
        'You’re carrying a used needle recovered during a property search to the designated sharps container in the station’s processing area. As you approach, you notice the container has reached its fill line. On the way there, you also pass a used syringe sitting in a general-waste bin. Both situations present a sharps hazard, but for different reasons.',
        'A sharps container at its fill line should no longer be used because there is less room to place another sharp safely without coming into contact with the sharps already inside. A sharp left where it doesn’t belong, whether on a work surface, concealed in other material, or mixed into general waste, can also put the next person who encounters it at risk.',
        'Recognizing these conditions before someone is injured is an important part of preventing sharps exposures.'
      ] },
      c2up: { narration: [
        'You’re carrying a recovered sharp toward the designated sharps container in the station’s processing area. As you approach, you notice that the container is nearing its marked fill line. There appears to be room for another sharp, but the contents are already crowded near the top.',
        'On the way, you also notice something partially concealed in a general-waste bin. It looks like it could be a used syringe, but you can’t tell without disturbing the contents.',
        'Sharps hazards aren’t always obvious. A container nearing capacity can leave less room to place another sharp safely, while a possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside. Recognizing the warning signs matters even when the hazard isn’t immediately clear.'
      ], check: { stem: 'The sharps container is nearing its fill line. Nearby, you notice something partially concealed in a general-waste bin that could be a used syringe. What should you recognize?' } },
      controls: { narration: [
        'An agency is looking for ways to better protect officers who may come into contact with used sharps. One option is to issue heavier protective gloves. Another is to make designated sharps containers more accessible throughout its stations and intake areas. Both can provide protection, but they don’t control the hazard in the same way.',
        'Heavy-duty gloves can help protect against cuts, punctures, and exposure, but even thick gloves can be penetrated by a needle. A designated sharps container is an engineering control. It contains the sharp after disposal, reducing the chance that another person will come into contact with it.',
        'That provides stronger protection against needlestick injuries than relying on PPE alone.'
      ], check: { label: 'What you’ve seen on shift' } },
      case3: { narration: [
        'Chris recovers a used needle from a subject’s property during an arrest. He can’t find a sharps container nearby. He’s in the middle of the intake, so just this once, he drops the used needle into the general trash at the station.',
        'Later, Jacob collects the bag for custodial pickup. The needle sticks him through the bag. Jacob never handled the arrest. He never even saw the needle. But a needlestick can expose someone to bloodborne pathogens such as HIV, hepatitis B, and hepatitis C.',
        'The shortcut was Chris’s. The risk became Jacob’s. One decision. Someone else’s injury.'
      ] },
      case3rf: { narration: [
        'Chris recovers a used needle from a subject’s property during an arrest. He can’t find a sharps container nearby. He’s in the middle of the intake, so just this once, he drops the used needle into the general trash at the station.',
        'Later, Jacob collects the bag for custodial pickup. The needle sticks him through the bag. Jacob never handled the arrest. He never even saw the needle. For Jacob, it didn’t end with the stick. It meant reporting the injury, a medical evaluation, blood tests, and weeks of waiting to learn whether he’d been exposed to HIV, hepatitis B, or hepatitis C — weeks his family spent waiting with him, the same question sitting at their dinner table every night.',
        'Jacob had no part in the shortcut, but he was left carrying its consequences, along with the people who love him. He couldn’t see the needle, avoid the shortcut, or choose differently. Chris saved himself a trip to the sharps container. Jacob inherited the risk. That is how far one disposal choice can reach.',
        'If it had been you waiting on those results — you, or someone in your family — how would those weeks have felt?'
      ] }
    }
  };
  // The current sector's version of a screen: Manufacturing's, with that
  // sector's differences (DECK_LENS) laid over it — the question too.
  function deckFor(id) {
    var base = DECK[id], over = (DECK_LENS[LE.lensId()] || {})[id];
    if (!over) return base;
    var d = {}, k;
    for (k in base) d[k] = base[k];
    for (k in over) if (k !== 'check') d[k] = over[k];
    if (over.check && base.check) {
      d.check = {};
      for (k in base.check) d.check[k] = base.check[k];
      for (k in over.check) d.check[k] = over.check[k];
    }
    return d;
  }

  // ---- The podcast scripts (Read + Listen) ---------------------------------
  // Jessica's podcast cut of the same screens (Contain_the_Sharp_<sector>_
  // Podcast.pdf, v0.1, 21 Sep 2026): the deck's narration re-voiced as a
  // two-host conversation (Dana, Ray), and case 3 as a first-person interview
  // with Jacob. One chapter per screen, one-to-one with the deck — CH-M4-01A
  // is c1base, 01R c1rem, 01B c1up, 02A/R/B the case 2 trio, 03 controls,
  // 04A/B case 3, 05A/B the debrief. Verbatim; don't edit here, re-extract.
  //
  // Read shows these as a transcript and Listen plays them (tools/sharps-
  // narration voices them, one placeholder voice per speaker). The deck
  // narration above stays as the Watch script. Questions stay in the flow, over the
  // screen, as for every carrier — the doc's "every check at the end" listen
  // is parked until testers say they want it (2026-09-23 review).
  //
  // Each line is [speaker, text]; ['PAUSE'] is the script's own "(pause)".
  // The ident ("This is Contain the Sharp…") is left out: it heads a
  // continuous listen, and here each chapter plays on its own screen.
  var PODCAST = {
    manufacturing: {
      // The spine of the continuous listen (the podcast path, PODCAST_EP
      // below), not screens. `ident` is the script's own, verbatim (the
      // chapter-4 variant, "I'm Dana." alone, applies only when the cut OPENS
      // on the interview — it never does here). `outro` is ours, not the
      // script's (which has "no episode close"): one neutral line that works
      // on a phone or at a desk, so the learner knows to come back to the
      // screen (2026-09-25 review). Both play in every sector.
      ident: [
        ['DANA', 'This is Contain the Sharp. Bloodborne Pathogens, Module 4. I’m Dana, with Ray.']
      ],
      outro: [
        ['DANA', 'You may now continue the lesson.']
      ],
      c1base: [
        ['DANA', 'The blade at the bench. Ray, set it up for me.'],
        ['RAY', 'You’re at your bench. You’ve just changed out a used box-cutter blade.'],
        ['DANA', 'Routine.'],
        ['RAY', 'Completely routine. The designated sharps container is down at the end of the line. And the used blade is still sitting at your bench.'],
        ['DANA', 'Let me ask the obvious one. When I hear “sharps,” I think needles. This is a box cutter.'],
        ['RAY', 'Good question, because the definition is wider than people expect. Like a needle or any other sharp object, that blade is a sharp — because it can puncture or cut the skin, it’s a hazard.'],
        ['DANA', 'Even if there’s nothing visible on it?'],
        ['RAY', 'Whether or not it’s visibly contaminated. An exposed blade left on a surface is a hazard to the next person who reaches for that spot. That’s why the safe-handling procedure applies to every sharp, every time.'],
        ['DANA', 'So what is the procedure? Say it plainly.'],
        ['RAY', 'Four things. Plan how you’re going to dispose of it. Use a safer alternative when one exists. Activate any available safety feature. And once it’s been used — don’t recap it, don’t bend it, don’t break it. It goes directly into a designated sharps container.'],
        ['DANA', 'Directly.'],
        ['RAY', 'Directly.']
      ],
      c1rem: [
        ['DANA', 'The blade at the bench. Let’s take this one slowly.'],
        ['RAY', 'You’re cleaning up your workstation after changing a cutting blade. The used blade is still in your hand, and you’re deciding how to handle it before you move on.'],
        ['DANA', 'My instinct is to make it safer first. Snap it. Or set it down somewhere obvious.'],
        ['RAY', 'That instinct makes sense — both of those feel like the responsible move. What they don’t do is properly contain the sharp. That’s the distinction.'],
        ['DANA', 'Is there a wrapping step?'],
        ['RAY', 'Depending on your facility’s procedures, you may need to wrap the exposed edge before disposal. So check yours. The rule underneath stays the same. Once a sharp is used, don’t recap it, bend it, or break it. Don’t leave it on a work surface, and don’t place it in general waste.'],
        ['DANA', 'And instead.'],
        ['RAY', 'Move it directly to a designated sharps container. That’s the safe-handling procedure.']
      ],
      c1up: [
        ['DANA', 'When the container is a walk away. Ray, set it up for me.'],
        ['RAY', 'You’ve just changed out a used box-cutter blade at your bench. The designated sharps container is several workstations away. Your line is about to restart. And a coworker is waving you back.'],
        ['DANA', 'That’s a real situation.'],
        ['RAY', 'That’s the situation.'],
        ['DANA', 'And here’s my honest read — setting it down at my own station doesn’t feel careless. I can see it. It’s mine. I’ll take it down on my break.'],
        ['RAY', 'That’s exactly how it feels. You can see exactly where it is, and you’re planning to carry it down on your next scheduled break. Nothing about that feels careless.'],
        ['DANA', 'And yet.'],
        ['RAY', 'The safe-handling procedure doesn’t change when work gets busy. Once a sharp is used — don’t recap it, don’t bend it, don’t break it, and don’t set it aside for later. It goes directly into a designated sharps container.'],
        ['DANA', 'Even for a few minutes.'],
        ['RAY', 'Leaving that blade at your workstation, even temporarily, creates a hazard for anyone who reaches for that spot before you get back.']
      ],
      c2base: [
        ['DANA', 'Let’s talk about a sharps container that’s at the fill line. Ray, this is all about what you notice when you’re following procedure.'],
        ['RAY', 'It is. Knowing what to do is one thing. Spotting the condition is a separate skill.'],
        ['DANA', 'Give me the scene.'],
        ['RAY', 'You’re carrying a used sharp to a designated sharps container on the production floor. You get close, and the container is full.'],
        ['DANA', 'Full.'],
        ['RAY', 'Full. And on the way there, you passed a piece of contaminated glass sitting in a general-waste bin.'],
        ['DANA', 'Those feel like two unrelated things to me. One’s a container doing its job. The other is something somebody else left.'],
        ['RAY', 'They look nothing alike, and both are sharps hazards.'],
        ['DANA', 'Start with the container. Why does full count?'],
        ['RAY', 'A sharps container at its fill line should no longer be used, because there’s less room to place another sharp safely without coming into contact with the sharps already inside.'],
        ['DANA', 'And the glass in the bin?'],
        ['RAY', 'A sharp left where it doesn’t belong — on a work surface, concealed in other material, or mixed into general waste — can put the next person who encounters it at risk.'],
        ['DANA', 'So the skill here is seeing it.'],
        ['RAY', 'Recognizing these conditions before someone is injured is an important part of preventing sharps exposures.']
      ],
      c2rem: [
        ['DANA', 'Let’s talk about a sharps container that’s at the fill line. There are two separate conditions in this one, so let’s take them one at a time.'],
        ['RAY', 'Good idea. First one. You arrive at a designated sharps container and notice that several used sharps are already crowded near the top. One is resting near the opening, leaving little room to add another safely.'],
        ['DANA', 'So what happens if you try?'],
        ['RAY', 'Pressing the sharps down, or trying to fit another one in, could bring your hand into contact with a used sharp.'],
        ['DANA', 'Your hand.'],
        ['RAY', 'Yours. So when a container reaches its fill line, it should be treated as full and should not be used. Use another designated sharps container instead.'],
        ['DANA', 'Second condition.'],
        ['RAY', 'A sharp can also become a hazard when it is left somewhere it doesn’t belong. On a work surface. Concealed in other material. Placed in general waste. Any of those can expose someone who doesn’t expect it to be there.'],
        ['DANA', 'And what connects them?'],
        ['RAY', 'Whether the hazard is a full container or a misplaced sharp, recognizing the unsafe condition is the first step in preventing a sharps injury.']
      ],
      c2up: [
        ['DANA', 'Let’s talk about when hazards aren’t as obvious. Ray, take me through it.'],
        ['RAY', 'You’re carrying a used sharp toward a designated sharps container on the production floor. As you approach, the container is nearing its marked fill line.'],
        ['DANA', 'Nearing. Not at it.'],
        ['RAY', 'Nearing. There appears to be room for another sharp — but the contents are already crowded near the top.'],
        ['DANA', 'Okay.'],
        ['RAY', 'And on the way, you notice something partially concealed in a general-waste bin. It looks like it could be a piece of contaminated glass. You can’t tell without disturbing the contents.'],
        ['DANA', 'So now I have two maybes. And my first read is that neither one is mine to act on yet.'],
        ['RAY', 'That’s a common read, and it’s worth slowing down on. Sharps hazards aren’t always obvious. A container nearing capacity can leave less room to place another sharp safely.'],
        ['DANA', 'And the one in the bin, even though nobody’s confirmed what it is?'],
        ['RAY', 'A possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside. Recognizing the warning signs matters even when the hazard isn’t immediately clear.']
      ],
      controls: [
        ['DANA', 'Why the container beats the gloves. Ray, I want to take the other side of this for a minute.'],
        ['RAY', 'Please.'],
        ['DANA', 'A facility is looking for ways to better protect employees who may come into contact with used sharps. Two options. One, provide heavier protective gloves. Two, make designated sharps containers more accessible throughout the facility.'],
        ['RAY', 'Both on the table.'],
        ['DANA', 'And I’d take the gloves. Gloves are on the person, everywhere they go. The container only works if somebody walks to it.'],
        ['RAY', 'That’s a reasonable case, and both can provide protection. Where they differ is how they control the hazard.'],
        ['DANA', 'Go on.'],
        ['RAY', 'Heavy-duty gloves can help protect against cuts, punctures, and exposure. But even thick gloves can be penetrated by a needle.'],
        ['DANA', 'So the glove protects the person. At least usually.'],
        ['RAY', 'A designated sharps container is an engineering control. It contains the sharp after disposal, reducing the chance that another person will come into contact with it. That provides stronger protection against needlestick injuries than relying on PPE alone.'],
        ['DANA', 'One protects the person. One contains the hazard.'],
        ['RAY', 'That’s the difference.']
      ],
      case3: [
        ['DANA', 'This one is an interview. Jacob, thank you for doing this.'],
        ['JACOB', 'Sure.'],
        ['DANA', 'Tell me what you do.'],
        ['JACOB', 'I collect the bags. Sanitation.'],
        ['DANA', 'Take me to that day.'],
        ['JACOB', 'There’s a guy on the line. Chris. He manages his diabetes with insulin. That afternoon he couldn’t find a sharps container nearby. He was in the middle of a task. So just that once, he tossed the used needle into the general trash.'],
        ['DANA', 'And you came through after.'],
        ['JACOB', 'I came through after. I picked up the bag. The needle stuck me through the bag.'],
        ['DANA', 'Did you see it?'],
        ['JACOB', 'No. I never used that needle. I never even saw it.'],
        ['DANA', 'And a needlestick carries more than the stick.'],
        ['JACOB', 'A needlestick can expose you to bloodborne pathogens. HIV. Hepatitis B. Hepatitis C.'],
        ['PAUSE'],
        ['DANA', 'How do you think about it now?'],
        ['JACOB', 'The shortcut was his. The risk became mine. One decision became someone else’s injury.']
      ],
      case3rf: [
        ['DANA', 'This one is an interview. Jacob, thank you for doing this.'],
        ['JACOB', 'Sure.'],
        ['DANA', 'Tell me what you do.'],
        ['JACOB', 'I collect the bags. Sanitation.'],
        ['DANA', 'Take me to that day.'],
        ['JACOB', 'There’s a guy on the line. Chris. He manages his diabetes with insulin. That afternoon he couldn’t find a sharps container nearby. He was in the middle of a task. So just that once, he tossed the used needle into the general trash.'],
        ['DANA', 'And you came through after.'],
        ['JACOB', 'I came through after. I picked up that bag. The needle stuck me through it.'],
        ['DANA', 'Did you see it?'],
        ['JACOB', 'No. I never used that needle. I never even saw it.'],
        ['DANA', 'What happened from there?'],
        ['JACOB', 'It didn’t end with the stick. It meant reporting the injury. A medical evaluation. Blood tests. And weeks of waiting to learn whether I’d been exposed to HIV, hepatitis B, or hepatitis C.'],
        ['DANA', 'Weeks.'],
        ['JACOB', 'Weeks. And my family waited them with me. The same question sitting at our dinner table every night.'],
        ['PAUSE'],
        ['DANA', 'You had no part in the decision.'],
        ['JACOB', 'No part in it. And I’m the one who was left carrying it. Me, and the people who love me. I couldn’t see the needle. I couldn’t avoid the shortcut. I couldn’t choose differently.'],
        ['DANA', 'What would you want someone to take from it?'],
        ['JACOB', 'Chris saved himself a trip to the sharps container. I inherited the risk. That’s how far one disposal choice can reach. And if it had been you waiting on those results — you, or someone in your family — how would those weeks have felt?']
      ],
      debrief: [
        ['DANA', 'The shortcut is the exception. Ray, I want to say the common assumption out loud.'],
        ['RAY', 'Say it.'],
        ['DANA', 'There’s a common assumption that when a sharps container isn’t nearby, everyone takes the shortcut and drops the sharp in the nearest trash. And making the trip to a designated container can feel unrealistic when work is moving quickly.'],
        ['RAY', 'That’s the assumption. And that shortcut isn’t necessarily the norm.'],
        ['DANA', 'Meaning there’s a number.'],
        ['RAY', 'There’s a number. In a U.S. study, ninety-two point seven percent of workers surveyed reported always disposing of sharp objects in a sharps container.'],
        ['DANA', 'Ninety-two point seven.'],
        ['RAY', 'Always.'],
        ['DANA', 'So why does it feel like the reverse?'],
        ['RAY', 'The shortcut stands out because it’s memorable, and because of what can happen when someone takes it. Not because it’s how the work normally gets done.'],
        ['DANA', 'So the version we tell each other is the exception.'],
        ['RAY', 'Safe disposal is the norm, even when the container isn’t convenient.']
      ],
      debriefrf: [
        ['DANA', 'Memorable isn’t the same as normal. Ray, I want to stay with this one, because it’s a belief a lot of people hold.'],
        ['RAY', 'Start with why people believe it.'],
        ['DANA', 'When a sharps container isn’t nearby, it can feel like taking the shortcut is simply what people do. And that expecting everyone to make the trip is unrealistic.'],
        ['RAY', 'That’s how it feels. And what stands out isn’t always what’s most common.'],
        ['DANA', 'Give me the number.'],
        ['RAY', 'In a U.S. study, ninety-two point seven percent of workers surveyed reported always disposing of sharp objects in a sharps container.'],
        ['DANA', 'That’s higher than I would have guessed.'],
        ['RAY', 'The shortcut feels common because it’s the behavior that gets noticed and remembered. The one time someone cuts a corner becomes the story people retell. The routine trips to the sharps container don’t.'],
        ['DANA', 'So memorable isn’t the same as normal.'],
        ['RAY', 'Safe disposal is the expected practice, even when the container isn’t convenient.']
      ]
    },
    public: {
      c1base: [
        ['DANA', 'The needle at the counter. Ray, set it up for me.'],
        ['RAY', 'You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter.'],
        ['DANA', 'So it’s already in your hand.'],
        ['RAY', 'In your gloved hand. And the designated sharps container is across the intake area.'],
        ['DANA', 'Help me with the risk. It’s one needle.'],
        ['RAY', 'A used needle retains a small amount of blood after use. And its sharpness makes it likely to penetrate someone else’s skin and expose them to that retained blood.'],
        ['DANA', 'Does it matter whether it looks contaminated?'],
        ['RAY', 'It doesn’t. Whether or not it looks contaminated, a needle left on the counter or dropped into a property tray is a hazard to the next person who reaches for that spot. That’s why the safe-handling procedure applies to every sharp, every time.'],
        ['DANA', 'So what is the procedure? Say it plainly.'],
        ['RAY', 'Four things. Plan how the sharp will be disposed of before you handle it. Use a needle alternative when one is available. Activate any available safety feature. And once it’s been used — don’t recap it, don’t bend it, don’t break it. It goes directly into a designated sharps container.'],
        ['DANA', 'Directly.'],
        ['RAY', 'Directly.']
      ],
      c1rem: [
        ['DANA', 'The needle at the counter. Let’s take this one slowly.'],
        ['RAY', 'You’ve recovered a used needle during a property search. It’s still in your gloved hand while you decide how to handle it before moving on.'],
        ['DANA', 'My instinct is to make it safer first. Recap it. Or set it aside.'],
        ['RAY', 'That instinct makes sense — both of those feel like the responsible move. What they don’t do is properly contain the sharp. That’s the distinction.'],
        ['DANA', 'What if there’s no container right there?'],
        ['RAY', 'If no designated sharps container is immediately available, don’t place the needle in general waste. And don’t improvise a wrapping out of soft material — a paper towel, a plastic bag.'],
        ['DANA', 'So what’s left?'],
        ['RAY', 'The rule underneath stays the same. Once a sharp is used, don’t recap it, bend it, or break it. Don’t leave it on a work surface, and don’t place it in general waste. The safe-handling procedure is to seek a designated sharps container and move the sharp directly into it.']
      ],
      c1up: [
        ['DANA', 'When the container is across the room. Ray, set it up for me.'],
        ['RAY', 'You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. The designated sharps container is at the far end of the intake area. The queue behind you is backing up. And another officer is calling you over to help with a subject in the next room.'],
        ['DANA', 'That’s a real situation.'],
        ['RAY', 'That’s the situation.'],
        ['DANA', 'And here’s my honest read — setting it down on the counter doesn’t feel careless. I can see exactly where it is. I’ll deal with it as soon as I’m back.'],
        ['RAY', 'That’s exactly how it feels. Nothing about that feels careless.'],
        ['DANA', 'And yet.'],
        ['RAY', 'The safe-handling procedure doesn’t change when the room gets busy. Once a sharp is used — don’t recap it, don’t bend it, don’t break it, and don’t set it aside for later. It goes directly into a designated sharps container.'],
        ['DANA', 'Even briefly.'],
        ['RAY', 'Leaving that needle on the counter, even briefly, creates a hazard for anyone who reaches for that spot before you return.']
      ],
      c2base: [
        ['DANA', 'Let’s talk about a sharps container that’s at the fill line. Ray, this is all about what you notice when you’re following procedure.'],
        ['RAY', 'It is. Knowing what to do is one thing. Spotting the condition is a separate skill.'],
        ['DANA', 'Give me the scene.'],
        ['RAY', 'You’re carrying a used needle recovered during a property search to the designated sharps container in the station’s processing area. As you approach, you notice the container has reached its fill line.'],
        ['DANA', 'At the line.'],
        ['RAY', 'At the line. And on the way there, you passed a used syringe sitting in a general-waste bin.'],
        ['DANA', 'Two very different situations.'],
        ['RAY', 'Both present a sharps hazard, but for different reasons.'],
        ['DANA', 'Start with the container. Why does reaching the line count?'],
        ['RAY', 'A sharps container at its fill line should no longer be used, because there’s less room to place another sharp safely without coming into contact with the sharps already inside.'],
        ['DANA', 'And the syringe in the bin?'],
        ['RAY', 'A sharp left where it doesn’t belong — on a work surface, concealed in other material, or mixed into general waste — can put the next person who encounters it at risk.'],
        ['DANA', 'So the skill here is seeing it.'],
        ['RAY', 'Recognizing these conditions before someone is injured is an important part of preventing sharps exposures.']
      ],
      c2rem: [
        ['DANA', 'Let’s talk about a sharps container that’s at the fill line. There are two separate conditions in this one, so let’s take them one at a time.'],
        ['RAY', 'Good idea. First one. You arrive at a designated sharps container and notice that several used sharps are already crowded near the top. One is resting near the opening, leaving little room to add another safely.'],
        ['DANA', 'So what happens if you try?'],
        ['RAY', 'Pressing the sharps down, or trying to fit another one in, could bring your hand into contact with a used sharp.'],
        ['DANA', 'Your hand.'],
        ['RAY', 'Yours. So when a container reaches its fill line, it should be treated as full and should not be used. Use another designated sharps container instead.'],
        ['DANA', 'Second condition.'],
        ['RAY', 'A sharp can also become a hazard when it is left somewhere it doesn’t belong. On a work surface. Concealed in other material. Placed in general waste. Any of those can expose someone who doesn’t expect it to be there.'],
        ['DANA', 'And what connects them?'],
        ['RAY', 'Whether the hazard is a full container or a misplaced sharp, recognizing the unsafe condition is the first step in preventing a sharps injury.']
      ],
      c2up: [
        ['DANA', 'Let’s talk about when hazards aren’t as obvious. Ray, take me through it.'],
        ['RAY', 'You’re carrying a recovered sharp toward the designated sharps container in the station’s processing area. As you approach, the container is nearing its marked fill line.'],
        ['DANA', 'Nearing. Not at it.'],
        ['RAY', 'Nearing. There appears to be room for another sharp — but the contents are already crowded near the top.'],
        ['DANA', 'Okay.'],
        ['RAY', 'And on the way, you notice something partially concealed in a general-waste bin. It looks like it could be a used syringe. You can’t tell without disturbing the contents.'],
        ['DANA', 'So now I have two maybes. And my first read is that neither one is mine to act on yet.'],
        ['RAY', 'That’s a common read, and it’s worth slowing down on. Sharps hazards aren’t always obvious. A container nearing capacity can leave less room to place another sharp safely.'],
        ['DANA', 'And the one in the bin, even though nobody’s confirmed what it is?'],
        ['RAY', 'A possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside. Recognizing the warning signs matters even when the hazard isn’t immediately clear.']
      ],
      controls: [
        ['DANA', 'Why the container beats the gloves. Ray, I want to take the other side of this for a minute.'],
        ['RAY', 'Please.'],
        ['DANA', 'An agency is looking for ways to better protect officers who may come into contact with used sharps. Two options. One, issue heavier protective gloves. Two, make designated sharps containers more accessible throughout its stations and intake areas.'],
        ['RAY', 'Both on the table.'],
        ['DANA', 'And I’d take the gloves. Gloves are on the officer, everywhere they go. The container only works if somebody walks to it.'],
        ['RAY', 'That’s a reasonable case, and both can provide protection. Where they differ is how they control the hazard.'],
        ['DANA', 'Go on.'],
        ['RAY', 'Heavy-duty gloves can help protect against cuts, punctures, and exposure. But even thick gloves can be penetrated by a needle.'],
        ['DANA', 'So the glove protects the officer. At least usually.'],
        ['RAY', 'A designated sharps container is an engineering control. It contains the sharp after disposal, reducing the chance that another person will come into contact with it. That provides stronger protection against needlestick injuries than relying on PPE alone.'],
        ['DANA', 'One protects the person. One contains the hazard.'],
        ['RAY', 'That’s the difference.']
      ],
      case3: [
        ['DANA', 'This one is an interview. Jacob, thank you for doing this.'],
        ['JACOB', 'Sure.'],
        ['DANA', 'Tell me what you do.'],
        ['JACOB', 'Custodial pickup. I collect the bags.'],
        ['DANA', 'Take me to that day.'],
        ['JACOB', 'There’s an officer, Chris. He recovered a used needle from a subject’s property during an arrest. He couldn’t find a sharps container nearby. He was in the middle of the intake. So just that once, he dropped the used needle into the general trash at the station.'],
        ['DANA', 'And you came through after.'],
        ['JACOB', 'I came through after. I picked up the bag. The needle stuck me through the bag.'],
        ['DANA', 'Did you see it?'],
        ['JACOB', 'No. I never handled the arrest. I never even saw the needle.'],
        ['DANA', 'And a needlestick carries more than the stick.'],
        ['JACOB', 'A needlestick can expose you to bloodborne pathogens. HIV. Hepatitis B. Hepatitis C.'],
        ['PAUSE'],
        ['DANA', 'How do you think about it now?'],
        ['JACOB', 'The shortcut was his. The risk became mine. One decision became someone else’s injury.']
      ],
      case3rf: [
        ['DANA', 'This one is an interview. Jacob, thank you for doing this.'],
        ['JACOB', 'Sure.'],
        ['DANA', 'Tell me what you do.'],
        ['JACOB', 'Custodial pickup. I collect the bags.'],
        ['DANA', 'Take me to that day.'],
        ['JACOB', 'There’s an officer, Chris. He recovered a used needle from a subject’s property during an arrest. He couldn’t find a sharps container nearby. He was in the middle of the intake. So just that once, he dropped the used needle into the general trash at the station.'],
        ['DANA', 'And you came through after.'],
        ['JACOB', 'I came through after. I picked up that bag. The needle stuck me through it.'],
        ['DANA', 'Did you see it?'],
        ['JACOB', 'No. I never handled the arrest. I never even saw the needle.'],
        ['DANA', 'What happened from there?'],
        ['JACOB', 'It didn’t end with the stick. It meant reporting the injury. A medical evaluation. Blood tests. And weeks of waiting to learn whether I’d been exposed to HIV, hepatitis B, or hepatitis C.'],
        ['DANA', 'Weeks.'],
        ['JACOB', 'Weeks. And my family waited them with me. The same question sitting at our dinner table every night.'],
        ['PAUSE'],
        ['DANA', 'You had no part in the decision.'],
        ['JACOB', 'No part in it. And I’m the one who was left carrying it, along with the people who love me. I couldn’t see the needle. I couldn’t avoid the shortcut. I couldn’t choose differently.'],
        ['DANA', 'What would you want someone to take from it?'],
        ['JACOB', 'Chris saved himself a trip to the sharps container. I inherited the risk. That’s how far one disposal choice can reach. And if it had been you waiting on those results — you, or someone in your family — how would those weeks have felt?']
      ],
      debrief: [
        ['DANA', 'The shortcut is the exception. Ray, I want to say the common assumption out loud.'],
        ['RAY', 'Say it.'],
        ['DANA', 'There’s a common assumption that when a sharps container isn’t nearby, everyone takes the shortcut and drops the sharp in the nearest trash. And making the trip to a designated container can feel unrealistic when work is moving quickly.'],
        ['RAY', 'That’s the assumption. And that shortcut isn’t necessarily the norm.'],
        ['DANA', 'Meaning there’s a number.'],
        ['RAY', 'There’s a number. In a U.S. study, ninety-two point seven percent of workers surveyed reported always disposing of sharp objects in a sharps container.'],
        ['DANA', 'Ninety-two point seven.'],
        ['RAY', 'Always.'],
        ['DANA', 'So why does it feel like the reverse?'],
        ['RAY', 'The shortcut stands out because it’s memorable, and because of what can happen when someone takes it. Not because it’s how the work normally gets done.'],
        ['DANA', 'So the version we tell each other is the exception.'],
        ['RAY', 'Safe disposal is the norm, even when the container isn’t convenient.']
      ],
      debriefrf: [
        ['DANA', 'Memorable isn’t the same as normal. Ray, I want to stay with this one, because it’s a belief a lot of people hold.'],
        ['RAY', 'Start with why people believe it.'],
        ['DANA', 'When a sharps container isn’t nearby, it can feel like taking the shortcut is simply what people do. And that expecting everyone to make the trip is unrealistic.'],
        ['RAY', 'That’s how it feels. And what stands out isn’t always what’s most common.'],
        ['DANA', 'Give me the number.'],
        ['RAY', 'In a U.S. study, ninety-two point seven percent of workers surveyed reported always disposing of sharp objects in a sharps container.'],
        ['DANA', 'That’s higher than I would have guessed.'],
        ['RAY', 'The shortcut feels common because it’s the behavior that gets noticed and remembered. The one time someone cuts a corner becomes the story people retell. The routine trips to the sharps container don’t.'],
        ['DANA', 'So memorable isn’t the same as normal.'],
        ['RAY', 'Safe disposal is the expected practice, even when the container isn’t convenient.']
      ]
    }
  };
  var PODCAST_WHO = { DANA: 'Dana', RAY: 'Ray', JACOB: 'Jacob' };
  function podcastFor(id) {
    return (PODCAST[LE.lensId()] || {})[id] || PODCAST.manufacturing[id] || null;
  }
  // ---- The article (Read, default) -----------------------------------------
  // 2026-09-24: reading a two-host script as text read like reading a
  // script, so Read defaults to this: the same podcast chapters rewritten as
  // plain prose. Every fact, rule and figure is the podcast's (and so the
  // deck's) — the procedure and rule sentences stay close to verbatim; only
  // the dialogue scaffolding is gone. The podcast's shape survives: the
  // scene, the tempting read of it, then the correction. Case 3 is told as a
  // short feature, Jacob's own lines kept as quotes. Demo → "Read view"
  // switches back to the podcast transcript. Public Sector's case 2 remedial
  // and both debriefs are identical to Manufacturing in the podcast, so they
  // fall back to it.
  var ARTICLE = {
    manufacturing: {
      c1base: [
        'You’ve just changed out a used box-cutter blade at your bench. It’s a routine job. The designated sharps container is down at the end of the line, and the used blade is still sitting at your bench.',
        'When most people hear “sharps,” they think of needles. The definition is wider than that. Like a needle or any other sharp object, a blade is a sharp: it can puncture or cut the skin, and that makes it a hazard, whether or not it’s visibly contaminated.',
        'An exposed blade left on a surface is a hazard to the next person who reaches for that spot. That’s why the safe-handling procedure applies to every sharp, every time.',
        'The procedure comes down to four things. Plan how you’re going to dispose of the sharp. Use a safer alternative when one exists. Activate any available safety feature. And once it’s been used, don’t recap it, bend it, or break it. It goes directly into a designated sharps container.'
      ],
      c1rem: [
        'You’re cleaning up your workstation after changing a cutting blade. The used blade is still in your hand, and you’re deciding how to handle it before you move on.',
        'The instinct is to make it safer first: snap it, or set it down somewhere obvious. Both feel like the responsible move. What they don’t do is properly contain the sharp, and that’s the distinction that matters.',
        'Depending on your facility’s procedures, you may need to wrap the exposed edge before disposal, so check yours. The rule underneath stays the same. Once a sharp is used, don’t recap it, bend it, or break it. Don’t leave it on a work surface, and don’t place it in general waste.',
        'Instead, move it directly to a designated sharps container. That’s the safe-handling procedure.'
      ],
      c1up: [
        'You’ve just changed out a used box-cutter blade at your bench. The designated sharps container is several workstations away. Your line is about to restart, and a coworker is waving you back.',
        'Setting the blade down at your own station doesn’t feel careless. You can see exactly where it is, it’s yours, and you’re planning to carry it down on your next scheduled break.',
        'But the safe-handling procedure doesn’t change when work gets busy. Once a sharp is used, don’t recap it, bend it, or break it, and don’t set it aside for later. It goes directly into a designated sharps container.',
        'Leaving the blade at your workstation, even for a few minutes, creates a hazard for anyone who reaches for that spot before you get back.'
      ],
      c2base: [
        'Knowing what to do with a sharp is one skill. Spotting an unsafe condition while you’re following the procedure is a separate one.',
        'You’re carrying a used sharp to a designated sharps container on the production floor. When you get close, you see the container is full. On the way there, you passed a piece of contaminated glass sitting in a general-waste bin.',
        'The two can feel unrelated: one is a container doing its job, the other is something somebody else left behind. They look nothing alike, and both are sharps hazards.',
        'A sharps container at its fill line should no longer be used, because there’s less room to place another sharp safely without coming into contact with the sharps already inside.',
        'A sharp left where it doesn’t belong — on a work surface, concealed in other material, or mixed into general waste — can put the next person who encounters it at risk. Recognizing these conditions before someone is injured is an important part of preventing sharps exposures.'
      ],
      c2rem: [
        'There are two separate conditions to recognize here, so take them one at a time.',
        'First, you arrive at a designated sharps container and notice that several used sharps are already crowded near the top. One is resting near the opening, leaving little room to add another safely. Pressing the sharps down, or trying to fit another one in, could bring your hand into contact with a used sharp.',
        'So when a container reaches its fill line, it should be treated as full and should not be used. Use another designated sharps container instead.',
        'Second, a sharp can also become a hazard when it’s left somewhere it doesn’t belong: on a work surface, concealed in other material, or placed in general waste. Any of those can expose someone who doesn’t expect it to be there.',
        'Whether the hazard is a full container or a misplaced sharp, recognizing the unsafe condition is the first step in preventing a sharps injury.'
      ],
      c2up: [
        'You’re carrying a used sharp toward a designated sharps container on the production floor. As you approach, you see the container is nearing its marked fill line. It isn’t at the line, and there appears to be room for another sharp, but the contents are already crowded near the top.',
        'On the way, you notice something partially concealed in a general-waste bin. It looks like it could be a piece of contaminated glass, but you can’t tell without disturbing the contents.',
        'That’s two maybes, and a common first read is that neither one is yours to act on yet. It’s worth slowing down on that. Sharps hazards aren’t always obvious. A container nearing capacity can leave less room to place another sharp safely.',
        'And even though nobody has confirmed what’s in the bin, a possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside. Recognizing the warning signs matters even when the hazard isn’t immediately clear.'
      ],
      controls: [
        'A facility is looking for ways to better protect employees who may come into contact with used sharps. It has two options: provide heavier protective gloves, or make designated sharps containers more accessible throughout the facility.',
        'There’s a reasonable case for the gloves. They’re on the person, everywhere they go, while a container only works if somebody walks to it. Both can provide protection. Where they differ is in how they control the hazard.',
        'Heavy-duty gloves can help protect against cuts, punctures, and exposure. But even thick gloves can be penetrated by a needle.',
        'A designated sharps container is an engineering control. It contains the sharp after disposal, reducing the chance that another person will come into contact with it. That provides stronger protection against needlestick injuries than relying on PPE alone.',
        'One protects the person. The other contains the hazard.'
      ],
      case3: [
        'Jacob collects the bags. He works in sanitation.',
        'One afternoon, a man on the line named Chris, who manages his diabetes with insulin, couldn’t find a sharps container nearby. He was in the middle of a task, so just that once, he tossed the used needle into the general trash.',
        'Jacob came through after. He picked up the bag, and the needle stuck him through it. “I never used that needle,” he says. “I never even saw it.”',
        'A needlestick carries more than the stick. It can expose you to bloodborne pathogens: HIV, hepatitis B, and hepatitis C.',
        '“The shortcut was his,” Jacob says. “The risk became mine. One decision became someone else’s injury.”'
      ],
      case3rf: [
        'Jacob collects the bags. He works in sanitation.',
        'One afternoon, a man on the line named Chris, who manages his diabetes with insulin, couldn’t find a sharps container nearby. He was in the middle of a task, so just that once, he tossed the used needle into the general trash.',
        'Jacob came through after. He picked up the bag, and the needle stuck him through it. “I never used that needle,” he says. “I never even saw it.”',
        'It didn’t end with the stick. For Jacob, it meant reporting the injury, a medical evaluation, blood tests, and weeks of waiting to learn whether he’d been exposed to HIV, hepatitis B, or hepatitis C.',
        '“My family waited them with me,” he says. “The same question sitting at our dinner table every night.”',
        'Jacob had no part in the decision, but he’s the one who was left carrying it, along with the people who love him. “I couldn’t see the needle. I couldn’t avoid the shortcut. I couldn’t choose differently.”',
        '“Chris saved himself a trip to the sharps container,” he says. “I inherited the risk. That’s how far one disposal choice can reach.”',
        'If it had been you waiting on those results — you, or someone in your family — how would those weeks have felt?'
      ],
      debrief: [
        'There’s a common assumption that when a sharps container isn’t nearby, everyone takes the shortcut and drops the sharp in the nearest trash. Making the trip to a designated container can feel unrealistic when work is moving quickly.',
        'But that shortcut isn’t necessarily the norm. In a U.S. study, 92.7% of workers surveyed reported always disposing of sharp objects in a sharps container.',
        'So why does it feel like the reverse? The shortcut stands out because it’s memorable, and because of what can happen when someone takes it, not because it’s how the work normally gets done. The version people tell each other is the exception. Safe disposal is the norm, even when the container isn’t convenient.'
      ],
      debriefrf: [
        'It’s a belief a lot of people hold: when a sharps container isn’t nearby, taking the shortcut is simply what people do, and expecting everyone to make the trip is unrealistic.',
        'That’s how it feels. But what stands out isn’t always what’s most common. In a U.S. study, 92.7% of workers surveyed reported always disposing of sharp objects in a sharps container.',
        'The shortcut feels common because it’s the behavior that gets noticed and remembered. The one time someone cuts a corner becomes the story people retell. The routine trips to the sharps container don’t.',
        'Memorable isn’t the same as normal. Safe disposal is the expected practice, even when the container isn’t convenient.'
      ]
    },
    public: {
      c1base: [
        'You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. It’s already in your gloved hand, and the designated sharps container is across the intake area.',
        'It’s one needle, but the risk is real. A used needle retains a small amount of blood after use, and its sharpness makes it likely to penetrate someone else’s skin and expose them to that retained blood.',
        'It doesn’t matter whether it looks contaminated. A needle left on the counter or dropped into a property tray is a hazard to the next person who reaches for that spot. That’s why the safe-handling procedure applies to every sharp, every time.',
        'The procedure comes down to four things. Plan how the sharp will be disposed of before you handle it. Use a needle alternative when one is available. Activate any available safety feature. And once it’s been used, don’t recap it, bend it, or break it. It goes directly into a designated sharps container.'
      ],
      c1rem: [
        'You’ve recovered a used needle during a property search. It’s still in your gloved hand while you decide how to handle it before moving on.',
        'The instinct is to make it safer first: recap it, or set it aside. Both feel like the responsible move. What they don’t do is properly contain the sharp, and that’s the distinction that matters.',
        'If no designated sharps container is immediately available, don’t place the needle in general waste. And don’t improvise a wrapping out of soft material, such as a paper towel or a plastic bag.',
        'The rule underneath stays the same. Once a sharp is used, don’t recap it, bend it, or break it. Don’t leave it on a work surface, and don’t place it in general waste. The safe-handling procedure is to seek a designated sharps container and move the sharp directly into it.'
      ],
      c1up: [
        'You’ve just recovered a used hypodermic needle from a subject’s property at the booking counter. The designated sharps container is at the far end of the intake area. The queue behind you is backing up, and another officer is calling you over to help with a subject in the next room.',
        'Setting the needle down on the counter doesn’t feel careless. You can see exactly where it is, and you’ll deal with it as soon as you’re back.',
        'But the safe-handling procedure doesn’t change when the room gets busy. Once a sharp is used, don’t recap it, bend it, or break it, and don’t set it aside for later. It goes directly into a designated sharps container.',
        'Leaving the needle on the counter, even briefly, creates a hazard for anyone who reaches for that spot before you return.'
      ],
      c2base: [
        'Knowing what to do with a sharp is one skill. Spotting an unsafe condition while you’re following the procedure is a separate one.',
        'You’re carrying a used needle recovered during a property search to the designated sharps container in the station’s processing area. As you approach, you see the container has reached its fill line. On the way there, you passed a used syringe sitting in a general-waste bin.',
        'They’re two very different situations, and both present a sharps hazard, for different reasons.',
        'A sharps container at its fill line should no longer be used, because there’s less room to place another sharp safely without coming into contact with the sharps already inside.',
        'A sharp left where it doesn’t belong — on a work surface, concealed in other material, or mixed into general waste — can put the next person who encounters it at risk. Recognizing these conditions before someone is injured is an important part of preventing sharps exposures.'
      ],
      c2up: [
        'You’re carrying a recovered sharp toward the designated sharps container in the station’s processing area. As you approach, you see the container is nearing its marked fill line. It isn’t at the line, and there appears to be room for another sharp, but the contents are already crowded near the top.',
        'On the way, you notice something partially concealed in a general-waste bin. It looks like it could be a used syringe, but you can’t tell without disturbing the contents.',
        'That’s two maybes, and a common first read is that neither one is yours to act on yet. It’s worth slowing down on that. Sharps hazards aren’t always obvious. A container nearing capacity can leave less room to place another sharp safely.',
        'And even though nobody has confirmed what’s in the bin, a possible sharp concealed in general waste can put someone at risk if the material is disturbed or handled without recognizing what may be inside. Recognizing the warning signs matters even when the hazard isn’t immediately clear.'
      ],
      controls: [
        'An agency is looking for ways to better protect officers who may come into contact with used sharps. It has two options: issue heavier protective gloves, or make designated sharps containers more accessible throughout its stations and intake areas.',
        'There’s a reasonable case for the gloves. They’re on the officer, everywhere they go, while a container only works if somebody walks to it. Both can provide protection. Where they differ is in how they control the hazard.',
        'Heavy-duty gloves can help protect against cuts, punctures, and exposure. But even thick gloves can be penetrated by a needle.',
        'A designated sharps container is an engineering control. It contains the sharp after disposal, reducing the chance that another person will come into contact with it. That provides stronger protection against needlestick injuries than relying on PPE alone.',
        'One protects the person. The other contains the hazard.'
      ],
      case3: [
        'Jacob does custodial pickup. He collects the bags.',
        'An officer named Chris recovered a used needle from a subject’s property during an arrest. He couldn’t find a sharps container nearby. He was in the middle of the intake, so just that once, he dropped the used needle into the general trash at the station.',
        'Jacob came through after. He picked up the bag, and the needle stuck him through it. “I never handled the arrest,” he says. “I never even saw the needle.”',
        'A needlestick carries more than the stick. It can expose you to bloodborne pathogens: HIV, hepatitis B, and hepatitis C.',
        '“The shortcut was his,” Jacob says. “The risk became mine. One decision became someone else’s injury.”'
      ],
      case3rf: [
        'Jacob does custodial pickup. He collects the bags.',
        'An officer named Chris recovered a used needle from a subject’s property during an arrest. He couldn’t find a sharps container nearby. He was in the middle of the intake, so just that once, he dropped the used needle into the general trash at the station.',
        'Jacob came through after. He picked up the bag, and the needle stuck him through it. “I never handled the arrest,” he says. “I never even saw the needle.”',
        'It didn’t end with the stick. For Jacob, it meant reporting the injury, a medical evaluation, blood tests, and weeks of waiting to learn whether he’d been exposed to HIV, hepatitis B, or hepatitis C.',
        '“My family waited them with me,” he says. “The same question sitting at our dinner table every night.”',
        'Jacob had no part in the decision, but he’s the one who was left carrying it, along with the people who love him. “I couldn’t see the needle. I couldn’t avoid the shortcut. I couldn’t choose differently.”',
        '“Chris saved himself a trip to the sharps container,” he says. “I inherited the risk. That’s how far one disposal choice can reach.”',
        'If it had been you waiting on those results — you, or someone in your family — how would those weeks have felt?'
      ]
    }
  };
  function articleFor(id) {
    return (ARTICLE[LE.lensId()] || {})[id] || ARTICLE.manufacturing[id] || [];
  }
  // 'article' (default) | 'podcast' — the Demo menu's "Read view".
  function readStyle() {
    try { return sessionStorage.getItem('sh-read-style') === 'podcast' ? 'podcast' : 'article'; }
    catch (e) { return 'article'; }
  }

  // Read steps through the text a run at a time — transcript turns or
  // article paragraphs. Items are gathered into a step until it holds at
  // least READ_STEP_MIN characters, so "Directly." / "Even if there's
  // nothing visible on it?" (or a one-line paragraph) ride along with what's
  // around them instead of each being its own two-second step. A short
  // leftover at the end joins the step before it.
  var READ_STEP_MIN = 240;
  function readSteps(items, len) {
    var steps = [], cur = [], n = 0;
    items.forEach(function (l) {
      cur.push(l); n += len(l);
      if (n >= READ_STEP_MIN) { steps.push(cur); cur = []; n = 0; }
    });
    if (cur.length) {
      if (steps.length && n < READ_STEP_MIN / 2) steps[steps.length - 1] = steps[steps.length - 1].concat(cur);
      else steps.push(cur);
    }
    return steps;
  }
  // The spoken turns only — the reader has nothing to show for a pause.
  function podcastTurns(id) {
    return (podcastFor(id) || []).filter(function (l) { return l[0] !== 'PAUSE'; });
  }

  var DECK_SOURCE = 'Source: Gershon et al. (2000), “Hospital Safety Climate and Its Relationship ' +
    'with Safe Work Practices and Workplace Exposure Incidents,” American Journal of Infection ' +
    'Control, 28(3), 211–221.';

  // ---- The screen ------------------------------------------------------------
  // One template for all eleven screens above. Every id is fixed — only one
  // step is ever mounted at a time — so the template needs no per-screen
  // prefixes.
  var DK_IDS = { wrap: 'dkMedia', video: 'dkVideo', note: 'dkVfall', pct: 'dkPct', skip: 'dkSkip' };

  // A remedial screen re-asks whichever version's question was missed (base
  // or test-up), saved under its own key so the first answer is kept.
  function deckCheck(d) {
    if (!d.recheck) return d.check;
    var r = d.recheck, missed = readCourse()[r.of] || {};
    var src = deckFor(missed.variant === 'up' ? r.up : r.base).check, q = {};
    for (var k in src) q[k] = src[k];
    q.key = r.key;
    return q;
  }
  // The question card. The outer node is the reinforcement layer itself,
  // stretched over the stage; the card inside it is what reads as the ask.
  function deckCheckHtml(q) {
    return '<div class="dk-check" id="dkCheck" hidden><div class="dk-card">' +
      (q.label ? '<p class="ll-eyebrow">' + esc(q.label) + '</p>' : '') +
      '<h2 class="cs-q cs-q--lead">' + esc(q.stem) + '</h2>' +
      (q.kind === 'likert'
        ? likertHtml(true)
        : mcqHtml(q.options, true)) +
      '<button class="bl-check dk-submit" id="dkSubmit" type="button" disabled>' +
        (q.kind === 'mcq' ? 'Check answer' : 'Submit answer') + '</button>' +
      '<p class="dk-fb" id="dkFb" role="status" hidden></p>' +
    '</div></div>';
  }

  // ---- THE STAGE (2026-09-22) ------------------------------------------------
  // Video is the most immersive carrier, so it gets the room: a 16:9 stage
  // sized to whatever fits between the header and the footer. Read plays on
  // the SAME stage — one frame, one title row above it, and one progress rail
  // along its bottom edge (clip time, or reading position).
  //
  //  Read   — an immersive reader: large type, one paragraph in focus at a
  //           time with the rest dimmed, text size, and paragraph stepping.
  //
  // ONE CARRIER PER RUN (2026-10-27). The learner picks Watching, Listening
  // or Reading once, on "How do you prefer to learn?" after the pre-check,
  // and every screen after it is that format. The per-screen Watch / Read /
  // Read to me switch is gone, and with it the per-screen narration ("Read
  // to me") — Listening is the whole-module Listen mode, not a screen's
  // audio. Listen mode only reaches these screens for a remedial version,
  // which plays as Watch (the episode is the base content only, 2026-09-25).
  //
  // The question rises over the stage itself when the carrier finishes; the
  // held content blurs behind it (the reinforcement layer).
  function deckCarrier() {
    return !podcastPath() && modalityId() === 'article' ? 'article' : 'video';
  }
  function mmss(t) {
    t = Math.max(0, Math.round(t || 0));
    return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
  }
  function readSize() {
    try { var v = +sessionStorage.getItem('sh-read-size'); if (v >= 0 && v <= 3) return v; } catch (e) {}
    return 1;
  }

  // The Listen waveform: the track's real loudness (30 Hz envelope, base-36)
  // scrolling right-to-left past a fixed playhead — what has been said is
  // lit, what is coming is dim. Shared by the per-screen Listen carrier and
  // the podcast path's continuous episode, so the two can't drift apart.
  var WAVE_HZ = 30, WAVE_BAR = 4, WAVE_GAP = 3;   // CSS px per bar and gap
  function drawEnvelope(canvas, g, env, t) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    // Re-fit whenever the box changed (the caption rows settle after the
    // first frame, and the window can resize) — a stale bitmap stretches
    // and leaves ghost bars.
    var dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    g.clearRect(0, 0, w, h);
    var cs = getComputedStyle(document.documentElement);
    function tok(name, fb) { return (cs.getPropertyValue(name) || fb).trim(); }
    var mid = h / 2, cx = w / 2, pitch = WAVE_BAR + WAVE_GAP;
    var pos = t * WAVE_HZ;                    // playhead, in samples
    var first = Math.floor(pos - cx / pitch) - 1, last = Math.ceil(pos + cx / pitch) + 1;
    var lit = tok('--ll-teal', '#2ee6cf'), dim = 'rgba(' + tok('--ll-surface-rgb', '255,255,255') + ',.16)';
    for (var i = first; i <= last; i++) {
      if (i < 0 || i >= env.length) continue;
      var v = parseInt(env.charAt(i), 36) / 35;
      var bh = Math.max(3, v * (h * .92));
      var x = cx + (i - pos) * pitch - WAVE_BAR / 2;
      g.fillStyle = i <= pos ? lit : dim;
      g.globalAlpha = i <= pos ? .35 + .65 * (1 - Math.min(1, (pos - i) / (cx / pitch))) : 1;
      var r = WAVE_BAR / 2, y = mid - bh / 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, WAVE_BAR, bh, r); else g.rect(x, y, WAVE_BAR, bh);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function deckContent(id) {
    return function () {
      var d = deckFor(id);
      var q = deckCheck(d);
      var m = deckCarrier();
      return '<main class="ll-object dk-object"><div class="dk-theater">' +
        '<header class="dk-head">' +
          '<div class="dk-head-t">' +
            '<h1 class="dk-title">' + esc(d.title) + '</h1>' +
          '</div>' +
        '</header>' +

        '<div class="dk-stagewrap">' +
          '<div class="dk-stage" id="dkStage" data-mode="' + m + '">' +

            // Watch
            (m === 'video'
              ? '<section class="dk-layer dk-layer--video" id="dkVideoWrap" aria-label="Video">' +
                  videoFrame({ ids: DK_IDS, src: deckVideo(id), poster: videoPoster('', d.title, '') }) +
                '</section>'
              : '') +

            // Read
            (m !== 'article' ? '' :
            '<section class="dk-layer dk-layer--read" id="dkRead" aria-label="Reading view" data-size="' + readSize() + '">' +
              '<div class="dk-read-scroll" id="dkReadScroll"><article class="dk-read-col">' +
                // The article (default) or the podcast transcript, per the
                // Demo menu's "Read view". A reading step is a run of
                // paragraphs or turns, never one short line (readSteps).
                // Every step gets a fixed-height slot for the button, so moving
                // it between steps never shifts the text.
                (readStyle() === 'podcast'
                  ? readSteps(podcastTurns(id), function (l) { return l[1].length; }).map(function (grp) {
                      return grp.map(function (l) {
                        return '<p class="dk-turn" data-who="' + l[0].toLowerCase() + '">' +
                          '<span class="dk-who">' + esc(PODCAST_WHO[l[0]] || l[0]) + '</span>' + esc(l[1]) + '</p>';
                      }).join('');
                    })
                  : readSteps(articleFor(id), function (t) { return t.length; }).map(function (grp) {
                      return grp.map(function (t) { return '<p class="dk-ppar">' + esc(t) + '</p>'; }).join('');
                    })
                ).map(function (html, i) {
                  return '<div class="dk-para dk-step" data-i="' + i + '">' + html + '</div><div class="dk-slot"></div>';
                }).join('') +
                (d.source ? '<p class="dk-src"><i class="fa-solid fa-book" aria-hidden="true"></i> ' + esc(DECK_SOURCE) + '</p>' : '') +
              '</article></div>' +
              '<div class="dk-tools" role="toolbar" aria-label="Reading controls">' +
                '<button class="dk-tool" type="button" id="dkParaPrev" aria-label="Previous paragraph"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
                '<span class="dk-tool-n" id="dkParaN" aria-live="polite"></span>' +
                '<button class="dk-tool" type="button" id="dkParaNext" aria-label="Next paragraph"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
                '<span class="dk-tool-sep" aria-hidden="true"></span>' +
                '<button class="dk-tool" type="button" id="dkSizeDown" aria-label="Smaller text"><span class="dk-a sm">A</span></button>' +
                '<button class="dk-tool" type="button" id="dkSizeUp" aria-label="Larger text"><span class="dk-a lg">A</span></button>' +
              '</div>' +
            '</section>') +

            // The rail every carrier drives.
            '<div class="dk-rail" aria-hidden="true"><span class="dk-rail-fill" id="dkRail"></span></div>' +
          '</div>' +
          (q ? deckCheckHtml(q) : '') +
        '</div>' +
      '</div></main>';
    };
  }

  function deckInit(id) {
    return function (ctx) {
      var d = deckFor(id);
      var q = deckCheck(d);
      var stage = document.getElementById('dkStage');
      var rail = document.getElementById('dkRail');
      var video = document.getElementById(DK_IDS.video);
      var showing = stage.dataset.mode, handed = false;
      ctx.setCoachSay('');
      ctx.floatClose();

      function setRail(f) { rail.style.transform = 'scaleX(' + Math.max(0, Math.min(1, f || 0)) + ')'; }

      // ---- Read: the immersive reader --------------------------------------
      var read = (function () {
        var box = document.getElementById('dkRead');
        if (!box) return { enter: function () {}, sync: function () {} };
        var scroller = document.getElementById('dkReadScroll');
        var paras = [].slice.call(box.querySelectorAll('.dk-para'));
        var nEl = document.getElementById('dkParaN');
        var at = 0;
        // The way forward, in flow: one button that follows the paragraph in
        // focus. "Next" steps on; on the last paragraph it is the same "Done
        // reading" (the only one — the footer doesn't offer it), and once the question has been handed
        // over it has nothing left to do and goes away.
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'dk-next';
        next.addEventListener('click', function () {
          if (at < paras.length - 1) { focus(at + 1, true); next.focus({ preventScroll: true }); }
          else if (!handed) finished();
        });
        function placeNext() {
          var last = at === paras.length - 1;
          next.hidden = last && handed;
          next.innerHTML = last
            ? '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Done reading</span>'
            : '<span>Next</span><i class="fa-solid fa-arrow-down" aria-hidden="true"></i>';
          var slot = paras[at].nextElementSibling;
          if (next.parentNode !== slot) {
            slot.appendChild(next);
            // Re-run the entrance so the move reads as the control following along.
            next.style.animation = 'none'; void next.offsetWidth; next.style.animation = '';
          }
        }
        // Which paragraph is lit, and everything that follows from it — the
        // button, the count, the arrows, the rail. No scrolling here, so the
        // scroll handler below can call it too.
        function light(i) {
          at = Math.max(0, Math.min(paras.length - 1, i));
          paras.forEach(function (p, j) { p.classList.toggle('is-on', j === at); p.classList.toggle('is-past', j < at); });
          placeNext();
          nEl.textContent = (at + 1) + ' / ' + paras.length;
          document.getElementById('dkParaPrev').disabled = at === 0;
          document.getElementById('dkParaNext').disabled = at === paras.length - 1;
          setRail((at + 1) / paras.length);
        }
        // Light a paragraph and bring it (with its button) to the middle.
        var auto = false, autoT = 0;
        function focus(i, smooth) {
          light(i);
          var p = paras[at];
          var slot = p.nextElementSibling;
          var h = slot.offsetTop + slot.offsetHeight - p.offsetTop;
          var top = Math.max(0, p.offsetTop - (scroller.clientHeight - h) / 2);
          // Our own scroll must not be read back as the learner's (see below).
          if (smooth && Math.abs(scroller.scrollTop - top) > 1) {
            auto = true;
            clearTimeout(autoT);
            autoT = setTimeout(function () { auto = false; }, 700);
          }
          scroller.scrollTo({ top: top, behavior: smooth ? 'smooth' : 'auto' });
        }
        scroller.addEventListener('scrollend', function () { auto = false; clearTimeout(autoT); });
        // Scrolling IS reading. The text used to scroll freely while the lit
        // paragraph stayed put, so a learner could scroll it (and its button)
        // out of view and be left in all-dimmed text with no way on. Now the
        // paragraph at the reading line is the lit one, and the button follows.
        // "Reading line" = the last paragraph whose top has passed ~45% of the
        // view; moving the button shifts later text in the direction that
        // keeps the choice stable, so there's no flicker at a boundary. The
        // ends are pinned so the first and last paragraphs are always reachable
        // (the last one carries "Done reading").
        scroller.addEventListener('scroll', function () {
          if (auto) return;
          var y = scroller.scrollTop, max = scroller.scrollHeight - scroller.clientHeight;
          var pick;
          if (y >= max - 2) pick = paras.length - 1;
          else if (y <= 2) pick = 0;
          else {
            var line = y + scroller.clientHeight * 0.45;
            pick = 0;
            paras.forEach(function (p, j) { if (p.offsetTop <= line) pick = j; });
          }
          if (pick !== at) light(pick);
        }, { passive: true });
        paras.forEach(function (p, j) { p.addEventListener('click', function () { focus(j, true); }); });
        document.getElementById('dkParaPrev').addEventListener('click', function () { focus(at - 1, true); });
        document.getElementById('dkParaNext').addEventListener('click', function () { focus(at + 1, true); });
        function size(delta) {
          var v = Math.max(0, Math.min(3, (+box.dataset.size || 0) + delta));
          box.dataset.size = v;
          try { sessionStorage.setItem('sh-read-size', v); } catch (e) {}
          document.getElementById('dkSizeDown').disabled = v === 0;
          document.getElementById('dkSizeUp').disabled = v === 3;
          requestAnimationFrame(function () { focus(at, false); });
        }
        document.getElementById('dkSizeDown').addEventListener('click', function () { size(-1); });
        document.getElementById('dkSizeUp').addEventListener('click', function () { size(1); });
        // Arrow keys step paragraphs while the reader is showing and focus is
        // not in a control that owns them.
        box.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); focus(at + 1, true); }
          if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); focus(at - 1, true); }
        });
        size(0);
        return {
          enter: function () { requestAnimationFrame(function () { focus(at, false); }); },
          sync: placeNext
        };
      })();

      // The carrier is done. With no question, Continue opens. With one, the
      // question rises over the stage and Continue stays shut until it is
      // answered.
      function finished() {
        if (handed) return; handed = true;
        read.sync();
        if (!q) { ctx.enableNext(); return; }
        ctx.disableNext();
        if (video) try { video.pause(); } catch (e) {}
        var el = document.getElementById('dkCheck');
        reinforce(ctx, el, 1, 1);
        // Over the whole page: lifted out of the stage onto <body> (a fixed
        // layer inside the step would be trapped by any transformed or
        // filtered ancestor), and taken away again when the step is torn
        // down, since the engine only clears its own stage. Moved AFTER
        // reinforce(), which marks the layer's parent as held — done on
        // <body> that would blur the footer too.
        el.classList.add('dk-check--page');
        document.body.appendChild(el);
        try { el.focus({ preventScroll: true }); } catch (e) {}
        var stageRoot = document.querySelector('.ll-stage');
        if (stageRoot && window.MutationObserver) {
          var gone = new MutationObserver(function () {
            if (document.body.contains(stage)) return;
            gone.disconnect();
            if (el.parentNode) el.parentNode.removeChild(el);
          });
          gone.observe(stageRoot, { childList: true, subtree: true });
        }
        var host = el.querySelector('.dk-opts, .lk');
        var fb = document.getElementById('dkFb');
        wireChoice(host, document.getElementById('dkSubmit'), function (v, picked) {
          document.getElementById('dkSubmit').classList.add('is-spent');
          if (q.kind === 'mcq') {
            var ok = v === q.correct;
            // 2026-09-24 live review: say the verdict in words, both ways.
            // A first miss does NOT reveal the right answer: the learner
            // goes into the remedial content next and meets this question
            // again, so the feedback only says what happens next. A second
            // miss (the re-ask on the remedial screen) is the last time
            // they see it, so that one still names the right answer.
            // The incorrect line is Rob's wording, standing in until
            // Jessica's authored feedback lands in the deck (q.noFb).
            var last = !!d.recheck;
            csMark(picked, ok ? 'ok' : 'bad');
            if (!ok) csTag(picked, 'Your answer');
            if (!ok && last) {
              // Names both rows, so the right answer can't be mistaken
              // for a second pick (colour + mark + words).
              var right = host.querySelectorAll('.cs-opt')[q.correct];
              csMark(right, 'ok');
              csTag(right, 'Correct answer');
            }
            var body = ok ? q.okFb
              : last ? ''
              : (q.noFb || 'Let\u2019s dig into this again from a slightly different lens.');
            fb.innerHTML = '<strong class="dk-fb-h"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') +
                '" aria-hidden="true"></i> ' + (ok ? 'Correct' : 'Not quite') + '</strong>' +
              (body ? '<span class="dk-fb-b">' + esc(body) + '</span>' : '');
            fb.className = 'dk-fb ' + (ok ? 'is-ok' : 'is-bad');
            fb.hidden = false;
            clearFooter(fb);
            saveResult(q.key, { variant: q.variant, passed: ok, picked: v, carrier: showing });
          } else if (q.kind === 'insight') {
            csMark(picked, 'neutral');
            saveResult(q.key, { picked: v, answer: q.options[v].t, carrier: showing });
            markRecorded();
          } else {
            picked.classList.add('is-picked');
            saveResult(q.key, { score: v, carrier: showing });
            markRecorded();
          }
          ctx.enableNext();
          // Ungraded items have no verdict to show, so after Submit the card
          // just went quiet and it wasn't clear the screen was done (2026-10-23
          // review). A plain status line takes the spent button's place — same
          // height, so nothing on the card shifts.
          function markRecorded() {
            var btn = document.getElementById('dkSubmit');
            var line = document.createElement('p');
            line.className = 'dk-recorded';
            line.setAttribute('role', 'status');
            line.style.minHeight = btn.offsetHeight + 'px';
            line.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Answer recorded';
            btn.replaceWith(line);
          }
        });
      }

      // The run's one carrier (deckCarrier), chosen on the offer screen.
      if (showing === 'video') {
        // mountVideo unlocks Continue on 'ended' by itself; finished()
        // shuts it again on a screen whose question is still to come.
        mountVideo(ctx, { ids: DK_IDS, src: deckVideo(id), onFallback: finished, onEnded: finished });
        video.addEventListener('timeupdate', function () {
          if (video.duration) setRail(video.currentTime / video.duration);
        });
        setRail(0);
      } else {
        // No footer "Done reading": the in-flow Next button walks the text
        // and becomes "Done reading" on the last paragraph.
        read.enter();
      }
      // Warm the next screen's video, but not while this one is still
      // loading — they'd split the bandwidth.
      if (video && showing === 'video') {
        video.addEventListener('canplaythrough', function () { warmNextVideo(id); }, { once: true });
      } else {
        warmNextVideo(id);
      }
    };
  }

  // `extra.deck` serves a DECK entry under a different step id — the podcast
  // step id (Listen mode once ran the remedial screens again this way),
  // and two steps can't share an id.
  //
  // `served` is the step's own routing rule (base vs harder vs reinforced),
  // kept apart from `when` because the podcast path skips every non-remedial
  // screen yet still needs to know which version this learner is served —
  // the Listen mode post-check asks the question of whichever version played.
  function deckStep(id, extra) {
    var deck = (extra && extra.deck) || id;
    // The blue bar carries the module name; the screen's own title sits above
    // the video, so showing it in both places just repeated it.
    var s = { id: id, icon: 'fa-circle-play', mins: 2, stage: 'Learn', lesson: 'Contain the Sharp',
              mode: 'floating', gate: true, coach: { say: '' },
              content: deckContent(deck), init: deckInit(deck) };
    for (var k in extra) if (k !== 'deck') s[k] = extra[k];
    if (!DECK[deck].recheck) {
      var served = s.when || function () { return true; };
      s.served = served;
      s.when = function () { return served() && !podcastPath(); };
    }
    return s;
  }

  // ==========================================================================
  //  LISTEN MODE (2026-09-25; renamed from "the podcast path" 2026-09-29;
  //  rebuilt on the recorded audio package 2026-10-01). No learner surface
  //  says "podcast"; internal names — podcastPath(), the podpath/podpos
  //  keys — keep the old word.
  //
  //    pre-check → the offer → ONE continuous listen → the questions →
  //    review set (missed knowledge questions only) → completion → simulation
  //
  //  NOTHING content-specific lives here. Two kinds of data drive it:
  //    data/sharps-listen/config.json — which package each sector plays,
  //        trigger rules (testOut / harder / reinforce), chapter titles,
  //        which question goes with each topic, speed options, the review
  //        set's retry rule;
  //    assets/audio/sharps/listenModeAudio-<sector>/ — the Listen Mode
  //        Studio's "Prototype package", unzipped as is: manifest.json (the
  //        fixed topic order, versions, bridges and closers) plus audio/ and
  //        its WebVTT captions, which the page turns into timed sentences
  //        itself (no build step; tools/listen-mode/build.py belongs to the
  //        earlier hand-made package and is no longer needed).
  //  A new export for a sector means replacing that sector's folder (and
  //  bumping config.audioVersion) and nothing else.
  //
  //  The pre-check answers are SNAPSHOTTED when the learner chooses Listen
  //  mode (podpath.results), and the listen is always resolved from that
  //  snapshot — a resume or replay rebuilds the same listen even if the
  //  answers changed since.
  //
  //  Playback: every file this learner needs is fetched and decoded, then
  //  the listen is assembled on an OfflineAudioContext — each piece
  //  scheduled back to back on its clock (sample-accurate joins, a short
  //  gain ramp at every edge) — and the rendered result plays through ONE
  //  <audio> element. Web Audio does the joining; the media element is what
  //  keeps playing on a locked phone, shows lock-screen controls, does
  //  speed, and resumes by time. Needs the page served over http(s): fetch
  //  and decode don't work from a double-clicked file.
  // ==========================================================================
  var LISTEN_CONFIG_URL = '../data/sharps-listen/config.json';
  function podcastPath() {
    // Admin preview with one format allowed: the format screen is skipped,
    // so that format decides the path.
    if (AP && AP.only()) return AP.only() === 'listen';
    return !!(readCourse().podpath || {}).podcast;
  }

  // ---- The data ------------------------------------------------------------
  // One package per sector (config.sectors → that package's manifest.json),
  // fetched at script load and again if the Demo menu's Context lens moves to
  // the other sector. LD() is always the CURRENT sector's data, or null while
  // it loads; nothing else holds on to a package.
  var listenCache = {}, listenPending = {};
  function listenSectorKey() { return LE.lensId() || 'manufacturing'; }
  function LD() { return listenCache[listenSectorKey()] || null; }
  function fetchListen(url, as) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Couldn’t load ' + url + ' (' + r.status + ')');
      return as === 'text' ? r.text() : r.json();
    });
  }

  // A package's captions are WebVTT files, one per audio file. Their cues are
  // regrouped into whole sentences (the player shows one at a time): words
  // spread across their cue by character share, a speaker change or sentence
  // end closes a sentence, [stage directions] drop out, and an ALL-CAPS word
  // is spoken emphasis (shown in lower case, flagged in `em`).
  function vttSeconds(x) {
    var p = x.replace(',', '.').split(':').map(Number);
    while (p.length < 3) p.unshift(0);
    return p[0] * 3600 + p[1] * 60 + p[2];
  }
  function parseVtt(text) {
    var words = [];
    text.replace(/\r/g, '').split(/\n\s*\n/).forEach(function (block) {
      var m = block.match(/([0-9:.,]+)\s*-->\s*([0-9:.,]+)/);
      if (!m) return;
      var s = vttSeconds(m[1]), e = vttSeconds(m[2]), body = block.slice(m.index + m[0].length).trim();
      var v = body.match(/^<v\s+([^>]+)>/), who = v ? v[1].trim().toUpperCase() : '';
      var ws = body.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').replace(/\[[^\]]*\]\s*/g, '').trim().split(/\s+/)
        .filter(Boolean).map(function (w) {
          var core = w.replace(/[^A-Za-z]/g, ''), em = core.length >= 2 && core === core.toUpperCase() && w.indexOf('-') < 0;
          return { w: em ? w.toLowerCase() : w, em: em };
        });
      var total = ws.reduce(function (n, x) { return n + x.w.length + 1; }, 0) || 1, acc = 0;
      ws.forEach(function (x) {
        var a = s + (e - s) * acc / total;
        acc += x.w.length + 1;
        words.push({ w: x.w, em: x.em, who: who, s: a, e: s + (e - s) * acc / total });
      });
    });
    var sents = [], cur = [];
    function flush() {
      if (!cur.length) return;
      var em = [];
      cur.forEach(function (x, i) { if (x.em) em.push(i); });
      sents.push({ w: cur[0].who, t: cur.map(function (x) { return x.w; }).join(' '), em: em,
                   s: +cur[0].s.toFixed(3), e: +cur[cur.length - 1].e.toFixed(3) });
    }
    words.forEach(function (x) {
      if (cur.length && x.who !== cur[0].who) { flush(); cur = []; }
      cur.push(x);
      if (/[.?!]["”’)]*$/.test(x.w)) { flush(); cur = []; }
    });
    flush();
    return sents;
  }

  // Every audio entry a manifest names: topic versions, bridges, closers.
  function manifestEntries(m) {
    var out = [];
    Object.keys(m.topics || {}).forEach(function (t) {
      Object.keys(m.topics[t]).forEach(function (k) { var e = m.topics[t][k]; if (e && typeof e === 'object' && e.file) out.push(e); });
    });
    ['bridges', 'closers'].forEach(function (g) {
      var seams = (m.seams || {})[g] || {};
      Object.keys(seams).forEach(function (k) { out.push(seams[k]); });
    });
    return out;
  }
  // The names the resolver plays by: a package from the studio says `base`
  // (or `universal` for a one-version topic) and `testup`; the hand-made one
  // before it said `normal` and `harder`. Both play.
  function normalizeManifest(m) {
    Object.keys(m.topics || {}).forEach(function (t) {
      var d = m.topics[t];
      if (!d.normal) d.normal = d.base || d.universal;
      if (!d.harder && d.testup) d.harder = d.testup;
    });
    return m;
  }

  function loadListenData() {
    var key = listenSectorKey();
    if (listenCache[key]) return Promise.resolve(listenCache[key]);
    if (listenPending[key]) return listenPending[key];
    var p = fetchListen(LISTEN_CONFIG_URL).then(function (config) {
      var url = (config.sectors || {})[key] || (config.sectors || {})[config.defaultSector] || config.manifest;
      var base = url.replace(/[^\/]*$/, '');
      var reviews = config.review && config.review.topics || {}, cardsBase = LISTEN_CONFIG_URL.replace(/[^\/]*$/, '');
      return fetchListen(url).then(function (manifest) {
        normalizeManifest(manifest);
        var timing = {};
        // Captions come with the package; no build step.
        var captioned = Promise.all(manifestEntries(manifest).map(function (e) {
          timing[e.file] = { dur: e.duration, sents: [] };
          if (!e.captions) return null;
          return fetchListen(base + e.captions, 'text').then(function (txt) { timing[e.file].sents = parseVtt(txt); })
            .catch(function () {});   // a missing caption file leaves that part uncaptioned, not unplayable
        }));
        var hb = config.handBack;
        if (hb) timing[hb.file] = { dur: hb.dur, sents: hb.sents || [] };
        var cards = Promise.all(Object.keys(reviews).map(function (k) {
          return fetchListen(cardsBase + reviews[k].cards).then(function (c) { return [k, c]; });
        }));
        return Promise.all([captioned, cards]).then(function (r) {
          var byTopic = {};
          r[1].forEach(function (c) { byTopic[c[0]] = c[1]; });
          return (listenCache[key] = { sector: key, config: config, manifest: manifest, timing: timing, base: base, cards: byTopic });
        });
      });
    });
    listenPending[key] = p;
    p.catch(function () { delete listenPending[key]; });   // let a retry try again
    return p;
  }
  if (location.protocol !== 'file:') loadListenData().catch(function () {});

  // ---- The learner's answers, as the rules read them -------------------------
  // The Demo menu's Battery/Feel overrides count, as everywhere else.
  function feelScore(key) {
    try { var o = sessionStorage.getItem('sh-feel'); if (o === 'low') return 2; if (o === 'high') return 5; } catch (e) {}
    var v = (readCourse().battery || {})[key];
    return v == null ? null : v;
  }
  function listenResultsLive() {
    return { k1: { correct: k1Correct() }, k2: { correct: k2Correct() },
             f1: { score: feelScore('f1') }, f3: { score: feelScore('f3') } };
  }
  // The snapshot taken when Listen mode was chosen (older runs, saved before
  // there was one, fall back to the live answers).
  function listenResults() {
    var p = readCourse().podpath;
    return (p && p.results) || listenResultsLive();
  }
  function ruleHolds(rule, results) {
    if (!rule) return false;
    var r = results[rule.item] || {};
    if (rule.rule === 'correct') return r.correct === true && r.confident !== false;
    if (rule.rule === 'scoreAtMost') return r.score != null && r.score <= rule.value;
    return false;
  }
  function ruleWhy(rule, results) {
    var r = results[rule.item] || {}, item = rule.item.toUpperCase();
    if (rule.rule === 'correct') return item + ' pre-check answered correctly';
    return item + ' agreement ' + r.score + ' (at or below ' + rule.value + ')';
  }

  // Splice point for a topic — the manifest's, unless a reviewer has nudged
  // it in the splice test this session.
  function seamFor(t, data) {
    try { var o = sessionStorage.getItem('sh-seam-' + t); if (o != null && o !== '') return +o; } catch (e) {}
    return data.manifest.topics[t].seamAt;
  }
  // Every audio request carries a version (the manifest's, else the config's
  // `audioVersion`: the studio's manifests have none, and re-exports reuse the
  // same names), so replacing audio reaches browsers that cached the old take.
  function audioUrl(file, data) {
    var v = data.manifest.version || data.config.audioVersion || data.manifest.ledgerVersion;
    return data.base + file + (v ? '?v=' + encodeURIComponent(v) : '');
  }
  function fileDur(file, data) {
    var t = data.timing[file];
    return t ? t.dur : null;
  }

  // ---- The resolver ----------------------------------------------------------
  // One way to play each topic, in the manifest's fixed order:
  //   0. skipped, if the pre-check tests the learner out of it
  //      (config.triggers.testOut — the package's K1: routing "testOut");
  //   1. a `reinforced` whole file, if the topic has one and the learner
  //      needs reinforcement;
  //   2. else, needing reinforcement with an `addon` and a valid seamAt:
  //      normal[0 → seam], the add-on, normal[seam → end], no gap (the old
  //      hand-made package; the studio's packages swap whole files instead);
  //   3. else `harder` (the studio's `testup`) when the learner qualifies;
  //   4. else `normal` (the studio's `base` or `universal`).
  // Each entry carries `why`, the plain-language trace a reviewer sees.
  function resolveListen(results, data) {
    var m = data.manifest, trig = data.config.triggers || {};
    return m.order.map(function (t) {
      var def = m.topics[t];
      if (!def) throw new Error('The manifest’s order names “' + t + '”, which it doesn’t define.');
      var out = (trig.testOut || {})[t], reinforce = (trig.reinforce || {})[t], harder = (trig.harder || {})[t];
      if (testOutOn() && ruleHolds(out, results)) return { topic: t, how: 'skip', why: ruleWhy(out, results) + ' → tested out, part skipped' };
      var needs = ruleHolds(reinforce, results), up = testUpOn() && ruleHolds(harder, results);
      if (needs && def.reinforced) return { topic: t, how: 'reinforced', why: ruleWhy(reinforce, results) + ' → reinforced version' };
      if (needs && def.addon) {
        var seam = seamFor(t, data), d = fileDur(def.normal.file, data);
        if (seam > 0 && (d == null || seam < d))
          return { topic: t, how: 'addon', seam: seam, why: ruleWhy(reinforce, results) + ' → add-on spliced in at ' + seam + 's' };
      }
      if (up && def.harder) return { topic: t, how: 'harder', why: ruleWhy(harder, results) + ' → harder version' };
      var why = out && !testOutOn() ? 'normal (skip ahead is off for this assignment)'
        : harder && !testUpOn() ? 'normal (harder checks are off for this assignment)'
        : out ? 'normal (' + out.item.toUpperCase() + ' pre-check not answered correctly)'
        : harder && !up ? 'normal (' + harder.item.toUpperCase() + ' pre-check not answered correctly)'
        : reinforce && !needs ? 'normal (no reinforcement needed)'
        : 'normal (single version)';
      return { topic: t, how: 'normal', why: why };
    });
  }
  // The plan as playback pieces on one timeline. Each piece carries the
  // silence before it (`gap`, the sting's placeholder): the manifest's
  // gapBetweenPartsSec between every two parts, a topic's own gapBeforeSec
  // overriding it for the join into that topic, none inside a spliced topic.
  // Seams, when the package has them, are the studio's rules:
  //   · a bridge plays between two topics that are both in the listen,
  //     named for the pair (the topic just heard > the next one played, so a
  //     skipped topic between them is already accounted for);
  //   · the closer written for the last topic heard plays in place of the
  //     close, when the package has one for it.
  // A package without `seams` plays exactly the topics, as before.
  function gapBefore(topic, data) {
    var d = data.manifest.topics[topic];
    return d && d.gapBeforeSec != null ? d.gapBeforeSec : (data.manifest.gapBetweenPartsSec || 0);
  }
  function listenPieces(plan, data) {
    var m = data.manifest, seams = m.seams || {}, t = 0, out = [], last = null;
    function piece(topic, file, offset, dur, gap, kind) {
      var full = fileDur(file, data);
      if (dur == null) dur = (full == null ? null : full - offset);
      if (out.length) t += gap; else gap = 0;
      out.push({ topic: topic, file: file, offset: offset, dur: dur, at: t, gap: gap, kind: kind });
      t += dur || 0;
    }
    plan.forEach(function (p) {
      var def = m.topics[p.topic];
      if (p.how === 'skip') return;
      var content = def.objective != null, gap = gapBefore(p.topic, data);
      if (content && last) {
        var bridge = (seams.bridges || {})[last + '>' + p.topic];
        if (bridge) piece(last, bridge.file, 0, null, m.gapBetweenPartsSec || 0, 'bridge');
      }
      if (p.topic === 'close' && last && (seams.closers || {})[last]) {
        piece(p.topic, seams.closers[last].file, 0, null, gap, 'closer');
      } else if (p.how === 'reinforced') piece(p.topic, def.reinforced.file, 0, null, gap, 'topic');
      else if (p.how === 'addon') {
        piece(p.topic, def.normal.file, 0, p.seam, gap, 'topic');
        piece(p.topic, def.addon.file, 0, null, 0, 'topic');
        piece(p.topic, def.normal.file, p.seam, null, 0, 'topic');
      } else piece(p.topic, (p.how === 'harder' ? def.harder : def.normal).file, 0, null, gap, 'topic');
      if (content) last = p.topic;
    });
    // The hand-back to the screen ("You may now continue the lesson."), for a
    // package that doesn't carry its own `continue` topic.
    var hb = data.config.handBack;
    if (hb && out.length && m.order.indexOf('continue') < 0) piece('close', hb.file, 0, null, hb.gap || 0, 'handback');
    return { pieces: out, dur: t };
  }
  // A chapter's name: the manifest's, or the config's (the studio's packages
  // don't carry titles).
  function topicTitle(t, data) {
    var def = data.manifest.topics[t] || {};
    return def.title || (data.config.titles || {})[t] || t;
  }
  function listenMinutes() {
    if (!LD()) return null;
    try { return Math.max(1, Math.round(listenPieces(resolveListen(listenResults(), LD()), LD()).dur / 60)); }
    catch (e) { return null; }
  }
  // Reviewer trace for the captions: which answer put each part here.
  function listenTrace() {
    if (!LD()) return 'Loading the audio manifest…';
    try {
      return resolveListen(listenResults(), LD()).map(function (p) { return p.topic + ': ' + p.why; }).join(' · ');
    } catch (e) { return String(e.message || e); }
  }

  // ---- The offer -------------------------------------------------------------
  // After the pre-check, because the pre-check is what builds the listen.
  // Two modes: Listen mode, or Standard mode (the screen-by-screen path in
  // whatever format each screen offers — so not "Watch", which every screen
  // lets them change). How Listen mode works sits behind its own toggle.
  //
  // 2026-09-29: the page reflects the learner's saved mode preference. With
  // one saved, that mode is preselected ("Continue in…", tagged Your
  // preference) and the other reads "Switch to…"; picking the other offers
  // to make it the new preference. With none saved, whichever they pick can
  // be saved for future modules. Select, then Continue — the choice no
  // longer advances on its own, since a checkbox now travels with it.
  //
  // The preference is a learner PROFILE setting, not this run's progress, so
  // it lives in localStorage and survives Start over. PROTOTYPE: a real
  // build reads and writes it on the learner's profile. Demo → "Mode
  // preference" sets or clears it.
  var MODE_PREF_KEY = 'sh-mode-pref';
  function modePref() {
    try { var v = localStorage.getItem(MODE_PREF_KEY); return v === 'listen' || v === 'standard' ? v : null; }
    catch (e) { return null; }
  }
  function setModePref(v) {
    try { if (v) localStorage.setItem(MODE_PREF_KEY, v); else localStorage.removeItem(MODE_PREF_KEY); } catch (e) {}
  }
  var MODES = {
    listen:   { icon: 'fa-headphones', name: 'Listen mode',
                // No runtime here on purpose: Standard mode shows none, and a time
                // on one option only reads as a reason to pick it.
                sub: function () { return 'An audio podcast with questions at the end.'; } },
    standard: { icon: 'fa-display', name: 'Classic mode',
                sub: function () { return 'Videos and articles with questions after each.'; } }
  };
  // "How do you prefer to learn?" (2026-10-20, DLE alignment): the learner's
  // answer sets the modality. Listening = Listen mode; Watching and Reading are
  // Classic mode with the video or the article as the default carrier
  // (sh-modality, the key every beat's modalityDefault reads). The saved
  // MODE preference stays listen | standard; a saved Classic learner also
  // keeps which of the two (sh-format-pref).
  var FORMAT_PREF_KEY = 'sh-format-pref';
  function formatPref() {
    try { var v = localStorage.getItem(FORMAT_PREF_KEY); return v === 'video' || v === 'article' ? v : null; }
    catch (e) { return null; }
  }
  function setFormatPref(v) {
    try { if (v) localStorage.setItem(FORMAT_PREF_KEY, v); else localStorage.removeItem(FORMAT_PREF_KEY); } catch (e) {}
  }
  var OFFER = [
    { key: 'video',   name: 'Watching',  icon: 'fa-circle-play', sub: 'Videos with questions after each.' },
    { key: 'listen',  name: 'Listening', icon: 'fa-headphones',  sub: 'An audio podcast with questions at the end.' },
    { key: 'article', name: 'Reading',   icon: 'fa-file-lines',  sub: 'Articles with questions after each.' }
  ];
  // The title page's preference card, in the picker's own shape: the same
  // three options, names, icons and order as the offer above (2026-10-27),
  // so the setting reads the same wherever the learner meets it.
  var MODE_CARD = {};
  OFFER.forEach(function (o) { MODE_CARD[o.key] = { icon: o.icon, label: o.name }; });
  // The formats this run may offer: all three, or in an admin preview only
  // the ones the assignment allows ("Formats people can choose").
  function offered() { return AP ? OFFER.filter(function (o) { return AP.allows(o.key); }) : OFFER; }
  function offeredKeys() { return offered().map(function (o) { return o.key; }); }
  // Saving an offer key writes the mode, and for Classic, which format.
  function setOfferPref(k) {
    setModePref(k === 'listen' ? 'listen' : 'standard');
    if (k !== 'listen') setFormatPref(k);
  }
  // The offer key a saved preference stands for, or null.
  function offerPref() {
    var m = modePref();
    return m === 'listen' ? 'listen' : m === 'standard' ? (formatPref() || 'video') : null;
  }
  function PODOFFER_CONTENT() {
    var pref = offerPref();
    return '<main class="ll-object po-object"><div class="po">' +
      '<h1 class="po-head">How do you prefer to learn?</h1>' +
      '<div class="po-opts" role="radiogroup" aria-label="How do you prefer to learn?">' +
        offered().map(function (o) {
          var k = o.key;
          // The visual is a quiet picture of the experience's shape: one long
          // listen then a short quiz, versus three watch/read-then-answer pairs.
          var vis = k === 'listen'
            ? '<span class="po-wave" data-wave></span><span class="po-kz"></span>'
            : '<span class="po-pair"><i class="w"></i><i class="k"></i></span>'.repeat(3);
          // Three tall cards side by side, each with its description showing. A
          // div, not a button, so each can hold richer content.
          return '<div class="po-opt" tabindex="0" role="radio" aria-checked="false" data-pick="' + k + '">' +
            '<span class="po-opt-top">' +
              '<span class="po-ico"><i class="fa-solid ' + o.icon + '" aria-hidden="true"></i></span>' +
              '<span class="po-radio" aria-hidden="true"></span>' +
            '</span>' +
            '<span class="po-txt"><b>' + esc(o.name) + '</b>' +
              (k === pref ? '<span class="po-tag">Your preference</span>' : '') +
              '<small>' + esc(o.sub) + '</small></span>' +
            '<span class="po-vis' + (k === 'listen' ? '' : ' po-vis--std') + '" aria-hidden="true">' + vis + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<label class="po-save" id="poSave" hidden>' +
        '<input type="checkbox" id="poSaveBox" />' +
        '<span id="poSaveLabel"></span>' +
      '</label>' +
    '</div></main>';
  }
  function podofferInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    var pref = offerPref();
    var opts = [].slice.call(document.querySelectorAll('.po-opt'));
    var save = document.getElementById('poSave'), box = document.getElementById('poSaveBox');
    var saveLabel = document.getElementById('poSaveLabel');
    var picked = null;

    // Deterministic waveform that fills whatever width its box has.
    var wave = document.querySelector('[data-wave]');
    function drawWave() {
      if (!wave || !wave.isConnected) return;
      var n = Math.max(16, Math.floor(wave.clientWidth / 6)), h = [];
      for (var i = 0; i < n; i++) h.push(18 + Math.round(60 * Math.abs(Math.sin(i * .55) * Math.cos(i * .21 + 1))));
      wave.innerHTML = h.map(function (v) { return '<i style="height:' + v + '%"></i>'; }).join('');
    }
    drawWave();
    window.addEventListener('resize', drawWave);

    // Commit the pick for this module: which path runs, which carrier the
    // Classic beats open on, and (for Listen mode) the frozen cut.
    function commit(k) {
      var pod = k === 'listen';
      if (!pod) { try { sessionStorage.setItem('sh-modality', k); } catch (e) {} }
      var was = readCourse().podpath;
      // A fresh choice (or a changed one) starts the listen from the top.
      if (!was || !!was.podcast !== pod) { saveResult('podpos', null); saveResult('podcast', null); }
      // Listen mode freezes the pre-check answers it was built from.
      saveResult('podpath', { podcast: pod, results: pod ? listenResultsLive() : null });
      LE.refreshNav();
    }
    function pick(k) {
      picked = k;
      opts.forEach(function (b) { b.setAttribute('aria-checked', b.dataset.pick === k ? 'true' : 'false'); });
      commit(k);
      // The checkbox: save a first preference, or replace a different one.
      // Picking the mode that's already the preference needs neither.
      var offer = !pref || pref !== k;
      save.hidden = !offer;
      box.checked = false;
      saveLabel.textContent = 'Save preference';
      ctx.enableNext();
    }
    opts.forEach(function (b) { b.addEventListener('click', function () { pick(b.dataset.pick); }); });
    opts.forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.target !== b || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault(); pick(b.dataset.pick);
      });
    });
    // An unchecked box never changes what was saved; a checked one saves the
    // mode and, for Classic, which format.
    box.addEventListener('change', function () {
      if (!box.checked) return;
      setOfferPref(picked);
    });

    // Back from later in the module: this run's own pick wins. Otherwise the
    // saved preference is preselected, so Continue carries straight on.
    var chosen = readCourse().podpath;
    if (chosen) pick(chosen.podcast ? 'listen' : (modalityId() === 'article' ? 'article' : 'video'));
    else if (pref) pick(pref);
    else ctx.disableNext();
  }

  // ---- The player --------------------------------------------------------------
  // The Read to me player's look (stage, waveform, word-by-word captions)
  // over the whole assembled listen. Chapters are TOPICS, not files — an
  // add-on belongs to its topic's chapter. The page never scrolls; the
  // chapter list opens over the stage. Play/pause, back 15 s, and (config)
  // speed on screen; play/pause on the lock screen; no scrubbing ahead.

  // Fetch + decode every file the pieces need (once each), then schedule the
  // pieces back to back on an OfflineAudioContext and render. A failed fetch
  // or decode rejects naming the file — a part is never skipped silently.
  function renderListen(data, pieces, onProgress) {
    var rate = data.config.renderSampleRate || 24000;
    var files = [];
    pieces.forEach(function (p) { if (files.indexOf(p.file) < 0) files.push(p.file); });
    var probe = new OfflineAudioContext(1, rate, rate), done = 0, bufs = {};
    return Promise.all(files.map(function (f) {
      return fetch(audioUrl(f, data)).then(function (r) {
        if (!r.ok) throw new Error('missing ' + f + ' (' + r.status + ')');
        return r.arrayBuffer();
      }).then(function (ab) {
        return new Promise(function (res, rej) {
          probe.decodeAudioData(ab, res, function () { rej(new Error('could not decode ' + f)); });
        });
      }).then(function (b) {
        bufs[f] = b; done++; onProgress(done / files.length);
      }).catch(function (e) { e.file = f; throw e; });
    })).then(function () {
      // Durations from the DECODED audio, not the timing file: they are
      // what the clock actually schedules.
      var t = 0;
      pieces.forEach(function (p, i) {
        if (i) t += p.gap || 0;
        var b = bufs[p.file];
        p.dur = Math.max(0, Math.min(p.dur == null ? Infinity : p.dur, b.duration - p.offset));
        p.at = t; t += p.dur;
      });
      var total = t, ctx = new OfflineAudioContext(1, Math.ceil(total * rate) + rate, rate);
      var fade = (data.manifest.spliceFadeMs || 25) / 1000;
      pieces.forEach(function (p) {
        var src = ctx.createBufferSource(), g = ctx.createGain(), f = Math.min(fade, p.dur / 4);
        src.buffer = bufs[p.file];
        g.gain.setValueAtTime(0, p.at);
        g.gain.linearRampToValueAtTime(1, p.at + f);
        g.gain.setValueAtTime(1, p.at + p.dur - f);
        g.gain.linearRampToValueAtTime(0, p.at + p.dur);
        src.connect(g); g.connect(ctx.destination);
        src.start(p.at, p.offset, p.dur);
      });
      return ctx.startRendering().then(function (out) { return { buffer: out, dur: total }; });
    });
  }
  // 16-bit mono WAV from the rendered buffer, so one <audio> element plays it.
  function wavBlob(buf, dur) {
    var rate = buf.sampleRate, n = Math.min(buf.length, Math.ceil(dur * rate)), ch = buf.getChannelData(0);
    var ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, n * 2, true);
    for (var i = 0, o = 44; i < n; i++, o += 2) {
      var x = Math.max(-1, Math.min(1, ch[i]));
      v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    return new Blob([ab], { type: 'audio/wav' });
  }
  // The waveform's loudness, measured from the rendered listen itself.
  function envFromBuffer(buf, dur) {
    var ch = buf.getChannelData(0), step = Math.round(buf.sampleRate / WAVE_HZ), n = Math.ceil(dur * WAVE_HZ), raw = [];
    for (var k = 0; k < n; k++) {
      var s = 0, a = k * step, b = Math.min(ch.length, a + step);
      for (var i = a; i < b; i++) s += ch[i] * ch[i];
      raw.push(Math.sqrt(s / Math.max(1, b - a)));
    }
    var peak = Math.max.apply(null, raw.concat([1e-6]));
    return raw.map(function (x) { return '0123456789abcdefghijklmnopqrstuvwxyz'.charAt(Math.min(35, Math.floor(35 * Math.pow(x / peak, .7)))); }).join('');
  }
  // Captions on the listen's own clock: each piece contributes the sentences
  // that fall inside its slice of its file, shifted to where it plays.
  function listenSentences(pieces, data) {
    var out = [];
    pieces.forEach(function (p) {
      var tm = data.timing[p.file];
      if (!tm) return;
      tm.sents.forEach(function (st) {
        if (st.s < p.offset - .05 || st.s >= p.offset + p.dur) return;
        out.push({ w: st.w, t: st.t, em: st.em || [], s: p.at + (st.s - p.offset),
                   e: p.at + Math.min(st.e, p.offset + p.dur) - p.offset });
      });
    });
    return out;
  }
  // Chapters by topic: numbered in order, spanning all of a topic's pieces.
  function listenChapters(pieces, data) {
    var out = [];
    pieces.forEach(function (p) {
      var def = data.manifest.topics[p.topic];
      var last = out[out.length - 1];
      if (last && last.topic === p.topic) { last.end = p.at + p.dur; return; }
      out.push({ topic: p.topic, title: topicTitle(p.topic, data), chapter: def.chapter !== false, start: p.at, end: p.at + p.dur });
    });
    var n = 0;
    out.forEach(function (c) { if (c.chapter) c.n = ++n; });
    out.total = n;
    return out;
  }

  function EPISODE_CONTENT() {
    return '<main class="ll-object dk-object ep-object"><div class="dk-theater">' +
      '<header class="dk-head"><div class="dk-head-t">' +
        '<p class="ll-eyebrow" id="epEyebrow">Listen mode</p>' +
        '<h1 class="dk-title" id="epTitle">Contain the Sharp</h1>' +
      '</div>' +
        '<button class="ep-ch-btn" type="button" id="epChBtn" aria-label="Chapters" aria-expanded="false" aria-controls="epChPanel" disabled>' +
          '<i class="fa-solid fa-list-ul" aria-hidden="true"></i><span>Chapters</span></button>' +
      '</header>' +
      '<div class="dk-stagewrap"><div class="dk-stage" id="epStage" data-mode="podcast">' +
        '<section class="dk-layer dk-layer--listen" aria-label="Listen mode">' +
          '<audio id="epAudio" preload="auto"></audio>' +
          '<div class="dk-wave-wrap ep-wave-wrap"><canvas class="dk-wave" id="epWave" aria-hidden="true"></canvas>' +
            '<span class="dk-playhead" aria-hidden="true"></span></div>' +
          '<div class="dk-caps" aria-live="off">' +
            '<p class="dk-cap-who" id="epCapWho"></p>' +
            '<p class="dk-cap-now" id="epCapNow"></p>' +
          '</div>' +
          '<div class="dk-player">' +
            '<span class="ep-player-start">' +
              '<button class="ep-back" type="button" id="epBack" aria-label="Back 15 seconds" disabled>' +
                '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>15</span></button>' +
              '<button class="ep-back ep-speed" type="button" id="epSpeed" aria-label="Playback speed" hidden disabled>1×</button>' +
            '</span>' +
            '<button class="dk-play" type="button" id="epPlay" aria-label="Play" disabled><i class="fa-solid fa-play" aria-hidden="true"></i></button>' +
            '<span class="dk-player-end">' +
              '<button class="dk-skip" id="epSkip" type="button" hidden aria-label="Skip to the end">Skip <i class="fa-solid fa-forward" aria-hidden="true"></i></button>' +
              '<span class="dk-time" id="epTime">0:00 / –:––</span>' +
            '</span>' +
          '</div>' +
        '</section>' +
        // Preparing (fetch + decode + assemble), and any failure, over the stage.
        '<div class="ep-prep" id="epPrep" role="status">' +
          '<p class="ep-prep-t" id="epPrepT">Preparing your listen…</p>' +
          '<div class="pu-track ep-prep-track"><div class="pu-fill" id="epPrepFill"></div></div>' +
          '<button class="bl-check ep-prep-retry" type="button" id="epRetry" hidden>Try again</button>' +
        '</div>' +
        '<div class="ep-ch-panel" id="epChPanel" hidden>' +
          '<div class="ep-ch-head"><h2>Chapters</h2>' +
            '<button class="ep-ch-close" type="button" id="epChClose" aria-label="Close chapters">' +
              '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
          '<ol class="ep-chapters" id="epChapters"></ol>' +
        '</div>' +
        '<div class="dk-rail" aria-hidden="true"><span class="dk-rail-fill" id="epRail"></span></div>' +
      '</div></div>' +
    '</div></main>';
  }
  function episodeInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();
    var $ = function (id) { return document.getElementById(id); };
    var audio = $('epAudio'), stage = $('epStage'), canvas = $('epWave'), g = canvas.getContext('2d');
    var play = $('epPlay'), back = $('epBack'), speed = $('epSpeed'), timeEl = $('epTime'), rail = $('epRail');
    var capNow = $('epCapNow'), capWho = $('epCapWho'), eyebrow = $('epEyebrow'), titleEl = $('epTitle');
    var prep = $('epPrep'), prepT = $('epPrepT'), prepFill = $('epPrepFill'), retry = $('epRetry');
    var chBtn = $('epChBtn'), chPanel = $('epChPanel'), chList = $('epChapters');
    var ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
    var art = new URL('../../assets/images/sharps-header.jpg', location.href).href;
    var L = null, url = null, raf = 0, lastSent = -1, spans = [], lastCh = -1, lastSave = 0;
    var done = !!(readCourse().podcast || {}).done, finishedOnce = done;
    var torn = false;

    function fail(e) {
      if (torn) return;
      var msg = location.protocol === 'file:'
        ? 'Listen mode needs this page served from a web server (localhost or GitHub Pages). It can’t load audio from a double-clicked file.'
        : 'Part of this listen couldn’t be loaded' + (e && e.file ? ' (' + e.file + ')' : '') + '. Check your connection and try again.';
      prepT.textContent = msg;
      prep.classList.add('is-error');
      retry.hidden = location.protocol === 'file:';
      if (window.console) console.error('[listen mode]', e);
    }
    function build() {
      prep.hidden = false; prep.classList.remove('is-error'); retry.hidden = true;
      prepT.textContent = 'Preparing your listen…'; prepFill.style.width = '0%';
      if (location.protocol === 'file:') { fail(); return; }
      loadListenData().then(function (data) {
        var plan = resolveListen(listenResults(), data);
        var lp = listenPieces(plan, data);
        return renderListen(data, lp.pieces, function (f) { prepFill.style.width = Math.round(f * 100) + '%'; })
          .then(function (r) {
            if (torn) return;
            L = { data: data, plan: plan, pieces: lp.pieces, dur: r.dur,
                  env: envFromBuffer(r.buffer, r.dur), sents: listenSentences(lp.pieces, data),
                  chapters: listenChapters(lp.pieces, data) };
            url = URL.createObjectURL(wavBlob(r.buffer, r.dur));
            ready();
          });
      }).catch(fail);
    }
    retry.addEventListener('click', build);

    function chapterAt(t) {
      var c = L.chapters[0];
      L.chapters.forEach(function (x) { if (t >= x.start - .01) c = x; });
      return c;
    }
    function sentenceAt(t) {
      for (var i = L.sents.length - 1; i >= 0; i--) if (t >= L.sents[i].s) return i;
      return -1;
    }
    function setSentence(i) {
      if (i === lastSent) return;
      lastSent = i;
      var st = L.sents[i];
      capWho.textContent = st && st.w ? (PODCAST_WHO[st.w] || (st.w.charAt(0) + st.w.slice(1).toLowerCase())) : '';
      capWho.dataset.who = st && st.w ? st.w.toLowerCase() : '';
      capNow.innerHTML = st ? st.t.split(' ').map(function (w, k) {
        return '<span' + (st.em.indexOf(k) > -1 ? ' class="is-em"' : '') + '>' + esc(w) + '</span>';
      }).join(' ') : '';
      spans = [].slice.call(capNow.children);
      capNow.classList.remove('is-in'); void capNow.offsetWidth; capNow.classList.add('is-in');
    }
    function words(t) {
      var st = L.sents[lastSent];
      if (!st) return;
      var f = (t - st.s) / Math.max(.01, st.e - st.s), total = st.t.length, acc = 0;
      spans.forEach(function (sp) {
        var mid = (acc + sp.textContent.length / 2) / total;
        acc += sp.textContent.length + 1;
        sp.classList.toggle('is-said', mid <= f);
      });
    }
    function setChapter(c) {
      if (!c || c === lastCh) return;
      lastCh = c;
      eyebrow.textContent = c.chapter ? 'Listen mode · Chapter ' + c.n + ' of ' + L.chapters.total : 'Listen mode';
      titleEl.textContent = c.title;
      [].forEach.call(chList.children, function (li) {
        var n = +li.dataset.n;
        li.classList.toggle('is-now', c.chapter && n === c.n && !done);
        li.classList.toggle('is-done', done || (c.chapter ? n < c.n : n <= (c.start > 0 ? L.chapters.total : 0)));
        if (c.chapter && n === c.n) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current');
      });
      if (ms && window.MediaMetadata) {
        try {
          ms.metadata = new MediaMetadata({
            title: c.title,
            artist: c.chapter ? 'Chapter ' + c.n + ' of ' + L.chapters.total : 'Contain the Sharp',
            album: 'Bloodborne Pathogens · Module 4',
            artwork: [{ src: art, sizes: '1200x675', type: 'image/jpeg' }]
          });
        } catch (e) {}
      }
    }
    function tick() {
      if (!L) return;
      var t = audio.currentTime || 0;
      drawEnvelope(canvas, g, L.env, t);
      setSentence(sentenceAt(t));
      words(t);
      setChapter(chapterAt(t));
      timeEl.textContent = mmss(t) + ' / ' + mmss(L.dur);
      rail.style.transform = 'scaleX(' + Math.max(0, Math.min(1, t / L.dur)) + ')';
      if (!audio.paused) raf = requestAnimationFrame(tick);
    }
    function setPlaying(on) {
      play.innerHTML = '<i class="fa-solid ' + (on ? 'fa-pause' : 'fa-play') + '" aria-hidden="true"></i>';
      play.setAttribute('aria-label', on ? 'Pause' : 'Play');
      stage.classList.toggle('is-playing', on);
      if (ms) try { ms.playbackState = on ? 'playing' : 'paused'; } catch (e) {}
    }
    function save(force) {
      if (!L || done) return;
      var now = Date.now();
      if (!force && now - lastSave < 2000) return;
      lastSave = now;
      saveResult('podpos', { t: Math.round(audio.currentTime * 10) / 10 });
    }
    function finish() {
      if (!finishedOnce) {
        finishedOnce = true;
        saveResult('podcast', { done: true, plan: L.plan.map(function (p) { return p.topic + ':' + p.how; }) });
        saveResult('podpos', null);
      }
      done = true;
      lastCh = -1; setChapter(chapterAt(L.dur));
      setPlaying(false);
      ctx.enableNext();
    }

    function ready() {
      prep.hidden = true;
      LE.refreshNav();   // the caption's "why each part" trace, now the manifest is in
      [play, back, speed, chBtn].forEach(function (b) { b.disabled = false; });
      chList.innerHTML = L.chapters.filter(function (c) { return c.chapter; }).map(function (c) {
        return '<li class="ep-ch" data-n="' + c.n + '">' +
          '<span class="ep-ch-n" aria-hidden="true">' + c.n + '</span>' +
          '<span class="ep-ch-t">' + esc(c.title) + '</span>' +
          '<span class="ep-ch-d">' + mmss(c.end - c.start) + '</span>' +
        '</li>';
      }).join('');
      // Speed (config). Kept for the session.
      var sp = L.data.config.speed || {};
      if (sp.enabled && sp.options && sp.options.length) {
        speed.hidden = false;
        var rate = 1;
        try { rate = +sessionStorage.getItem('sh-listen-rate') || 1; } catch (e) {}
        if (sp.options.indexOf(rate) < 0) rate = 1;
        var setRate = function (r) {
          rate = r; audio.playbackRate = r; audio.defaultPlaybackRate = r;
          speed.textContent = (r === 1 ? '1' : String(r)) + '×';
          speed.setAttribute('aria-label', 'Playback speed, ' + r + ' times');
          try { sessionStorage.setItem('sh-listen-rate', r); } catch (e) {}
        };
        speed.addEventListener('click', function () {
          var i = sp.options.indexOf(rate);
          setRate(sp.options[(i + 1) % sp.options.length]);
        });
        audio.addEventListener('loadedmetadata', function () { audio.playbackRate = rate; }, { once: true });
        setRate(rate);
      }
      audio.src = url;
      var startAt = 0, pos = readCourse().podpos;
      if (done) startAt = L.dur;
      else if (pos && pos.t != null) {
        // Pick up at the start of the sentence that was playing.
        startAt = pos.t;
        L.sents.forEach(function (st) { if (st.s <= pos.t) startAt = st.s; });
      }
      audio.addEventListener('loadedmetadata', function () {
        try { audio.currentTime = Math.min(startAt, L.dur); } catch (e) {}
        tick();
        if (!done) audio.play().catch(function () { setPlaying(false); });
      }, { once: true });
      if (done) ctx.enableNext();
    }

    play.addEventListener('click', function () {
      if (!L) return;
      if (audio.paused) {
        if (audio.ended || audio.currentTime >= L.dur - .05) audio.currentTime = 0;   // replay the same listen
        audio.play().catch(function () {});
      } else audio.pause();
    });
    back.addEventListener('click', function () { audio.currentTime = Math.max(0, audio.currentTime - 15); tick(); });
    audio.addEventListener('play', function () { setPlaying(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
    audio.addEventListener('pause', function () { setPlaying(false); save(true); tick(); });
    audio.addEventListener('timeupdate', function () { save(false); });
    audio.addEventListener('ended', finish);
    window.addEventListener('pagehide', function () { save(true); });
    window.addEventListener('resize', function () { if (canvas.isConnected) tick(); });

    // Chapters: over the stage, closed by the same button, its own ×, or Esc.
    function chapters(open) {
      chPanel.hidden = !open;
      chBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      stage.classList.toggle('is-ch-open', open);
      (open ? $('epChClose') : chBtn).focus({ preventScroll: true });
    }
    chBtn.addEventListener('click', function () { chapters(chPanel.hidden); });
    $('epChClose').addEventListener('click', function () { chapters(false); });
    chPanel.addEventListener('keydown', function (e) { if (e.key === 'Escape') chapters(false); });

    // Review-mode skip: to the last 5 seconds.
    var skip = $('epSkip');
    skip.hidden = !LE.reviewMode();
    skip.addEventListener('click', function () {
      if (!L) return;
      audio.currentTime = Math.max(0, L.dur - 5); audio.play().catch(function () {});
    });

    // The lock screen: play and pause, nothing that moves the playhead
    // forward.
    if (ms) {
      try {
        ms.setActionHandler('play', function () { audio.play().catch(function () {}); });
        ms.setActionHandler('pause', function () { audio.pause(); });
        ['seekforward', 'seekto', 'nexttrack', 'previoustrack', 'seekbackward'].forEach(function (a) {
          try { ms.setActionHandler(a, null); } catch (e) {}
        });
      } catch (e) {}
    }

    // Stop, let go of the lock screen and free the rendered file when the
    // step is torn down.
    var stageRoot = document.querySelector('.ll-stage');
    if (stageRoot && window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (document.body.contains(audio)) return;
        mo.disconnect(); torn = true; save(true); audio.pause(); cancelAnimationFrame(raf);
        if (url) { audio.removeAttribute('src'); URL.revokeObjectURL(url); }
        if (ms) try { ms.metadata = null; ms.setActionHandler('play', null); ms.setActionHandler('pause', null); } catch (e) {}
      });
      mo.observe(stageRoot, { childList: true });
    }
    build();
  }

  // ---- The questions ---------------------------------------------------------
  // Every chapter's question, straight after the episode, as ONE stack in the
  // pre-check's own card-stack look (2026-09-25 review) — its own screen with
  // its own purpose, rather than walking back through each chapter's page
  // with a question laid over it. The questions, their answers and feedback
  // are the deck's (deckCheck), saved under the same keys the screen-by-
  // screen path uses, so remediation routes off them unchanged.
  //
  // Knowledge questions give the deck's verdict in the card and wait for
  // "Next question"; agreement and insight items have no verdict and move on
  // by themselves, like the pre-check. The last card hands straight on to
  // the next step. The stack mechanics mirror batteryInit's (same markup,
  // same depth classes), trimmed to the two formats the deck's checks use.
  function PODCHECK_CONTENT() {
    // .sh-podcheck: these are the deck's long scenario stems, not the
    // pre-check's one-liners, so they take the deck question card's type
    // size (clara/sharps.html) rather than the pre-check's headline size.
    return BATTERY_CONTENT.replace('<main class="ll-object">', '<main class="ll-object sh-podcheck">').replace(
      '<button class="bl-check" id="blCheck"',
      '<p class="dk-fb bl-fb" id="blFb" role="status" hidden></p><button class="bl-check" id="blCheck"');
  }
  // One question per topic that has one (config.checks), in the order the
  // topics played, using the deck screen that matches the version that
  // played (k2 harder → the harder case's question). Titles are the
  // manifest's chapter titles, so the stack names what the learner heard.
  function podcheckItems() {
    if (!LD()) return [];
    var checks = LD().config.checks || {}, topics = LD().manifest.topics;
    return resolveListen(listenResults(), LD()).map(function (p) {
      var c = checks[p.topic];
      if (!c || p.how === 'skip') return null;   // a part the learner tested out of asks nothing
      var deckId = c[p.how] || c.normal;
      return { id: deckId, topic: p.topic, role: c.role, title: topicTitle(p.topic, LD()),
               q: DECK[deckId] ? deckCheck(deckFor(deckId)) : null };
    }).filter(function (it) { return it && it.q; });
  }
  function podcheckInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();
    if (!LD()) {
      loadListenData().then(function () { if (document.getElementById('blAsk')) podcheckInit(ctx); })
        .catch(function () { document.getElementById('blQ').textContent = 'The questions couldn\u2019t be loaded. Reload the page to try again.'; });
      return;
    }
    var items = podcheckItems(), n = items.length;
    var askEl = document.getElementById('blAsk');
    var stepEl = document.getElementById('blStep');
    var qEl = document.getElementById('blQ');
    var optsEl = document.getElementById('blOptions');
    var checkEl = document.getElementById('blCheck');
    var fbEl = document.getElementById('blFb');
    var dotsEl = document.getElementById('blDots');
    var near = document.getElementById('blPeek1');
    var far = document.getElementById('blPeek2');
    var MISS = 'Let’s dig into this again from a slightly different lens.';

    function eyebrow(i) { return 'Question ' + (i + 1) + ' of ' + n + ' · ' + items[i].title; }
    function answerHtml(q, live) {
      return q.kind === 'likert' ? likertHtml(live) : mcqHtml(q.options, live);
    }
    function setPeekContent(el, i, withFb) {
      if (!el) return;
      var it = items[i];
      if (!it) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = '<p class="ll-eyebrow">' + esc(eyebrow(i)) + '</p>' +
        '<h2 class="bl-q">' + esc(it.q.stem) + '</h2>' +
        answerHtml(it.q, false) +
        // Measuring only: the tallest card is a knowledge question WITH its
        // feedback showing, and the stage has to hold that without moving.
        (withFb && it.q.kind === 'mcq'
          ? '<p class="dk-fb"><strong class="dk-fb-h">Correct</strong><span class="dk-fb-b">' + esc(it.q.okFb || MISS) + '</span></p>'
          : '') +
        '<button class="bl-check" type="button" disabled>Submit answer</button>';
    }
    // Same as batteryInit's: the stage is pinned to its tallest card, so the
    // page never re-centres as cards of different heights come forward.
    function pinStageHeight() {
      var stageEl = document.getElementById('blStage');
      var ruler = document.createElement('div');
      ruler.className = 'bl-peek sh-battery bl-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      stageEl.appendChild(ruler);
      var max = 0;
      for (var k = 0; k < n; k++) {
        setPeekContent(ruler, k, true);
        max = Math.max(max, ruler.getBoundingClientRect().height);
      }
      stageEl.removeChild(ruler);
      var padTop = parseFloat(getComputedStyle(stageEl).paddingTop) || 0;
      stageEl.style.minHeight = Math.ceil(padTop + max + 8) + 'px';
    }
    function renderDots(i) {
      dotsEl.innerHTML = items.map(function (_, k) {
        return '<span class="bl-dot' + (k < i ? ' is-done' : k === i ? ' is-now' : '') + '"></span>';
      }).join('');
    }
    function arm(el) {
      el.classList.remove('is-spent');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
    }
    function spend(el) {
      el.classList.add('is-spent');
      el.disabled = true;
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
    }
    function advance(i) {
      if (i + 1 < n) swapTo(i + 1); else done();
    }
    function render(i) {
      var q = items[i].q;
      renderDots(i);
      stepEl.textContent = eyebrow(i);
      qEl.textContent = q.stem;
      fbEl.hidden = true; fbEl.className = 'dk-fb bl-fb'; fbEl.innerHTML = '';
      optsEl.removeAttribute('role');
      optsEl.className = 'bl-deck';
      optsEl.innerHTML = answerHtml(q, true);
      optsEl.firstChild.setAttribute('aria-labelledby', 'blQ');
      arm(checkEl);
      checkEl.hidden = false;
      checkEl.textContent = q.kind === 'mcq' ? 'Check answer' : 'Submit answer';
      // A long stem plus four options can run past the footer on a short
      // window; once an answer is picked, bring Check answer up into view.
      optsEl.onclick = function () { if (!checkEl.disabled) clearFooter(checkEl); };
      wireChoice(optsEl.firstChild, checkEl, function (v, picked) {
        if (q.kind === 'mcq') {
          // The deck screen's own verdict: in words both ways, the right
          // answer not revealed on a miss (the remedial content comes next).
          var ok = v === q.correct;
          csMark(picked, ok ? 'ok' : 'bad');
          if (!ok) csTag(picked, 'Your answer');
          var body = ok ? q.okFb : (q.noFb || MISS);
          fbEl.innerHTML = '<strong class="dk-fb-h"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') +
              '" aria-hidden="true"></i> ' + (ok ? 'Correct' : 'Not quite') + '</strong>' +
            (body ? '<span class="dk-fb-b">' + esc(body) + '</span>' : '');
          fbEl.className = 'dk-fb bl-fb ' + (ok ? 'is-ok' : 'is-bad');
          fbEl.hidden = false;
          // On a short window the verdict (and Next question under it) can
          // land under the fixed footer — bring them up into view.
          clearFooter(checkEl);
          saveResult(q.key, { variant: q.variant, passed: ok, picked: v, carrier: 'podcast' });
          checkEl.textContent = i + 1 < n ? 'Next question' : 'Continue';
          checkEl.disabled = false;
          checkEl.onclick = function () { checkEl.onclick = null; spend(checkEl); advance(i); };
          checkEl.focus({ preventScroll: true });
          return;
        }
        spend(checkEl);
        if (q.kind === 'insight') {
          csMark(picked, 'neutral');
          saveResult(q.key, { picked: v, answer: q.options[v].t, carrier: 'podcast' });
        } else {
          picked.classList.add('is-picked');
          saveResult(q.key, { score: v, carrier: 'podcast' });
        }
        setTimeout(function () { advance(i); }, T(700));
      });
    }
    function snapDepth(el, depthClass) {
      el.className = 'bl-peek sh-battery no-anim ' + depthClass;
      void el.offsetWidth;
      el.classList.remove('no-anim');
    }
    function swapTo(i) {
      askEl.classList.add('is-leaving');
      near.classList.remove('depth1'); near.classList.add('depth0');
      far.classList.remove('depth2'); far.classList.add('depth1');
      setTimeout(function () {
        if (!askEl.isConnected) return;
        render(i);
        // The last answer may have scrolled the page to show its verdict —
        // the next question starts from the top, not halfway down.
        var host = document.querySelector('.ll-object.sh-podcheck');
        if (host) host.scrollTop = 0;
        askEl.classList.add('no-anim');
        askEl.classList.remove('is-leaving');
        void askEl.offsetWidth;
        askEl.classList.remove('no-anim');
        snapDepth(near, 'depth2');
        setPeekContent(near, i + 2);
        var tmp = near; near = far; far = tmp;
      }, T(440));
    }
    // Like the pre-check's last card: it drops off, and the module moves on.
    function done() {
      saveResult('podcheck', { done: true });
      askEl.classList.add('is-dropping');
      dotsEl.classList.add('is-gone');
      ctx.enableNext();
      setTimeout(function () { if (askEl.isConnected) ctx.els.next.click(); }, T(380));
    }

    render(0);
    setPeekContent(near, 1); near.className = 'bl-peek sh-battery depth1';
    setPeekContent(far, 2); far.className = 'bl-peek sh-battery depth2';
    pinStageHeight();
    // Rotating a phone or resizing the window changes how tall every card is.
    window.addEventListener('resize', function () { if (document.getElementById('blStage')) pinStageHeight(); });
  }

  // ---- The review set ----------------------------------------------------------
  // After the questions, for each KNOWLEDGE question missed (config.checks
  // role "knowledge"): that topic's fact cards (data/sharps-listen/review/),
  // an optional recap (the manifest's quickTakes — the only audio on this
  // screen, and only when pressed), then a retry of the same question.
  // Exit rule from config.review.retries: one retry, then on either way. The
  // retry is recorded under the topic's retryKey; the original miss stays.
  //
  // LISTEN_FEEL_HOOK: belief/norm misses (f1, f3 — role "belief") get no
  // review yet. When they do, add their topics to config.review.topics and
  // widen listenMissed() below past role "knowledge".
  function listenMissed() {
    if (!LD()) {
      // Before the manifest is in (a reload straight onto this step): any
      // saved check marked failed.
      var c = readCourse();
      return Object.keys(c).filter(function (k) { return /check$/.test(k) && c[k] && c[k].passed === false; });
    }
    var topics = (LD().config.review || {}).topics || {};
    return podcheckItems().filter(function (it) {
      var r = readCourse()[it.q.key];
      return it.role === 'knowledge' && topics[it.topic] && r && r.passed === false;
    });
  }
  function REVIEW_CONTENT() {
    return '<main class="ll-object po-object rv-object"><div class="po rv" id="rv" aria-live="polite"></div></main>';
  }
  function reviewInit(ctx) {
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();
    var root = document.getElementById('rv');
    if (!LD()) {
      root.innerHTML = '<p class="rv-note">Loading…</p>';
      loadListenData().then(function () { if (root.isConnected) reviewInit(ctx); })
        .catch(function () { root.innerHTML = '<p class="rv-note">The review couldn’t be loaded. Reload the page to try again.</p>'; });
      return;
    }
    LE.refreshNav(); ctx.disableNext();   // the caption's trace, now the data is in
    var cfg = LD().config.review || {}, queue = listenMissed(), qi = 0;
    var recapAudio = null;
    function stopRecap() { if (recapAudio) { recapAudio.pause(); recapAudio = null; } }
    function next() {
      stopRecap();
      qi++;
      if (qi < queue.length) cards(); else { ctx.enableNext(); ctx.els.next.click(); }
    }
    function head(it) {
      return '<p class="ll-eyebrow">Review' + (queue.length > 1 ? ' · ' + (qi + 1) + ' of ' + queue.length : '') + '</p>' +
        '<h1 class="po-head">' + esc(it.title) + '</h1>';
    }
    // The fact cards, and the way to the retry.
    function cards() {
      var it = queue[qi], set = LD().cards[it.topic] || { cards: [] };
      var qt = (LD().manifest.quickTakes || {})[it.topic];
      root.innerHTML = head(it) +
        '<ol class="rv-cards">' + set.cards.map(function (c, i) {
          return '<li class="rv-card"><span class="rv-n" aria-hidden="true">' + (i + 1) + '</span><div>' +
            (c.head ? '<h2 class="rv-card-h">' + esc(c.head) + '</h2>' : '') +
            '<p>' + esc(c.body) + '</p></div></li>';
        }).join('') + '</ol>' +
        '<div class="rv-actions">' +
          (set.recap && qt ? '<button class="ep-back rv-recap" type="button" id="rvRecap">' +
            '<i class="fa-solid fa-volume-high" aria-hidden="true"></i><span>Hear a quick recap</span></button>' : '') +
          '<button class="bl-check rv-go" type="button" id="rvGo">Try the question again</button>' +
        '</div>';
      var rb = document.getElementById('rvRecap');
      if (rb) rb.addEventListener('click', function () {
        if (recapAudio && !recapAudio.paused) { recapAudio.pause(); return; }
        if (!recapAudio) {
          recapAudio = new Audio(audioUrl(qt.file, LD()));
          recapAudio.addEventListener('play', function () { rb.querySelector('span').textContent = 'Pause the recap'; rb.querySelector('i').className = 'fa-solid fa-pause'; });
          recapAudio.addEventListener('pause', function () { rb.querySelector('span').textContent = 'Hear a quick recap'; rb.querySelector('i').className = 'fa-solid fa-volume-high'; });
          recapAudio.addEventListener('error', function () { rb.querySelector('span').textContent = 'Recap unavailable'; rb.disabled = true; });
        }
        recapAudio.play().catch(function () {});
      });
      document.getElementById('rvGo').addEventListener('click', function () { stopRecap(); ask(0); });
      try { root.querySelector('.po-head').focus({ preventScroll: true }); } catch (e) {}
    }
    // The retry: the same question, saved under the topic's retryKey.
    function ask(attempt) {
      var it = queue[qi], q = it.q, key = ((cfg.topics || {})[it.topic] || {}).retryKey || (q.key + '-retry');
      var allowed = cfg.retries == null ? 1 : cfg.retries;
      root.innerHTML = head(it) +
        '<div class="rv-q">' +
          '<h2 class="cs-q cs-q--lead">' + esc(q.stem) + '</h2>' +
          mcqHtml(q.options, true) +
          '<p class="dk-fb rv-fb" id="rvFb" role="status" hidden></p>' +
          '<button class="bl-check" type="button" id="rvCheck" disabled>Check answer</button>' +
        '</div>';
      var host = root.querySelector('.dk-opts'), btn = document.getElementById('rvCheck'), fb = document.getElementById('rvFb');
      wireChoice(host, btn, function (v, picked) {
        var ok = v === q.correct, last = ok || attempt + 1 >= allowed;
        csMark(picked, ok ? 'ok' : 'bad');
        if (!ok) csTag(picked, 'Your answer');
        if (!ok && last) {
          var right = host.querySelectorAll('.cs-opt')[q.correct];
          csMark(right, 'ok'); csTag(right, 'Correct answer');
        }
        var body = ok ? q.okFb : last ? '' : (q.noFb || 'Let’s dig into this again from a slightly different lens.');
        fb.innerHTML = '<strong class="dk-fb-h"><i class="fa-solid ' + (ok ? 'fa-circle-check' : 'fa-circle-xmark') +
            '" aria-hidden="true"></i> ' + (ok ? 'Correct' : 'Not quite') + '</strong>' +
          (body ? '<span class="dk-fb-b">' + esc(body) + '</span>' : '');
        fb.className = 'dk-fb rv-fb ' + (ok ? 'is-ok' : 'is-bad');
        fb.hidden = false;
        saveResult(key, { variant: q.variant, passed: ok, picked: v, attempt: attempt + 1, carrier: 'listen-review' });
        btn.textContent = last ? (qi + 1 < queue.length ? 'Next review' : 'Continue') : 'Try again';
        btn.disabled = false;
        btn.onclick = function () { if (last) next(); else ask(attempt + 1); };
        btn.focus({ preventScroll: true });
      });
    }
    if (!queue.length) { ctx.enableNext(); root.innerHTML = '<p class="rv-note">Nothing to review.</p>'; return; }
    cards();
    var stageRoot = document.querySelector('.ll-stage');
    if (stageRoot && window.MutationObserver) {
      var mo = new MutationObserver(function () { if (!root.isConnected) { mo.disconnect(); stopRecap(); } });
      mo.observe(stageRoot, { childList: true });
    }
  }

  // ---- Completion ---------------------------------------------------------------
  // The listen never hands off to the simulation itself; this screen does.
  function LISTENDONE_CONTENT() {
    return '<main class="ll-object po-object"><div class="po">' +
      '<div class="po-top">' +
        '<h1 class="po-head">Next, try it in a scenario</h1>' +
        '<p class="po-sub">A short scenario on screen, about 5 min.</p>' +
      '</div>' +
    '</div></main>';
  }
  function listendoneInit(ctx) { ctx.setCoachSay(''); ctx.floatClose(); ctx.enableNext(); }

  // ---- Reviewer tools ------------------------------------------------------------
  // Scenario switcher: the listens the pre-check can build, as Demo-menu
  // values — K1 tested out or not — and 0–1 missed knowledge checks.
  var LISTEN_COMBOS = [
    { value: 'n', label: 'K1 not tested out · full listen', results: { k1: { correct: false }, f1: { score: 3 }, f2: { score: 3 } } },
    { value: 'T', label: 'K1 tested out · K1 part skipped', results: { k1: { correct: true }, f1: { score: 3 }, f2: { score: 3 } } }
  ];
  function listenComboNow() {
    var r = listenResults(), cfg = LD() && LD().config.triggers || {};
    return ruleHolds((cfg.testOut || {}).k1, r) ? 'T' : 'n';
  }
  var LISTEN_RESULT_KEYS = ['k1check', 'k2check', 'insight', 'f1post', 'f3post', 'k1recheck', 'k2recheck', 'podcheck', 'podcast', 'podpos'];
  function setListenCombo(v) {
    var c = LISTEN_COMBOS.filter(function (x) { return x.value === v; })[0];
    if (!c) return;
    LISTEN_RESULT_KEYS.forEach(function (k) { saveResult(k, null); });
    saveResult('podpath', { podcast: true, results: c.results });
    LE.goTo('podcast');
  }
  function setListenMisses(v) {
    if (!LD()) return;
    var miss = v === 'k1' ? ['k1'] : [];
    ['k1recheck', 'k2recheck'].forEach(function (k) { saveResult(k, null); });
    podcheckItems().forEach(function (it) {
      var q = it.q;
      if (q.kind === 'mcq') saveResult(q.key, { variant: q.variant, passed: miss.indexOf(it.topic) < 0,
        picked: miss.indexOf(it.topic) < 0 ? q.correct : (q.correct + 1) % q.options.length, carrier: 'podcast' });
      else if (q.kind === 'insight') saveResult(q.key, { picked: 0, answer: q.options[0].t, carrier: 'podcast' });
      else saveResult(q.key, { score: 4, carrier: 'podcast' });
    });
    saveResult('podcast', { done: true });
    saveResult('podcheck', { done: true });
    if (!LE.goTo(miss.length ? 'listenreview' : 'listendone')) LE.goTo('scene');
  }

  // Splice test: about 8 s either side of each join of a spliced topic, with
  // seamAt nudgeable and shown in manifest form to copy back. "Use for this
  // listen" applies the value for this session only (sh-seam-<topic>).
  function spliceTest(api) {
    var old = document.getElementById('spPanel');
    if (old) { old.remove(); return; }
    loadListenData().then(function (data) {
      var topics = Object.keys(data.manifest.topics).filter(function (t) {
        var d = data.manifest.topics[t]; return d.addon && d.seamAt != null;
      });
      if (!topics.length) return;
      var ac = null, bufs = {}, playing = [];
      var el = document.createElement('div');
      el.id = 'spPanel'; el.className = 'sp-panel';
      el.innerHTML =
        '<div class="sp-head"><b>Splice test</b><span>Review only</span>' +
          '<button type="button" class="ep-ch-close" id="spClose" aria-label="Close splice test"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>' +
        '<label class="sp-row">Topic <select id="spTopic">' + topics.map(function (t) {
          return '<option value="' + t + '">' + esc(t + ' — ' + (data.manifest.topics[t].title || '')) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="sp-row">seamAt <input id="spSeam" type="number" step="0.05" min="0" />' +
          '<button type="button" class="ep-back" data-n="-0.1">−0.1</button><button type="button" class="ep-back" data-n="0.1">+0.1</button></label>' +
        '<div class="sp-row sp-btns">' +
          '<button type="button" class="ep-back" id="spIn"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Into the add-on</button>' +
          '<button type="button" class="ep-back" id="spOut"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Out of the add-on</button>' +
          '<button type="button" class="ep-back" id="spStop">Stop</button></div>' +
        '<code class="sp-code" id="spCode"></code>' +
        '<div class="sp-row sp-btns">' +
          '<button type="button" class="ep-back" id="spUse">Use for this listen</button>' +
          '<button type="button" class="ep-back" id="spReset">Back to the manifest</button></div>' +
        '<p class="sp-note" id="spNote"></p>';
      document.body.appendChild(el);
      var topicEl = el.querySelector('#spTopic'), seamEl = el.querySelector('#spSeam');
      var code = el.querySelector('#spCode'), note = el.querySelector('#spNote');
      function show() {
        var t = topicEl.value, man = data.manifest.topics[t].seamAt;
        if (seamEl.dataset.t !== t) { seamEl.value = seamFor(t, data); seamEl.dataset.t = t; }
        code.textContent = '"seamAt": ' + (+seamEl.value).toFixed(2);
        var o = null; try { o = sessionStorage.getItem('sh-seam-' + t); } catch (e) {}
        note.textContent = 'Manifest: ' + man + 's' + (o != null ? ' · this session uses ' + o + 's' : '');
      }
      function load(f) {
        if (bufs[f]) return Promise.resolve(bufs[f]);
        return fetch(audioUrl(f, data)).then(function (r) { return r.arrayBuffer(); })
          .then(function (ab) { return ac.decodeAudioData(ab); }).then(function (b) { bufs[f] = b; return b; });
      }
      function stop() { playing.forEach(function (s) { try { s.stop(); } catch (e) {} }); playing = []; }
      function hear(into) {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        stop();
        var d = data.manifest.topics[topicEl.value], seam = +seamEl.value, fade = (data.manifest.spliceFadeMs || 25) / 1000;
        Promise.all([load(d.normal.file), load(d.addon.file)]).then(function (b) {
          var n = b[0], a = b[1], t0 = ac.currentTime + .1, parts;
          parts = into ? [[n, Math.max(0, seam - 8), Math.min(8, seam)], [a, 0, Math.min(6, a.duration)]]
                       : [[a, Math.max(0, a.duration - 6), Math.min(6, a.duration)], [n, seam, Math.min(8, n.duration - seam)]];
          parts.forEach(function (p) {
            var s = ac.createBufferSource(), g = ac.createGain();
            s.buffer = p[0];
            g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + fade);
            g.gain.setValueAtTime(1, t0 + p[2] - fade); g.gain.linearRampToValueAtTime(0, t0 + p[2]);
            s.connect(g); g.connect(ac.destination); s.start(t0, p[1], p[2]);
            playing.push(s); t0 += p[2];
          });
        });
      }
      topicEl.addEventListener('change', show);
      seamEl.addEventListener('input', show);
      [].forEach.call(el.querySelectorAll('[data-n]'), function (b) {
        b.addEventListener('click', function () { seamEl.value = Math.max(0, +seamEl.value + +b.dataset.n).toFixed(2); show(); });
      });
      el.querySelector('#spIn').addEventListener('click', function () { hear(true); });
      el.querySelector('#spOut').addEventListener('click', function () { hear(false); });
      el.querySelector('#spStop').addEventListener('click', stop);
      el.querySelector('#spUse').addEventListener('click', function () {
        try { sessionStorage.setItem('sh-seam-' + topicEl.value, (+seamEl.value).toFixed(2)); } catch (e) {}
        show(); stop(); if (api) api.replay();
      });
      el.querySelector('#spReset').addEventListener('click', function () {
        try { sessionStorage.removeItem('sh-seam-' + topicEl.value); } catch (e) {}
        seamEl.dataset.t = ''; show(); stop(); if (api) api.replay();
      });
      el.querySelector('#spClose').addEventListener('click', function () { stop(); el.remove(); });
      show();
    }).catch(function () {});
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
  // Slides 2–4, in the deck's order: two knowledge questions, then the two
  // agreement statements — each its own card in the stack.
  var BATTERY = [K1_PRE, K2_PRE, F1_ITEM, F3_ITEM];
  function batteryInit(ctx) {
    var res = { k1up: false, k2up: false, f1: null, f3: null };
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
    // Rotating a phone or resizing the window changes how tall every card is.
    window.addEventListener('resize', function () { if (document.getElementById('blStage')) pinStageHeight(); });

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
      if (q.type === 'mcq' || q.type === 'likert') {
        html += (q.type === 'mcq' ? mcqHtml(q.options, false) : likertHtml(false)) +
          '<button class="bl-check" type="button" disabled>Submit answer</button>';
      } else if (q.type === 'order') {
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
      if (q.type === 'mcq' || q.type === 'likert') { renderDeckItem(i, q); return; }
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
    // The deck's formats: a lettered multiple-choice list (slides 2–3) or a
    // 1–5 agreement scale (slide 4). No verdict on the pre-check — select,
    // submit, and the next card comes forward.
    function renderDeckItem(i, q) {
      optsEl.removeAttribute('role');
      optsEl.className = 'bl-deck';
      optsEl.innerHTML = q.type === 'mcq' ? mcqHtml(q.options, true) : likertHtml(true);
      optsEl.firstChild.setAttribute('aria-labelledby', 'blQ');
      arm(checkEl);
      checkEl.hidden = false;
      checkEl.textContent = 'Submit answer';
      wireChoice(optsEl.firstChild, checkEl, function (v) {
        spend(checkEl);
        if (q.obj === 'K1') res.k1up = v === q.correct;
        if (q.obj === 'K2') res.k2up = v === q.correct;
        if (q.obj === 'F1') res.f1 = v;
        if (q.obj === 'F3') res.f3 = v;
        setTimeout(function () {
          if (i + 1 < BATTERY.length) swapTo(i + 1); else done();
        }, T(700));
      });
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
      // K1 → case 1 test-up, K2 → case 2 test-up, each from its own item
      // (already set in renderDeckItem). F1/F3 are the baselines the same
      // statements are compared against after case 3 and the debrief.
      stepEl.textContent = 'Quick questions: all ' + BATTERY.length + ' done';
      saveResult('battery', res);
      // 2026-09-25 (from Riff 07): the last card drops off the stack and the
      // module moves straight on to the path screen — the footer's Continue
      // was easy to miss once the last Submit had been pressed.
      askEl.classList.add('is-dropping');
      if (dotsEl) dotsEl.classList.add('is-gone');
      // The answers now decide the first Watch screen — start loading it.
      warmNextVideo('battery');
      ctx.enableNext();
      setTimeout(function () {
        if (askEl.isConnected) ctx.els.next.click();
      }, T(380));
    }
  }

  // ==========================================================================
  //  YOUR UPDATED PATH — 2026-09-24 live review: the row list is gone.
  //  Learners saw "Skipped" / "Adapted" beside section names and had no idea
  //  what adapted meant or why it happened (Chuck), and Rob agreed. The
  //  learner doesn't need to know what moved, only that something did. Two
  //  treatments, from experiments/sharps-riffs 03 and 02, picked from the
  //  Demo menu ("Path update style"):
  //
  //   calibrate (default) — "Calibrating your path…" over a progress bar,
  //                          then "You're all set, <name>" / "Let's continue…".
  //                          Says nothing about what moved.
  //   celebrate           — the same bar, then a playful reward: a flash,
  //                          one short confetti burst, a "Nice work" chip.
  //
  //  Celebrate only fires on a PROVEN knowledge answer (a harder case). When
  //  the only move is a longer case 3 / debrief (low agreement), the path got
  //  longer, and confetti for "here's more" would be wrong, so it falls back
  //  to calibrate. It carries no "time saved" figure: in this module a correct
  //  answer swaps a case for a harder one of about the same length and skips
  //  nothing, so there is no saved time to report.
  //
  //  The screen still only appears when something actually moved (adjustMoved).
  // ==========================================================================
  var ADJUST_CONTENT =
    '<main class="ll-object ll-object--crowned" id="adjustObject">' +
      '<canvas class="pu-confetti" id="puConfetti" aria-hidden="true"></canvas>' +
      '<div class="pu">' +
        '<div class="pu-load" id="puLoad">' +
          '<p class="pu-status">Calibrating your path…</p>' +
          '<div class="pu-track" role="progressbar" aria-label="Calibrating your path" ' +
            'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="puTrack">' +
            '<div class="pu-fill" id="puFill"></div></div>' +
          '<p class="pu-pct" id="puPct" aria-hidden="true">0%</p>' +
        '</div>' +
        '<div class="pu-flash" id="puFlash" aria-hidden="true"></div>' +
        '<div class="pu-result" id="puResult" role="status"></div>' +
      '</div>' +
    '</main>';
  // One lookup per treatment: what lands once the bar fills.
  var PU_RESULT = {
    // A function, so it reads the learner's name at reveal time.
    calibrate: function () {
      var name = savedName();
      return '<p class="ll-eyebrow pu-eyebrow">You\u2019re all set' + (name ? ', ' + esc(name) : '') + '</p>' +
        '<h2 class="pu-head">Let\u2019s continue\u2026</h2>' +
        '<p class="pu-sub">This module has adapted to your answers.</p>';
    },
    celebrate:
      '<p class="pu-chip"><i class="fa-solid fa-trophy" aria-hidden="true"></i> Nice work</p>' +
      '<h2 class="pu-head">You already know the basics.</h2>' +
      '<p class="pu-sub">We’ll go straight to the harder cases.</p>'
  };
  function pathUpdateStyle() {
    try { return sessionStorage.getItem('sh-path-style') === 'celebrate' ? 'celebrate' : 'calibrate'; }
    catch (e) { return 'calibrate'; }
  }
  // One row per routing decision the pre-check made (deck slides 2–4): a
  // correct knowledge answer swaps that case for its harder version, and a
  // low agreement swaps case 3 / the debrief for its longer version. Nothing
  // on screen lists these any more; they decide whether the screen runs at
  // all, and whether the celebrate treatment has earned its confetti.
  var ADJUST_ROWS = [
    { id: 'c1up',      state: function () { return k1TestUp() ? 'harder' : 'kept'; } },
    { id: 'c2up',      state: function () { return k2TestUp() ? 'harder' : 'kept'; } },
    { id: 'case3rf',   state: function () { return feelLow('f1') ? 'expanded' : 'kept'; } },
    { id: 'debriefrf', state: function () { return feelLow('f3') ? 'expanded' : 'kept'; } }
  ];
  function adjustRows() {
    return ADJUST_ROWS.map(function (r) { return { id: r.id, state: r.state() }; });
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
    var proven = adjustRows().some(function (r) { return r.state === 'harder'; });
    var style = (pathUpdateStyle() === 'celebrate' && proven) ? 'celebrate' : 'calibrate';
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var load = document.getElementById('puLoad');
    var track = document.getElementById('puTrack');
    var fill = document.getElementById('puFill');
    var pct = document.getElementById('puPct');
    var result = document.getElementById('puResult');
    var DUR = T(1900);

    ctx.floatClose();
    ctx.setCoachSay('');

    // The bar and the number move together; ease-out so it settles rather
    // than ticking linearly toward 100.
    var t0 = null;
    function tick(ts) {
      if (!fill.isConnected) return;            // learner already moved on
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / DUR), v = Math.round((1 - Math.pow(1 - t, 3)) * 100);
      fill.style.width = v + '%';
      pct.textContent = v + '%';
      track.setAttribute('aria-valuenow', v);
      if (t < 1) requestAnimationFrame(tick); else setTimeout(reveal, T(180));
    }
    requestAnimationFrame(tick);

    function reveal() {
      if (!result.isConnected) return;
      load.classList.add('is-done');
      result.innerHTML = typeof PU_RESULT[style] === 'function' ? PU_RESULT[style]() : PU_RESULT[style];
      result.classList.add('in');
      if (style === 'celebrate' && !still) {
        document.getElementById('puFlash').classList.add('pop');
        puConfetti(document.getElementById('puConfetti'));
      }
      LE.refreshNav();
      ctx.enableNext();
    }
  }

  // One short burst from the two bottom corners, no library. Ported from
  // experiments/sharps-riffs/02-path-update-celebratory.html, where the
  // count and spread were already tuned down from "blizzard" to "two modest
  // fountains that stay mostly on their own side". The canvas sits under the
  // text, so particles frame the reward rather than covering it.
  function puConfetti(canvas) {
    if (!canvas || !canvas.getContext) return;
    var c = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var COLORS = ['#2ee6cf', '#5aa9f6', '#f1b34a', '#c4b5fd', '#ff8fa8', '#ffffff'];
    var DURATION = 2500, per = Math.max(30, Math.min(60, Math.round(w / 22)));
    function burst(x0, dir) {
      var out = [];
      for (var i = 0; i < per; i++) {
        var speed = 13 + Math.random() * 13;
        var rad = (90 - (14 + Math.random() * 34)) * Math.PI / 180;
        var streamer = Math.random() < 0.25;
        out.push({ x: x0, y: h, vx: dir * Math.cos(rad) * speed, vy: -Math.sin(rad) * speed,
                   size: streamer ? 9 + Math.random() * 8 : 4 + Math.random() * 5, streamer: streamer,
                   rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.4,
                   color: COLORS[(Math.random() * COLORS.length) | 0],
                   rect: streamer || Math.random() < 0.55 });
      }
      return out;
    }
    var ps = burst(w * 0.06, 1).concat(burst(w * 0.94, -1)), start = null;
    function frame(ts) {
      if (!canvas.isConnected) return;
      if (start === null) start = ts;
      var el = ts - start, a = el > DURATION - 800 ? Math.max(0, (DURATION - el) / 800) : 1;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.scale(dpr, dpr);
      ps.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.vx *= 0.985; p.rot += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.globalAlpha = a; c.fillStyle = p.color;
        if (p.rect) {
          var len = p.streamer ? p.size * 2 : p.size;
          c.fillRect(-len / 2, -p.size * 0.28, len, p.size * 0.42);
        } else { c.beginPath(); c.arc(0, 0, p.size / 2, 0, Math.PI * 2); c.fill(); }
        c.restore();
      });
      if (el < DURATION) requestAnimationFrame(frame);
      else { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); }
    }
    requestAnimationFrame(frame);
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
    // A clip on another origin (the CloudFront-hosted deck videos) always
    // streams: a CDN serves range requests properly, and downloading ~12 MB
    // whole before the first frame was a 10–15 second wait.
    var remote = /^https?:\/\//.test(url) && url.indexOf(location.origin) !== 0;
    fetch(url, { method: 'HEAD' }).then(function (h) {
      if (h.status === 404) { var e = new Error('missing'); e.missing = true; throw e; }
      return +h.headers.get('Content-Length') || 0;
    }).then(function (size) {
      if (remote || size > STREAM_OVER) { stream(size); return; }
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
      // 'auto', not 'metadata': buffer ahead of the playhead from the start
      // instead of fetching only as playback reaches each part (a remote clip
      // streams; see `remote` above).
      v.preload = 'auto';
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
    podcast: { label: 'Read to me', icon: 'fa-volume-high',
               cost: 'Longest \u00b7 hands free',
               tradeoff: 'Runs while you do something else, but takes longer and stops to ask you things.',
               note: 'The narration read aloud, word-highlighted as it plays.' }
  };

  //  The chooser. One implementation, so a second beat offering a choice
  //  cannot invent a different one. A beat declares which keys it offers and
  //  in what order; every label comes from the table above.
  //
  //  It PERSISTS rather than gating. A one-shot chooser would either hide the
  //  default carrier behind a click or vanish once used, and both are worse:
  //  the learner arrives on the default and can still see, at any point,
  //  what the other option is.
  // `table` defaults to MODALITIES; the title page's mode card passes its own
  // (MODE_CARD — Watching / Listening / Reading) through the same picker.
  function modalityPicker(id, keys, table) {
    table = table || MODALITIES;
    return '<div class="md-pick" id="' + id + '" role="group" ' +
        'aria-label="How do you want to take this?">' +
      keys.map(function (k) {
        var m = table[k];
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
  function modalityDropdown(ids, keys, opts, table) {
    var corner = opts && opts.corner;
    return '<div class="md-now' + (corner ? ' md-now--corner' : '') + '">' +
        '<div class="cp-format-now" id="' + ids.now + '">' +
          '<span class="cp-format-now-t"><i class="fa-solid" id="' + ids.icon + '" aria-hidden="true"></i>' +
            '<b id="' + ids.label + '"></b></span>' +
          '<button class="cp-format-change" type="button" id="' + ids.btn + '" ' +
            'aria-expanded="false" aria-controls="' + ids.wrap + '">' +
            'Change<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="cp-format-picker" id="' + ids.wrap + '" hidden>' + modalityPicker(ids.pick, keys, table) + '</div>' +
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
  function initModalityDropdown(ids, table) {
    table = table || MODALITIES;
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
        var m = table[k];
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
  function csTag(b, text) {
    if (!b || b.querySelector('.cs-tag')) return;
    var t = document.createElement('span');
    t.className = 'cs-tag';
    t.textContent = text;
    b.appendChild(t);
    b.classList.add('has-tag');
    var name = b.getAttribute('aria-label');
    if (name) b.setAttribute('aria-label', name + ' (' + text + ')');
  }
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
  // The hero still that sets the scene on this screen — and rides into the
  // player as its backdrop (?hero=). Only a sector with its OWN produced
  // still gets one (both current sectors do); any other keeps the icon mark.
  // Same files as the in-module scene (SCENE_ART).
  function handoffHero() {
    var a = SCENE_ART[LE.lensId()];
    return a ? { src: a.src } : null;
  }

  // With a hero, this screen IS the simulator's first frame: the still runs
  // full-bleed behind the copy, framed exactly as the player frames its own
  // backdrop (center / cover). "Enter the scenario" then fakes the jump —
  // the copy leaves, the still blurs and darkens to the player's coach-up
  // state (.ho-sim reproduces its two washes: the has-hero gradient and the
  // coach scrim), and a cross-document View Transition hands over to the
  // player, which opens on that same picture with the coach sheet rising.
  function HANDOFF_CONTENT() {
    var hero = handoffHero();
    return '<main class="ll-object ll-object--chain' + (hero ? ' ho-object' : '') + '">' +
      (hero
        ? '<div class="ho-bg" aria-hidden="true" style="background-image:url(\'' + esc(hero.src) + '\')"></div>' +
          '<div class="ho-read" aria-hidden="true"></div><div class="ho-sim" aria-hidden="true"></div>'
        : '') +
      '<div class="ho-wrap">' +
      '<p class="ll-eyebrow">Perform: live scenario, about 5 minutes</p>' +
      (hero ? '' : '<span class="ho-mark" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>') +
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

  // The frame header's current text, as a player URL param (&course= / &lesson=).
  function frameText(which) {
    var el = document.querySelector('.vt-frame .vt-' + which);
    var t = el ? el.textContent.trim() : '';
    return t ? '&' + which + '=' + encodeURIComponent(t) : '';
  }

  // One listener for the life of the page (the Next button outlives every
  // step). Capture phase on document, so it runs before the engine's own
  // Next handler and can hold the hand-off until the fake transition lands.
  var handoffLeaving = false;
  document.addEventListener('click', function (e) {
    var next = e.target.closest && e.target.closest('#llNext');
    var obj = document.querySelector('.ll-object.ho-object:not(.leaving)');
    if (!obj || !next || next.disabled || handoffLeaving) return;
    // The Demo menu's Do-object baseline keeps `enact` in-page — nothing to
    // hand over to, so no fake jump either.
    if (doBaselineOn()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    handoffLeaving = true;
    // Both documents opt in to a same-origin cross-document View Transition;
    // this side opts in only now, so no other navigation off this page fades.
    var vt = document.createElement('style');
    vt.textContent = '@view-transition { navigation: auto; }';
    document.head.appendChild(vt);
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    obj.classList.add('ho-entering');
    setTimeout(function () { next.click(); handoffLeaving = false; }, still ? 0 : 700);
  }, true);

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
  var DOBASELINE_VIDEO = '../../assets/videos/sharps-doobject-baseline.mp4';
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
      '<span class="rs-badge" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' +
      '<p class="ll-eyebrow">Your results</p>' +
      '<h2 id="recHead">Module complete!</h2>' +
      '<p class="ll-sub">Based on your answers and your choices in the scenario.</p>' +
      '<div class="rs-wrap" id="recList"></div>' +
    '</main>';
  // The two Feel objectives asked before and after now report the MOVE rather
  // than the level, because the level on its own says more about the person
  // than about the module. `held` is not a failure and is not dressed up as
  // one — somebody who arrived agreeing had nowhere to go.
  var MOVE = {
    up:   { cls: 'up',   icon: 'fa-arrow-trend-up',   label: 'Moved up' },
    held: { cls: 'held', icon: 'fa-minus',            label: 'Held' },
    down: { cls: 'down', icon: 'fa-arrow-trend-down', label: 'Moved down' }
  };
  // Item 13/D3: the shared scenario player's own additive write-back, read
  // here rather than assumed. Absent whenever the scenario has not run yet
  // (or hasn't reached its real debrief) — every caller below falls back to
  // the pre-item-13 generic line in that case, same as before this existed.
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
    // 2026-10-24: only things with a right answer are scored — the two
    // knowledge checks and the two scenario results land in Strengths or
    // Worth a review. The agreement ratings (F1, F3) are views, not
    // results: a low one only ever served a longer version of the content,
    // so they are never graded here. They get their own unscored section
    // in the details, quoting the statement and showing how the rating
    // moved. F2 (never asked here) and D3 (a plan) are not graded either.
    // Labels here are plain topic nouns, not the objective names, which
    // are written as claims ("It protects your coworkers") and read as a
    // verdict next to a status icon.
    var TOPIC = {
      K1: { name: 'Safe handling steps',        kind: 'Knowledge check' },
      K2: { name: 'Spotting unsafe conditions', kind: 'Knowledge check' },
      D1: { name: 'Acting in the moment',       kind: 'Scenario' },
      D2: { name: 'Disposing of it safely',     kind: 'Scenario' }
    };
    // Each entry: { id, ok, line }.
    function knowTopic(id, chk, re) {
      if (!chk) return null;
      var up = chk.variant === 'up';
      if (chk.passed) return { id: id, ok: true, line: 'Answered correctly' + (up ? ', on the harder version.' : '.') };
      if (re && re.passed) return { id: id, ok: true, line: 'Answered correctly on the second try.' };
      return { id: id, ok: false, line: re ? 'Missed on both tries.' : 'Missed this question.' };
    }
    function decisionTopic() {
      if (c.scene && c.scene.decision) {
        var d = c.scene.decision;
        return { id: 'D1', ok: d === 'now',
          line: d === 'now' ? 'You disposed of the sharp before answering the call.'
              : d === 'later' ? 'You held on to the sharp but put off disposing of it.'
              : 'You set the sharp down to answer the call.' };
      }
      if (beats && beats.decision) {
        return { id: 'D1', ok: beats.decision === 'SOUND',
          line: beats.decision === 'SOUND' ? 'You dealt with the sharp before stepping away.'
              : 'You stepped away before the sharp was dealt with.' };
      }
      return null;
    }
    function disposalTopic() {
      if (c.scene && c.scene.rubric) {
        var r = c.scene.rubric;
        var short = SCENE_RUBRIC.filter(function (x) { return !(r[x.id] && r[x.id].score === 2); });
        return { id: 'D2', ok: short.length === 0,
          line: short.length === 0 ? 'Every part of how you disposed of it was on point.'
              : 'Room to improve: ' + short.map(function (x) { return SCENE_FEEDBACK[x.id].short; }).join(', ') + '.' };
      }
      if (beats && (beats.execution || beats.container)) {
        var gaps = [];
        if (beats.execution !== 'SOUND') gaps.push('getting the sharp to the container');
        if (beats.container !== 'SOUND') gaps.push('handling the full container');
        return { id: 'D2', ok: gaps.length === 0,
          line: gaps.length === 0 ? 'You got it to a proper container, even when the first one was full.'
              : 'Room to improve: ' + gaps.join(' and ') + '.' };
      }
      return null;
    }
    var topics = [
      knowTopic('K1', c.k1check, c.k1recheck),
      knowTopic('K2', c.k2check, c.k2recheck),
      decisionTopic(),
      disposalTopic()
    ].filter(Boolean);

    // Knowledge only: the pre-check answer against the final one.
    function finalPass(chk, re) { return !!(chk && (chk.passed || (re && re.passed))); }
    var changes = [];
    if (!b.skipped) {
      if (c.k1check && b.k1up != null) changes.push({ id: 'K1', before: !!b.k1up, after: finalPass(c.k1check, c.k1recheck) });
      if (c.k2check && b.k2up != null) changes.push({ id: 'K2', before: !!b.k2up, after: finalPass(c.k2check, c.k2recheck) });
    }
    function changeOf(ch) {
      var k = ch.after && !ch.before ? 'up' : !ch.after && ch.before ? 'down' : 'held';
      return { icon: MOVE[k].icon, cls: k === 'up' ? 'rs-ok' : k === 'down' ? 'rs-warn' : 'rs-flat',
        label: k === 'up' ? 'Improved' : k === 'down' ? 'Dropped' : ch.after ? 'Already strong' : 'No change' };
    }
    function yesNo(v) { return v ? 'Correct' : 'Incorrect'; }

    // Views: the statement, rated at the start and again later. Neutral
    // marks only — no tick, no warning — since there is no right rating.
    var views = [
      { stmt: F1_STATEMENT, before: b.f1, after: c.f1post && c.f1post.score },
      { stmt: F3_STATEMENT, before: b.f3, after: c.f3post && c.f3post.score }
    ].filter(function (v) { return v.before != null || v.after != null; });
    function viewLine(v) {
      if (v.before != null && v.after != null) {
        return 'At the start: ' + v.before + ' of 5 · Later: ' + v.after + ' of 5';
      }
      return 'You rated this ' + (v.after != null ? v.after : v.before) + ' of 5';
    }

    function nameList(list, icon) {
      return '<ul class="rs-names">' + list.map(function (t) {
        return '<li><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + esc(TOPIC[t.id].name) + '</li>';
      }).join('') + '</ul>';
    }
    var strong = topics.filter(function (t) { return t.ok; });
    var work = topics.filter(function (t) { return !t.ok; });
    var improved = changes.filter(function (ch) { return ch.after && !ch.before; }).length;

    // Nothing scored in this run (a deep link, or everything skipped in
    // Review mode): no summary card at all rather than an empty one.
    var html = '';
    if (topics.length) {
      // All strong: keep both columns — "Nothing — nice work" is the payoff.
      // All to review: drop the empty Strengths column rather than show a
      // "none" next to the module's own check mark.
      html += '<section class="rs-summary' + (strong.length ? '' : ' rs-summary--one') + '">' +
        (strong.length ? '<div class="rs-col rs-col--strong"><h3 class="rs-head">Strengths</h3>' +
          nameList(strong, 'fa-circle-check') + '</div>' : '') +
        '<div class="rs-col rs-col--work"><h3 class="rs-head">Worth a review</h3>' +
          (work.length ? nameList(work, 'fa-circle-exclamation') : '<p class="rs-empty">Nothing — nice work</p>') + '</div>' +
      '</section>';
    }
    if (improved) {
      html += '<p class="rs-improved"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>' +
        'Improved on ' + improved + ' of ' + changes.length + ' knowledge checks since the pre-check</p>';
    }

    // The detail, for whoever wants it. Each scored row leads with what it
    // was ("Knowledge check · …") so the label reads as a section name.
    var more = '';
    if (topics.length) {
      more += '<h4 class="rs-sub">How you did</h4><ul class="rs-rows">' + topics.map(function (t) {
        return '<li><i class="fa-solid ' + (t.ok ? 'fa-circle-check rs-ok' : 'fa-circle-exclamation rs-warn') + '" aria-hidden="true"></i>' +
          '<span class="rs-topic"><span class="rs-kind">' + esc(TOPIC[t.id].kind) + '</span>' + esc(TOPIC[t.id].name) + '</span>' +
          '<span class="rs-val">' + esc(t.line) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (changes.length) {
      more += '<h4 class="rs-sub">Since the pre-check</h4><ul class="rs-rows">' + changes.map(function (ch) {
        var m = changeOf(ch);
        return '<li><i class="fa-solid ' + m.icon + ' ' + m.cls + '" aria-hidden="true"></i>' +
          '<span class="rs-topic">' + esc(TOPIC[ch.id].name) + '</span>' +
          '<span class="rs-val">' + esc(m.label) + ': ' + yesNo(ch.before) +
            ' <i class="fa-solid fa-arrow-right rs-arrow" aria-hidden="true"></i> ' + yesNo(ch.after) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (views.length) {
      more += '<h4 class="rs-sub">Your views <span class="rs-note">Not scored</span></h4><ul class="rs-rows rs-views">' + views.map(function (v) {
        return '<li><i class="fa-regular fa-comment rs-flat" aria-hidden="true"></i>' +
          '<q class="rs-stmt">' + esc(v.stmt) + '</q><span class="rs-val">' + esc(viewLine(v)) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (c.sustain && c.sustain.route) {
      more += '<h4 class="rs-sub">Your plan</h4>' +
        '<p class="rs-plan">You named ' + esc(low(c.sustain.cond)) + ' as the shift most likely to test this, and said your container is ' +
          esc(c.sustain.route) + '.</p>';
    }
    if (more) {
      html += '<details class="rs-more"' + (topics.length ? '' : ' open') + '><summary>Show details<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>' +
        '<div class="rs-more-body">' + more + '</div></details>';
    }
    if (!html) html = '<p class="rs-empty">No results yet. Finish the module to see them here.</p>';
    document.getElementById('recList').innerHTML = html;
  }

  // ==========================================================================
  //  THE SIMULATION (deck slides 23–27, 2026-09-22) — in the module, on the
  //  stage, instead of a hand-off to the full conversation simulator.
  //
  //  The deck's scenario is four moments, not a conversation: a decision
  //  (whether you act), a described disposal (how well, on the four-part
  //  rubric), an adaptive complication (the Recovery test, or a correction
  //  inside the scene for a learner who is struggling), and one open close
  //  that is never scored. So it runs as the "A Critical Choice" riff did
  //  (experiments/sharps-riffs/01): one first-person still, scanned through a
  //  binocular view, with the coach setting each moment in a panel over the
  //  scene and the learner answering in their own words, typed or spoken.
  //  Each moment turns the view to the part of the scene it is about.
  //
  //  Copy is the deck's own. The coach's lines ARE the slides' setup and
  //  prompts; the only model-written text is the in-scene correction on the
  //  struggling path (slide 26), per the stakeholder. The full simulator is
  //  still reachable from the Demo menu ("Full scenario simulator").
  // ==========================================================================
  var SCENE_ART = {
    // Generated stills (2026-09-22), the same layout in both sectors: the
    // person calling on the left, the sharp front and center, the container
    // on the right — plus a close-up of the container at its fill line.
    manufacturing: { src: '../../assets/images/sharps-scene-manufacturing.jpg',
      focal: { sharp: [0.557, 0.780], person: [0.190, 0.300], container: [0.870, 0.200] },
      zoom: { sharp: 2.6 },
      closeup: { src: '../../assets/images/sharps-scene-container-manufacturing.jpg', x: 0.68 } },
    // Generated still (2026-09-22). The syringe is small in this frame, so
    // the view leans in closer on it (zoom.sharp).
    public: { src: '../../assets/images/sharps-scene-public.jpg',
      focal: { sharp: [0.570, 0.570], person: [0.148, 0.300], container: [0.940, 0.290] },
      zoom: { sharp: 3.4 },
      // Beat 3's own still: arriving at the container and finding it at its
      // fill line. `x` is where the container sits across the frame, so the
      // crop keeps it in view in a narrow scene column.
      closeup: { src: '../../assets/images/sharps-scene-container-public.jpg', x: 0.69 } }
  };
  function sceneArt() { return SCENE_ART[LE.lensId()] || SCENE_ART.manufacturing; }

  // The deck's copy, per sector (slides 23–27).
  var SCENE_COPY = {
    manufacturing: {
      setup: 'You’re replacing a cutting blade at a workstation on the production floor when you notice a used blade sitting on the edge of the neighboring workbench. You didn’t put it there, and you don’t know who did.',
      beat1: 'You pick up the used blade from the workbench. Before you can deal with it, a coworker calls for your help with a problem on the line. They need you now. The blade is still in your hand. What do you do?',
      beat2: 'The used blade still has to be dealt with, and the designated sharps container is at the end of the line. Describe what you do next, step by step, until the blade is disposed of.',
      item: 'blade'
    },
    public: {
      setup: 'You’re clearing your patrol vehicle at the end of shift when you find a used hypodermic needle wedged into the back seat. You didn’t put it there, and you don’t know who did.',
      beat1: 'You lift the used needle clear of the seat. Before you can deal with it, another officer calls for your help across the lot. They need you now. The needle is still in your gloved hand. What do you do?',
      beat2: 'The used needle still has to be dealt with, and the designated sharps container is inside the station. Describe what you do next, step by step, until the needle is disposed of.',
      item: 'needle'
    }
  };
  // Slide 26 is written about the learner ("the container they reach…");
  // on screen it is said to them. Slide 27 is the deck's own quote.
  var SCENE_BEAT3 = 'The container you reach is at its fill line, and the spare is in another room. What do you do?';
  var SCENE_BEAT4 = 'What would make this hardest to do right on your worst shift?';
  function sceneCopy() { return SCENE_COPY[LE.lensId()] || SCENE_COPY.manufacturing; }

  // The rubric slide ("the same in every version"), verbatim. Beat 1 scores
  // whether the learner acts; Beat 2 scores how well — kept separate on
  // purpose, as the slide says. Recovery is confirmed by Beat 3.
  var SCENE_RUBRIC = [
    { id: 'timing',    name: 'Timing',    def: 'Disposed at the point of use — not deferred to the end of the task.' },
    { id: 'technique', name: 'Technique', def: 'Safety feature on · no recapping, no bending, no setting it down in between.' },
    { id: 'route',     name: 'Route',     def: 'A designated container, fill line respected · never general waste or linen.' },
    { id: 'recovery',  name: 'Recovery',  def: 'When the container is full or missing, finds another proper one — never improvises.' }
  ];

  // What the learner sees on the scenario's result card. `label` is the
  // expected action in plain words, so every row says what good looks like
  // whether it is ticked or not; a row that is not fully met adds one line
  // on what they did instead (keyed by score: 1 partly, 0 missed, none = no
  // evidence or the moment never came). `short` names it on the results
  // screen. The deck's own wording still drives the grader (SCENE_RUBRIC).
  var SCENE_FEEDBACK = {
    decision:  { short: 'acting first', label: 'Deal with the sharp before you help',
      1: 'You held on to it, but waited until after helping.',
      0: 'You set it down to go help.',
      none: 'Your answer didn\u2019t say what you did with it.' },
    timing:    { short: 'timing', label: 'Dispose of it right away',
      1: 'You got to it, but not right away.',
      0: 'You waited until the task was done.',
      none: 'Your answer didn\u2019t say when.' },
    technique: { short: 'handling',
      get label() {
        return sceneCopy().item === 'blade'
          ? 'Keep it in hand \u2014 no bending, breaking, or setting it down'
          : 'Safety feature on \u2014 no recapping, bending, or setting it down';
      },
      1: 'Part of this was missing from your answer.',
      0: 'You recapped, bent, or set it down on the way.',
      none: 'Your answer didn\u2019t say how you handled it.' },
    route:     { short: 'the container', label: 'Put it in a sharps container',
      1: 'You didn\u2019t say it went into a sharps container.',
      0: 'It went somewhere other than a sharps container.',
      none: 'Your answer didn\u2019t say where it went.' },
    recovery:  { short: 'the full container', label: 'If the container is full, find another one',
      1: 'You didn\u2019t say where you\u2019d take it instead.',
      0: 'You made do with the full container.',
      none: 'This didn\u2019t come up in your run.' }
  };

  function sceneSimulatorOn() {
    try { return sessionStorage.getItem('sh-scene-mode') === 'simulator'; } catch (e) { return false; }
  }

  // ---- Grading ------------------------------------------------------------
  // One fast-model call per graded moment, through the same live Worker every
  // sim page uses (SimCore.callModel). Each has an offline fallback so the
  // scene still runs without the Worker (or on file://).
  function sceneContext() {
    var c = sceneCopy();
    return 'Workplace safety training, bloodborne pathogens module, safe sharps disposal. ' +
      'The scene: ' + c.setup + ' ' + c.beat1;
  }
  function askModel(system, user, maxTokens) {
    if (!(window.SimCore && SimCore.WORKER_URL)) return Promise.reject(new Error('offline'));
    return SimCore.callModel({ system: system, messages: [{ role: 'user', content: user }],
      maxTokens: maxTokens || 400, model: SimCore.MODELS.FAST }).then(SimCore.parseJson);
  }
  // Offline keyword checks drop negated phrases first ("I don't force it
  // in" must not read as forcing it in).
  function affirmed(t) {
    return String(t || '').toLowerCase()
      .replace(/\b(don['\u2019]?t|do not|never|won['\u2019]?t|wouldn['\u2019]?t|not|no)\b(\s+\S+){1,4}/g, ' ');
  }
  function has(t, re) { return re.test(affirmed(t)); }

  // Beat 1: whether they act. now = deals with it before helping; later =
  // keeps hold of it but defers; shortcut = sets it down anywhere that is
  // not a designated container.
  function gradeDecision(text) {
    var sys = sceneContext() + '\n\nThe learner answered "What do you do?". Classify ONLY whether they act on the sharp:\n' +
      '"now" = they dispose of it in a designated sharps container (or go straight to one) before helping;\n' +
      '"later" = they keep it under control but defer disposal until after helping;\n' +
      '"shortcut" = they set it down on any surface it was not disposed into, pocket it, bin it, or hand it off.\n' +
      'Judge only what they actually said. Return ONLY JSON: {"decision":"now"|"later"|"shortcut"}';
    return askModel(sys, 'The learner said:\n\n' + text, 60).then(function (r) {
      return /^(now|later|shortcut)$/.test(r.decision) ? r.decision : localDecision(text);
    }).catch(function () { return localDecision(text); });
  }
  function localDecision(t) {
    if (has(t, /\b(set|put|leave|lay|place)\b[^.]*\b(down|bench|table|seat|counter|aside)\b|\btrash\b|\bpocket\b/)) return 'shortcut';
    var a = affirmed(t), bin = a.search(/\bcontainer\b|\bdispos/), help = a.search(/\bhelp/);
    if (bin < 0) return 'later';
    // Disposal named before the help (or no help at all) is acting now.
    return help < 0 || bin < help ? 'now' : 'later';
  }

  // Beat 2: how well, on the four rubric criteria (0 = missed, 1 = partly,
  // 2 = met, null = the answer gives no evidence either way). Also writes the
  // in-scene correction used only on the struggling path.
  function gradeExecution(text, decisionText) {
    var rub = SCENE_RUBRIC.map(function (r, i) { return (i + 1) + '. ' + r.name + ' — ' + r.def; }).join('\n');
    var sys = sceneContext() + '\n\nThen: ' + sceneCopy().beat2 + '\n\nRate the learner’s described disposal on this rubric:\n' + rub +
      '\n\nFor each criterion give 0 (missed or contradicted), 1 (partly), 2 (clearly met), or null if their words give no evidence either way ' +
      '(Recovery is usually null here — nothing has gone wrong yet). Credit only what they actually said: Route is met only if they say the ' +
      'sharp goes into a designated sharps container — "take it inside" or "get rid of it" alone is partly at most. For each non-null score, quote the ' +
      'shortest exact phrase from their answer that is the evidence (verbatim substring, or "" if none).\n' +
      'Also write "correction": 1-2 plain sentences spoken to the learner ("you") inside the scene, correcting the single most important gap ' +
      'in what they described, as feedback rather than a do-over. Stay inside the scene as given: add no new people, events or outcomes. ' +
      'No praise words, no lists.\n' +
      'Return ONLY JSON: {"timing":{"score":0|1|2|null,"quote":""},"technique":{...},"route":{...},"recovery":{...},"correction":""}' +
      // 2026-10-24: a used blade has no safety feature and no cap, so
      // Technique marked a clean "walk it over and drop it in" as partly met
      // for never mentioning one. Score only the steps this item has.
      (sceneCopy().item === 'blade'
        ? '\nThe item is a used blade: it has no safety feature and no cap, so never mark Technique down for not mentioning one. ' +
          'Technique is met when they keep it in hand and put it straight into the container without bending, breaking or setting it down.'
        : '');
    var user = 'Their first answer ("What do you do?"): ' + decisionText + '\n\nTheir step-by-step description:\n\n' + text;
    return askModel(sys, user, 500).then(function (r) {
      var out = { correction: typeof r.correction === 'string' ? r.correction.trim() : '' };
      SCENE_RUBRIC.forEach(function (c) { out[c.id] = normCrit(r[c.id], text); });
      if (!out.correction) out.correction = localExecution(text).correction;
      return out;
    }).catch(function () { return localExecution(text); });
  }
  function normCrit(x, text) {
    x = x || {};
    var s = x.score === 0 || x.score === 1 || x.score === 2 ? x.score : null;
    var q = typeof x.quote === 'string' && x.quote && String(text).indexOf(x.quote) > -1 ? x.quote : '';
    return { score: s, quote: q };
  }
  function localExecution(t) {
    var bad = has(t, /\brecap|\bbend|\bbreak|\btrash\b|\bgarbage\b|\bset it down\b/);
    var out = {
      timing:    { score: has(t, /\b(straight|right away|immediately|directly|first)\b/) ? 2 : 1, quote: '' },
      technique: { score: bad ? 0 : has(t, /\bsafety (feature|cap|shield)|\bretract|\bsheath/) ? 2 : 1, quote: '' },
      route:     { score: has(t, /\bcontainer\b/) ? (has(t, /\bfill line|\bfull\b/) ? 2 : 1) : 0, quote: '' },
      recovery:  { score: null, quote: '' },
      correction: 'Keep it in your hand, walk it directly to the designated sharps container, and put it straight in — no recapping, bending, or setting it down on the way.'
    };
    return out;
  }
  // Beat 3 (doing well): the Recovery test.
  function gradeRecovery(text) {
    var r = SCENE_RUBRIC[3];
    var sys = sceneContext() + '\n\nComplication: ' + SCENE_BEAT3 + '\n\nRate ONLY ' + r.name + ' — ' + r.def +
      '\n0 = improvises (forces it in, presses contents down, balances it on top, general waste, sets it down); 1 = does not improvise but ' +
      'names no proper route (waits, hands it off); 2 = keeps the sharp under control and goes for the spare or another designated container ' +
      '(walking it to the next, nearest or another container counts as 2). ' +
      'Quote the shortest exact phrase from their answer that is the evidence. Return ONLY JSON: {"score":0|1|2,"quote":""}';
    return askModel(sys, 'The learner said:\n\n' + text, 120).then(function (x) {
      var n = normCrit(x, text); if (n.score == null) n.score = 1; return n;
    }).catch(function () {
      return { score: has(t0(text), /\bforce|\bpush|\bpress|\bon top\b|\btrash\b|\bset it down\b/) ? 0
        : has(t0(text), /\bspare\b|\banother\b|\b(next|nearest|other) (container|room|one)\b|\bget (a|the) (new|spare)/) ? 2 : 1, quote: '' };
    });
  }
  function t0(t) { return String(t || ''); }
  // Struggling = the decision was the shortcut, or any of the first three
  // criteria came back missed. The complication is for a learner doing well.
  function sceneStruggling(decision, ex) {
    return decision === 'shortcut' || ['timing', 'technique', 'route'].some(function (k) { return ex[k] && ex[k].score === 0; });
  }

  // ---- The screen -----------------------------------------------------------
  function SCENE_CONTENT() {
    var art = sceneArt();
    return '<main class="ll-object dk-object sc-object"><div class="dk-theater">' +
      '<header class="dk-head"><div class="dk-head-t">' +
        '<p class="ll-eyebrow">Interactive scenario</p>' +
        '<h1 class="dk-title">A sharp decision</h1>' +
      '</div>' +
      (art.placeholder ? '<span class="sc-ph"><i class="fa-solid fa-image" aria-hidden="true"></i> Placeholder scene</span>' : '') +
      '</header>' +
      '<div class="dk-stagewrap">' +
        '<div class="dk-stage sc-stage" id="scStage">' +
          '<div class="sc-scene" id="scScene" data-view="wide">' +
            // Three views, one showing at a time (data-view):
            //   wide  — the whole still, nothing cropped (a blurred copy fills
            //           the frame around it); the establishing shot and the
            //           pull-back for the close
            //   bino  — the binocular view on one subject
            //   close — a second still for the moment you reach the container
            '<div class="sc-view sc-wide"><img class="sc-img sc-img-bg" src="' + esc(art.src) + '" alt="">' +
              '<img class="sc-img sc-img-fit" src="' + esc(art.src) + '" alt=""></div>' +
            '<div class="sc-view sc-bino" id="scBino"><div class="sc-jitter" id="scJitter">' +
              '<img class="sc-img" id="scImg" src="' + esc(art.src) + '" alt=""></div></div>' +
            (art.closeup
              ? '<div class="sc-view sc-close"><img class="sc-img" src="' + esc(art.closeup.src) + '" alt="" ' +
                  'style="object-position:' + Math.round(art.closeup.x * 100) + '% 50%"></div>'
              : '') +
            '<div class="sc-vignette" aria-hidden="true"></div>' +
          '</div>' +
          '<aside class="sc-panel" aria-label="Scenario">' +
            '<div class="sc-panel-head"><span class="sc-dot" aria-hidden="true"></span> CLARA ' +
              '<span class="sc-beat" id="scBeat"></span></div>' +
            '<div class="sc-thread" id="scThread" aria-live="polite"></div>' +
            '<div class="sc-compose" id="scCompose">' +
              '<div class="input-shell sc-shell" id="scShell">' +
                '<textarea id="scInput" rows="2" placeholder="Type, or tap the mic to talk" aria-label="Your answer" disabled></textarea>' +
                '<button class="sc-send" id="scSend" type="button" aria-label="Send" disabled><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>' +
              '</div>' +
              '<p class="sc-hint" id="scHint"></p>' +
            '</div>' +
          '</aside>' +
        '</div>' +
        '<div class="dk-check sc-result" id="scResult" hidden><div class="dk-card sc-card">' +
          '<h2 class="cs-q cs-q--lead">How\u2019d you do?</h2>' +
          '<div class="sc-rows" id="scRows"></div>' +
        '</div></div>' +
      '</div>' +
    '</div></main>';
  }

  function sceneInit(ctx) {
    var art = sceneArt(), copy = sceneCopy();
    var thread = document.getElementById('scThread');
    var input = document.getElementById('scInput');
    var send = document.getElementById('scSend');
    var beatEl = document.getElementById('scBeat');
    var hint = document.getElementById('scHint');
    var scene = document.getElementById('scScene');
    var bino = document.getElementById('scBino');
    var img = document.getElementById('scImg');
    var jit = document.getElementById('scJitter');
    var alive = true, res = { answers: {} };
    ctx.setCoachSay('');
    ctx.floatClose();
    ctx.disableNext();

    // ---- The binocular view (ported from Riff 01): two overlapping lenses
    // over one still, panning between focal points with a hand-held drift.
    var nat = { w: 2000, h: 857 }, cur = { f: art.focal.sharp, zoom: 2 }, base = 1;
    function layout() {
      var W = scene.clientWidth, H = scene.clientHeight;
      // How much of the scene's height the lenses may take: the page's CSS
      // sets --sc-lens-h (lower in the stacked layout, so the band keeps
      // room above and below the binoculars).
      var fill = parseFloat(getComputedStyle(scene).getPropertyValue('--sc-lens-h')) || 0.92;
      var D = Math.min(W * 0.8 / 1.64, H * fill), d = D * 0.64, r = D / 2, fe = Math.max(14, r * .12);
      var lens = function (cx) { return 'radial-gradient(circle at ' + cx + 'px 50%, #000 0, #000 ' + (r - fe) + 'px, transparent ' + r + 'px)'; };
      bino.style.width = (D + d) + 'px'; bino.style.height = D + 'px';
      bino.style.webkitMaskImage = bino.style.maskImage = lens(r) + ', ' + lens(r + d);
      // The image is sized ONCE, to just cover the lenses; every move after
      // that is a transform (translate + scale), which the browser animates
      // on the GPU. Animating width/height re-laid the image out every frame.
      base = Math.max((D + d) / nat.w, D / nat.h);
      img.style.width = nat.w * base + 'px'; img.style.height = nat.h * base + 'px';
      aim(cur.f, cur.zoom, false);
    }
    function aim(f, zoom, smooth) {
      cur = { f: f, zoom: zoom };
      var bw = bino.clientWidth, bh = bino.clientHeight;
      if (!bw) return;
      var rw = nat.w * base * zoom, rh = nat.h * base * zoom;
      // Clamped so a subject near the frame's edge never pans the lens past
      // the image into black.
      var tx = Math.min(0, Math.max(bw - rw, bw / 2 - f[0] * rw));
      var ty = Math.min(0, Math.max(bh - rh, bh / 2 - f[1] * rh));
      img.style.transition = smooth ? '' : 'none';
      img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + zoom + ')';
      if (!smooth) void img.offsetWidth;
    }
    // Each moment turns to the part of the scene its line is about, and HOLDS
    // there while the learner answers: 'wide' (everything), a binocular
    // subject ('sharp' / 'person' / 'container'), or 'close' (the container
    // close-up; without one, the lens leans in on the container instead).
    // Raising the binoculars from the wide shot, the lens is placed while it
    // is still hidden, so it arrives already on its subject — the swap reads
    // as raising and lowering them rather than one picture fading into another.
    function look(point, zoom) {
      if (point === 'wide') { scene.dataset.view = 'wide'; return; }
      if (point === 'close') {
        if (art.closeup) { scene.dataset.view = 'close'; return; }
        point = 'container'; zoom = 3.2;
      }
      var z = (art.zoom && art.zoom[point]) || zoom || 2;
      var raising = scene.dataset.view !== 'bino';
      aim(art.focal[point], z, !raising);
      scene.dataset.view = 'bino';
    }
    function sized() { nat = { w: img.naturalWidth || 2000, h: img.naturalHeight || 857 }; layout(); }
    img.addEventListener('load', sized);
    if (img.complete && img.naturalWidth) sized();   // already cached
    window.addEventListener('resize', function () { if (alive && bino.isConnected) layout(); });
    (function drift(t) {
      if (!bino.isConnected) { alive = false; return; }
      jit.style.transform = 'translate(' + (Math.sin(t / 1300) * 2.4 + Math.sin(t / 370) * .8) + 'px,' +
        (Math.cos(t / 1500) * 2 + Math.sin(t / 430) * .6) + 'px)';
      requestAnimationFrame(drift);
    })(0);
    requestAnimationFrame(layout);

    // ---- The thread -----------------------------------------------------
    function wait(ms) { return new Promise(function (r) { setTimeout(r, T(ms)); }); }
    function bubble(cls, html) {
      var el = document.createElement('div');
      el.className = 'sc-msg ' + cls;
      el.innerHTML = html;
      thread.appendChild(el);
      thread.scrollTop = thread.scrollHeight;
      return el;
    }
    function coach(text) {
      var t = bubble('sc-coach is-typing', '<span class="tdots"><span></span><span></span><span></span></span>');
      return wait(Math.min(1400, 450 + text.length * 8)).then(function () {
        if (!alive) return;
        t.classList.remove('is-typing'); t.textContent = text;
        thread.scrollTop = thread.scrollHeight;
      });
    }
    function thinking() { return bubble('sc-coach is-typing', '<span class="tdots"><span></span><span></span><span></span></span>'); }

    // ---- Answering: type or talk (the shared mic component) -------------
    var voice = window.SimVoiceInput && window.SimVoiceInput.attach({
      shell: '#scShell', textarea: '#scInput', sendButton: '#scSend', hint: '#scHint', demo: false });
    var pending = null;
    input.addEventListener('input', function () { send.disabled = input.value.trim().length < 2; });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!send.disabled) send.click(); }
    });
    send.addEventListener('click', function () {
      var v = input.value.trim();
      if (!v || !pending) return;
      if (voice && voice.isListening()) voice.stop();
      var p = pending; pending = null;
      input.value = ''; input.disabled = true; send.disabled = true;
      if (voice) voice.el.disabled = true;
      bubble('sc-you', esc(v));
      p(v);
    });
    function answer() {
      return new Promise(function (resolve) {
        pending = resolve;
        input.disabled = false;
        if (voice) voice.el.disabled = false;
        try { input.focus({ preventScroll: true }); } catch (e) {}
      });
    }
    function beat(n) { beatEl.textContent = n ? n + ' / 4' : ''; }

    // ---- The four moments -------------------------------------------------
    (async function run() {
      // Slide 23 — the setup, on the whole scene; then up to the needle it
      // names, and a moment to find it.
      beat(1);
      await wait(600); if (!alive) return;
      await coach(copy.setup);
      await wait(700); if (!alive) return;
      look('sharp', 2.1);
      await wait(2000); if (!alive) return;
      // Slide 24 — the needle is in your hand when the call comes: the lens
      // swings to the officer as the line lands, and holds for the answer.
      var line1 = coach(copy.beat1);
      setTimeout(function () { if (alive) look('person', 2); }, T(700));
      await line1;
      var a1 = await answer(); if (!alive) return;
      res.answers.decision = a1;
      var th = thinking();
      res.decision = await gradeDecision(a1);
      th.remove();

      // Slide 25 — the container, through the station door.
      beat(2);
      look('container', 1.8);
      await coach(copy.beat2);
      var a2 = await answer(); if (!alive) return;
      res.answers.execution = a2;
      th = thinking();
      res.rubric = await gradeExecution(a2, a1);
      th.remove();

      beat(3);
      if (sceneStruggling(res.decision, res.rubric)) {
        // Slide 26, struggling: corrected inside the scene, not a do-over.
        res.path = 'corrected';
        look('sharp', 1.9);
        await coach(res.rubric.correction);
      } else {
        res.path = 'complication';
        // Slide 26 — you reach it, and it is full.
        look('close');
        await coach(SCENE_BEAT3);
        var a3 = await answer(); if (!alive) return;
        res.answers.recovery = a3;
        th = thinking();
        res.rubric.recovery = await gradeRecovery(a3);
        th.remove();
      }

      // Slide 27 — binoculars down: the whole scene, for the one question
      // that is not about any part of it.
      beat(4);
      await wait(500); look('wide');
      await coach(SCENE_BEAT4);
      res.answers.close = await answer(); if (!alive) return;
      beat(0);
      saveResult('scene', res);
      await wait(700); if (!alive) return;
      showRubric();
    })();

    // ---- The rubric, over the scene -------------------------------------
    var MARK = { 2: ['is-met', 'fa-check', 'Met'], 1: ['is-part', 'fa-minus', 'Partly'], 0: ['is-miss', 'fa-xmark', 'Missed'] };
    var DEC = { now: 2, later: 1, shortcut: 0 };
    // 2026-10-24: the expected action, ticked or not, plus what they did
    // when it fell short — in place of the deck's rubric definition and
    // their quoted words, which read as the grader's checklist.
    // Their own words under the row they evidence, so the result reads as
    // considered — but each phrase once: the grader often cites one
    // sentence for two criteria, and the same quote under a tick and a dash
    // read as a contradiction.
    var quoted = {};
    function row(id, score, quote) {
      var q = quote && !quoted[quote.toLowerCase()] ? quote : '';
      if (q) quoted[q.toLowerCase()] = 1;
      var m = score == null ? ['is-none', 'fa-circle', 'Not shown'] : MARK[score];
      var f = SCENE_FEEDBACK[id];
      return '<div class="sc-row ' + m[0] + '">' +
        '<span class="sc-mark" role="img" aria-label="' + m[2] + '"><i class="fa-solid ' + m[1] + '" aria-hidden="true"></i></span>' +
        '<div class="sc-row-t"><b>' + esc(f.label) + '</b>' +
          (score === 2 ? '' : '<span>' + esc(f[score == null ? 'none' : score]) + '</span>') +
          (q ? '<q>' + esc(q) + '</q>' : '') + '</div></div>';
    }
    function showRubric() {
      var r = res.rubric;
      quoted = {};
      // The decision has no grader quote; their first answer is the evidence.
      document.getElementById('scRows').innerHTML =
        row('decision', DEC[res.decision], (res.answers && res.answers.decision || '').trim()) +
        SCENE_RUBRIC.map(function (c) { return row(c.id, r[c.id].score, r[c.id].quote); }).join('');
      reinforce(ctx, document.getElementById('scResult'), 1, 1);
      ctx.enableNext();
    }
  }

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
      // No CLARA on this screen: a rapid-
      // fire stack of four quick questions has no room for a reaction
      // between one and the next, so it runs as a plain one-click battery
      // instead — select, confirm, next question loads (see batteryInit).
      noCoach: true,
      caption: { title: 'ENTRY · Pre-module battery — deck slides 2–4', note: 'Deck-aligned 2026-09-22: question 1 (K1) and question 2 (K2) are the slides’ own lettered multiple-choice items; a correct answer serves that case’s harder test-up version instead of its base. The two agreement statements (F1, F3) are 1–5 scales, each its own card; neutral or below serves the reinforced version of case 3 / the debrief, and the same statement is asked again afterwards. Earlier note follows. Four items: two gate-flagged Know and two remediate-flagged Feel. NEVER a Do objective — a question cannot credibly measure behavior. The policy chip above each item shows which rule put it here. K1 clean sweep = test-out; K2 (recognition, content-locked) sets its own test-up from its own item — neither derives from the other. D12: K1’s test-out shortcut ships live as built. The compliance question K&A’s script raises — whether 1910.1030(g)(2)(vii)(E)/(F) actually locks this content — is unconfirmed either way, not resolved in K1’s favor; if compliance later rules it locked, this item’s `policy`/`locked` fields are the only thing that needs to change.' },
      content: BATTERY_CONTENT, init: batteryInit,
      onSkip: function () { saveResult('battery', { k1up: false, k2up: false, f1: null, f3: null, skipped: true }); } },

    { id: 'adjust', icon: 'fa-diagram-project', mins: 1, stage: 'Entry', lesson: 'Your Updated Path', mode: 'crown', gate: true, interstitial: true,
      when: adjustMoved,
      caption: { title: 'ENTRY · Knowledge Layer', note: 'Deck-aligned 2026-09-22: four possible rows — each case swapped for its harder version (a correct pre-check answer), and case 3 / the debrief swapped for their longer versions (low agreement). Only rows that actually moved are shown, and the screen drops out entirely when nothing did. Earlier note follows. Two different moves in one screen, which is the point: a beat REMOVED (test-out) and a beat made HARDER (content-locked → test-up). Compression is only one of the things an assessment policy can do. It reported a THIRD — a beat added on a low Feel score — and that row is gone: the beat it named (“The One That Landed”) runs for every learner on every path, so the screen was telling a learner their answer had changed something it had not. Both Feel items now set a baseline and route nothing, which means only the two Know items can move the path and this screen appears only when the procedure was proven. Runs ONLY when something actually fired: a learner whose answers moved nothing never sees it, because a page reporting that nothing happened is a non-event, and it would land as an EXTRA screen on the path that is already longer. Presenter control: Demo → Battery result; flipping to a result that moves nothing advances past this screen, which is itself the demonstration.' },
      coach: { say: '' },
      content: ADJUST_CONTENT, init: adjustInit },

    // ---- The podcast path (see THE PODCAST PATH above) ----------------------
    { id: 'podoffer', icon: 'fa-headphones', stage: 'Entry', lesson: 'Choose a format', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' },
      // Nothing to choose when an admin preview allows one format.
      when: function () { return offered().length > 1; },
      caption: { title: 'ENTRY · The Listen mode offer (2026-09-25)', note: 'After the pre-check, because the pre-check is what builds the listen: its answers pick the chapters, and no runtime is shown for either option, so time never tips the choice. Yes freezes the cut; the module then stays in Listen mode (no switching partway). No keeps the screen-by-screen path in the learner\u2019s Watch or Read preference. How it works sits behind the info toggle. From the audio script (Contain_the_Sharp_<sector>_Podcast.pdf): one continuous listen, every check at the end. Called Listen mode, not podcast, on every learner surface (2026-09-29).' },
      content: PODOFFER_CONTENT, init: podofferInit },
    { id: 'podcast', icon: 'fa-headphones', stage: 'Learn', lesson: 'Contain the Sharp', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' },
      get mins() { return listenMinutes() || 8; },
      when: function () { return podcastPath(); },
      get caption() { return { title: 'LEARN · The listen (Listen mode, studio prototype packages 2026-10-14)', note: 'Assembled from the sector\u2019s audio package (config.sectors \u2192 assets/audio/sharps/listenModeAudio-<sector>/manifest.json) by the rules in data/sharps-listen/config.json, from the pre-check answers as they stood when Listen mode was chosen. Rendered on an OfflineAudioContext (sample-accurate joins, ' + ((LD() && LD().manifest.spliceFadeMs) || 25) + ' ms ramps), played through one audio element. Captions are aligned from the transcripts to the files\u2019 pauses (tools/listen-mode/build.py) — close, not word-perfect. Why each part is here: ' + listenTrace() + '. Demo → Listen combination / Missed checks / Splice test.' }; },
      content: EPISODE_CONTENT, init: episodeInit },
    { id: 'podcheck', icon: 'fa-list-check', stage: 'Check', lesson: 'Questions', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' },
      get mins() { return Math.max(1, Math.round((podcheckItems().length || 5) / 2)); },
      when: function () { return podcastPath(); },
      caption: { title: 'CHECK · The listen\u2019s questions (Listen mode)', note: 'One question per topic that played (config.checks), from the deck screen matching the version that played — k2 harder asks the harder case\u2019s question. One stack in the pre-check\u2019s look. Saved under the same keys as the screen-by-screen path (k1check, k2check, insight, f1post, f3post). Knowledge questions show the deck\u2019s verdict and wait for Next question; agreement and insight items move on by themselves.' },
      content: PODCHECK_CONTENT, init: podcheckInit },
    { id: 'listenreview', icon: 'fa-rotate', stage: 'Check', lesson: 'Review', mode: 'floating', gate: true,
      noCoach: true, coach: { say: '' }, mins: 2, adaptive: true, variant: 'Review set',
      when: function () { return extraOn() && podcastPath() && listenMissed().length > 0; },
      get caption() { return { title: 'CHECK · Review set (Listen mode)', note: 'Only for missed KNOWLEDGE questions (config.checks role "knowledge"; belief misses get no review yet — LISTEN_FEEL_HOOK). Per topic: fact cards from data/sharps-listen/review/<topic>.json (placeholder: the deck\u2019s own remedial narration, verbatim), an optional recap (the manifest\u2019s quickTakes, plays only when pressed), then one retry of the same question (config.review.retries), saved under the topic\u2019s retryKey. Here because: ' + (LD() ? listenMissed().map(function (it) { return it.topic + ' question missed'; }).join(', ') : '\u2026') + '.' }; },
      content: REVIEW_CONTENT, init: reviewInit },
    { id: 'listendone', icon: 'fa-flag-checkered', stage: 'Check', lesson: 'Listen mode complete', mode: 'floating',
      noCoach: true, coach: { say: '' }, mins: 0, nextLabel: 'Start the scenario',
      when: function () { return podcastPath() && !sceneSimulatorOn(); },
      caption: { title: 'CHECK · Completion (Listen mode)', note: 'The audio never hands off to the simulation, so this screen does. With Demo → Full scenario simulator on, the existing hand-off screen does this job instead, so this one steps aside.' },
      content: LISTENDONE_CONTENT, init: listendoneInit },

    // ---- Deck slides 5–22 ----------------------------------------------------
    // Each case serves ONE of its versions: base, or the harder test-up version
    // when its pre-check question was answered correctly. A miss on either
    // version's question serves that case's remedial video next.
    deckStep('c1base', { when: function () { return !k1TestUp(); },
      caption: { title: 'LEARN · Case 1, base (K1) — deck slides 5–6', note: 'Served unless pre-check question 1 was answered correctly. The slide 5 narration as a video or an article, whichever the learner chose on the format screen; when it finishes, the slide 6 mastery check rises over it on the reinforcement layer. A miss serves the remedial video (slide 7) next.' } }),
    deckStep('c1up', { adaptive: true, variant: 'Mastery version', when: function () { return k1TestUp(); },
      caption: { title: 'LEARN · Case 1, test-up (K1) — deck slides 8–9', note: 'Served INSTEAD of the base case when pre-check question 1 was answered correctly. The harder version of the same procedure, then the slide 9 mastery check over it. A miss serves the remedial video (slide 7), same as the base case.' } }),
    deckStep('c1rem', { adaptive: true, variant: 'Remedial version',
      when: function () { return extraOn() && checkMissed('k1check') && !podcastPath(); },
      caption: { title: 'LEARN · Case 1, remedial (K1) — deck slide 7', note: 'Only after a missed case 1 mastery check (either version). Re-teaches the never-recap, straight-to-container rule. Then re-asks the question that was missed (slide 6 or 9, whichever version ran); a second miss just moves the learner on.' } }),

    deckStep('c2base', { when: function () { return !k2TestUp(); },
      caption: { title: 'LEARN · Case 2, base (K2) — deck slides 10–11', note: 'Served unless pre-check question 2 was answered correctly. K2 is compliance-locked: it can test up, never out. Slide 11 mastery check on the reinforcement layer once the carrier finishes; a miss serves slide 12.' } }),
    deckStep('c2up', { adaptive: true, variant: 'Mastery version', when: function () { return k2TestUp(); },
      caption: { title: 'LEARN · Case 2, test-up (K2) — deck slides 13–14', note: 'Served INSTEAD of the base case when pre-check question 2 was answered correctly. Slide 14 mastery check over it; a miss serves the remedial video (slide 12).' } }),
    deckStep('c2rem', { adaptive: true, variant: 'Remedial version',
      when: function () { return extraOn() && checkMissed('k2check') && !podcastPath(); },
      caption: { title: 'LEARN · Case 2, remedial (K2) — deck slide 12', note: 'Only after a missed case 2 mastery check (either version). Re-teaches both recognition calls. Then re-asks the question that was missed (slide 11 or 14); a second miss just moves the learner on.' } }),

    deckStep('controls', {
      caption: { title: 'LEARN · Engineering controls (F2) — deck slides 15–16', note: 'Every learner. F2 carries no question in this module (asked once for the course, in Module 2). The slide 16 climate-and-culture question rises over the video once it finishes: every learner is asked, it is never graded and never routes, and nothing on screen says so — it looks like any other question. Reported at the cohort level.' } }),

    // Case 3 and the debrief each serve one of two versions off the matching
    // pre-check agreement statement, then ask that same statement again over
    // whichever version ran — the pre/post pair is the measure.
    deckStep('case3', { when: function () { return !feelLow('f1'); },
      caption: { title: 'LEARN · Case 3, base (F1) — deck slides 17 + 19', note: 'Served when the pre-check F1 statement was answered 4–5 (agree). The F1 statement is asked again over it (slide 19); the record reports the move.' } }),
    deckStep('case3rf', { adaptive: true, variant: 'Reinforced version', when: function () { return feelLow('f1'); },
      caption: { title: 'LEARN · Case 3, reinforced (F1) — deck slides 18 + 19', note: 'Served INSTEAD of the base story when the pre-check F1 statement was answered 1–3 (neutral or below — the deck calls agree the healthy answer). The longer story follows the cost past the needlestick. Same F1 re-ask over it (slide 19).' } }),
    deckStep('debrief', { when: function () { return !feelLow('f3'); },
      caption: { title: 'LEARN · Debrief, base (F3) — deck slides 20 + 22', note: 'Served when the pre-check F3 statement was answered 4–5. Cites Gershon et al. (2000), 92.7%. The F3 statement is asked again over it (slide 22).' } }),
    deckStep('debriefrf', { adaptive: true, variant: 'Reinforced version', when: function () { return feelLow('f3'); },
      caption: { title: 'LEARN · Debrief, reinforced (F3) — deck slides 21 + 22', note: 'Served INSTEAD of the base debrief when the pre-check F3 statement was answered 1–3. The norm correction given more room. Same F3 re-ask over it (slide 22).' } }),

    { id: 'scene', icon: 'fa-binoculars', mins: 5, stage: 'Perform', lesson: 'A sharp decision', mode: 'floating', gate: true,
      when: function () { return !sceneSimulatorOn(); },
      caption: { title: 'PERFORM · The simulation, in the module — deck slides 23–27', note: 'Runs for every learner. Four moments on one first-person still (the "A Critical Choice" riff\u2019s binocular view), the coach setting each in the deck\u2019s own words and the learner answering typed or spoken. Beat 1 (D1) scores WHETHER they act — now / later / set it down — and is kept separate from the rubric on purpose, per the rubric slide. Beat 2 (D2) is rated by the live model on the four rubric criteria (Timing, Technique, Route, Recovery), quoting the learner\u2019s own words as evidence. Beat 3 adapts: doing well → the full-container complication (the Recovery test); struggling (set it down, or any of the first three missed) → a model-written correction inside the scene, not a do-over. Beat 4 is sentiment only — saved, never scored, never routes. Ends on the rubric over the scene. Demo → "Full scenario simulator" swaps this for the previous hand-off to the conversation simulator. Public Sector runs on a PLACEHOLDER still until the produced image lands.' },
      content: SCENE_CONTENT, init: sceneInit },

    { id: 'handoff', icon: 'fa-comments', mins: 5, stage: 'Perform', lesson: 'The Unclaimed Hazard', mode: 'floating',
      when: function () { return sceneSimulatorOn(); },
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
      when: function () { return sceneSimulatorOn(); },
      // D10: a function, not a fixed string — checked fresh on every visit so
      // the Demo menu's "Do-object baseline" toggle (set on the handoff
      // screen above) takes effect without a reload. Live is the only path a
      // learner ever takes; a falsy return here falls through to this step's
      // own content/init below (see the engine's showStep). §6.3: the
      // scenario key is sector-derived (scenarioKey()), not fixed to
      // Manufacturing's own — each sector runs its own scenario now.
      external: function () {
        return doBaselineOn() ? null
          : '../../scenario-simulator/composed-scenarios/index.html'
            + '?type=mix-arc&scenario=' + scenarioKey() + '&handoff=1&brand=clara'
            // This screen's handoff page IS the title card now, so the player
            // drops its own and opens on the coach (notitle); every beat here
            // is coach-led, so its Learn | Practice toggle has nothing to
            // switch to (practice=0); and the hero still, when this sector
            // has one, carries over as the player's backdrop (hero).
            + '&notitle=1&practice=0'
            + (handoffHero() ? '&hero=' + encodeURIComponent(handoffHero().src) : '')
            // …and the blue header band keeps this module's own text (read off
            // the frame as it stands, so it always matches what was on screen)
            + frameText('course') + frameText('lesson')
            + '&back=' + encodeURIComponent('../../lesson-presentation/clara/sharps.html?step=record');
      },
      gate: true,
      content: DOBASELINE_CONTENT, init: doBaselineInit,
      caption: { title: 'PERFORM · The culminating activity, four beats (D1/D2)', note: 'Alignment brief D6: rebuilt from a version keyed end-of-shift-sharps that re-staged chain’s own Chris/Jacob incident as the final exam — a redundancy, since the learner had already resolved that exact dilemma once. This version matches K&A’s script: an unclaimed blade, no character to negotiate with. Four coach-led beats, not roleplay — nobody is in the scene to react, only a decision (D1), a step-by-step description (D2), a complication testing Recovery (D2), and a closing sentiment question that is explicitly not a KFD objective and carries no Record row. Runs on its OWN page, so its rubric evidence lives in its debrief rather than on the record screen below; this beat is where both Do objectives are evidenced now. §6.3: Public Sector runs its own sector-authored scenario (scenarioKey()), not Manufacturing’s. D10: the Demo menu’s "Do-object baseline" toggle swaps this for an in-page video plus one stand-in question — the PRD’s literal Do-object ask, reviewer-only and never on a learner’s path.' },
      coach: { say: '' } },
    { id: 'record', icon: 'fa-chart-simple', mins: 1, stage: 'Record', lesson: 'Your Results', mode: 'floating', noCoach: true,
      caption: { title: 'RECORD · Results (strengths, needs work, change since the pre-check)', note: 'Rebuilt 2026-10-23: no CLARA on this screen, content centered. Each measured topic (K1, K2, F1, F3, D1, D2) lands in Strengths or Needs work with how it was assessed; knowledge = correct (incl. on retry), agreement = 4–5 of 5, scenario = decision \u201cnow\u201d / all four rubric parts met. F2 is taught but never asked here, so it is not graded; D3 shows as \u201cYour plan\u201d, not a result. \u201cSince the pre-check\u201d compares the same four pre-check items against their later asks. Earlier note follows. Eight objectives, each with the policy that governed it and where its evidence came from. Seven closed, one deliberately open — objective-level performance data from day one, which is what turns provenance into evidence without re-authoring anything. The learner’s view of this screen carries none of that vocabulary: Know / Feel / Do survives as three plain headings and the row icon, and the sub-level, theoretical construct and assessment policy live here and in the Learning Layer view.' },
      coach: { say: '' },
      content: RECORD_CONTENT, init: recordInit }
  ];

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
    if (media && DK_OFFERED.indexOf(media) > -1) {
      try { sessionStorage.setItem('sh-modality', media); } catch (e) {}
    }
    var name = p.get('name');
    if (name) { try { sessionStorage.setItem('sh-name', name.trim().slice(0, 40)); } catch (e) {} }
    // ?sim=1 / ?sim=0 — the Demo menu's "Full scenario simulator" switch as a
    // link, since that row only shows on the Perform screen itself. With
    // ?step=handoff it lands a reviewer straight on the hero bridge screen.
    // Admin preview (js/admin-preview.js): one allowed Watch/Read format is
    // the carrier from the start, since the format screen is skipped. Just
    // Contain the Sharp assigned: skip the cover and open the module itself.
    if (AP) {
      var one = AP.only();
      if (one && one !== 'listen') { try { sessionStorage.setItem('sh-modality', one); } catch (e) {} }
      if (AP.modules.length === 1 && AP.modules[0] === 'm4' && !p.get('step')) {
        var at = STEPS.findIndex(function (st) { return st.id === 'intro'; });
        if (at > -1 && STEPS[at + 1]) {
          try {
            var u = new URL(location.href);
            u.searchParams.set('step', STEPS[at + 1].id);
            history.replaceState(null, '', u.pathname + u.search + u.hash);
          } catch (e) {}
        }
      }
    }
    var sim = p.get('sim');
    if (sim === '1' || sim === '0') {
      try { sessionStorage.setItem('sh-scene-mode', sim === '1' ? 'simulator' : 'scene'); } catch (e) {}
    }
  })();

  // ==========================================================================
  //  Hand it to the engine.
  // ==========================================================================
  // On the adjustment screen a forced result can leave nothing to report,
  // which removes the screen itself — advancing IS the demonstration then.
  function adjustReplay(api) {
    if (api.step && api.step.id === 'adjust') {
      if (!adjustMoved()) { api.go(1); return; }
      api.replay();
      return;
    }
    api.refresh();
  }
  LE.register({
    course: COURSE,
    steps: STEPS,
    storageKey: 'sh-course',
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
    // User testing (2026-10-24): no "Course overview" label on the cover, and
    // the footer "?" (reviewer captions) only while Review mode is on — both
    // confused testers as something a learner was meant to use.
    coverLabel: '',
    reviewCaptions: true,
    lenses: LENSES,
    lensOrder: LENS_ORDER,
    // Every beat with a scene in it moves with the sector.
    // Every screen with a scene in it moves with the sector. The chain walks
    // its own incident per sector; the rating screen borrows that chain's clock.
    // The deck screens move with the sector: Public Sector has its own deck
    // (DECK_LENS).
    lensedSteps: { intro: 1, scene: 1, c1base: 1, c1up: 1, c1rem: 1, c2base: 1, c2up: 1, c2rem: 1,
                   controls: 1, case3: 1, case3rf: 1, debrief: 1, debriefrf: 1 },
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
      id: 'shBatteryBtn', icon: 'fa-shuffle', name: 'Knowledge questions correct',
      note: 'Force both pre-check knowledge questions right (harder cases) or wrong (standard cases), and replay the routing',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      type: 'toggle', on: function () { return k1TestUp(); },
      onClick: function (api) {
        var up = !k1TestUp();
        try { sessionStorage.setItem('sh-battery', up ? 'proven' : 'unproven'); } catch (e) {}
        var b = readCourse().battery || {};
        saveResult('battery', { k1up: up, k2up: up, f1: b.f1 == null ? null : b.f1, f3: b.f3 == null ? null : b.f3 });
        adjustReplay(api);
      }
    }, {
      // 2026-09-24 live review: the old list of adaptations is gone. Two
      // treatments for the moment the path updates, side by side for
      // comparison — see ADJUST_CONTENT. Celebrate only shows on a proven
      // knowledge answer; otherwise it falls back to calibrate.
      id: 'shPathStyleBtn', icon: 'fa-wand-magic-sparkles', name: 'Path update style',
      note: 'Simple progress bar, or a playful reward. The reward only shows when a knowledge question was answered correctly',
      visibleOn: function (step) { return step.id === 'adjust'; },
      type: 'select', value: pathUpdateStyle,
      options: [
        { value: 'calibrate', label: 'Calibrating (simple)' },
        { value: 'celebrate', label: 'Nice work (playful)' }
      ],
      onChange: function (v, api) {
        try { sessionStorage.setItem('sh-path-style', v); } catch (e) {}
        api.replay();
      }
    }, {
      id: 'shFeelBtn', icon: 'fa-heart', name: 'Low agreement',
      note: 'Force both pre-check agreement statements low (the longer case 3 and debrief) or high (the standard ones)',
      visibleOn: function (step) { return step.id === 'adjust' || step.id === 'battery'; },
      type: 'toggle', on: function () { return feelLow('f1'); },
      onClick: function (api) {
        var low = !feelLow('f1');
        try { sessionStorage.setItem('sh-feel', low ? 'low' : 'high'); } catch (e) {}
        var b = readCourse().battery || {};
        saveResult('battery', { k1up: !!b.k1up, k2up: !!b.k2up, f1: low ? 2 : 5, f3: low ? 2 : 5 });
        adjustReplay(api);
      }
    }, {
      // The previous Perform step — a hand-off to the full conversation
      // simulator — kept one switch away for comparison.
      id: 'shSceneModeBtn', icon: 'fa-comments', name: 'Full scenario simulator',
      note: 'Swap the in-module scene for the previous hand-off to the conversation simulator',
      visibleOn: function (step) { return step.id === 'scene' || step.id === 'handoff'; },
      type: 'toggle', on: sceneSimulatorOn,
      onClick: function (api) {
        var on = !sceneSimulatorOn();
        try { sessionStorage.setItem('sh-scene-mode', on ? 'simulator' : 'scene'); } catch (e) {}
        LE.goTo(on ? 'handoff' : 'scene');
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
      // Read by the path-ready line ("You're all set, Chris").
      id: 'shNameBtn', icon: 'fa-signature', name: 'Learner name',
      note: 'Stand-in for the SSO name — shown on the path-ready screen. Clear it for the unnamed version',
      visibleOn: function (step) { return step.id === 'intro' || step.id === 'adjust'; },
      state: function () { return savedName() || 'Not set'; },
      onClick: function (api) {
        var next = window.prompt('Learner name (optional):', savedName());
        if (next === null) return;
        try { sessionStorage.setItem('sh-name', next.trim().slice(0, 40)); } catch (e) {}
        api.replay();
      }
    }, {
      // Listen mode reviewer tools (see Reviewer tools, LISTEN MODE).
      id: 'shListenComboBtn', icon: 'fa-shuffle', name: 'Listen combination',
      note: 'The listens the pre-check can build (K1 tested out or not). Restarts the listen from the top',
      visibleOn: function (step) { return ['podcast', 'podcheck', 'listenreview', 'listendone'].indexOf(step.id) > -1; },
      type: 'select', value: function () { return LD() ? listenComboNow() : 'n'; },
      options: LISTEN_COMBOS.map(function (c) { return { value: c.value, label: c.label }; }),
      onChange: function (v) { setListenCombo(v); }
    }, {
      id: 'shListenMissBtn', icon: 'fa-circle-xmark', name: 'Missed checks',
      note: 'Answer the listen\u2019s questions for you, missing 0 or 1 knowledge questions, then go to the review set (or past it)',
      visibleOn: function (step) { return ['podcast', 'podcheck', 'listenreview', 'listendone'].indexOf(step.id) > -1; },
      type: 'select', value: function () { return 'pick'; },
      options: [ { value: 'pick', label: 'Choose\u2026' }, { value: 'none', label: 'None missed' },
                 { value: 'k1', label: 'k1 missed' } ],
      onChange: function (v) { if (v !== 'pick') setListenMisses(v); }
    }, {
      id: 'shSpliceBtn', icon: 'fa-scissors', name: 'Splice test',
      note: 'Hear about 8 s either side of an add-on join, nudge seamAt, and copy the value back into the manifest (only for a package that has add-ons)',
      visibleOn: function (step) {
        var d = LD();
        return step.id === 'podcast' && !!d && Object.keys(d.manifest.topics).some(function (t) { return d.manifest.topics[t].addon; });
      },
      onClick: function (api) { spliceTest(api); }
    }, {
      // The learner's saved mode preference (see THE OFFER) — a profile
      // setting, so it survives Start over. Clear it to see the first-time
      // version of the offer.
      id: 'shModePrefBtn', icon: 'fa-headphones', name: 'Mode preference',
      note: 'The learner’s saved Listen / Classic mode preference, which the offer screen reflects',
      visibleOn: function (step) { return step.id === 'podoffer'; },
      type: 'select', value: function () { return modePref() || 'none'; },
      options: [
        { value: 'none', label: 'None saved' },
        { value: 'listen', label: 'Listen mode' },
        { value: 'standard', label: 'Classic mode' }
      ],
      onChange: function (v, api) {
        setModePref(v === 'none' ? null : v);
        saveResult('podpath', null);
        api.replay();
      }
    }, {
      // Which render of the Watch video plays — see DECK_VIDEOS.
      id: 'shVideoStyleBtn', icon: 'fa-film', name: 'Video style',
      note: 'The generated videos come in two art styles',
      visibleOn: function (step) { return !!DECK_VIDEOS.manufacturing[step.id]; },
      type: 'select', value: videoStyle,
      options: [
        { value: 'photo', label: 'Photoreal' },
        { value: '2d', label: '2D' }
      ],
      onChange: function (v, api) {
        try { sessionStorage.setItem('sh-video-style', v); sessionStorage.setItem('sh-modality', 'video'); } catch (e) {}
        api.replay();
      }
    }, {
      // Read as an article (default) or as Jessica's podcast transcript —
      // the same chapters either way; see ARTICLE / PODCAST.
      id: 'shReadStyleBtn', icon: 'fa-book-open', name: 'Read view',
      note: 'Plain article, or the audio script as a transcript with speaker names',
      // Only on a Reading run — there is no per-screen switch to land in the
      // reader any more (2026-10-27).
      visibleOn: function (step) { return !!DECK[step.id] && deckCarrier() === 'article'; },
      type: 'select', value: readStyle,
      options: [
        { value: 'article', label: 'Article' },
        { value: 'podcast', label: 'Audio script' }
      ],
      onChange: function (v, api) {
        try { sessionStorage.setItem('sh-read-style', v); } catch (e) {}
        api.replay();
      }
    }, {
      // 2026-09-24 live review (Rob): show the standard experience without
      // Ask CLARA, then switch it on to ask whether it adds value. Off by
      // default. A pure CSS swap like Design style (html.sh-ask-off, set
      // before paint in clara/sharps.html's <head>), so nothing re-renders.
      id: 'shAskBtn', icon: 'fa-comment-dots', name: 'Ask CLARA',
      note: 'Show the bottom-right Ask CLARA launcher. Off by default, so the standard module runs without it',
      type: 'toggle', on: function () { return !document.documentElement.classList.contains('sh-ask-off'); },
      onClick: function () {
        var on = !document.documentElement.classList.toggle('sh-ask-off');
        try { sessionStorage.setItem('sh-ask', on ? 'on' : 'off'); } catch (e) {}
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
