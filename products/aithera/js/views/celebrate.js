// views/celebrate.js — Post-scenario interstitial.
// Sits between the final practice step and the Performance Insights page.
// Frames the readiness change (up / down / neutral) and offers two CTAs:
// "Return home" or "See full results" (primary).

import { store } from '../store.js';
import * as ui from '../ui.js?v=scene-flow-42';

export function render() {
  const result = store.state.session.lastSummary;
  const root = document.createElement('section');
  root.className = 'stack pc-wrap';

  if (!result) {
    root.appendChild(ui.el('p', { class: 'muted' },
      'No recent practice. Try one from the home feed.'));
    return root;
  }

  const sc = store.scenario(result.scenarioId);

  root.appendChild(ui.practiceCelebration({
    before: result.readinessBefore ?? 0,
    after:  result.readinessAfter  ?? 0,
    scenarioTitle: sc?.title,
    onHome:    () => { location.hash = '#/home'; },
    onResults: () => { location.hash = '#/summary'; }
  }));

  return root;
}
