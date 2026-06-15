// views/coach-fab.js — persistent Coach Vic FAB and lightweight chat popover.
// The same chat session backs both this overlay and the full /coach page,
// so promoting "Open in Coach Vic" carries the conversation across.
//
// Handoff triggers (when to surface "Open in Coach Vic →"):
//   - Vic's reply has a card, citation, or suggestPractice CTA
//   - The thread crosses 6 messages (substantive enough to deserve the page)
//   - The user taps attach (file review needs the full surface)

import { store } from '../store.js';
import { coach } from '../coach.js';
import * as ui from '../ui.js?v=scene-flow-42';
import { currentPhase, personaScenarioForPhase } from '../phase.js';

const HANDOFF_THRESHOLD = 6;
let openState = false;
let triggerEl, panelEl, threadEl, suggBox, handoffBanner, composerEl;

export function mount(rootEl) {
  rootEl.replaceChildren();
  rootEl.classList.add('coach-fab-root');

  triggerEl = ui.el('button', {
    class: 'coach-fab-btn',
    'aria-label': 'Chat with Coach Vic',
    'aria-expanded': 'false',
    on: { click: toggle }
  }, vicMark());

  panelEl = ui.el('div', {
    class: 'coach-pop',
    role: 'dialog',
    'aria-label': 'Coach Vic',
    hidden: true
  });

  rootEl.appendChild(panelEl);
  rootEl.appendChild(triggerEl);

  buildPanel();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openState) close();
  });
}

export function setVisible(visible) {
  const root = document.getElementById('coachFab');
  if (!root) return;
  root.hidden = !visible;
  if (!visible) close();
  // Pulse the FAB when the assistant has something proactive to offer.
  // Currently only fires at phase 4 (post policy change).
  if (visible && triggerEl) {
    triggerEl.classList.toggle('proactive', currentPhase() === 4);
  }
}

function buildPanel() {
  const header = ui.el('div', { class: 'cp-head' },
    ui.el('div', { class: 'cp-id' },
      ui.el('span', { class: 'cp-mark' }, vicMark(true)),
      ui.el('div', null,
        ui.el('strong', null, 'Coach Vic'),
        ui.el('small', null, 'Quick chat')
      )
    ),
    ui.el('div', { class: 'cp-head-actions' },
      ui.el('button', {
        class: 'cp-iconbtn', 'aria-label': 'Close',
        on: { click: close }
      }, ui.el('span', { class: 'cp-x' }, '×'))
    )
  );

  threadEl = ui.el('div', { class: 'cp-thread' });
  suggBox = ui.el('div', { class: 'cp-sugg' });
  handoffBanner = ui.el('div', { class: 'cp-handoff', hidden: true },
    ui.el('span', { class: 'cp-handoff-text' }, 'Keep chatting in the full view'),
    ui.el('button', {
      class: 'btn primary sm',
      on: { click: () => promote('substantive') }
    }, 'Open full chat →')
  );

  composerEl = ui.chatComposer({
    placeholder: 'Ask Vic…',
    onSend: (text) => onLearnerMessage(text),
    onMic: () => {},
    onAttach: () => promote('attach')
  });

  panelEl.replaceChildren(header, threadEl, suggBox, handoffBanner, composerEl);
}

// ---------- behaviors ----------

function toggle() {
  if (openState) close();
  else open();
}

async function open() {
  openState = true;
  panelEl.hidden = false;
  triggerEl.setAttribute('aria-expanded', 'true');
  triggerEl.classList.add('is-open');
  document.body.classList.add('coach-fab-open');

  await rehydrate();
  scrollToEnd();
}

function close() {
  openState = false;
  panelEl.hidden = true;
  triggerEl.setAttribute('aria-expanded', 'false');
  triggerEl.classList.remove('is-open');
  document.body.classList.remove('coach-fab-open');
}

// Replay the active session into the panel; if the session is empty, ask
// Vic for an opener and persist it as the first message.
async function rehydrate() {
  const sess = store.chatActiveOrCreate();
  threadEl.replaceChildren();
  suggBox.replaceChildren();

  if (sess.messages.length === 0) {
    const op = currentPhase() === 4 ? phase4Opener() : await coach.opener();
    store.chatAdd(sess.id, { role: 'coach', text: op.text, time: op.time, reply: op });
    appendCoach(op);
  } else {
    for (const m of sess.messages) {
      if (m.role === 'me') {
        threadEl.appendChild(ui.chatBubble({ tone: 'me', text: m.text, time: m.time }));
      } else {
        appendCoach(m.reply || { text: m.text, time: m.time }, /*persist*/ false);
      }
    }
  }

  refreshHandoffBanner();
}

function startFresh() {
  store.chatNew();
  rehydrate();
}

function goHistory() {
  close();
  location.hash = '#/coach/history';
}

function promote(reason) {
  const sess = store.chatActiveOrCreate();
  // Mark the session so the full view can react to the handoff.
  sess.promotedFrom = reason;
  showHandoffOverlay(() => {
    close();
    location.hash = '#/coach';
  });
}

function showHandoffOverlay(after) {
  const overlay = ui.el('div', { class: 'coach-handoff-overlay' },
    ui.el('div', { class: 'cho-card' },
      ui.el('div', { class: 'cho-mark' }, vicMark(true)),
      ui.el('div', { class: 'cho-text' },
        ui.el('strong', null, 'Opening Coach Vic'),
        ui.el('small', null, 'Bringing your chat with you…')
      ),
      ui.el('div', { class: 'cho-bar' }, ui.el('span'))
    )
  );
  document.body.appendChild(overlay);
  // Let CSS transitions fire, then navigate.
  requestAnimationFrame(() => overlay.classList.add('show'));
  setTimeout(() => {
    after();
    setTimeout(() => overlay.remove(), 250);
  }, 700);
}

async function onLearnerMessage(text) {
  const sess = store.chatActiveOrCreate();
  const time = nowStamp();
  store.chatAdd(sess.id, { role: 'me', text, time });
  threadEl.appendChild(ui.chatBubble({ tone: 'me', text, time }));
  suggBox.replaceChildren();
  scrollToEnd();

  setTimeout(async () => {
    const reply = await coach.reply(text);
    store.chatAdd(sess.id, { role: 'coach', text: reply.text, time: reply.time, reply });
    appendCoach(reply);
    refreshHandoffBanner(reply);
  }, 380);
}

function appendCoach(reply, persist = true) {
  // The popover keeps cards and chips out of the bubble itself — the page
  // is too narrow for them and they're a strong signal the chat should
  // graduate to the full view. We surface them via the handoff banner.
  threadEl.appendChild(ui.chatBubble({ tone: 'coach', text: reply.text, time: reply.time }));
  if (reply.suggested?.length) {
    suggBox.replaceChildren(ui.suggestedChips(reply.suggested, (s) => onLearnerMessage(s)));
  } else {
    suggBox.replaceChildren();
  }
  scrollToEnd();
  // persist=false branch is only used during rehydrate; we never write
  // already-persisted messages back to the store.
  void persist;
}

// Show the handoff banner when a reply gives us a strong signal, or when
// the conversation has gotten long enough to be worth promoting.
function refreshHandoffBanner(latestReply) {
  const sess = store.chatActiveOrCreate();
  const long = sess.messages.length >= HANDOFF_THRESHOLD;
  const richReply = latestReply
    ? !!(latestReply.card || latestReply.cite || latestReply.suggestPractice)
    : sess.messages.some((m) => m.reply && (m.reply.card || m.reply.cite || m.reply.suggestPractice));
  handoffBanner.hidden = !(long || richReply);
}

function scrollToEnd() {
  requestAnimationFrame(() => {
    threadEl.scrollTo({ top: threadEl.scrollHeight, behavior: 'smooth' });
  });
}

// ---------- visuals ----------

function vicMark(small) {
  // Friendly robot glyph — matches the FAB icon in the mockup.
  return ui.el('span', {
    class: small ? 'vic-glyph sm' : 'vic-glyph',
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.4" fill="currentColor"/><circle cx="15" cy="13" r="1.4" fill="currentColor"/><path d="M12 4v3"/><circle cx="12" cy="3.5" r="0.8" fill="currentColor"/></svg>`
  });
}

// Phase 4 opener references the policy change and the proactive scenario.
function phase4Opener() {
  const s = store.state;
  const first = (s.learner?.name || '').split(' ')[0];
  const pe = s.policyEvent?.modal;
  const sc = personaScenarioForPhase(4);
  const pw = s.industry?.language?.practiceWord || 'scenario';
  const text = pe
    ? `Heads up, **${first}** — ${pe.headline}. ${pe.body} I can run you through it in ~5 minutes if you're ready.`
    : `Hey ${first} — a recent policy update affects your readiness. Want a quick ${pw}?`;
  return {
    text,
    time: nowStamp(),
    suggested: sc
      ? [`Start "${sc.title}"`, 'Show me what changed', 'Not now']
      : ['Show me what changed', 'Not now']
  };
}

function nowStamp() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = String(((h + 11) % 12) + 1).padStart(2, '0');
  return `${hr}:${m} ${ampm}`;
}
