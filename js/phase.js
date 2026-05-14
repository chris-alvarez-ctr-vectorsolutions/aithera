// phase.js — prototype maturity phases (1–4).
// Phases progressively disclose content so a tester can experience the
// learner journey end-to-end in one session:
//   1 — Baseline. Learner picks a course manually.
//   2 — Standalone practice nudge after the course-embedded scenario.
//   3 — Adaptive course tailored from prior practice.
//   4 — Proactive assistant after a policy-driven readiness drop.
// Phase state lives on the store; gating is read here so views stay clean.

import { store } from './store.js';

export const PHASES = [1, 2, 3, 4];

// Two personas can share an industry (e.g. HiEd Student + K-12 Student),
// so `industry` alone isn't enough to pick the right scenarios. Each
// persona's scenarios use a distinct ID prefix; this map drives the
// per-phase scenario lookup throughout the app.
const PERSONA_PREFIX = {
  'ems':           'ems-sc-',
  'hied-student':  'hied-sc-',
  'industrial':    'ind-sc-',
  'k12-student':   'k12s-sc-',
  'k12-employee':  'k12e-sc-'
};

// Per-persona course id prefix (e.g. "ems-p1", "k12e-p3"). Used to detect
// when a course belongs to a different persona — even within the same
// industry — so we don't cross-pollute course lists.
const PERSONA_COURSE_KEY = {
  'ems':           'ems',
  'hied-student':  'hied',
  'industrial':    'ind',
  'k12-student':   'k12s',
  'k12-employee':  'k12e'
};
const ALL_COURSE_KEYS = Object.values(PERSONA_COURSE_KEY);

// True if the course is generic for the persona's industry, or is the
// persona's own phase-tagged course. False if it's another persona's
// phase-tagged course.
export function belongsToCurrentPersona(course) {
  if (!course) return false;
  const slug = store.state.profileSlug;
  const learnerIndustry = store.state.learner?.industry;
  if (course.industry !== learnerIndustry) return false;
  const myKey = PERSONA_COURSE_KEY[slug];
  // Reject courses owned by a *different* persona (id like "<otherKey>-p…").
  for (const k of ALL_COURSE_KEYS) {
    if (k === myKey) continue;
    if (course.id === `${k}-p1` || course.id === `${k}-p3` || course.id.startsWith(`${k}-p`)) {
      return false;
    }
  }
  return true;
}

// Scenarios that belong to the current persona's phased flow.
export function personaScenarios() {
  const slug = store.state.profileSlug;
  const prefix = PERSONA_PREFIX[slug];
  if (!prefix) return [];
  return store.state.scenarios.filter((s) => s.id.startsWith(prefix));
}

export function personaScenarioForPhase(p) {
  return personaScenarios().find((s) => s.phaseHint === p) || null;
}

// Adaptive course tailored to the current persona (Phase 3 unlock).
export function personaAdaptiveCourse() {
  const slug = store.state.profileSlug;
  // Course ID convention: "<persona-key>-p3"
  const key = {
    'ems': 'ems',
    'hied-student': 'hied',
    'industrial': 'ind',
    'k12-student': 'k12s',
    'k12-employee': 'k12e'
  }[slug];
  if (!key) return null;
  return store.state.courses.find((c) => c.id === `${key}-p3`) || null;
}

export function personaPhase1Course() {
  const slug = store.state.profileSlug;
  const key = {
    'ems': 'ems',
    'hied-student': 'hied',
    'industrial': 'ind',
    'k12-student': 'k12s',
    'k12-employee': 'k12e'
  }[slug];
  if (!key) return null;
  return store.state.courses.find((c) => c.id === `${key}-p1`) || null;
}

export function currentPhase() {
  return store.state.phase ?? 1;
}

export function isAtLeast(p) {
  return currentPhase() >= p;
}

// Called by recordPractice when a phase-tagged scenario completes.
// A scenario with phaseHint === current phase advances the phase by one.
export function maybeAdvanceFromScenario(scenarioId) {
  const sc = store.scenario(scenarioId);
  if (!sc?.phaseHint) return false;
  if (sc.phaseHint !== currentPhase()) return false;
  store.advancePhase(sc.phaseHint + 1);
  return true;
}

// When entering phase 4, drop the policy-targeted concept and queue a modal.
export function triggerPolicyEventIfNeeded() {
  const s = store.state;
  if (s.phase !== 4) return;
  if (s.policyEvent?.applied) return;
  const policy = s.learner?.policyEvent;
  if (!policy) return;
  const { conceptId, drop = 0.25, modal } = policy;
  if (conceptId && s.mastery?.concepts) {
    const cur = s.mastery.concepts[conceptId] ?? 0.5;
    s.mastery.concepts[conceptId] = Math.max(0, cur - drop);
  }
  s.policyEvent = { applied: true, shown: false, modal, conceptId };
  store.persistAll();
  store.emit();
}

// Mark the policy modal as shown so it only fires once per session.
export function markPolicyModalShown() {
  if (store.state.policyEvent) {
    store.state.policyEvent.shown = true;
    store.persistAll();
  }
}
