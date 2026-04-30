// views/summary.js — post-scenario summary.
// Auto-credits modules tied to the practiced concepts and shows the
// "what next" recommendation from adaptive.nextStepAfter.
import { store } from '../store.js';
import * as adaptive from '../adaptive.js';

export function render() {
  const result = store.state.session.lastSummary;
  const root = document.createElement('section');
  if (!result) { root.innerHTML = '<p class="muted">No recent practice. Try one from the home feed.</p>'; return root; }

  const sc = store.scenario(result.scenarioId);
  const course = store.course(result.courseId);
  const next = adaptive.nextStepAfter(result);
  const strengths = result.stepResults.filter((r) => r.outcome === 'good');
  const growth    = result.stepResults.filter((r) => r.outcome === 'bad');

  // Concepts auto-credited (visible — leadership wants to see this).
  const credited = sc.concepts.map((cid) => ({
    cid,
    label: course.concepts.find((c) => c.id === cid)?.label ?? cid,
    mastery: store.state.mastery.concepts[cid] ?? 0.5
  }));

  root.innerHTML = `
    <div class="card" style="background:linear-gradient(180deg, rgba(62,213,152,0.10), var(--bg-card))">
      <span class="tag good">${Math.round(result.score*100)}% scenario score</span>
      <h2 style="margin:8px 0 4px">${sc.title}</h2>
      <p class="muted">${sc.outcomeType}</p>
    </div>

    <div class="card">
      <strong>Observed strengths</strong>
      ${strengths.length ? `<ul class="list-tight">${strengths.map((s) => `<li>Step ${s.stepId.toUpperCase()} — clean, defensible decision.</li>`).join('')}</ul>` : '<p class="muted">No clear strengths this run — that\'s OK.</p>'}
    </div>

    <div class="card">
      <strong>Areas for growth</strong>
      ${growth.length ? `<ul class="list-tight">${growth.map((g) => `<li>Step ${g.stepId.toUpperCase()} — re-evaluate with the linked concept refresher below.</li>`).join('')}</ul>` : '<p class="muted">Nothing flagged. Watch for repeatability across variants.</p>'}
    </div>

    <div class="card">
      <strong>Modules auto-credited</strong>
      <p class="tiny muted" style="margin-top:4px">By completing this ${store.state.industry.language.practiceWord}, you advanced these concepts:</p>
      ${credited.map((c) => `
        <div class="kv">
          <span>${c.label}</span>
          <span>${(c.mastery*100|0)}%</span>
        </div>
        <div class="progress"><span style="width:${c.mastery*100}%"></span></div>
      `).join('')}
    </div>

    <div class="card coach">
      <strong>What's next</strong>
      <p style="margin-top:6px">${next.message}</p>
      <div class="row" style="margin-top:10px;gap:8px">
        <a class="btn ghost" href="#/practice/${sc.id}">Retry with variation</a>
        <a class="btn primary" style="flex:1" href="#/course/${course.id}">Open course</a>
      </div>
    </div>
  `;
  return root;
}
