// coach.js — Coach Vic response engine.
// Async API so swapping the source from the local JSON script to a real
// model endpoint later is a one-place change.
//
//   await coach.opener()      → proactive greeting (uses learner state)
//   await coach.reply(text)   → responds to a message
//
// Response shape (uniform across local + future remote sources):
//   { text, time, card?, cite?, suggested?, suggestPractice?, bounded?, escalated? }
//
// `text` may contain Markdown-lite **bold** and *italic*. Cards are
// structured payloads ({ type, ...fields }) the view knows how to render.

import { store } from './store.js';

let SCRIPT = null;

async function ensureScript() {
  if (SCRIPT) return;
  const res = await fetch('data/coach-script.json', { cache: 'no-cache' });
  SCRIPT = await res.json();
}

export const coach = {
  // Proactive opener — picks the highest-priority "when" condition that
  // matches the current learner state. Falls back to a generic hello.
  async opener() {
    await ensureScript();
    const ctx = buildContext();

    for (const o of SCRIPT.openers) {
      if (o.when === 'lowest-mastery-below' && ctx.lowestMasteryValue !== null && ctx.lowestMasteryValue < (o.threshold ?? 0.55)) {
        return finalize(o, ctx);
      }
      if (o.when === 'cert-expires-within' && ctx.certDays !== null && ctx.certDays <= (o.thresholdDays ?? 30)) {
        return finalize(o, ctx);
      }
      if (o.when === 'default') return finalize(o, ctx);
    }
    return { text: 'Hi.', time: now() };
  },

  // Reply to a learner message. Stays bounded; never invents citations.
  async reply(message) {
    await ensureScript();
    const ctx = buildContext();
    const text = String(message || '').trim();

    if (new RegExp(SCRIPT.highRisk, 'i').test(text)) {
      return { ...SCRIPT.escalation, text: fillTemplate(SCRIPT.escalation.text, ctx), time: now() };
    }

    for (const intent of SCRIPT.intents) {
      if (new RegExp(intent.match, 'i').test(text)) {
        return finalize(intent, ctx);
      }
    }

    return { ...SCRIPT.fallback, text: fillTemplate(SCRIPT.fallback.text, ctx), time: now() };
  },

  // Legacy compatibility — used by older views.
  greeting() {
    const s = store.state;
    if (!s.learner) return 'Hi.';
    const tone = s.learner.preferences?.coachTone ?? 'direct';
    const word = s.industry?.language?.practiceWord ?? 'scenario';
    const first = s.learner.name.split(' ')[0];
    return tone === 'supportive'
      ? `Hi ${first} — I'm Vic. Want to warm up with a quick ${word}, or pick up where you left off?`
      : `${first} — Vic here. Pick up the chapter, or jump straight into a ${word}?`;
  }
};

// ---------------- helpers ----------------

function finalize(node, ctx) {
  const text = fillTemplate(node.text, ctx);
  const card = node.card ? hydrateCard(node.card, ctx) : null;
  const suggested = (node.suggested || []).map((s) => fillTemplate(s, ctx));
  return {
    text,
    card,
    suggested,
    cite: node.cite || null,
    suggestPractice: !!node.suggestPractice,
    time: now()
  };
}

function hydrateCard(card, ctx) {
  const out = {};
  for (const [k, v] of Object.entries(card)) {
    if (typeof v !== 'string') { out[k] = v; continue; }
    if (v.startsWith('lookup:')) {
      const ref = v.slice(7);
      out[k] = Math.round((ctx.conceptsByRef[ref] ?? 0.5) * 100);
      continue;
    }
    out[k] = fillTemplate(v, ctx);
    // numeric coercion for fields that look numeric
    if (/^-?\d+$/.test(out[k])) out[k] = parseInt(out[k], 10);
  }
  return out;
}

function fillTemplate(s, ctx) {
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? `{${k}}`));
}

function buildContext() {
  const s = store.state;
  const learner = s.learner || {};
  const industry = s.industry || {};
  const practiceWord = industry.language?.practiceWord || 'scenario';
  const scenarioWord = industry.language?.scenarioWord || 'incident';
  const firstName = (learner.name || '').split(' ')[0];

  // Lowest-mastery concept across the catalog (only courses for this
  // industry, since the prototype loads one industry at a time).
  let lowestId = null, lowestVal = null, lowestCourse = null, lowestLabel = null;
  const conceptsByRef = {};
  for (const course of s.courses || []) {
    if (course.industry !== learner.industry) continue;
    for (const c of course.concepts || []) {
      const live = s.mastery?.concepts?.[c.id] ?? c.mastery;
      conceptsByRef[c.id] = live;
      if (lowestVal === null || live < lowestVal) {
        lowestVal = live; lowestId = c.id; lowestCourse = course; lowestLabel = c.label;
      }
    }
  }

  // Earliest-expiring cert
  let certLabel = null, certDays = null;
  for (const c of learner.certifications || []) {
    if (certDays === null || c.expiresInDays < certDays) { certDays = c.expiresInDays; certLabel = c.label; }
  }

  return {
    firstName,
    practiceWord,
    scenarioWord,
    courseTitle: lowestCourse?.title ?? '',
    conceptLabel: lowestLabel ?? '',
    conceptPct: lowestVal != null ? Math.round(lowestVal * 100) : null,
    conceptDelta: -12, // mocked delta vs last week so the demo feels alive
    lowestMasteryValue: lowestVal,
    certLabel: certLabel ?? '',
    certDays,
    conceptsByRef
  };
}

function now() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = String(((h + 11) % 12) + 1).padStart(2, '0');
  return `${hr}:${m} ${ampm}`;
}
