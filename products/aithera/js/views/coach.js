// views/coach.js — Coach Vic chat surface.
// Composition matches the mockup: date divider, dark coach bubbles
// with timestamps, light learner bubbles, embedded Concept Breakdown
// card when relevant, and a composer with attach + mic + send.
//
// The thread is sourced from the shared chat session in `store.chats` so
// conversations started in the FAB popover continue here without losing
// any context. If the session is empty, Vic opens proactively.

import { store } from '../store.js';
import { coach } from '../coach.js';
import * as ui from '../ui.js?v=scene-flow-8';

export function render() {
  const root = document.createElement('section');
  root.className = 'coach-view';

  const session = store.chatActiveOrCreate();

  // Vic header strip
  root.appendChild(headerStrip());

  // Thread container — scrolls internally so the composer stays pinned
  const thread = ui.el('div', { class: 'coach-thread stack' });
  root.appendChild(thread);

  // Date divider above first messages
  thread.appendChild(ui.dateDivider(formatDate()));

  // Suggested-quick-replies row (replaced after each Vic reply)
  const suggBox = ui.el('div', { class: 'coach-sugg' });
  root.appendChild(suggBox);

  // Composer (pinned to the bottom of the coach view, just above the tab bar)
  const composer = ui.chatComposer({
    onSend: (text) => onLearnerMessage(text),
    onMic:  () => onMic(),
    onAttach: () => alert('Attachments are stubbed in this prototype.')
  });
  root.appendChild(composer);

  // ---------- behaviors ----------

  function scrollToEnd() {
    requestAnimationFrame(() => {
      thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    });
  }

  function appendCoach(reply, persist = true) {
    const extras = [];
    if (reply.card) extras.push(renderCard(reply.card, reply));
    extras.push(citeTag(reply));
    const bubble = ui.chatBubble({ tone: 'coach', text: reply.text, time: reply.time, children: extras });
    // Animate only live arrivals — not the backlog replayed on mount (persist=false),
    // which would re-animate the whole thread on every entry into the view.
    if (persist) bubble.classList.add('cc-anim-in');
    thread.appendChild(bubble);
    suggBox.replaceChildren(ui.suggestedChips(reply.suggested ?? [], (s) => onLearnerMessage(s)));
    scrollToEnd();
    if (persist) {
      store.chatAdd(session.id, { role: 'coach', text: reply.text, time: reply.time, reply });
    }
  }

  function appendMe(text, persist = true) {
    const time = nowStamp();
    const bubble = ui.chatBubble({ tone: 'me', text, time });
    if (persist) bubble.classList.add('cc-anim-in');   // live message only (see appendCoach)
    thread.appendChild(bubble);
    suggBox.replaceChildren();
    scrollToEnd();
    if (persist) {
      store.chatAdd(session.id, { role: 'me', text, time });
    }
  }

  async function onLearnerMessage(text) {
    appendMe(text);
    setTimeout(async () => {
      const reply = await coach.reply(text);
      appendCoach(reply);
    }, 380);
  }

  function onMic() {
    const btn = composer.querySelector('.cc-mic');
    btn.classList.add('listening');
    setTimeout(() => {
      btn.classList.remove('listening');
      onLearnerMessage('What\'s most important for me to focus on right now?');
    }, 900);
  }

  // ---------- bootstrap: replay session, or open proactively ----------
  (async () => {
    if (session.messages.length === 0) {
      const op = await coach.opener();
      appendCoach(op);
    } else {
      for (const m of session.messages) {
        if (m.role === 'me') appendMe(m.text, false);
        else appendCoach(m.reply || { text: m.text, time: m.time }, false);
      }
    }
  })();

  return root;
}

// ---------- helpers ----------

function headerStrip() {
  return ui.el('div', { class: 'vic-header' },
    ui.el('div', { class: 'vic-mark' }, vicGlyph()),
    ui.el('div', { class: 'vic-meta' },
      ui.el('strong', null, 'Coach Vic')
    ),
    ui.el('div', { class: 'vic-actions' },
      ui.el('a', {
        class: 'vic-iconbtn', 'aria-label': 'Chat history',
        href: '#/coach/history'
      }, ui.icon('list')),
      ui.el('button', {
        class: 'vic-iconbtn', 'aria-label': 'New chat',
        on: { click: () => { store.chatNew(); location.reload(); } }
      }, ui.icon('sparkle'))
    )
  );
}

function vicGlyph() {
  return ui.el('span', {
    class: 'vic-glyph sm',
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.4" fill="currentColor"/><circle cx="15" cy="13" r="1.4" fill="currentColor"/><path d="M12 4v3"/><circle cx="12" cy="3.5" r="0.8" fill="currentColor"/></svg>`
  });
}

function renderCard(card, reply) {
  if (card.type === 'concept-breakdown') {
    const courseId = reply.cite?.courseId;
    return ui.conceptBreakdown({
      ...card,
      onReview: courseId ? () => location.hash = `#/course/${courseId}` : null,
      onPractice: () => {
        const sc = store.state.scenarios[0];
        if (sc) location.hash = `#/practice/${sc.id}`;
      }
    });
  }
  return null;
}

function citeTag(reply) {
  if (reply.cite) {
    const course = store.course(reply.cite.courseId);
    if (course) {
      const a = ui.el('a', { class: 'tag accent', style: { marginTop: '2px', display: 'inline-flex' },
        href: `#/course/${course.id}` }, `Source: ${course.title}`);
      return a;
    }
  }
  if (reply.offScript) {
    return ui.el('span', { class: 'tag warn', style: { marginTop: '2px', display: 'inline-flex' } },
      'Outside course library — verify with a peer or supervisor');
  }
  if (reply.bounded) {
    return ui.el('span', { class: 'tag warn', style: { marginTop: '2px', display: 'inline-flex' } },
      'No matching source — Vic will not guess');
  }
  if (reply.escalated) {
    return ui.el('span', { class: 'tag bad', style: { marginTop: '2px', display: 'inline-flex' } },
      'Escalated — outside coaching scope');
  }
  if (reply.suggestPractice) {
    const sc = store.state.scenarios[0];
    if (sc) {
      return ui.el('a', { class: 'btn primary sm', style: { marginTop: '4px', display: 'inline-flex' },
        href: `#/practice/${sc.id}` }, `Run "${sc.title}" →`);
    }
  }
  return null;
}

function formatDate() {
  const d = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
}

function nowStamp() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = String(((h + 11) % 12) + 1).padStart(2, '0');
  return `${hr}:${m} ${ampm}`;
}
