// store.js — single source of truth for the prototype.
// Loads JSON profiles, applies industry theming, and persists progress
// to localStorage so a refresh doesn't reset the demo.
// Intent: leadership should see the *same* learner state across reloads
// without needing a backend.

const LS_KEY = 'aithera.state.v1';

// Registry of shareable profile slugs. Slugs are stable, URL-safe handles
// for the (learner, industry) JSON pairs the launch screen offers — they
// let us encode "which profile is loaded" in the URL itself, so a shared
// link can boot the app into the right context without localStorage.
const PROFILES = {
  ems:            { learner: 'ems',           industry: 'public-safety' },
  'hied-student': { learner: 'hied-student',  industry: 'education'     },
  industrial:     { learner: 'industrial',    industry: 'commercial'    },
  'k12-student':  { learner: 'k12-student',   industry: 'education'     },
  'k12-employee': { learner: 'k12-employee',  industry: 'education'     }
};
const DEFAULT_PROFILE = 'ems';

export const profiles = {
  has: (slug) => Object.prototype.hasOwnProperty.call(PROFILES, slug),
  get: (slug) => PROFILES[slug],
  default: DEFAULT_PROFILE
};

const state = {
  ready: false,
  learner: null,        // learnerProfile.json
  industry: null,       // industryProfile.json
  courses: [],          // courseData.json
  scenarios: [],        // scenarioBank.json
  mastery: null,        // masteryState.json (per learner)
  profileSlug: null,    // currently-loaded profile slug (URL-shareable)
  // Chat sessions with Coach Vic. Shared between the FAB popover and
  // the full Coach Vic page so a conversation started in the overlay
  // continues seamlessly when promoted to the full page.
  // Each session: { id, startedAt, updatedAt, messages: [{ role, text, time, reply? }] }
  chats: { sessions: [], activeId: null },
  // ephemeral session data (e.g. last practice result)
  session: { lastSummary: null },
  // Prototype maturity phase (1–4). Resets to 1 each fresh session
  // unless seeded via profile prototype controls.
  phase: 1,
  // One-shot policy event payload that fires when phase 4 is entered.
  // { applied, shown, modal: { headline, body }, conceptId }
  policyEvent: null
};

const subs = new Set();

export const store = {
  get state() { return state; },

  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  emit() { for (const fn of subs) fn(state); },

  // Bootstraps the app. If a learner was previously selected, re-hydrate
  // from localStorage; otherwise the launch view drives selection.
  async init() {
    const saved = readLS();
    if (saved?.chats?.sessions) {
      state.chats = {
        sessions: saved.chats.sessions,
        activeId: saved.chats.activeId ?? null
      };
    }
    if (typeof saved?.phase === 'number') state.phase = saved.phase;
    if (saved?.policyEvent) state.policyEvent = saved.policyEvent;
    if (saved?.profileSlug && profiles.has(saved.profileSlug)) {
      try { await this.loadProfile(saved.profileSlug); }
      catch { /* fall through to launch */ }
    } else if (saved?.learnerId) {
      // Back-compat with pre-slug LS payloads.
      try { await this.loadLearner(saved.learnerId, saved.industryId); }
      catch { /* fall through to launch */ }
    }
    state.ready = true;
    this.emit();
  },

  async loadProfile(slug) {
    const p = PROFILES[slug];
    if (!p) throw new Error(`Unknown profile: ${slug}`);
    state.profileSlug = slug;
    await this.loadLearner(p.learner, p.industry);
  },

  async loadLearner(learnerFile, industryFile) {
    // learnerFile / industryFile are the slug names of the JSON files.
    const [learner, industry, courses, scenarios, mastery] = await Promise.all([
      fetchJSON(`data/learners/${learnerFile}.json`),
      fetchJSON(`data/industries/${industryFile}.json`),
      fetchJSON('data/courses.json'),
      fetchJSON('data/scenarios.json'),
      fetchJSON('data/mastery.json')
    ]);
    state.learner = learner;
    state.industry = industry;
    state.courses = courses.courses;
    state.scenarios = scenarios.scenarios;
    state.mastery = mastery.byLearner[learner.learnerId] ?? blankMastery();
    // Snapshot of the original concept seeds so phase-jump seeding can
    // reset to a deterministic baseline instead of accumulating bumps.
    state._initialConcepts = JSON.parse(JSON.stringify(state.mastery.concepts));
    applyTheme(industry);
    writeLS({
      profileSlug: state.profileSlug,
      learnerId: learnerFile,
      industryId: industryFile,
      mastery: state.mastery
    });
    this.emit();
  },

  reset() {
    localStorage.removeItem(LS_KEY);
    state.learner = null; state.industry = null;
    state.courses = []; state.scenarios = [];
    state.mastery = null;
    state.profileSlug = null;
    state.phase = 1;
    state.policyEvent = null;
    this.emit();
  },

  // ---- phase controls ----
  setPhase(n) {
    const target = Math.max(1, Math.min(4, n | 0));
    const changed = target !== state.phase;
    state.phase = target;
    state.policyEvent = null;
    // Reset the chat session so a phase-specific opener can reseed.
    if (changed) { state.chats = { sessions: [], activeId: null }; persistChats(); }
    persistAll();
    this.emit();
  },
  advancePhase(n) {
    const target = Math.min(4, n | 0);
    if (target > state.phase) {
      state.phase = target;
      // Reset chat so the new phase's opener shows next time the FAB opens.
      state.chats = { sessions: [], activeId: null };
      persistChats();
      persistAll();
      this.emit();
    }
  },
  persistAll() { persistAll(); },

  // ---- selectors ----
  course(id) { return state.courses.find((c) => c.id === id); },
  scenariosForCourse(courseId) {
    return state.scenarios.filter((s) => s.courseId === courseId);
  },
  scenario(id) { return state.scenarios.find((s) => s.id === id); },

  // ---- mutations (persisted) ----
  recordPractice(result) {
    const before = readinessPct();
    state.mastery.recentPractice.unshift(result);
    state.mastery.recentPractice = state.mastery.recentPractice.slice(0, 10);
    // Bump concept mastery based on outcomes (simple, visible adaptive bump).
    for (const cid of result.concepts ?? []) {
      const cur = state.mastery.concepts[cid] ?? 0.5;
      const delta = result.score >= 0.75 ? 0.06 : result.score >= 0.5 ? 0.02 : -0.04;
      state.mastery.concepts[cid] = clamp(cur + delta, 0, 1);
    }
    const after = readinessPct();
    result.readinessBefore = before;
    result.readinessAfter  = after;
    result.readinessDelta  = after - before;
    state.session.lastSummary = result;

    // Phase advancement: completing a scenario tagged with phaseHint
    // matching the current phase advances the phase by one.
    const sc = state.scenarios.find((x) => x.id === result.scenarioId);
    if (sc?.phaseHint && sc.phaseHint === state.phase && state.phase < 4) {
      state.phase = sc.phaseHint + 1;
      result.phaseAdvancedTo = state.phase;
      // Reset chat so the next phase's opener can seed cleanly.
      state.chats = { sessions: [], activeId: null };
      persistChats();
    }

    persistMastery();
    this.emit();
  },

  // Average concept-mastery × 100. Used as the learner's "clinical
  // readiness" headline number across the Hub, summary, and celebration
  // interstitial.
  readinessPct() { return readinessPct(); },

  toggleSaved(courseId) {
    const list = state.mastery.saved;
    const i = list.indexOf(courseId);
    if (i >= 0) list.splice(i, 1); else list.push(courseId);
    persistMastery(); this.emit();
  },

  setProgress(courseId, lessonId, blockIdx, percent) {
    state.mastery.courseProgress[courseId] = { lesson: lessonId, block: blockIdx, percent };
    persistMastery(); this.emit();
  },

  markLessonComplete(courseId, lessonId) {
    const course = this.course(courseId); if (!course) return;
    const idx = course.lessons.findIndex((c) => c.id === lessonId);
    const next = course.lessons[idx + 1];
    state.mastery.completedLessons ??= {};
    const list = state.mastery.completedLessons[courseId] ??= [];
    if (!list.includes(lessonId)) list.push(lessonId);
    const percent = list.length / course.lessons.length;
    state.mastery.courseProgress[courseId] = {
      lesson: next ? next.id : lessonId,
      block: 0,
      percent
    };
    persistMastery(); this.emit();
  },

  isLessonComplete(courseId, lessonId) {
    return state.mastery.completedLessons?.[courseId]?.includes(lessonId) ?? false;
  },

  // ---- chat sessions ----
  // Resolve the current active session, creating a fresh one when needed.
  // The popover and the full Coach Vic page both call this so they end up
  // pointing at the same conversation.
  chatActiveOrCreate() {
    const list = state.chats.sessions;
    let s = list.find((x) => x.id === state.chats.activeId);
    if (!s) s = this.chatNew({ silent: true });
    return s;
  },

  chatGet(id) { return state.chats.sessions.find((s) => s.id === id) || null; },

  chatList() {
    return [...state.chats.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  // Start a new chat session and mark it active. `silent: true` skips the
  // emit so callers can chain mutations (e.g. seeding the opener) without
  // triggering a render mid-build.
  chatNew({ silent = false } = {}) {
    const s = {
      id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    state.chats.sessions.unshift(s);
    state.chats.activeId = s.id;
    persistChats();
    if (!silent) this.emit();
    return s;
  },

  chatSetActive(id) {
    if (state.chats.activeId === id) return;
    state.chats.activeId = id;
    persistChats();
    this.emit();
  },

  // Append a message and bump the session's timestamp. `msg` is one of:
  //   { role: 'me', text, time }
  //   { role: 'coach', text, time, reply }   // full reply payload preserved
  chatAdd(sessionId, msg) {
    const s = state.chats.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.messages.push(msg);
    s.updatedAt = Date.now();
    // Keep most-recently-updated session first so the history list stays sorted.
    const i = state.chats.sessions.indexOf(s);
    if (i > 0) {
      state.chats.sessions.splice(i, 1);
      state.chats.sessions.unshift(s);
    }
    persistChats();
  },

  chatDelete(id) {
    state.chats.sessions = state.chats.sessions.filter((s) => s.id !== id);
    if (state.chats.activeId === id) state.chats.activeId = null;
    persistChats();
    this.emit();
  }
};

function persistMastery() {
  const cur = readLS() ?? {};
  cur.mastery = state.mastery;
  cur.phase = state.phase;
  cur.policyEvent = state.policyEvent;
  writeLS(cur);
}

function persistAll() {
  const cur = readLS() ?? {};
  cur.mastery = state.mastery;
  cur.phase = state.phase;
  cur.policyEvent = state.policyEvent;
  writeLS(cur);
}

function persistChats() {
  const cur = readLS() ?? {};
  // Cap stored sessions at 30 so localStorage doesn't grow unboundedly
  // across long demo runs.
  cur.chats = {
    sessions: state.chats.sessions.slice(0, 30),
    activeId: state.chats.activeId
  };
  writeLS(cur);
}

function blankMastery() {
  return { courseProgress: {}, concepts: {}, saved: [], recentPractice: [] };
}

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null'); } catch { return null; }
}
function writeLS(v) { localStorage.setItem(LS_KEY, JSON.stringify(v)); }

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// Apply industry theme by overriding CSS variables. The bg token is
// owned by the page theme (Launch = dark, prototype = light) — we only
// drive the brand-tone accents from industry JSON so the prototype
// re-skins (purple for Education, amber for Commercial, etc.) without
// fighting the light/dark choice.
function applyTheme(industry) {
  const t = industry?.theme || {};
  const r = document.documentElement.style;
  if (t.accent)  r.setProperty('--accent', t.accent);
  if (t.accent2) r.setProperty('--accent-2', t.accent2);
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function readinessPct() {
  const concepts = state.mastery?.concepts || {};
  const vals = Object.values(concepts);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100);
}
