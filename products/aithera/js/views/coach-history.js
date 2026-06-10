// views/coach-history.js — list of past Coach Vic chat sessions.
// Tapping a session sets it active and opens it in the full coach view.

import { store } from '../store.js';
import * as ui from '../ui.js?v=scene-flow-7';

export function render() {
  const root = document.createElement('section');
  root.className = 'coach-history';

  root.appendChild(ui.el('div', { class: 'ch-head' },
    ui.el('h2', null, 'Coach Vic chats'),
    ui.el('p', { class: 'muted' }, 'Pick up a previous conversation, or start fresh.'),
    ui.el('button', {
      class: 'btn primary',
      on: { click: () => { store.chatNew(); location.hash = '#/coach'; } }
    }, ui.icon('sparkle'), ui.el('span', null, 'New chat'))
  ));

  const list = store.chatList();

  if (list.length === 0) {
    root.appendChild(ui.el('div', { class: 'ch-empty' },
      ui.el('p', null, 'No chats yet.'),
      ui.el('small', { class: 'muted' }, 'Tap the Vic FAB on any page to start a quick chat.')
    ));
    return root;
  }

  const ul = ui.el('div', { class: 'ch-list' });
  for (const s of list) {
    ul.appendChild(historyItem(s));
  }
  root.appendChild(ul);

  return root;
}

function historyItem(s) {
  const firstMine = s.messages.find((m) => m.role === 'me');
  const lastMsg = s.messages[s.messages.length - 1];
  const title = firstMine?.text || lastMsg?.text || 'New conversation';
  const preview = lastMsg?.text || '';

  const item = ui.el('button', {
    class: 'ch-item',
    on: {
      click: () => {
        store.chatSetActive(s.id);
        location.hash = '#/coach';
      }
    }
  },
    ui.el('div', { class: 'ch-item-mark' },
      ui.el('span', { html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.4" fill="currentColor"/><circle cx="15" cy="13" r="1.4" fill="currentColor"/><path d="M12 4v3"/></svg>` })
    ),
    ui.el('div', { class: 'ch-item-body' },
      ui.el('div', { class: 'ch-item-row' },
        ui.el('strong', null, truncate(title, 64)),
        ui.el('span', { class: 'ch-item-time muted' }, fmtTime(s.updatedAt))
      ),
      ui.el('p', { class: 'ch-item-preview muted' }, truncate(preview, 96)),
      ui.el('span', { class: 'ch-item-count tag' }, `${s.messages.length} message${s.messages.length === 1 ? '' : 's'}`)
    ),
    ui.el('span', { class: 'ch-item-chev' }, ui.icon('chevron'))
  );

  return item;
}

function truncate(s, n) {
  // Coach replies use `**bold**`/`*italic*` markdown — strip it for the
  // list preview so users don't see raw asterisks.
  s = String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = String(((h + 11) % 12) + 1);
    return `${hr}:${m} ${ampm}`;
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
