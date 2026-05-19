// One-shot authoring script: injects a "kind: articulate" scenario into
// scenarios.json for each listed course, and adds a matching scenario-
// type lesson into courses.json. Idempotent — re-running replaces the
// articulate scenario/lesson it owns rather than duplicating.
//
// Run: node scripts/add-articulate.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const scenariosPath = path.join(root, 'data/scenarios.json');
const coursesPath   = path.join(root, 'data/courses.json');

// Per-course articulate authoring. Each entry seeds the three audience
// steps (expert / beginner / outsider) for the same concept. Key fields:
//   concept    — what the learner is explaining (used in framing copy)
//   conceptRef — concept id from the course (drives mastery wiring)
//   keyPoints  — anchor ideas a good explanation should hit (rubric)
//   jargon     — in-the-know terms the model considers "expert language"
const COURSES = [
  {
    courseId: 'hazmat-awareness', industry: 'public-safety',
    scenarioTitle: 'Explain it back · Isolation discipline',
    moduleLabel: 'Module 2 · Hazmat field response',
    kicker: 'Public Safety · Articulate',
    icon: 'shield',
    concept: 'the 50m isolation rule and why it scales with fire involvement',
    conceptRef: 'c2',
    keyPoints: [
      'Why a 50m default exists at all',
      'How wind direction changes the safe stand-off',
      'Why fire involvement expands the radius',
      'The protect-yourself-first frame'
    ],
    jargon: ['UN 1203','placard','isolation','stand-off','hazmat','BLEVE','vapor','downwind','upwind','tier 2']
  },
  {
    courseId: 'critical-thinking-101', industry: 'education',
    scenarioTitle: 'Explain it back · Claim, evidence, warrant',
    moduleLabel: 'Module 2 · Argument structure',
    kicker: 'Education · Articulate',
    icon: 'brain',
    concept: 'the claim–evidence–warrant structure of an argument',
    conceptRef: 'ct1',
    keyPoints: [
      'What a claim is on its own',
      'What counts as evidence vs. an assertion',
      'Why the warrant connects evidence to claim',
      'What changes if the warrant is unstated'
    ],
    jargon: ['warrant','premise','syllogism','enthymeme','rhetoric','fallacy','inference','assertion']
  },
  {
    courseId: 'loto-refresher', industry: 'commercial',
    scenarioTitle: 'Explain it back · The six-step LOTO sequence',
    moduleLabel: 'Module 2 · LOTO in practice',
    kicker: 'Commercial · Articulate',
    icon: 'wrench',
    concept: 'the six-step lockout/tagout sequence and why dissipation matters',
    conceptRef: 'lt1',
    keyPoints: [
      'The six steps in order',
      'Why notification comes before shutdown',
      'What "dissipate stored energy" prevents',
      'Why verification is its own step, not a check on isolation'
    ],
    jargon: ['LOTO','energy isolation','dissipate','stored energy','hasp','tag-out','authorized employee','zero-energy state','1910.147']
  },
  {
    courseId: 'sepsis-bundle', industry: 'healthcare',
    scenarioTitle: 'Explain it back · The one-hour sepsis bundle',
    moduleLabel: 'Module 2 · Bundle execution',
    kicker: 'Healthcare · Articulate',
    icon: 'heart',
    concept: 'the one-hour sepsis bundle and what each element is doing',
    conceptRef: 'c2',
    keyPoints: [
      'Why the bundle is time-boxed to one hour',
      'What lactate is telling you',
      'Why blood cultures go before antibiotics',
      'What broad-spectrum antibiotics buy you',
      'When fluids vs. vasopressors'
    ],
    jargon: ['lactate','qSOFA','MAP','vasopressor','norepinephrine','crystalloid','30 mL/kg','broad-spectrum','source control','SSC']
  },
  {
    courseId: 'ems-p1', industry: 'public-safety',
    scenarioTitle: 'Explain it back · Scene size-up',
    moduleLabel: 'Module 2 · Approach discipline',
    kicker: 'Public Safety · Articulate',
    icon: 'shield',
    concept: 'why scene size-up always comes before patient contact',
    conceptRef: 'ems-r1',
    keyPoints: [
      'What a size-up actually looks at',
      'Why responder safety is named first',
      'How size-up shapes resource requests',
      'What changes when the scene is unsafe'
    ],
    jargon: ['NOI','MOI','BSI','PPE','staging','sitrep','dispatch','triage','scene safety']
  },
  {
    courseId: 'alcoholedu-hied', industry: 'education',
    scenarioTitle: 'Explain it back · BAC vs. impairment',
    moduleLabel: 'Module 2 · Decisions under the influence',
    kicker: 'Education · Articulate',
    icon: 'brain',
    concept: 'the difference between blood alcohol content and actual impairment',
    conceptRef: 'alcohol-r1',
    keyPoints: [
      'What BAC actually measures',
      'Why tolerance does not reduce impairment',
      'The role of pace and food on absorption',
      'Why "I feel fine" is not a reliable signal'
    ],
    jargon: ['BAC','absorption','metabolism','tolerance','standard drink','impairment threshold','BrAC']
  },
  {
    courseId: 'hied-p1', industry: 'education',
    scenarioTitle: 'Explain it back · Source credibility',
    moduleLabel: 'Module 2 · Evaluating sources',
    kicker: 'Education · Articulate',
    icon: 'note',
    concept: 'how you decide whether a source is credible enough to cite',
    conceptRef: 'hied-r1',
    keyPoints: [
      'The signals you look at before trusting a source',
      'Why peer review is not a magic stamp',
      'How recency factors in for different topics',
      'Why one good source rarely settles a question'
    ],
    jargon: ['peer review','primary source','secondary source','citation','provenance','retraction','impact factor','preprint']
  },
  {
    courseId: 'ind-p1', industry: 'commercial',
    scenarioTitle: 'Explain it back · Hazard recognition',
    moduleLabel: 'Module 2 · Spotting the hazard',
    kicker: 'Commercial · Articulate',
    icon: 'wrench',
    concept: 'how you decide a hazard is worth flagging, fixing, or escalating',
    conceptRef: 'ind-r1',
    keyPoints: [
      'What separates a hazard from a risk',
      'When you fix it yourself vs. flag it',
      'When something becomes an escalation',
      'Why "we always do it this way" is a warning sign'
    ],
    jargon: ['hazard','risk','near-miss','JSA','PPE','LOTO','line-of-fire','stop-work authority']
  },
  {
    courseId: 'k12s-p1', industry: 'education',
    scenarioTitle: 'Explain it back · Online class etiquette',
    moduleLabel: 'Module 2 · Communicating well online',
    kicker: 'Education · Articulate',
    icon: 'chat',
    concept: 'what makes a class message land well vs. cause a problem',
    conceptRef: 'k12rd1',
    keyPoints: [
      'How tone reads differently in text',
      'Why a screenshot lives forever',
      'When to use a DM vs. a class channel',
      'What to do before you hit send when you are frustrated'
    ],
    jargon: ['DM','thread','permalink','screenshot','timestamp','channel','AUP']
  },
  {
    courseId: 'k12e-p1', industry: 'education',
    scenarioTitle: 'Explain it back · Mandated reporting',
    moduleLabel: 'Module 2 · Reporting path',
    kicker: 'Education · Articulate',
    icon: 'shield',
    concept: 'what triggers a mandated report and what the path looks like',
    conceptRef: 'k12ed1',
    keyPoints: [
      'The threshold for "reasonable suspicion"',
      'Why you do not investigate before reporting',
      'Who the report goes to first',
      'What the reporter is and is not responsible for next'
    ],
    jargon: ['CPS','DCF','mandated reporter','reasonable suspicion','disclosure','statute','immunity','referral']
  }
];

function buildScenario(spec) {
  const id = `sc-art-${spec.courseId}`;
  return {
    id,
    courseId: spec.courseId,
    industry: spec.industry,
    title: spec.scenarioTitle,
    kicker: spec.kicker,
    moduleLabel: spec.moduleLabel,
    outcomeType: 'Articulation — explain the concept to three audiences',
    estMinutes: 5,
    concepts: spec.conceptRef ? [spec.conceptRef] : [],
    tier: 'core',
    difficulty: 'standard',
    topics: ['articulation','communication'],
    icon: spec.icon || 'chat',
    status: 'active',
    kind: 'articulate',
    welcome: {
      kicker: 'Explain it back',
      title: 'Three audiences, one concept',
      body: `You'll explain ${spec.concept} to three different listeners: an expert peer, a brand-new trainee, and a smart friend outside the field. The mic is yours. Coach Vic listens for whether you pitched it right.`,
      highlight: 'Three audiences',
      reassurance: 'No grade. Just a read on how well the idea actually transfers when you have to say it out loud.',
      expectedOutcome: 'Hit the right register for each listener.'
    },
    context: `You just covered ${spec.concept}. Now teach it back — three times, three audiences.`,
    steps: ['expert','beginner','outsider'].map((aud, i) => ({
      id: `art-${aud}`,
      tension: 'low',
      kicker: `Step ${i+1} of 3 · ${aud[0].toUpperCase()+aud.slice(1)}`,
      title: aud === 'expert' ? 'Explain it to a peer'
        : aud === 'beginner' ? 'Explain it to a new trainee'
        : 'Explain it to someone outside your field',
      prompt: `In your own words, explain ${spec.concept} to a${aud === 'outsider' ? ' friend who works in a totally different field' : aud === 'beginner' ? ' brand-new trainee on day one' : ' seasoned peer'}.`,
      coachHint: aud === 'expert'
        ? 'Skip the basics. Use the precise terms. Get to the nuance.'
        : aud === 'beginner'
          ? 'Plain language. Anchor every term you use. Make it land.'
          : 'No acronyms. Tell them why this matters to anyone.',
      indicator: 'Communication Style',
      input: 'articulate',
      audience: aud,
      concept: spec.concept,
      keyPoints: spec.keyPoints,
      jargon: spec.jargon
    }))
  };
}

function buildLesson(spec) {
  return {
    id: `ch-art-${spec.courseId}`,
    type: 'scenario',
    scenarioId: `sc-art-${spec.courseId}`,
    kicker: 'Practice · Articulate',
    title: spec.scenarioTitle,
    minutes: 5,
    blocks: []
  };
}

// --- scenarios.json ---
const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
const newScenarios = COURSES.map(buildScenario);
const keepIds = new Set(newScenarios.map((s) => s.id));
scenarios.scenarios = scenarios.scenarios
  .filter((s) => !keepIds.has(s.id))
  .concat(newScenarios);
fs.writeFileSync(scenariosPath, JSON.stringify(scenarios, null, 2) + '\n');

// --- courses.json ---
const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
for (const spec of COURSES) {
  const course = courses.courses.find((c) => c.id === spec.courseId);
  if (!course) { console.warn(`! missing course ${spec.courseId}`); continue; }
  const lessonId = `ch-art-${spec.courseId}`;
  course.lessons = (course.lessons || []).filter((l) => l.id !== lessonId);
  course.lessons.push(buildLesson(spec));
}
fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2) + '\n');

console.log(`✓ wrote ${newScenarios.length} articulate scenarios + ${COURSES.length} course lessons`);
