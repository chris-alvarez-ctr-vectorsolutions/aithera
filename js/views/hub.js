// views/hub.js — Practice Hub.
// Dedicated practice surface composed from ui.js primitives. Mirrors
// the desktop mockup in single-column form:
//
//   1. Header: kicker + title + Random Scenario CTA
//   2. Cumulative-practice stat hero (hours)
//   3. Mastery card (Scenarios / Edge cases / Mastery %)
//   4. Featured scenario hero (industry-flagged)
//   5. Scenario catalog with topic filter + difficulty sort
//   6. Footer: weekly streak + next review reminder
//
// Empty-state-aware: when a learner has no practice history, the stats
// degrade gracefully and the catalog leads with active scenarios so
// there's something to *do* immediately. Stats ramp up as practice
// accrues — that's the "grows over time" promise.

import { store } from '../store.js';
import * as adaptive from '../adaptive.js';
import * as ui from '../ui.js';

const DIFFICULTY_RANK = { standard: 1, 'high-risk': 2, expert: 3 };

export function render() {
  const root = document.createElement('section');
  const ind = store.state.industry;
  const learner = store.state.learner;
  const allForIndustry = store.state.scenarios.filter((s) => s.industry === learner.industry);
  const stats = computeStats(allForIndustry);
  const learnerLevel = computeLevel(stats.scenariosRun);

  // 1. Header
  root.appendChild(ui.hubHeader({
    kicker: `${ind.label} · Clinical readiness`,
    title: 'Practice Hub',
    onRandom: () => {
      const sc = pickRandom(allForIndustry, learnerLevel);
      if (sc) location.hash = `#/practice/${sc.id}`;
    }
  }));

  // 2. Stat hero — cumulative practice time
  root.appendChild(ui.statHero({
    kicker: 'Cumulative practice',
    value: stats.hours.toFixed(1),
    unit: stats.hours === 1 ? 'hour' : 'hours',
    sub: stats.scenariosRun > 0
      ? `Top ${stats.percentile}% of practitioners in your role`
      : 'Run your first scenario to start tracking practitioner percentile.',
    ic: 'trending'
  }));

  // 3. Mastery card
  root.appendChild(ui.masteryCard({
    scenarios: stats.scenariosRun,
    edgeCases: stats.edgeCasesRun,
    masteryPct: stats.masteryPct
  }));

  // 4. Featured scenario
  const featured = pickFeatured(allForIndustry, learnerLevel);
  if (featured) {
    root.appendChild(featuredCard(featured, ind));
  }

  // 5. Catalog
  root.appendChild(ui.sectionHeader('Scenario catalog'));
  const topics = uniqueTopics(allForIndustry);
  const catalog = ui.el('div', null);
  const filters = ui.catalogFilters({ topics, onChange: paint });
  root.appendChild(filters.node);
  root.appendChild(catalog);

  function paint() {
    catalog.replaceChildren();
    let items = allForIndustry.slice();
    const topic = filters.getTopic();
    if (topic) items = items.filter((s) => (s.topics || []).includes(topic));
    items = sortBy(items, filters.getSort());

    if (!items.length) {
      catalog.appendChild(ui.el('p', { class: 'muted tiny', style: { padding: '8px 4px' } }, 'No scenarios match this filter.'));
      return;
    }

    for (const sc of items) {
      const status = scenarioStatus(sc, learnerLevel);
      const scorePct = lastBestScorePct(sc.id);
      catalog.appendChild(ui.scenarioCatalogCard({
        scenario: sc,
        status,
        scorePct,
        onLockedClick: (e) => {
          e.preventDefault();
          alert(`This scenario unlocks at level ${sc.unlocksAtLevel}. You're at level ${learnerLevel}. Run more core scenarios to level up.`);
        }
      }));
    }
  }
  paint();

  // 6. Footer (streak + next review)
  root.appendChild(footer(stats));

  return root;
}

// ---------------- helpers ----------------

function featuredCard(sc, industry) {
  const tags = [];
  if (sc.highRisk) tags.push({ label: 'High risk', tone: 'bad' });
  if (sc.difficulty === 'expert') tags.push({ label: 'Expert level', tone: 'plain' });
  if (sc.tier === 'edge')         tags.push({ label: 'Edge case',   tone: 'info' });
  return ui.featuredScenario({
    id: sc.id,
    title: sc.title,
    body: sc.outcomeType,
    tags,
    startHref: `#/practice/${sc.id}`,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a3d'
  });
}

function footer(stats) {
  return ui.el('div', { class: 'hub-foot' },
    ui.el('div', null,
      ui.el('small', null, 'Weekly streak'),
      ui.el('strong', null, `${stats.streakDays} days`)
    ),
    ui.el('div', { style: { textAlign: 'right' } },
      ui.el('small', null, 'Next review'),
      ui.el('strong', null, stats.nextReviewLabel)
    )
  );
}

// Compute hub-level stats from learner state. Real data: practice
// records (recentPractice). Mocked data: percentile, next review.
function computeStats(industryScenarios) {
  const learner = store.state.learner;
  const recent = store.state.mastery.recentPractice || [];
  const hours = recent.reduce((s, r) => s + (r.elapsed || 0), 0) / 3600;
  const scenariosRun = recent.length;
  const edgeIds = new Set(industryScenarios.filter((s) => s.tier === 'edge').map((s) => s.id));
  const edgeCasesRun = recent.filter((r) => edgeIds.has(r.scenarioId)).length;

  // Mastery % = average of all concept masteries × 100 (industry-scoped via courses on screen).
  const concepts = store.state.mastery.concepts || {};
  const vals = Object.values(concepts);
  const masteryPct = vals.length
    ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100)
    : 0;

  // Mocked percentile so it visibly grows with use.
  const percentile = Math.max(5, 50 - scenariosRun * 8 - learner.stats.streakDays);

  // Next review: pick the most-imminent cert label, fall back to a generic.
  const nextCert = (learner.certifications || []).slice().sort((a, b) => a.expiresInDays - b.expiresInDays)[0];
  const nextReviewLabel = nextCert
    ? `${nextCert.label} in ${nextCert.expiresInDays}d`
    : 'No reviews scheduled';

  return {
    hours, scenariosRun, edgeCasesRun, masteryPct, percentile,
    streakDays: learner.stats.streakDays, nextReviewLabel
  };
}

function computeLevel(scenariosRun) {
  // Crude level mapping: every 2 scenarios = +1 level, starting at 1.
  return 1 + Math.floor(scenariosRun / 2);
}

function scenarioStatus(sc, level) {
  if (sc.status === 'locked' && (sc.unlocksAtLevel || 5) > level) return 'locked';
  const best = lastBestScorePct(sc.id);
  if (best != null && best >= 90) return 'mastered';
  return 'active';
}

function lastBestScorePct(scenarioId) {
  const recent = store.state.mastery.recentPractice || [];
  const runs = recent.filter((r) => r.scenarioId === scenarioId);
  if (!runs.length) return null;
  return Math.max(...runs.map((r) => Math.round((r.score || 0) * 100)));
}

function uniqueTopics(scenarios) {
  const set = new Set();
  for (const s of scenarios) for (const t of (s.topics || [])) set.add(t);
  return [...set].sort();
}

function sortBy(items, key) {
  const arr = items.slice();
  switch (key) {
    case 'difficulty-asc':  arr.sort((a, b) => (DIFFICULTY_RANK[a.difficulty] || 0) - (DIFFICULTY_RANK[b.difficulty] || 0)); break;
    case 'time-asc':        arr.sort((a, b) => (a.estMinutes || 0) - (b.estMinutes || 0)); break;
    case 'time-desc':       arr.sort((a, b) => (b.estMinutes || 0) - (a.estMinutes || 0)); break;
    case 'difficulty-desc':
    default:                arr.sort((a, b) => (DIFFICULTY_RANK[b.difficulty] || 0) - (DIFFICULTY_RANK[a.difficulty] || 0)); break;
  }
  // Locked items always sink to the end so the catalog leads with playable.
  arr.sort((a, b) => (a.status === 'locked' ? 1 : 0) - (b.status === 'locked' ? 1 : 0));
  return arr;
}

function pickFeatured(scenarios, level) {
  // Prefer a flagged featured scenario that's playable at this level;
  // otherwise the highest-difficulty playable one.
  const playable = scenarios.filter((s) => scenarioStatus(s, level) !== 'locked');
  return playable.find((s) => s.featured)
      || playable.sort((a, b) => (DIFFICULTY_RANK[b.difficulty] || 0) - (DIFFICULTY_RANK[a.difficulty] || 0))[0]
      || null;
}

function pickRandom(scenarios, level) {
  const playable = scenarios.filter((s) => scenarioStatus(s, level) !== 'locked');
  if (!playable.length) return null;
  // Weight scenarios by how unmastered their tied concepts are — so
  // "random" still leans the learner toward gaps.
  const concepts = store.state.mastery.concepts || {};
  const weights = playable.map((s) => {
    const masteryAvg = (s.concepts || []).reduce((acc, cid) => acc + (concepts[cid] ?? 0.5), 0) / Math.max(1, (s.concepts || []).length);
    return Math.max(0.1, 1 - masteryAvg);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < playable.length; i++) {
    r -= weights[i]; if (r <= 0) return playable[i];
  }
  return playable[playable.length - 1];
}
