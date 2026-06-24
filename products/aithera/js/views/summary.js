// views/summary.js — Practice Results / Performance Insights.
// Replaces the "you got 80%" stamp with a qualitative review built
// from the learner's actual stepResults. Each insight is paraphrased
// from the option they picked (see scenarios.json *.options[].insight)
// and tagged with the underlying competency indicator
// (Situational Awareness, Communication Style, etc.).
//
// Composition (deliberately lean — scores aren't the headline):
// header → readiness delta → run meta → observations → concepts credited
// → Retry / Continue actions.

import { store } from '../store.js';
import * as adaptive from '../adaptive.js';
import * as ui from '../ui.js?v=scene-flow-43';

export function render() {
  const result = store.state.session.lastSummary;
  const root = document.createElement('section');
  root.className = 'stack summary-results';
  if (!result) {
    root.appendChild(ui.el('p', { class: 'muted' },
      'No recent practice. Try one from the home feed.'));
    return root;
  }

  const sc = store.scenario(result.scenarioId);
  const course = store.course(result.courseId);
  const elapsed = result.elapsed ?? 0;

  // 1. Header — the qualitative-review framing (one line; scores are
  // deliberately not the headline here).
  root.appendChild(ui.insightHeader({
    icon: 'brain',
    title: 'Performance Insights',
    body: `A qualitative look at how you made decisions during the previous ${store.state.industry.language.scenarioWord}.`
  }));

  // Phase-advance banner — when this run unlocked the next phase, name it.
  if (result.phaseAdvancedTo) {
    root.appendChild(phaseAdvanceBanner(result.phaseAdvancedTo));
  }

  // Readiness movement (only when we captured before/after on this run) —
  // the one sanctioned headline number for this page.
  if (typeof result.readinessBefore === 'number' && typeof result.readinessAfter === 'number') {
    root.appendChild(ui.readinessDelta({
      before: result.readinessBefore,
      after:  result.readinessAfter
    }));
  }

  // Compact run meta — scenario · time · decisions. No score bar / "bundle
  // adherence": that re-introduced a number the framing above plays down.
  root.appendChild(ui.el('p', { class: 'run-meta' },
    [sc.title, formatElapsed(elapsed), `${result.stepResults.length} decisions`]
      .filter(Boolean).join('  ·  ')
  ));

  // 2. Observations — strengths + growth, consolidated into one card
  // instead of a separate stripe-card per observation.
  const insights = generateInsights(result, sc);
  if (insights.length) {
    root.appendChild(ui.observationList(insights));
  } else {
    root.appendChild(ui.el('div', { class: 'card' },
      ui.el('p', { class: 'tiny muted', style: { margin: '0' } },
        'No standout patterns surfaced this round — the rhythm matters more than any single decision.')));
  }

  // 3. Concepts this run counted toward — names only (a single muted line,
  // not a card of mastery bars). Labels may come from any course in the
  // catalog, since standalone practice isn't tied to a course.
  const conceptLabel = (cid) => {
    for (const c of store.state.courses) {
      const m = c.concepts?.find((x) => x.id === cid);
      if (m) return m.label;
    }
    return cid;
  };
  const credited = (sc.concepts || []).map(conceptLabel);
  if (credited.length) {
    root.appendChild(ui.el('p', { class: 'run-meta credited-line' },
      ui.el('span', { class: 'muted' }, 'Counted toward: '),
      credited.join(', ')
    ));
  }

  // Continue target — next lesson in course if there's progress to resume,
  // else back to the course / practice hub.
  const next = nextLesson(course);

  // 4. Actions — Retry + Continue, pinned to the bottom of the page in
  // place of the tab bar so the next action is always reachable.
  const retryHref = `#/practice/${sc.id}?retry=${(result.retryCount ?? 0) + 1}`;
  root.appendChild(ui.stickyFooter({ children: [
    ui.el('a', { class: 'btn block', href: retryHref },
      ui.icon('retry'),
      ui.el('span', null, 'Retry scenario')
    ),
    ui.el('a', { class: 'btn primary block cta-large', href: next?.href ?? (course ? `#/course/${course.id}` : '#/home'),
      style: { marginTop: '8px' } },
      ui.el('span', null, next ? 'Continue to next lesson' : (course ? 'Back to course' : 'Back home')),
      ui.icon('arrowRight')
    )
  ] }));

  return root;
}

// ----------------- insight generation -----------------

function generateInsights(result, sc) {
  const out = [];
  for (const r of result.stepResults) {
    const step = sc.steps.find((s) => s.id === r.stepId);
    if (!step) {
      // Discussion-mode results key off beat ids (not sc.steps), so they carry
      // their own coaching text. Surface it directly rather than dropping it —
      // otherwise the whole debrief comes back empty.
      if (r.insight) {
        out.push({
          tone: r.outcome === 'good' ? 'strength' : 'growth',
          quote: r.insight,
          indicator: r.indicator || 'Decision-making'
        });
      }
      continue;
    }
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

function phaseAdvanceBanner(phase) {
  const pw = store.state.industry?.language?.practiceWord || 'scenario';
  const copy = {
    2: { kicker: 'Practice unlocked', title: 'Standalone scenarios are now in your Practice tab.',
         body: 'Your course-embedded run opened up independent practice. Try one on your own to widen the base.',
         cta: { label: 'Open Practice', href: '#/practice' } },
    3: { kicker: 'Tailored course ready', title: 'A course was just adapted from your recent practice.',
         body: 'Some lessons are flagged for skip based on what you\'ve already shown. You can review or move on.',
         cta: { label: 'View tailored course', href: '#/courses' } },
    4: { kicker: 'Policy change detected', title: `Your readiness shifted — Coach Vic has a ${pw} ready.`,
         body: `Open the home view or tap Coach Vic for the targeted ${pw}.`,
         cta: { label: 'Back home', href: '#/home' } }
  }[phase];
  if (!copy) return ui.el('div');
  return ui.el('div', { class: 'card', style: { borderLeft: '3px solid var(--accent)' } },
    ui.el('div', { class: 'tag accent', style: { display: 'inline-block', marginBottom: '6px' } }, copy.kicker),
    ui.el('h3', { style: { margin: '4px 0 6px' } }, copy.title),
    ui.el('p', { class: 'tiny muted', style: { margin: '0 0 10px' } }, copy.body),
    ui.el('a', { class: 'btn primary block', href: copy.cta.href }, copy.cta.label)
  );
}

// nextLesson — resolves the footer "Continue" target: the next lesson to
// resume in this course, if there's saved progress. Returns null for
// standalone practice (no course) or when the course is finished, letting
// the caller fall back to the course / home.
function nextLesson(course) {
  if (!course) return null;
  const progress = store.state.mastery.courseProgress[course.id];
  if (!progress) return null;
  const idx = course.lessons.findIndex((c) => c.id === progress.lesson);
  const next = course.lessons[idx];
  if (!next) return null;
  return { href: `#/course/${course.id}/lesson/${next.id}` };
}

function formatElapsed(seconds) {
  if (!seconds) return null;
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
