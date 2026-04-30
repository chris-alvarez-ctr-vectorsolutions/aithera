// coach.js — Coach Vic stub.
// Goal: feel intelligent and bounded WITHOUT a real model call. Vic
// answers from a small library of scripted intents that map to course
// content. Anything outside that library returns a "I'll only answer
// from the trusted course content" response — that bounded behavior is
// the credibility play we want to demonstrate.

import { store } from './store.js';

const INTENTS = [
  {
    match: /isolation|how far|distance|stand off/i,
    answer: ({ industry }) =>
      `Default isolation for an unknown ${industry?.language?.scenarioWord || 'incident'} starts at 50m and grows with vapor, fire, or symptoms. It's a *living* number — re-check it on every wind shift.`,
    cite: { courseId: 'hazmat-awareness', concept: 'c2' }
  },
  {
    match: /qsofa|sepsis|recogni[sz]e/i,
    answer: () =>
      `qSOFA flags risk, not diagnosis. Two of three (RR≥22, altered mentation, SBP≤100) earns immediate re-eval and starts the bundle clock — it doesn't replace clinical judgment.`,
    cite: { courseId: 'sepsis-bundle', concept: 'c1' }
  },
  {
    match: /bundle|hour[- ]?one|fluids|antibiotics/i,
    answer: () =>
      `The hour-1 bundle: lactate, blood cultures (before antibiotics when feasible), broad-spectrum antibiotics, 30 mL/kg crystalloid, vasopressors if MAP <65 after fluids. Velocity beats perfect ordering.`,
    cite: { courseId: 'sepsis-bundle', concept: 'c2' }
  },
  {
    match: /sitrep|handoff|hand off|notify/i,
    answer: () =>
      `Lead with the picture, not the timeline: location, product, isolation, resources requested, life safety. Save chronology for the second beat.`,
    cite: { courseId: 'hazmat-awareness', concept: 'c3' }
  },
  {
    match: /practice|drill|simulation|scenario/i,
    answer: ({ industry }) =>
      `Want to run a ${industry?.language?.practiceWord || 'scenario'}? I can pick one targeted to your weakest concept right now.`,
    cite: null,
    suggestPractice: true
  }
];

const HIGH_RISK = /\b(suicid|harm myself|kill|emergenc|bleeding|chest pain)\b/i;

export const coach = {
  // Returns { text, cite, suggestPractice } given a message + current state.
  reply(message) {
    const s = store.state;

    if (HIGH_RISK.test(message)) {
      return {
        text: 'That sounds urgent and outside what I should advise on. Please contact your supervisor or emergency services. I can resume coaching afterwards.',
        cite: null,
        escalated: true
      };
    }

    for (const intent of INTENTS) {
      if (intent.match.test(message)) {
        return {
          text: applyTone(intent.answer({ industry: s.industry }), s.learner?.preferences?.coachTone),
          cite: intent.cite,
          suggestPractice: !!intent.suggestPractice
        };
      }
    }

    // Bounded fallback — this is the trust signal. Vic does NOT speculate.
    return {
      text: applyTone(
        `I only answer from your course library. I don't see a confident match for that. Want me to find the closest concept, or run a ${s.industry?.language?.practiceWord || 'scenario'} instead?`,
        s.learner?.preferences?.coachTone
      ),
      cite: null,
      bounded: true
    };
  },

  // Greeting depends on profile (yet another visible JSON-driven adapt).
  greeting() {
    const s = store.state;
    const tone = s.learner?.preferences?.coachTone ?? 'direct';
    const word = s.industry?.language?.practiceWord ?? 'scenario';
    if (tone === 'supportive') {
      return `Hi ${s.learner.name.split(' ')[0]} — I'm Vic. Want to warm up with a quick ${word}, or pick up where you left off?`;
    }
    return `${s.learner.name.split(' ')[0]} — Vic here. Pick up the chapter, or jump straight into a ${word}?`;
  }
};

function applyTone(text, tone) {
  if (tone === 'supportive') return text.replace(/\.$/, '. You\'ve got this.');
  return text;
}
