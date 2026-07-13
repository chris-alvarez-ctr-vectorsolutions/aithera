/* ============================================================================
   lesson.js — shared behaviors for Lesson Presentation experiments.

   Exposes a small global `Lesson` API so individual lesson pages stay lean:

     Lesson.chat.configure({ title, subtitle, intro, suggestions, fallback })
        - builds (once) the slide-in side panel and seeds the conversation
        - suggestions: [{ q: 'shown on chip & as user msg', a: 'bot reply' }, ...]
        - fallback: bot reply used when a typed question isn't recognized
     Lesson.chat.open() / close() / toggle()

   The chat is a *simulated* assistant: replies are canned (matched from the
   configured suggestions, else the fallback). No network calls.
   ========================================================================== */
(function () {
  'use strict';

  const Lesson = (window.Lesson = window.Lesson || {});

  /* --- tiny DOM helper --------------------------------------------------- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v != null) node.setAttribute(k, v);
      }
    }
    (Array.isArray(children) ? children : [children])
      .filter((c) => c != null)
      .forEach((c) => node.append(c.nodeType ? c : document.createTextNode(c)));
    return node;
  }

  /* ======================================================================
     Chat widget
     ====================================================================== */
  const chat = (Lesson.chat = {});

  let cfg = null;
  let panel, threadEl, suggEl, textarea, sendBtn;
  let seeded = false;
  let busy = false;

  chat.configure = function (config) {
    cfg = config || {};
    if (!panel) build();
    seeded = false;          // re-seed if reconfigured
  };

  function build() {
    threadEl = el('div', { class: 'chat-thread', 'aria-live': 'polite' });
    suggEl = el('div', { class: 'chat-suggestions' });

    textarea = el('textarea', {
      rows: '1',
      placeholder: 'Ask a question…',
      'aria-label': 'Ask a question',
      oninput: autosize,
      onkeydown: (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      },
    });

    sendBtn = el('button', {
      class: 'chat-send',
      'aria-label': 'Send',
      onclick: submit,
    }, el('i', { class: 'fa-solid fa-paper-plane' }));

    // Non-modal side panel: the lesson stays usable while it's open, so it is
    // deliberately NOT role="dialog" (no trap). While closed it sits offscreen
    // via transform — `inert` keeps its controls out of the tab order then.
    panel = el('aside', {
      class: 'lesson-chat',
      'aria-label': 'Ask about this term',
      'aria-hidden': 'true',
    }, [
      el('header', { class: 'chat-head' }, [
        el('div', { class: 'chat-avatar' }, el('i', { class: 'fa-solid fa-wand-magic-sparkles' })),
        el('div', { class: 'chat-head-text' }, [
          el('div', { class: 'chat-title', text: cfg.title || 'Ask about this' }),
          el('div', { class: 'chat-sub', text: cfg.subtitle || 'AI learning helper' }),
        ]),
        el('button', { class: 'chat-close', 'aria-label': 'Close chat', onclick: chat.close },
          el('i', { class: 'fa-solid fa-xmark' })),
      ]),
      threadEl,
      suggEl,
      el('div', { class: 'chat-composer' }, [textarea, sendBtn]),
    ]);

    panel.inert = true;
    document.body.appendChild(panel);
  }

  function autosize() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  function seed() {
    threadEl.replaceChildren();
    if (cfg.intro) addMsg('bot', cfg.intro);
    renderSuggestions(cfg.suggestions || []);
    seeded = true;
  }

  function renderSuggestions(list) {
    suggEl.replaceChildren();
    list.forEach((s) => {
      suggEl.appendChild(
        el('button', { class: 'chat-chip', onclick: () => ask(s.q, s.a) }, s.q)
      );
    });
  }

  function addMsg(who, text) {
    const m = el('div', { class: 'chat-msg ' + who, text });
    threadEl.appendChild(m);
    scrollDown();
    return m;
  }

  function scrollDown() {
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function showTyping() {
    // aria-hidden keeps the empty dots from triggering blank announcements
    // in the aria-live thread.
    const t = el('div', { class: 'chat-typing', 'aria-hidden': 'true' }, [
      el('span'), el('span'), el('span'),
    ]);
    threadEl.appendChild(t);
    scrollDown();
    return t;
  }

  /* Send a question and reply with a specific (or matched) canned answer. */
  function ask(question, answer) {
    if (busy) return;
    addMsg('user', question);
    suggEl.replaceChildren();          // clear chips once the learner engages
    busy = true;

    const typing = showTyping();
    const reply = answer != null ? answer : matchAnswer(question);
    const delay = 500 + Math.min(reply.length * 12, 1100);

    window.setTimeout(() => {
      typing.remove();
      addMsg('bot', reply);
      busy = false;
    }, delay);
  }

  /* Match a typed question against configured suggestions, else fallback. */
  function matchAnswer(q) {
    const text = q.toLowerCase();
    const hit = (cfg.suggestions || []).find((s) => {
      const key = s.q.toLowerCase();
      return text.includes(key) || key.includes(text);
    });
    if (hit) return hit.a;
    // loose keyword match against suggestion questions
    const words = text.split(/\W+/).filter((w) => w.length > 3);
    const scored = (cfg.suggestions || [])
      .map((s) => ({ s, n: words.filter((w) => s.q.toLowerCase().includes(w)).length }))
      .sort((a, b) => b.n - a.n)[0];
    if (scored && scored.n > 0) return scored.s.a;
    return cfg.fallback || "That's a great question — in a live lesson I'd dig into it with you.";
  }

  function submit() {
    const val = textarea.value.trim();
    if (!val || busy) return;
    textarea.value = '';
    autosize();
    ask(val);
  }

  let chatLastFocused = null;

  chat.open = function () {
    if (!panel) return;
    if (!seeded) seed();
    chatLastFocused = document.activeElement;
    panel.classList.add('open');
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    document.querySelector('.lesson-shell')?.classList.add('chat-open');
    document.body.classList.add('chat-open');
    window.setTimeout(() => textarea && textarea.focus(), 320);
  };

  chat.close = function () {
    if (!panel) return;
    panel.classList.remove('open');
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    document.querySelector('.lesson-shell')?.classList.remove('chat-open');
    document.body.classList.remove('chat-open');
    // Return focus to whatever opened the panel (e.g. the "Ask about this" button).
    if (chatLastFocused && chatLastFocused.focus && document.contains(chatLastFocused)) {
      chatLastFocused.focus();
    }
  };

  chat.toggle = function () {
    panel && panel.classList.contains('open') ? chat.close() : chat.open();
  };

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && panel.classList.contains('open')) chat.close();
  });

  /* ======================================================================
     Modal — a simple, temporary popover for clarifiers / "more info".

       Lesson.modal.open({ title, body, icon, cta })
         - title : heading text
         - body  : string (paragraphs split on blank lines) or a DOM node
         - icon  : optional Font Awesome class (default: circle-question)
         - cta   : optional dismiss-button label (default: "Got it")

     One backdrop element is reused across calls. Closes on the close button,
     the CTA, a backdrop click, or Escape.
     ====================================================================== */
  const modal = (Lesson.modal = {});

  let backdrop, modalTitleEl, modalBodyEl, modalIconEl, modalCtaEl, lastFocused;

  function buildModal() {
    modalIconEl = el('i', { class: 'fa-solid fa-circle-question' });
    modalTitleEl = el('h2', { class: 'lesson-modal-title', id: 'lessonModalTitle' });
    modalBodyEl = el('div', { class: 'lesson-modal-body' });
    modalCtaEl = el('vaadin-button', { theme: 'primary', onclick: modal.close }, 'Got it');

    const dialog = el('div', {
      class: 'lesson-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'lessonModalTitle',
    }, [
      el('header', { class: 'lesson-modal-head' }, [
        el('span', { class: 'lesson-modal-icon' }, modalIconEl),
        modalTitleEl,
        el('button', { class: 'lesson-modal-close', 'aria-label': 'Close', onclick: modal.close },
          el('i', { class: 'fa-solid fa-xmark' })),
      ]),
      modalBodyEl,
      el('footer', { class: 'lesson-modal-foot' }, modalCtaEl),
    ]);

    backdrop = el('div', {
      class: 'lesson-modal-backdrop',
      onclick: (e) => { if (e.target === backdrop) modal.close(); },
    }, dialog);

    // While closed the backdrop is only visually hidden (opacity 0) — `inert`
    // keeps its buttons out of the tab order until it opens.
    backdrop.inert = true;
    document.body.appendChild(backdrop);

    // Focus trap: while the modal is open, Tab cycles within the dialog.
    backdrop.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !backdrop.classList.contains('open')) return;
      const focusables = dialog.querySelectorAll(
        'button, vaadin-button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  modal.open = function (opts) {
    const o = opts || {};
    if (!backdrop) buildModal();

    modalIconEl.className = 'fa-solid ' + (o.icon || 'fa-circle-question');
    modalTitleEl.textContent = o.title || '';
    modalCtaEl.textContent = o.cta || 'Got it';

    modalBodyEl.replaceChildren();
    if (o.body && o.body.nodeType) {
      modalBodyEl.appendChild(o.body);
    } else {
      String(o.body || '')
        .split(/\n{2,}/)
        .forEach((para) => modalBodyEl.appendChild(el('p', { text: para })));
    }

    lastFocused = document.activeElement;
    backdrop.classList.add('open');
    backdrop.inert = false;
    window.setTimeout(() => modalCtaEl && modalCtaEl.focus(), 60);
  };

  modal.close = function () {
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.inert = true;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) modal.close();
  });

  /* ======================================================================
     Radio-group keyboard pattern — call on a container holding
     role="radio" buttons that already select on click. Adds the behavior
     the announced semantics promise: one tab stop (roving tabindex) and
     Arrow/Home/End to move + select.

       Lesson.radiogroup(containerEl)
     ====================================================================== */
  Lesson.radiogroup = function (group) {
    if (!group) return;
    const radios = () => Array.from(group.querySelectorAll('[role="radio"]'));

    function roving() {
      const list = radios();
      const checked = list.find((r) => r.getAttribute('aria-checked') === 'true');
      list.forEach((r) => { r.tabIndex = r === (checked || list[0]) ? 0 : -1; });
    }

    group.addEventListener('keydown', (e) => {
      const list = radios();
      const i = list.indexOf(document.activeElement);
      if (i === -1) return;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(i + 1) % list.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
      else if (e.key === 'Home') next = list[0];
      else if (e.key === 'End') next = list[list.length - 1];
      if (!next) return;
      e.preventDefault();
      next.click();      // select through the page's existing handler
      next.focus();
      roving();
    });

    // Keep the roving tabindex in sync with pointer selection too.
    group.addEventListener('click', () => window.setTimeout(roving, 0));
    roving();
  };

  /* ======================================================================
     Scroll cue — a shell-level affordance for content that outgrows the
     slide. The lesson body scrolls between the fixed header/footer; when
     there's more below the fold, a "Scroll" pill fades in (and nudges the
     body down on click). It hides once you reach the bottom or the content
     fits. Self-initializes for any page that loads this script, so every
     content type gets it without extra wiring.

       Lesson.scrollCue.refresh()  — re-evaluate after you change content
     ====================================================================== */
  const scrollCue = (Lesson.scrollCue = {});
  let cueEl, body, rafPending = false;

  // This shell overflows at the page level: .lesson-body only has a
  // min-height, so it grows with content and the document scrolls (the fixed
  // header/footer just overlay it). So we measure the document scroller, not
  // .lesson-body — but still watch .lesson-body for content changes.
  function metrics() {
    const doc = document.scrollingElement || document.documentElement;
    return { remaining: doc.scrollHeight - doc.scrollTop - doc.clientHeight };
  }

  function buildCue() {
    cueEl = el('button', {
      class: 'lesson-scroll-cue',
      type: 'button',
      'aria-label': 'Scroll down for more',
      onclick: nudge,
    }, ['Scroll', el('i', { class: 'fa-solid fa-chevron-down' })]);
    document.body.appendChild(cueEl);
  }

  function nudge() {
    window.scrollBy({ top: Math.round(window.innerHeight * 0.55), behavior: 'smooth' });
  }

  function updateCue() {
    if (!cueEl) return;
    cueEl.classList.toggle('show', metrics().remaining > 8);
  }

  function scheduleUpdate() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; updateCue(); });
  }

  scrollCue.refresh = scheduleUpdate;

  scrollCue.init = function () {
    body = document.querySelector('.lesson-body');
    if (!body) return;
    if (!cueEl) buildCue();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    // Content changes (screen switches, async-loaded components/fonts) shift
    // the height — re-check whenever the body subtree mutates.
    new MutationObserver(scheduleUpdate)
      .observe(body, { childList: true, subtree: true, attributes: true, characterData: true });

    updateCue();
    window.setTimeout(updateCue, 200);   // after components/fonts settle
    window.setTimeout(updateCue, 600);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrollCue.init);
  } else {
    scrollCue.init();
  }
})();
