// views/coach.js — Coach Vic chat surface.
// Composition matches the mockup: date divider, dark coach bubbles
// with timestamps, light learner bubbles, embedded Concept Breakdown
// card when relevant, and a composer with attach + mic + send.
//
// Vic loads a proactive opener tied to the learner's actual mastery
// state so the first message already feels personalized.

import { store } from '../store.js';
import { coach } from '../coach.js';
import * as ui from '../ui.js';

export function render() {
  const root = document.createElement('section');
  root.className = 'stack';

  // Vic header strip
  root.appendChild(headerStrip());

  // Thread container
  const thread = ui.el('div', { class: 'stack' });
  root.appendChild(thread);

  // Date divider above first messages
  thread.appendChild(ui.dateDivider(formatDate()));

  // Suggested-quick-replies row (replaced after each Vic reply)
  const suggBox = ui.el('div', null);
  root.appendChild(suggBox);

  // Composer (sticky bottom)
  const composer = ui.chatComposer({
    onSend: (text) => onLearnerMessage(text),
    onMic:  () => onMic(),
    onAttach: () => alert('Attachments are stubbed in this prototype.')
  });
  root.appendChild(composer);

  // ---------- behaviors ----------

  function appendCoach(reply) {
    const extras = [];
    if (reply.card) extras.push(renderCard(reply.card, reply));
    extras.push(citeTag(reply));
    thread.appendChild(ui.chatBubble({ tone: 'coach', text: reply.text, time: reply.time, children: extras }));
    // Replace the suggested chips
    suggBox.replaceChildren(ui.suggestedChips(reply.suggested ?? [], (s) => onLearnerMessage(s)));
    scrollToEnd();
  }

  function appendMe(text) {
    thread.appendChild(ui.chatBubble({ tone: 'me', text, time: nowStamp() }));
    suggBox.replaceChildren();
    scrollToEnd();
  }

  async function onLearnerMessage(text) {
    appendMe(text);
    // Tiny delay so it feels like Vic is composing.
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

  // ---------- bootstrap with proactive opener ----------
  (async () => {
    const op = await coach.opener();
    appendCoach(op);
  })();

  return root;
}

// ---------- helpers ----------

function headerStrip() {
  const learner = store.state.learner;
  return ui.el('div', { class: 'vic-header' },
    ui.el('div', { class: 'vic-mark' }, 'V'),
    ui.el('div', { class: 'vic-meta' },
      ui.el('strong', null, 'Coach Vic'),
      ui.el('small', null,
        `Bounded to ${learner.role}'s assigned content · cites every claim`)
    ),
    ui.el('div', { class: 'vic-status' },
      ui.el('span', { class: 'dot' }),
      ui.el('span', { class: 'tiny muted' }, 'Online')
    )
  );
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

function scrollToEnd() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
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
