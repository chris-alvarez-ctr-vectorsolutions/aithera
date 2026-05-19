// views/home.js — Home / Dashboard.
// Renders different content per maturity phase (1–4). Phase 1 is the
// baseline learner; phase 4 brings urgent alerts and a proactive coach.

import { store } from '../store.js';
import * as adaptive from '../adaptive.js';
import * as ui from '../ui.js?v=course-flow-1';
import { currentPhase, triggerPolicyEventIfNeeded, markPolicyModalShown,
         personaScenarioForPhase, personaAdaptiveCourse, personaPhase1Course } from '../phase.js';

export function render() {
  const { learner, industry, scenarios } = store.state;
  const phase = currentPhase();
  const root = document.createElement('section');
  root.className = 'stack';

  // Clean up any stale policy modal from a prior phase-4 render.
  document.querySelectorAll('.policy-modal-overlay').forEach((el) => el.remove());

  // Greeting
  const first = learner.name.split(' ')[0];
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const subline = learner.unit || `${learner.role} · ${industry.label}`;
  root.appendChild(ui.el('div', { class: 'home-greeting' },
    ui.el('h1', null, `Good ${partOfDay}, ${first}.`),
    ui.el('p', { class: 'muted' }, subline)
  ));

  // Phase 4: trigger and render the policy modal once.
  if (phase === 4) {
    triggerPolicyEventIfNeeded();
    const pe = store.state.policyEvent;
    if (pe?.applied && !pe.shown) {
      queueMicrotask(() => showPolicyModal(pe.modal));
      markPolicyModalShown();
    }
  }

  // 1. Urgent alerts — only at phase 4 (policy change drives the alert).
  if (phase === 4) {
    const pe = store.state.policyEvent;
    const proactiveSc = personaScenarioForPhase(4);
    if (pe?.modal) {
      root.appendChild(ui.alertStrip({
        kicker: 'Action required',
        title: pe.modal.headline,
        href: proactiveSc ? `#/practice/${proactiveSc.id}` : '#/coach',
        severity: 'urgent'
      }));
    }
    for (const a of adaptive.urgentAlerts()) {
      root.appendChild(ui.alertStrip({
        kicker: 'Action required', title: a.title, href: a.action.route, severity: a.severity
      }));
    }
  }

  // 2. Readiness — phases 1–3 read as neutral/healthy (no movers, no
  // refresher CTA). Phase 4 surfaces the full action-needed state.
  const snap = readinessForPhase(phase);
  if (snap) {
    root.appendChild(ui.readinessCard({
      level: snap.level, delta: snap.delta, status: snap.status,
      trend: snap.trend, movers: snap.movers,
      coachNote: noteFor(snap, phase),
      ctaHref: snap.ctaHref
    }));
  }

  // 3. Phase-specific "what to do next" section
  if (phase === 1) {
    renderPhase1(root, learner);
  } else if (phase === 2) {
    renderPhase2(root, learner);
  } else if (phase === 3) {
    renderPhase3(root, learner);
  } else if (phase === 4) {
    renderPhase4(root, learner);
  }

  // 4. In progress (always)
  const inProg = adaptive.inProgress();
  if (inProg.length) {
    const { course, progress } = inProg[0];
    root.appendChild(ui.sectionHeader('In progress', inProg.length > 1 ? '#/courses' : null));
    root.appendChild(ui.courseTile(course, { progress, compact: true }));
  }

  // 5. In progress (persona-scripted) — phase-1 learner sees a few
  // partially-finished courses to anchor the dashboard. Re-uses the same
  // "In progress" header as the adaptive block above when present.
  if (phase === 1 && learner.inProgressCourses?.length) {
    if (!inProg.length) root.appendChild(ui.sectionHeader('In progress'));
    for (const c of learner.inProgressCourses) {
      const real = store.course(c.id);
      root.appendChild(ui.rowCard({
        glyph: null,
        title: c.title,
        sub: c.blurb,
        percent: typeof c.percent === 'number' ? c.percent : 0,
        href: real ? `#/course/${c.id}` : null,
        disabled: !real,
        kebab: false
      }));
    }
  }

  // 6. Saved
  const saved = store.state.mastery.saved;
  if (saved.length) {
    root.appendChild(ui.sectionHeader('Saved'));
    for (const id of saved) {
      const c = store.course(id);
      if (!c) continue;
      root.appendChild(ui.rowCard({ glyph: 'star', title: c.title, sub: 'Saved', href: `#/course/${c.id}` }));
    }
  }

  return root;
}

// ---------- per-phase sections ----------

function renderPhase1(root, learner) {
  // Baseline: no AI suggestion. Show a manual course pick from the
  // learner's industry — prefer a phase-1-tagged course.
  const next = pickPhase1Course(learner);
  if (next) {
    root.appendChild(ui.sectionHeader('Next up'));
    root.appendChild(ui.nextUpHero({
      title: next.title,
      minutes: next.estMinutes || 15,
      href: `#/course/${next.id}`
    }));
  }
}

function renderPhase2(root, learner) {
  // Course-embedded scenario done. Nudge to practice tab with a
  // phase-2-tagged standalone scenario for this persona.
  const sc = personaScenarioForPhase(2);
  const tone = learner.preferences.coachTone;
  const word = store.state.industry.language.practiceWord;
  const first = learner.name.split(' ')[0];
  if (sc) {
    const q = tone === 'supportive'
      ? `Nice work, ${first}. Try a standalone ${word}: "${sc.title}"?`
      : `${first} — try the standalone ${word}: "${sc.title}".`;
    root.appendChild(ui.coachPrompt({
      question: q,
      primaryLabel: 'Open Practice',
      primaryHref: '#/practice',
      secondaryLabel: 'Start now',
      secondaryHref: `#/practice/${sc.id}`
    }));
  }
  const offer = learner.kaOffer;
  if (offer?.scenarioId && store.scenario(offer.scenarioId)) {
    root.appendChild(ui.el('div', { class: 'card ka-offer' },
      ui.el('div', { class: 'tag', style: { display: 'inline-block', marginBottom: '8px', background: 'var(--accent)', color: '#fff' } }, offer.kicker || 'Knowledge Assistant'),
      ui.el('h3', { style: { margin: '0 0 6px', fontSize: '16px' } }, offer.headline || 'A short practice scenario'),
      ui.el('p', { class: 'muted', style: { margin: '0 0 12px' } }, offer.body || ''),
      ui.el('div', { class: 'row', style: { gap: '8px' } },
        ui.el('a', { class: 'btn primary', href: `#/practice/${offer.scenarioId}?from=ka`, style: { flex: '1' } }, offer.acceptLabel || 'Try the scenario'),
        ui.el('a', { class: 'btn ghost', href: '#/home' }, offer.dismissLabel || 'Not now')
      )
    ));
  }
}

function renderPhase3(root, learner) {
  // Adaptive course is queued.
  const adaptive = personaAdaptiveCourse();
  const first = learner.name.split(' ')[0];
  if (adaptive) {
    root.appendChild(ui.sectionHeader('Tailored for you'));
    root.appendChild(ui.rowCard({
      glyph: 'sparkle',
      title: adaptive.title,
      sub: 'Adapted from your recent practice',
      href: `#/course/${adaptive.id}`
    }));
    root.appendChild(ui.coachPrompt({
      question: `${first} — your last few runs unlocked a tailored course. Want to start?`,
      primaryLabel: 'Open course',
      primaryHref: `#/course/${adaptive.id}`
    }));
  }
}

function renderPhase4(root, learner) {
  // Proactive: surface the phase-4 scenario tied to the policy change.
  const sc = personaScenarioForPhase(4);
  const first = learner.name.split(' ')[0];
  if (sc) {
    const pw = store.state.industry?.language?.practiceWord || 'scenario';
    root.appendChild(ui.coachPrompt({
      question: `${first} — the new policy affects how you handle "${sc.title.toLowerCase()}". 5-minute ${pw}?`,
      primaryLabel: `Start ${pw}`,
      primaryHref: `#/practice/${sc.id}`,
      secondaryLabel: 'Later',
      secondaryHref: '#/home'
    }));
  }
}

// ---------- helpers ----------

function pickPhase1Course(learner) {
  return personaPhase1Course()
    || store.state.courses.find((c) => c.industry === learner.industry && c.phaseHint === 1)
    || store.state.courses.find((c) => c.industry === learner.industry && !c.adaptive)
    || store.state.courses.find((c) => c.industry === learner.industry);
}

// Readiness presentation is identical across personas: synthesized from
// mastery + recent practice + (at phase 4) the policy event. No per-
// persona curation needed — the score "moves" naturally as phases
// progress because mastery rises with practice and drops with the
// policy event.
function readinessForPhase(phase) {
  const { learner, mastery, scenarios } = store.state;
  if (!learner) return null;

  const vals = Object.values(mastery?.concepts ?? {});
  const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0.7;
  const baseLevel = Math.round(avg * 100);

  // Phases 1–3: clean, neutral. No movers, no refresher CTA.
  if (phase < 4) {
    const status = baseLevel < 50 ? 'action-needed' : baseLevel < 75 ? 'watch' : 'good';
    return {
      level: baseLevel,
      delta: 0,
      status,
      trend: synthTrend(baseLevel),
      movers: [],
      ctaHref: null
    };
  }

  // Phase 4: dramatize the drop. Movers from the policy event +
  // recent practice. CTA points at the proactive phase-4 scenario.
  // Visual drop is intentionally larger than the underlying concept
  // change so the policy moment reads as a real setback regardless of
  // how high mastery climbed in phases 2–3.
  const pe = store.state.policyEvent;
  const dropLevel = Math.max(38, Math.min(58, Math.round(baseLevel * 0.65)));
  const dropDelta = -(baseLevel - dropLevel);
  const movers = [];
  if (pe?.modal?.headline) {
    movers.push({ direction: 'down', title: pe.modal.headline, when: 'today', delta: -12 });
  }
  if (pe?.conceptId) {
    movers.push({
      direction: 'down',
      title: `Concept gap: ${conceptLabel(pe.conceptId)}`,
      when: 'today',
      delta: -6
    });
  }
  const recent = (mastery?.recentPractice || []).slice(0, 2);
  for (const r of recent) {
    const sc = scenarios.find((s) => s.id === r.scenarioId);
    if (!sc) continue;
    const delta = Math.round(r.readinessDelta ?? 0) || 4;
    movers.push({
      direction: delta < 0 ? 'down' : 'up',
      title: `Practice: ${sc.title}`,
      when: relWhen(r.at),
      delta
    });
  }

  const proactive = personaScenarioForPhase(4);
  return {
    level: dropLevel,
    delta: dropDelta,
    status: 'action-needed',
    trend: synthTrend(dropLevel, dropDelta),
    movers,
    ctaHref: proactive ? `#/practice/${proactive.id}` : '#/coach'
  };
}

function conceptLabel(cid) {
  for (const c of store.state.courses) {
    const m = c.concepts?.find((x) => x.id === cid);
    if (m) return m.label;
  }
  return cid;
}

function relWhen(ts) {
  if (!ts) return '';
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

function synthTrend(level, delta = 0) {
  // Start = level - delta so the line lands on `level` having moved by delta.
  const start = level - delta;
  const out = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const eased = 1 - Math.pow(1 - t, 1.6);
    const jitter = ((i * 31) % 4) - 1.5;
    out.push(Math.round(start + (level - start) * eased + jitter));
  }
  out[out.length - 1] = level;
  return out;
}

function primaryActionHref(snap) {
  const { learner } = store.state;
  const lapsed = (learner.certifications ?? []).find((c) => c.expiresInDays <= 30);
  if (lapsed) return `#/course/${lapsed.id}`;
  const req = adaptive.requiredQueue()[0];
  return req ? `#/course/${req.id}` : '#/coach';
}

function noteFor(snap, phase) {
  const pw = store.state.industry?.language?.practiceWord || 'scenario';
  if (phase === 4) return `A policy change just shifted your readiness. The ${pw} targets the gap.`;
  if (phase === 3) return 'Your recent practice unlocked a tailored course. Open it when you\'re ready.';
  if (phase === 2) return 'Practice locked in some gains. Standalone scenarios will widen the base.';
  const top = snap.movers?.find?.((m) => m.direction === 'down');
  if (snap.status === 'action-needed') return 'Several gaps opened up. Let\'s close the biggest one first — 8 min.';
  if (snap.status === 'watch')         return `You're holding steady. A short refresh on ${top?.title ?? 'one weak area'} keeps you in the green.`;
  return `Strong shape. A 5-minute ${pw} keeps the streak going.`;
}

// ---------- policy modal ----------

function showPolicyModal({ headline, body }) {
  const overlay = document.createElement('div');
  overlay.className = 'policy-modal-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(11,18,32,.55);
    display:flex;align-items:center;justify-content:center;
    z-index:60;padding:24px;
  `;
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'max-width:420px;width:100%;padding:20px;background:var(--bg-elev);border-radius:14px';
  card.innerHTML = `
    <div class="tag" style="background:var(--accent);color:#fff;display:inline-block;margin-bottom:8px">Policy update</div>
    <h3 style="margin:0 0 8px">${escapeHtml(headline)}</h3>
    <p style="margin:0 0 14px">${escapeHtml(body)}</p>
    <div class="row" style="gap:8px;justify-content:flex-end">
      <button class="btn" id="pmLater">Remind me later</button>
      <button class="btn primary" id="pmGo">Take action</button>
    </div>
  `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  card.querySelector('#pmLater').onclick = close;
  card.querySelector('#pmGo').onclick = () => {
    close();
    const sc = store.state.scenarios.find((s) => s.industry === store.state.learner.industry && s.phaseHint === 4);
    if (sc) location.hash = `#/practice/${sc.id}`;
  };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
