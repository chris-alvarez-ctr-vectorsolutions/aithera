// adaptive.js — visible adaptive logic.
// These functions return human-readable rationales alongside the
// recommendation so the UI can SHOW *why* something is being surfaced
// (e.g. "Suggested because your isolation-distance mastery is 41%").
// That visibility is the proof point for leadership.

import { store } from './store.js';

const MASTERY_WEAK = 0.55;
const MASTERY_STRONG = 0.8;
const CERT_URGENT_DAYS = 30;

export function urgentAlerts() {
  const { learner } = store.state;
  if (!learner) return [];
  const out = [];
  for (const c of learner.certifications ?? []) {
    if (c.expiresInDays <= CERT_URGENT_DAYS) {
      out.push({
        kind: 'cert',
        severity: c.expiresInDays <= 14 ? 'urgent' : 'alert',
        title: `${c.label} expires in ${c.expiresInDays} days`,
        body: c.expiresInDays <= 14
          ? `Fast-track recertification recommended. We'll prioritize practice over passive review.`
          : `Plan a refresh now to avoid a lapse window.`,
        action: { label: 'Start refresh', courseId: c.id, route: `#/course/${c.id}` }
      });
    }
  }
  return out;
}

export function inProgress() {
  const { mastery, courses } = store.state;
  if (!mastery) return [];
  return Object.entries(mastery.courseProgress).map(([courseId, p]) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? { course, progress: p } : null;
  }).filter(Boolean);
}

// Practice suggestions are produced from concept mastery. Lower mastery
// AND newer-content bias produce a stronger suggestion. We expose the
// reason so the UI can render it on the card.
export function practiceSuggestions(limit = 3) {
  const { mastery, courses, scenarios, learner } = store.state;
  if (!mastery) return [];

  const ranked = [];
  for (const s of scenarios) {
    if (s.industry !== learner.industry) continue;
    const weakest = (s.concepts || []).reduce((acc, cid) => {
      const m = mastery.concepts[cid] ?? 0.5;
      return m < acc.m ? { cid, m } : acc;
    }, { cid: null, m: 1 });

    let priority = 0.5;
    let reason = 'Suggested for general practice.';
    if (weakest.m < MASTERY_WEAK) {
      priority = 1 - weakest.m;
      const course = courses.find((c) => c.id === s.courseId);
      const label = course?.concepts.find((c) => c.id === weakest.cid)?.label ?? 'a key concept';
      reason = `Targeted because your mastery of "${label}" is ${Math.round(weakest.m * 100)}%.`;
    } else if (weakest.m > MASTERY_STRONG) {
      priority = 0.2;
      reason = 'Quick mastery check — you can probably skim this.';
    }
    ranked.push({ scenario: s, priority, reason });
  }
  ranked.sort((a, b) => b.priority - a.priority);
  return ranked.slice(0, limit);
}

// After a practice attempt, decide what's next. Keeps the loop tight:
// failure → more practice; strong → option to skip ahead; mid → revisit.
export function nextStepAfter(result) {
  if (result.score >= 0.85) {
    return { action: 'skip-suggested', message: 'Strong run. We can skip ahead to the next chapter.' };
  }
  if (result.score < 0.5) {
    return { action: 'reinforce',     message: 'We\'ll surface another scenario variant + a 2-minute concept refresher.' };
  }
  return   { action: 'revisit',       message: 'Solid foundation. Let\'s revisit one weak concept before moving on.' };
}

// Required queue — what *must* be done now (regulatory / mandated).
export function requiredQueue() {
  const { courses, learner } = store.state;
  if (!learner) return [];
  return courses
    .filter((c) => c.industry === learner.industry && c.mandated)
    .slice(0, 3);
}
