// views/summary.js — Practice Results / Performance Insights.
// Replaces the "you got 80%" stamp with a qualitative review built
// from the learner's actual stepResults. Each insight is paraphrased
// from the option they picked (see scenarios.json *.options[].insight)
// and tagged with the underlying competency indicator
// (Situational Awareness, Communication Style, etc.).
//
// Composition: header → strengths → growth → modules credited →
// recommended next (action protocol) → Retry / Continue actions.

import { store } from '../store.js';
import * as adaptive from '../adaptive.js';
import * as ui from '../ui.js';

export function render() {
  const result = store.state.session.lastSummary;
  const root = document.createElement('section');
  root.className = 'stack';
  if (!result) {
    root.appendChild(ui.el('p', { class: 'muted' },
      'No recent practice. Try one from the home feed.'));
    return root;
  }

  const sc = store.scenario(result.scenarioId);
  const course = store.course(result.courseId);
  const elapsed = result.elapsed ?? 0;

  // 1. Header — the qualitative-review framing
  root.appendChild(ui.insightHeader({
    icon: 'brain',
    title: 'Performance Insights',
    body: `A qualitative review of your decision-making approach during the previous ${store.state.industry.language.scenarioWord}. Focus on the observed patterns rather than scores.`
  }));

  // Small completion summary line (kept compact — scores aren't the headline)
  root.appendChild(ui.el('div', { class: 'progress-mini' },
    ui.el('div', { class: 'pm-row' },
      ui.el('small', null, sc.title),
      ui.el('span', null, formatElapsed(elapsed))
    ),
    ui.progressBar(Math.round(result.score * 100)),
    ui.el('div', { class: 'pm-row pm-foot' },
      ui.el('span', null, `${result.stepResults.length} decisions logged`),
      ui.el('span', { class: 'muted' }, `${Math.round(result.score * 100)}% bundle adherence`)
    )
  ));

  // 2. Insights (strength + growth) — generated from stepResults
  const insights = generateInsights(result, sc);

  const strengths = insights.filter((i) => i.tone === 'strength');
  const growth    = insights.filter((i) => i.tone === 'growth');

  if (strengths.length) {
    for (const i of strengths) root.appendChild(ui.insightCard(i));
  } else {
    root.appendChild(ui.el('p', { class: 'muted tiny center', style: { padding: '4px 0 8px' } },
      'No clear strengths surfaced this round — the rhythm matters more than any single decision.'));
  }

  if (growth.length) {
    for (const i of growth) root.appendChild(ui.insightCard(i));
  }

  // 3. Modules auto-credited
  const credited = sc.concepts.map((cid) => ({
    cid,
    label: course.concepts.find((c) => c.id === cid)?.label ?? cid,
    mastery: store.state.mastery.concepts[cid] ?? 0.5
  }));
  root.appendChild(ui.sectionHeader('Modules credited by practice'));
  root.appendChild(ui.el('div', { class: 'card' },
    ui.el('p', { class: 'tiny muted', style: { marginTop: '0' } },
      `Completing this ${store.state.industry.language.practiceWord} advanced these concepts:`),
    ...credited.flatMap((c) => [
      ui.el('div', { class: 'kv' },
        ui.el('span', null, c.label),
        ui.el('span', null, `${(c.mastery*100|0)}%`)
      ),
      ui.progressBar(c.mastery * 100)
    ])
  ));

  // 4. Recommended next ("action protocol")
  // Show: next chapter in course (if any), then up to two other
  // required courses that share weak indicators.
  const recommended = recommendedNext(course, growth);
  if (recommended.length) {
    root.appendChild(ui.sectionHeader('Recommended next'));
    for (const r of recommended) {
      root.appendChild(ui.rowCard({
        glyph: r.glyph,
        title: r.title,
        sub: r.sub,
        href: r.href
      }));
    }
  }

  // 5. Actions — Retry (slightly different wording) + Continue
  const retryHref = `#/practice/${sc.id}?retry=${(result.retryCount ?? 0) + 1}`;
  root.appendChild(ui.el('div', { class: 'stack' },
    ui.el('a', { class: 'btn block', href: retryHref },
      ui.icon('retry'),
      ui.el('span', null, 'Retry scenario')
    ),
    ui.el('a', { class: 'btn primary block cta-large', href: recommended[0]?.href ?? `#/course/${course.id}` },
      ui.el('span', null, recommended[0] ? 'Continue to next module' : 'Back to course'),
      ui.icon('arrowRight')
    )
  ));

  return root;
}

// ----------------- insight generation -----------------

function generateInsights(result, sc) {
  const out = [];
  for (const r of result.stepResults) {
    const step = sc.steps.find((s) => s.id === r.stepId);
    if (!step) continue;
    const indicator = step.indicator || 'Decision-making';

    // Choice step: paraphrase comes from the chosen option
    if (r.choice) {
      const opt = step.options?.find((o) => o.id === r.choice);
      const quote = opt?.insight || opt?.feedback || step.title;
      out.push({
        tone: r.outcome === 'good' ? 'strength' : 'growth',
        quote,
        indicator
      });
      continue;
    }

    // Text step: derive from rubric outcome
    if (r.text != null) {
      out.push({
        tone: r.outcome === 'good' ? 'strength' : 'growth',
        quote: r.outcome === 'good'
          ? `Your formulation hit the anchor points — receiving end could act on it without follow-up questions.`
          : r.outcome === 'ok'
            ? `Your formulation was workable but missing anchor points; the receiving end will need to ask follow-ups.`
            : `Your formulation didn't anchor on enough rubric points; re-read your response against the model.`,
        indicator
      });
    }
  }

  // Cap visible insights so the page doesn't sprawl. Keep the strongest
  // strength and the most actionable growth at minimum.
  const strengths = out.filter((i) => i.tone === 'strength').slice(0, 2);
  const growth    = out.filter((i) => i.tone === 'growth').slice(0, 2);
  return [...strengths, ...growth];
}

function recommendedNext(course, growth) {
  const items = [];
  // Next chapter, if any progress to be made
  const progress = store.state.mastery.courseProgress[course.id];
  if (progress) {
    const idx = course.chapters.findIndex((c) => c.id === progress.chapter);
    const next = course.chapters[idx];
    if (next) items.push({
      glyph: 'flag',
      title: `${course.title} — ${next.title}`,
      sub: `Resume · ${next.minutes} min`,
      href: `#/course/${course.id}/chapter/${next.id}`
    });
  }
  // Other required courses in this industry
  const required = store.state.courses.filter((c) =>
    c.industry === course.industry && c.id !== course.id && c.mandated
  ).slice(0, 2);
  for (const r of required) items.push({
    glyph: 'shield',
    title: r.title,
    sub: `Required · ${r.estMinutes} min`,
    href: `#/course/${r.id}`
  });
  return items.slice(0, 3);
}

function formatElapsed(seconds) {
  if (!seconds) return '—';
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s} elapsed`;
}
