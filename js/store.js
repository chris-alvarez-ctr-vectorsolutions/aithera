// store.js — single source of truth for the prototype.
// Loads JSON profiles, applies industry theming, and persists progress
// to localStorage so a refresh doesn't reset the demo.
// Intent: leadership should see the *same* learner state across reloads
// without needing a backend.

const LS_KEY = 'aithera.state.v1';

const state = {
  ready: false,
  learner: null,        // learnerProfile.json
  industry: null,       // industryProfile.json
  courses: [],          // courseData.json
  scenarios: [],        // scenarioBank.json
  mastery: null,        // masteryState.json (per learner)
  // ephemeral session data (e.g. last practice result)
  session: { lastSummary: null }
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
    if (saved?.learnerId) {
      try { await this.loadLearner(saved.learnerId, saved.industryId); }
      catch { /* fall through to launch */ }
    }
    state.ready = true;
    this.emit();
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
    applyTheme(industry);
    writeLS({ learnerId: learnerFile, industryId: industryFile, mastery: state.mastery });
    this.emit();
  },

  reset() {
    localStorage.removeItem(LS_KEY);
    state.learner = null; state.industry = null;
    state.courses = []; state.scenarios = [];
    state.mastery = null;
    this.emit();
  },

  // ---- selectors ----
  course(id) { return state.courses.find((c) => c.id === id); },
  scenariosForCourse(courseId) {
    return state.scenarios.filter((s) => s.courseId === courseId);
  },
  scenario(id) { return state.scenarios.find((s) => s.id === id); },

  // ---- mutations (persisted) ----
  recordPractice(result) {
    state.mastery.recentPractice.unshift(result);
    state.mastery.recentPractice = state.mastery.recentPractice.slice(0, 10);
    // Bump concept mastery based on outcomes (simple, visible adaptive bump).
    for (const cid of result.concepts ?? []) {
      const cur = state.mastery.concepts[cid] ?? 0.5;
      const delta = result.score >= 0.75 ? 0.06 : result.score >= 0.5 ? 0.02 : -0.04;
      state.mastery.concepts[cid] = clamp(cur + delta, 0, 1);
    }
    state.session.lastSummary = result;
    persistMastery();
    this.emit();
  },

  toggleSaved(courseId) {
    const list = state.mastery.saved;
    const i = list.indexOf(courseId);
    if (i >= 0) list.splice(i, 1); else list.push(courseId);
    persistMastery(); this.emit();
  },

  setProgress(courseId, chapterId, blockIdx, percent) {
    state.mastery.courseProgress[courseId] = { chapter: chapterId, block: blockIdx, percent };
    persistMastery(); this.emit();
  },

  // Mark a chapter complete: bumps progress to the next chapter (if any)
  // and tracks the chapter id in a `completedChapters` list for that course.
  markChapterComplete(courseId, chapterId) {
    const course = this.course(courseId); if (!course) return;
    const idx = course.chapters.findIndex((c) => c.id === chapterId);
    const next = course.chapters[idx + 1];
    state.mastery.completedChapters ??= {};
    const list = state.mastery.completedChapters[courseId] ??= [];
    if (!list.includes(chapterId)) list.push(chapterId);
    const percent = list.length / course.chapters.length;
    state.mastery.courseProgress[courseId] = {
      chapter: next ? next.id : chapterId,
      block: 0,
      percent
    };
    persistMastery(); this.emit();
  },

  isChapterComplete(courseId, chapterId) {
    return state.mastery.completedChapters?.[courseId]?.includes(chapterId) ?? false;
  }
};

function persistMastery() {
  const cur = readLS() ?? {};
  cur.mastery = state.mastery;
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
