// views/guide.js — User testing guide.
// A standalone reference page accessible from the launchpoint. The intent
// is for testers to open this in one tab and the prototype in another,
// so the layout is reading-optimised (max-width, generous spacing) and
// stays on the dark launch theme rather than the prototype shell.

export function render() {
  const root = document.createElement('section');
  root.className = 'guide';
  root.innerHTML = `
    <header class="guide-hero">
      <div class="brand">
        <span class="brand-mark brand-mark-cyan" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="aith-guide-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#3ec8ff"/>
                <stop offset="1" stop-color="#7ee0ff"/>
              </linearGradient>
            </defs>
            <path d="M16 3.5c-1.4 0-2.6.8-3.2 2L4.6 22.7c-.7 1.5.4 3.3 2.1 3.3h3.1c1 0 1.9-.6 2.2-1.5l.6-1.7h7l.6 1.7c.3.9 1.2 1.5 2.2 1.5h3.1c1.7 0 2.8-1.8 2.1-3.3L19.2 5.5c-.6-1.2-1.8-2-3.2-2zM13.7 18.4L16 12.2l2.3 6.2h-4.6z" fill="url(#aith-guide-g)"/>
          </svg>
        </span><span class="brand-name" style="font-weight:700">Aithera</span>
      </div>
      <a class="guide-back" href="#/launch">← Back to launch</a>
      <h1>User testing guide</h1>
      <p class="guide-sub">A walkthrough that touches all four phase types in order. Each phase auto-advances when the prior phase's anchor scenario is completed, so the happy path is mostly linear.</p>
      <p class="guide-tip">Tip: open the prototype in a second tab so you can keep this guide visible while you click through.</p>
    </header>

    <div class="guide-body">

      <section class="guide-section">
        <h2>Setup</h2>
        <ol class="guide-list">
          <li>Open the app — lands on the launch page.</li>
          <li>Pick a learner profile (e.g. <strong>EMS</strong>) → tap <strong>Launch experience</strong>.</li>
          <li><em>Optional, for jumping around:</em> open <code>#/profile</code> → <strong>Prototype Controls</strong> card has Phase 1–4 jump buttons + Reset progress.</li>
        </ol>
      </section>

      <section class="guide-section">
        <div class="guide-phase-head">
          <span class="guide-phase-tag">Phase 1</span>
          <h2>Course completion (baseline)</h2>
        </div>
        <p class="guide-goal"><strong>Goal:</strong> show the core lesson flow + modality switcher.</p>
        <ol class="guide-list">
          <li>From Home, note the <strong>Next up</strong> card pointing to the Phase 1 course.</li>
          <li>Tap into it (or go to <strong>Courses</strong> → <em>"Patient Assessment on a Routine Call"</em>).</li>
          <li>On the course detail page, tap <strong>Start course ›</strong>.</li>
          <li>Walk through the four lesson steps:
            <ul class="guide-sublist">
              <li><strong>Watch</strong> — hero video. Try the <strong>"Try another way"</strong> panel (Read to me / Summary / Simpler terms / Ask Coach Vic). Tap <strong>Continue</strong>.</li>
              <li><strong>Learn</strong> — concept cards. Modality switcher works here too.</li>
              <li><strong>Check</strong> — answer the knowledge check.</li>
              <li><strong>Recap</strong> — tap <strong>Practice now</strong> to launch the embedded scenario directly. (Or <strong>Mark complete &amp; continue</strong> to finish the lesson normally.)</li>
            </ul>
          </li>
          <li>Complete the embedded scenario → <strong>auto-advances to Phase 2</strong>.</li>
        </ol>
        <p class="guide-note">In Phase 1 the catalog reads everything as "Recommended". Urgency signals (Required badges, mandate footnotes) don't surface until Phase 4.</p>
      </section>

      <section class="guide-section">
        <div class="guide-phase-head">
          <span class="guide-phase-tag">Phase 2</span>
          <h2>Practice after course completion</h2>
        </div>
        <p class="guide-goal"><strong>Goal:</strong> show that standalone practice (not tied to a course) is now unlocked.</p>
        <ol class="guide-list">
          <li>Tap <strong>Practice</strong> in the tabbar.</li>
          <li>A new P2 scenario appears in the catalog that wasn't there before — it has no parent course.</li>
          <li>Open it and run through it → <strong>auto-advances to Phase 3</strong>.</li>
        </ol>
        <p class="guide-prompt"><em>Talking point:</em> "What was missing before? What's new now?"</p>
      </section>

      <section class="guide-section">
        <div class="guide-phase-head">
          <span class="guide-phase-tag">Phase 3</span>
          <h2>Suggested practice</h2>
        </div>
        <p class="guide-goal"><strong>Goal:</strong> show readiness-driven recommendation + adaptive course.</p>
        <ol class="guide-list">
          <li>On the Practice Hub, the <strong>Practice Readiness</strong> card now surfaces top movers and a featured scenario.</li>
          <li>Visit <strong>Courses</strong> — a new adaptive course appears at the top, badged <strong>✨ Tailored for you</strong>: <em>"Emergency Response Decision-Making Under Stress"</em>. It tailors itself with skip chips based on what the user already knows.</li>
          <li>Run the featured P3 scenario from the Practice Hub → <strong>auto-advances to Phase 4</strong>.</li>
        </ol>
        <p class="guide-prompt"><em>Talking point:</em> "How does this differ from just browsing the catalog?"</p>
      </section>

      <section class="guide-section">
        <div class="guide-phase-head">
          <span class="guide-phase-tag">Phase 4</span>
          <h2>Dynamic learning (policy event)</h2>
        </div>
        <p class="guide-goal"><strong>Goal:</strong> show reactive, externally-triggered learning + urgency entering the experience.</p>
        <ol class="guide-list">
          <li>On phase entry, a <strong>policy modal</strong> pops automatically explaining a new protocol drop and the resulting readiness dip.</li>
          <li>Dismiss it. Visit <strong>Courses</strong> — note that <strong>Required</strong> badges now appear (e.g. on Hazmat) and the mandate footnote shows on course detail pages. Urgency has entered the experience.</li>
          <li>The <strong>Coach Vic FAB</strong> is now more proactive — open it to see the prompt.</li>
          <li>Follow Coach Vic's suggestion into the targeted practice for the new policy.</li>
        </ol>
        <p class="guide-prompt"><em>Talking point:</em> "How does it feel when learning comes to you vs. you going to it?"</p>
      </section>

      <section class="guide-section">
        <h2>Tester tips</h2>
        <ul class="guide-list">
          <li><strong>Reset between sessions:</strong> <code>#/profile</code> → <em>Reset progress</em> (keeps profile, clears phase + practice history).</li>
          <li><strong>Skip ahead:</strong> <code>#/profile</code> → Phase buttons (auto-seeds coherent state so the jumped-to phase reads correctly).</li>
          <li><strong>Watch for:</strong> modality switcher discoverability (Phase 1), the "aha" of unlocked content (Phases 2–3), and the reactivity of the policy drop + emergence of urgency (Phase 4).</li>
        </ul>
      </section>

      <footer class="guide-foot">
        <a class="btn primary block" href="#/launch">← Back to launch</a>
      </footer>
    </div>
  `;
  return root;
}
