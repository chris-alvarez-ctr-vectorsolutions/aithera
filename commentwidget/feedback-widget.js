// ux-mockups feedback widget
// Embed: <script src="/commentwidget/feedback-widget.js"></script>

(() => {
  // ----- Config ---------------------------------------------------------------
  const CW_WORKER_URL = 'https://ux-mockups-feedback.vectorsolutions-ux.workers.dev';
  const WIDGET_VERSION = '1.0.0';
  const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

  if (window.__cwWidgetLoaded) return;
  window.__cwWidgetLoaded = WIDGET_VERSION;

  // ----- State ----------------------------------------------------------------
  const state = {
    pins: [],
    stranded: [],
    author: localStorage.getItem('cw-author') || '',
    pickMode: false,
    hoverEl: null,
    openPanelPinId: null,
    activeToast: null,
  };

  const pageUrl = location.href.split('#')[0];
  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  const CMD_KEY = IS_MAC ? '⌘' : 'Ctrl';

  // ----- Styles ---------------------------------------------------------------
  const css = `
.cw-root, .cw-root * { box-sizing: border-box; }
.cw-root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #222; }
.cw-hidden { display: none !important; }

/* Pins layer */
.cw-pins { position: absolute; inset: 0; pointer-events: none; z-index: 2147483600; }
.cw-pin { position: absolute; transform: translate(-50%, -100%); width: 28px; height: 28px; border-radius: 50% 50% 50% 0; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,.3); cursor: pointer; pointer-events: auto; border: 2px solid #fff; transition: transform .15s, opacity .3s; }
.cw-pin span { transform: rotate(0); display: inline-block; }
.cw-pin:hover { transform: translate(-50%, -100%) scale(1.1); }
.cw-pin--done { background: #9ca3af; opacity: .7; }
.cw-pin--dragging { cursor: grabbing; opacity: .65; transform: translate(-50%, -100%) scale(1.08); transition: none; }
.cw-pin--done::after { content: "✓"; position: absolute; right: -4px; top: -4px; background: #10b981; color: #fff; width: 14px; height: 14px; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; }

/* Bubble (top-right activation) */
.cw-bubble { position: fixed; top: 20px; right: 20px; z-index: 2147483640; width: 44px; height: 44px; border-radius: 50%; background: #111827; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.25); border: 0; padding: 0; transition: transform .15s, background .15s; }
.cw-bubble:hover { transform: scale(1.06); }
.cw-bubble--active { background: #dc2626; font-size: 18px; }
.cw-bubble-tip { position: absolute; top: 54px; right: 0; background: #111827; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s; }
.cw-bubble:hover .cw-bubble-tip { opacity: 1; }
.cw-banner { position: fixed; top: 28px; right: 76px; z-index: 2147483640; background: #111827; color: #fff; padding: 8px 8px 8px 14px; border-radius: 22px; display: flex; align-items: center; gap: 10px; font-size: 13px; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
.cw-banner button { background: rgba(255,255,255,.15); color: #fff; border: 0; cursor: pointer; font: inherit; padding: 4px 10px; border-radius: 12px; }
.cw-banner button:hover { background: rgba(255,255,255,.25); }

/* Pick mode */
.cw-picking, .cw-picking * { cursor: crosshair !important; }
.cw-hover-outline { position: fixed; border: 2px dashed #2563eb; background: rgba(37,99,235,.08); pointer-events: none; z-index: 2147483630; transition: all .05s linear; }

/* Popup (new pin) */
.cw-popup { position: absolute; z-index: 2147483645; width: 320px; background: #fff; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.2); padding: 14px; }
.cw-popup h4 { margin: 0 0 10px; font-size: 14px; }
.cw-popup label { display: block; font-size: 12px; color: #555; margin-bottom: 4px; }
.cw-popup input, .cw-popup textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 6px 8px; font: inherit; resize: vertical; }
.cw-popup textarea { min-height: 70px; }
.cw-popup .cw-row { margin-bottom: 10px; }
.cw-popup .cw-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Author row (compact vs edit) */
.cw-author-compact { font-size: 12px; color: #6b7280; }
.cw-author-compact strong { color: #111827; }
.cw-author-change { background: transparent; border: 0; color: #2563eb; cursor: pointer; padding: 0 0 0 4px; font: inherit; text-decoration: underline; }
.cw-author-change:hover { color: #1d4ed8; }

/* Buttons */
.cw-btn { font: inherit; cursor: pointer; padding: 6px 12px; border-radius: 4px; border: 1px solid transparent; }
.cw-btn--primary { background: #2563eb; color: #fff; }
.cw-btn--primary:disabled { background: #93c5fd; cursor: not-allowed; }
.cw-btn--secondary { background: #fff; color: #374151; border-color: #d1d5db; }
.cw-btn--secondary:hover { background: #f3f4f6; }
.cw-btn--danger { color: #dc2626; }
.cw-btn--small { padding: 4px 8px; font-size: 12px; }
.cw-kbd { margin-left: 8px; font-size: 11px; opacity: .75; font-weight: 500; letter-spacing: .02em; padding: 1px 5px; border-radius: 3px; background: rgba(255,255,255,.18); }
.cw-btn--secondary .cw-kbd { background: rgba(0,0,0,.06); }

/* Panel (pin detail) */
.cw-panel { position: absolute; z-index: 2147483645; width: 360px; background: #fff; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.2); padding: 14px; }
.cw-panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.cw-panel-avatar { width: 26px; height: 26px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11px; }
.cw-panel-meta { flex: 1; min-width: 0; }
.cw-panel-meta strong { display: block; font-size: 13px; }
.cw-panel-meta span { font-size: 11px; color: #6b7280; }
.cw-panel-actions { display: flex; gap: 4px; }
.cw-panel-body { font-size: 13px; line-height: 1.5; margin-bottom: 10px; white-space: pre-wrap; word-break: break-word; }
.cw-panel-thumb { margin: 8px 0; cursor: zoom-in; max-width: 100%; border-radius: 4px; border: 1px solid #e5e7eb; }
.cw-panel-thumb img { display: block; max-width: 100%; max-height: 120px; }
.cw-panel-context { font-size: 11px; color: #6b7280; margin-bottom: 10px; }
.cw-panel-context code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 11px; word-break: break-all; }
.cw-panel-context a { color: #2563eb; word-break: break-all; }
.cw-panel-close { position: absolute; top: 8px; right: 8px; background: transparent; border: 0; cursor: pointer; font-size: 16px; color: #6b7280; }

/* Thread */
.cw-thread { border-top: 1px solid #e5e7eb; padding-top: 10px; }
.cw-reply { margin-bottom: 8px; }
.cw-reply-head { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
.cw-reply-head strong { color: #111827; margin-right: 6px; font-size: 12px; }
.cw-reply-text { font-size: 13px; white-space: pre-wrap; word-break: break-word; }
.cw-reply-form { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.cw-reply-form input, .cw-reply-form textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 6px 8px; font: inherit; }
.cw-reply-form textarea { min-height: 50px; resize: vertical; }
.cw-reply-form .cw-actions { display: flex; justify-content: flex-end; }

/* Stranded sidebar */
.cw-stranded { position: fixed; top: 20px; right: 20px; width: 260px; max-height: 60vh; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,.1); padding: 10px; z-index: 2147483620; font-size: 12px; }
.cw-stranded h5 { margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
.cw-stranded-item { padding: 6px 0; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
.cw-stranded-item:last-child { border-bottom: 0; }
.cw-stranded-item strong { display: block; font-size: 12px; color: #111827; }
.cw-stranded-item .cw-stranded-note { font-size: 11px; color: #9ca3af; font-style: italic; }

/* Toast */
.cw-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(20px); background: #111827; color: #fff; padding: 10px 14px; border-radius: 24px; box-shadow: 0 4px 14px rgba(0,0,0,.25); display: flex; align-items: center; gap: 12px; font-size: 13px; z-index: 2147483646; opacity: 0; transition: opacity .2s, transform .2s; }
.cw-toast--show { opacity: 1; transform: translateX(-50%) translateY(0); }
.cw-toast--success { background: #047857; }
.cw-toast--error { background: #b91c1c; }
.cw-toast--neutral { background: #111827; }
.cw-toast button { background: rgba(255,255,255,.15); color: #fff; border: 0; cursor: pointer; font: inherit; padding: 4px 10px; border-radius: 12px; }
.cw-toast button:hover { background: rgba(255,255,255,.25); }

/* Lightbox */
.cw-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.85); z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 20px; cursor: zoom-out; }
.cw-lightbox img { max-width: 100%; max-height: 100%; }
`;

  // ----- DOM helpers ----------------------------------------------------------
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'style') e.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function rel(ts) {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (d < 60) return 'just now';
    if (d < 3600) return Math.floor(d/60) + 'm ago';
    if (d < 86400) return Math.floor(d/3600) + 'h ago';
    return Math.floor(d/86400) + 'd ago';
  }

  function authorColor(name) {
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return `hsl(${h % 360}, 65%, 45%)`;
  }

  function initial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  function getProduct(url) {
    const m = url.match(/\/products\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Returns { row, getValue }. Shows "Posting as <name> · change" when a name
  // is already saved; clicking "change" reveals the editable input.
  function buildAuthorRow(onChange) {
    const row = el('div', { class: 'cw-row cw-author-row' });
    let current = state.author || '';

    function renderCompact() {
      row.innerHTML = '';
      row.appendChild(el('div', { class: 'cw-author-compact' }, [
        'Posting as ',
        el('strong', {}, [current]),
        el('button', { type: 'button', class: 'cw-author-change', onclick: renderEdit }, ['change']),
      ]));
    }
    function renderEdit() {
      row.innerHTML = '';
      const input = el('input', {
        type: 'text', value: current, placeholder: 'Your name',
        oninput: () => { current = input.value; if (onChange) onChange(); },
      });
      row.appendChild(el('label', {}, ['Your name']));
      row.appendChild(input);
      setTimeout(() => input.focus(), 0);
    }

    if (current) renderCompact(); else renderEdit();
    return { row, getValue: () => current.trim() };
  }

  function cssPath(node) {
    if (!(node instanceof Element)) return '';
    const parts = [];
    let n = node;
    while (n && n.nodeType === 1 && n !== document.body && parts.length < 6) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + CSS.escape(n.id); parts.unshift(s); return parts.join(' > '); }
      let sib = n, idx = 1;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === n.tagName) idx++;
      s += `:nth-of-type(${idx})`;
      parts.unshift(s);
      n = n.parentElement;
    }
    if (n === document.body) parts.unshift('body');
    return parts.join(' > ');
  }

  // ----- API ------------------------------------------------------------------
  async function api(method, path, body) {
    const res = await fetch(CW_WORKER_URL.replace(/\/$/, '') + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ----- html2canvas ----------------------------------------------------------
  let _h2c;
  function loadHtml2Canvas() {
    if (_h2c) return _h2c;
    _h2c = new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const s = document.createElement('script');
      s.src = HTML2CANVAS_URL;
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error('html2canvas load failed'));
      document.head.appendChild(s);
    });
    return _h2c;
  }

  async function captureElement(node) {
    try {
      const h2c = await loadHtml2Canvas();
      const canvas = await h2c(node, { logging: false, backgroundColor: '#fff', scale: 1 });
      const MAX = 800;
      if (canvas.width <= MAX) return canvas.toDataURL('image/jpeg', 0.8);
      const out = document.createElement('canvas');
      const r = MAX / canvas.width;
      out.width = MAX;
      out.height = Math.round(canvas.height * r);
      out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
      return out.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.warn('[cw] screenshot failed', e);
      return '';
    }
  }

  // ----- Root container -------------------------------------------------------
  let root, pinsLayer, bubble, bubbleIcon, banner, stranded;

  function buildRoot() {
    const style = el('style'); style.textContent = css;
    document.head.appendChild(style);

    root = el('div', { class: 'cw-root', 'data-cw-version': WIDGET_VERSION });
    pinsLayer = el('div', { class: 'cw-pins' });
    root.appendChild(pinsLayer);
    document.body.appendChild(root);

    bubbleIcon = el('span', { class: 'cw-bubble-icon' }, ['💬']);
    bubble = el('button', {
      class: 'cw-bubble',
      type: 'button',
      'aria-label': 'Add feedback',
      onclick: togglePickMode,
    }, [
      bubbleIcon,
      el('div', { class: 'cw-bubble-tip' }, ['Add feedback']),
    ]);
    document.body.appendChild(bubble);

    banner = el('div', { class: 'cw-banner cw-hidden' }, [
      document.createTextNode('Click any element to leave feedback'),
      el('button', { type: 'button', onclick: exitPickMode }, ['Esc to cancel']),
    ]);
    document.body.appendChild(banner);
  }

  function togglePickMode() {
    if (state.pickMode) exitPickMode();
    else enterPickMode();
  }

  // ----- Toast ----------------------------------------------------------------
  function showToast(text, variant = 'neutral', opts = {}) {
    if (state.activeToast) { state.activeToast.remove(); state.activeToast = null; }
    const t = el('div', { class: `cw-toast cw-toast--${variant}` });
    t.appendChild(document.createTextNode(text));
    let undoBtn = null;
    if (opts.undoLabel && opts.onUndo) {
      undoBtn = el('button', { onclick: () => {
        opts.onUndo();
        t.classList.remove('cw-toast--show');
        setTimeout(() => t.remove(), 200);
        if (state.activeToast === t) state.activeToast = null;
      }}, [opts.undoLabel]);
      t.appendChild(undoBtn);
    }
    document.body.appendChild(t);
    state.activeToast = t;
    requestAnimationFrame(() => t.classList.add('cw-toast--show'));
    const ttl = opts.onUndo ? 10000 : 4000;
    setTimeout(() => {
      if (state.activeToast !== t) return;
      t.classList.remove('cw-toast--show');
      setTimeout(() => t.remove(), 200);
      state.activeToast = null;
    }, ttl);
  }

  // ----- Pick mode ------------------------------------------------------------
  let hoverOutline;

  function enterPickMode() {
    if (state.pickMode) return;
    state.pickMode = true;
    document.documentElement.classList.add('cw-picking');
    if (bubble) {
      bubble.classList.add('cw-bubble--active');
      bubble.setAttribute('aria-label', 'Exit comment mode');
      if (bubbleIcon) bubbleIcon.textContent = '✕';
    }
    if (banner) banner.classList.remove('cw-hidden');
    hoverOutline = el('div', { class: 'cw-hover-outline cw-hidden' });
    document.body.appendChild(hoverOutline);
    document.addEventListener('mousemove', onPickHover, true);
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('keydown', onPickKey, true);
  }

  function exitPickMode() {
    if (!state.pickMode) return;
    state.pickMode = false;
    document.documentElement.classList.remove('cw-picking');
    if (bubble) {
      bubble.classList.remove('cw-bubble--active');
      bubble.setAttribute('aria-label', 'Add feedback');
      if (bubbleIcon) bubbleIcon.textContent = '💬';
    }
    if (banner) banner.classList.add('cw-hidden');
    if (hoverOutline) { hoverOutline.remove(); hoverOutline = null; }
    document.removeEventListener('mousemove', onPickHover, true);
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('keydown', onPickKey, true);
  }

  function isWidgetEl(node) {
    if (!node || !node.closest) return false;
    return !!(node.closest('.cw-root') || node.closest('.cw-bubble') || node.closest('.cw-banner') || node.closest('.cw-popup') || node.closest('.cw-panel') || node.closest('.cw-toast') || node.closest('.cw-stranded') || node.closest('.cw-hover-outline') || node.closest('.cw-lightbox'));
  }

  function onPickHover(e) {
    const target = e.target;
    if (isWidgetEl(target)) { hoverOutline.classList.add('cw-hidden'); return; }
    state.hoverEl = target;
    const r = target.getBoundingClientRect();
    Object.assign(hoverOutline.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    hoverOutline.classList.remove('cw-hidden');
  }

  function onPickKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); exitPickMode(); }
  }

  async function onPickClick(e) {
    if (isWidgetEl(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    const target = e.target;
    const selector = cssPath(target);
    const elementText = (target.innerText || target.textContent || '').trim().slice(0, 200);
    const x = (e.clientX) / window.innerWidth;
    const y = (e.clientY + window.scrollY) / window.innerHeight;
    exitPickMode();
    showToast('Capturing screenshot…', 'neutral');
    const screenshot = await captureElement(target);
    if (state.activeToast) { state.activeToast.remove(); state.activeToast = null; }
    openNewPinPopup({ x, y, selector, elementText, screenshot, clickX: e.clientX, clickY: e.clientY + window.scrollY });
  }

  // ----- New pin popup --------------------------------------------------------
  let popup;

  function openNewPinPopup(ctx) {
    closePopup();
    const authorRow = buildAuthorRow(validate);
    const textArea = el('textarea', { placeholder: 'Describe your feedback… (⌘/Ctrl + Enter to add)', oninput: validate });
    const submit = el('button', { class: 'cw-btn cw-btn--primary', disabled: true, onclick: doSubmit }, [
      'Add feedback',
      el('span', { class: 'cw-kbd', 'aria-hidden': 'true' }, [`${CMD_KEY} ↵`]),
    ]);
    const cancel = el('button', { class: 'cw-btn cw-btn--secondary', onclick: () => { closePopup(); enterPickMode(); } }, ['Cancel']);
    textArea.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submit.disabled) {
        e.preventDefault(); doSubmit();
      }
    });

    function validate() { submit.disabled = !(authorRow.getValue() && textArea.value.trim()); }
    async function doSubmit() {
      submit.disabled = true;
      const author = authorRow.getValue();
      const comment = textArea.value.trim();
      localStorage.setItem('cw-author', author);
      state.author = author;
      try {
        const { pin } = await api('POST', '/pins', {
          url: pageUrl,
          product: getProduct(pageUrl),
          selector: ctx.selector,
          elementText: ctx.elementText,
          x: ctx.x, y: ctx.y,
          screenshot: ctx.screenshot,
          author, comment,
        });
        state.pins.push(pin);
        renderPins();
        closePopup();
        showToast('Feedback added · click another element to add more', 'success');
        enterPickMode();
      } catch (err) {
        submit.disabled = false;
        showToast(err.message || 'Could not save', 'error');
      }
    }

    popup = el('div', { class: 'cw-popup' }, [
      el('h4', {}, ['New feedback']),
      authorRow.row,
      el('div', { class: 'cw-row' }, [el('label', {}, ['Comment']), textArea]),
      el('div', { class: 'cw-actions' }, [cancel, submit]),
    ]);
    positionFloater(popup, ctx.clickX, ctx.clickY);
    document.body.appendChild(popup);
    if (state.author) setTimeout(() => textArea.focus(), 0);
  }

  function closePopup() { if (popup) { popup.remove(); popup = null; } }

  function positionFloater(node, x, y) {
    const W = 360, H = 300;
    const left = Math.min(Math.max(8, x + 16), window.scrollX + window.innerWidth - W - 8);
    const top = Math.min(Math.max(window.scrollY + 8, y + 16), window.scrollY + window.innerHeight - H);
    node.style.left = left + 'px';
    node.style.top = top + 'px';
  }

  // ----- Pin rendering --------------------------------------------------------
  function renderPins() {
    pinsLayer.innerHTML = '';
    state.stranded = [];

    pinsLayer.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + 'px';

    for (const pin of state.pins) {
      if (pin.deleted) continue;
      const found = pin.selector ? safeQuery(pin.selector) : null;
      if (!found) { state.stranded.push(pin); continue; }
      const dot = makePinDot(pin);
      pinsLayer.appendChild(dot);
    }
    renderStranded();
  }

  function safeQuery(sel) {
    try { return document.querySelector(sel); } catch (e) { return null; }
  }

  function makePinDot(pin) {
    const left = pin.x * window.innerWidth;
    const top = pin.y * window.innerHeight;
    const dot = el('div', {
      class: 'cw-pin' + (pin.done ? ' cw-pin--done' : ''),
      style: `left:${left}px; top:${top}px; background:${authorColor(pin.author)};`,
      title: `${pin.author} — ${rel(pin.timestamp)}  ·  drag to reposition`,
    }, [el('span', {}, [initial(pin.author)])]);

    // Click vs drag: distinguish at mouseup. Threshold 5px.
    let drag = null;
    dot.addEventListener('mousedown', (e) => {
      if (state.pickMode || e.button !== 0) return;
      e.stopPropagation(); e.preventDefault();
      drag = { sx: e.clientX, sy: e.clientY, moved: false, nx: pin.x, ny: pin.y };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    function onMove(e) {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) {
        drag.moved = true;
        dot.classList.add('cw-pin--dragging');
      }
      if (drag.moved) {
        const pageX = e.clientX;
        const pageY = e.clientY + window.scrollY;
        drag.nx = pageX / window.innerWidth;
        drag.ny = pageY / window.innerHeight;
        dot.style.left = pageX + 'px';
        dot.style.top = pageY + 'px';
      }
    }

    async function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const d = drag; drag = null;
      dot.classList.remove('cw-pin--dragging');
      if (!d || !d.moved) { openPanel(pin); return; }
      const oldX = pin.x, oldY = pin.y;
      pin.x = d.nx; pin.y = d.ny;
      try {
        const { pin: updated } = await api('PATCH', '/pins/' + pin.id, {
          url: pin.url, author: state.author || pin.author, x: d.nx, y: d.ny,
        });
        mergePin(updated);
        showToast('Pin moved', 'success');
      } catch (err) {
        pin.x = oldX; pin.y = oldY;
        renderPins();
        showToast(err.message || 'Could not move pin', 'error');
      }
    }

    return dot;
  }

  function renderStranded() {
    if (stranded) { stranded.remove(); stranded = null; }
    if (!state.stranded.length) return;
    stranded = el('div', { class: 'cw-stranded' }, [
      el('h5', {}, [`Stranded feedback (${state.stranded.length})`]),
      ...state.stranded.map(pin => el('div', {
        class: 'cw-stranded-item',
        onclick: () => openPanel(pin, { stranded: true }),
      }, [
        el('strong', {}, [`${pin.author} — ${rel(pin.timestamp)}`]),
        document.createTextNode((pin.comment || '').slice(0, 80) + ((pin.comment || '').length > 80 ? '…' : '')),
        el('div', { class: 'cw-stranded-note' }, ['Element no longer found on this page']),
      ]))
    ]);
    document.body.appendChild(stranded);
  }

  // ----- Pin detail panel -----------------------------------------------------
  let panel, panelEditing = false;

  function closePanel() {
    if (panel) { panel.remove(); panel = null; }
    state.openPanelPinId = null;
    panelEditing = false;
  }

  function openPanel(pin, opts = {}) {
    closePanel();
    state.openPanelPinId = pin.id;
    panel = renderPanel(pin);
    let x, y;
    if (opts.stranded || !pin.selector || !safeQuery(pin.selector)) {
      x = window.scrollX + window.innerWidth - 400;
      y = window.scrollY + 80;
    } else {
      x = pin.x * window.innerWidth;
      y = pin.y * window.innerHeight;
    }
    positionFloater(panel, x, y);
    document.body.appendChild(panel);
  }

  function renderPanel(pin) {
    const isEditing = panelEditing;
    const closeBtn = el('button', { class: 'cw-panel-close', onclick: closePanel, 'aria-label': 'Close' }, ['×']);
    const avatar = el('div', { class: 'cw-panel-avatar', style: `background:${authorColor(pin.author)};` }, [initial(pin.author)]);
    const meta = el('div', { class: 'cw-panel-meta' }, [
      el('strong', {}, [pin.author]),
      el('span', {}, [rel(pin.timestamp)]),
    ]);
    const actions = el('div', { class: 'cw-panel-actions' }, [
      el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small', onclick: () => onDone(pin) }, [pin.done ? '↺ Reopen' : '✓ Done']),
      el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small', onclick: () => { panelEditing = true; reopenPanel(pin); } }, ['✎ Edit']),
      el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small cw-btn--danger', onclick: () => onDelete(pin) }, ['🗑 Delete']),
    ]);

    const head = el('div', { class: 'cw-panel-head' }, [avatar, meta, actions]);

    let body;
    if (isEditing) {
      const ta = el('textarea', { style: 'width:100%;min-height:80px;border:1px solid #d1d5db;border-radius:4px;padding:6px 8px;font:inherit;', placeholder: 'Edit comment… (⌘/Ctrl + Enter to save)' });
      ta.value = pin.comment || '';
      async function doSave() {
        try {
          const { pin: updated } = await api('PATCH', '/pins/' + pin.id, { url: pin.url, author: state.author || pin.author, comment: ta.value.trim() });
          mergePin(updated);
          panelEditing = false; reopenPanel(updated);
          showToast('Updated', 'success');
        } catch (e) { showToast(e.message, 'error'); }
      }
      const save = el('button', { class: 'cw-btn cw-btn--primary cw-btn--small', onclick: doSave }, [
        'Save',
        el('span', { class: 'cw-kbd', 'aria-hidden': 'true' }, [`${CMD_KEY} ↵`]),
      ]);
      const cancel = el('button', { class: 'cw-btn cw-btn--secondary cw-btn--small', onclick: () => { panelEditing = false; reopenPanel(pin); } }, ['Cancel']);
      ta.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); doSave(); }
      });
      body = el('div', { class: 'cw-panel-body' }, [ta, el('div', { class: 'cw-actions', style: 'margin-top:6px;' }, [cancel, save])]);
    } else {
      body = el('div', { class: 'cw-panel-body' }, [pin.comment || '']);
    }

    const extras = [];
    if (pin.screenshot) {
      const thumb = el('div', { class: 'cw-panel-thumb', onclick: () => openLightbox(pin.screenshot) }, [
        el('img', { src: pin.screenshot, alt: 'screenshot' })
      ]);
      extras.push(thumb);
    }
    extras.push(el('div', { class: 'cw-panel-context' }, [
      pin.selector ? el('div', {}, ['Element: ', el('code', {}, [pin.selector])]) : null,
      el('div', {}, ['Page: ', el('a', { href: pin.url, target: '_blank', rel: 'noopener' }, [pin.url])]),
    ]));

    const thread = el('div', { class: 'cw-thread' }, [
      ...(pin.thread || []).map(r => el('div', { class: 'cw-reply' }, [
        el('div', { class: 'cw-reply-head' }, [el('strong', {}, [r.author]), rel(r.timestamp)]),
        el('div', { class: 'cw-reply-text' }, [r.text]),
      ])),
      buildReplyForm(pin),
    ]);

    return el('div', { class: 'cw-panel' }, [closeBtn, head, body, ...extras, thread]);
  }

  function reopenPanel(pin) {
    closePanel();
    openPanel(pin);
  }

  function buildReplyForm(pin) {
    const authorRow = buildAuthorRow(validate);
    const text = el('textarea', { placeholder: 'Add a reply… (⌘/Ctrl + Enter)', oninput: validate });
    const submit = el('button', { class: 'cw-btn cw-btn--primary cw-btn--small', disabled: true, onclick: doSubmit }, [
      'Reply',
      el('span', { class: 'cw-kbd', 'aria-hidden': 'true' }, [`${CMD_KEY} ↵`]),
    ]);
    text.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submit.disabled) {
        e.preventDefault(); doSubmit();
      }
    });
    function validate() { submit.disabled = !(authorRow.getValue() && text.value.trim()); }
    async function doSubmit() {
      submit.disabled = true;
      const author = authorRow.getValue();
      const body = text.value.trim();
      localStorage.setItem('cw-author', author);
      state.author = author;
      try {
        const { pin: updated } = await api('POST', `/pins/${pin.id}/replies`, { url: pin.url, author, text: body });
        mergePin(updated);
        reopenPanel(updated);
        showToast('Reply added', 'success');
      } catch (e) {
        submit.disabled = false;
        showToast(e.message, 'error');
      }
    }
    return el('div', { class: 'cw-reply-form' }, [authorRow.row, text, el('div', { class: 'cw-actions' }, [submit])]);
  }

  // ----- Done / Delete / Undo -------------------------------------------------
  async function onDone(pin) {
    const wasDone = !!pin.done;
    const next = !wasDone;
    try {
      const { pin: updated } = await api('PATCH', '/pins/' + pin.id, { url: pin.url, author: state.author || pin.author, done: next });
      mergePin(updated);
      closePanel();
      renderPins();
      if (next) {
        showToast('Marked complete', 'success', {
          undoLabel: 'Undo',
          onUndo: () => undo(pin.id, pin.url),
        });
      } else {
        showToast('Reopened', 'success');
      }
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function onDelete(pin) {
    try {
      const { pin: updated } = await api('PATCH', '/pins/' + pin.id, { url: pin.url, author: state.author || pin.author, deleted: true });
      mergePin(updated);
      closePanel();
      renderPins();
      showToast('Deleted', 'success', {
        undoLabel: 'Undo',
        onUndo: () => undo(pin.id, pin.url),
      });
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function undo(pinId, url) {
    try {
      const { pin: updated } = await api('POST', `/pins/${pinId}/undo`, { url, author: state.author });
      mergePin(updated);
      renderPins();
      showToast('Undone', 'neutral');
    } catch (e) {
      if (e.status === 409) showToast('Undo window expired — change could not be reverted', 'error');
      else showToast(e.message, 'error');
    }
  }

  function mergePin(updated) {
    const i = state.pins.findIndex(p => p.id === updated.id);
    if (i >= 0) state.pins[i] = updated; else state.pins.push(updated);
  }

  // ----- Lightbox -------------------------------------------------------------
  function openLightbox(src) {
    const lb = el('div', { class: 'cw-lightbox', onclick: () => lb.remove() }, [el('img', { src })]);
    document.body.appendChild(lb);
  }

  // ----- Init -----------------------------------------------------------------
  async function init() {
    buildRoot();
    window.addEventListener('resize', () => renderPins());
    window.addEventListener('scroll', () => { /* pins are document-positioned, no-op */ }, { passive: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePopup(); closePanel(); } });

    try {
      const { pins } = await api('GET', '/pins?url=' + encodeURIComponent(pageUrl));
      state.pins = pins || [];
      renderPins();
    } catch (e) {
      console.warn('[cw] failed to load pins', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
