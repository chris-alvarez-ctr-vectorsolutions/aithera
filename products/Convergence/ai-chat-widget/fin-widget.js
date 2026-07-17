/* ============================================================
 * Vectoria / Intercom Fin — shared FAB widget include
 *
 * Drop-in for any Convergence prototype that should show the Fin rollout:
 *   <script src="../ai-chat-widget/fin-widget.js"></script>   (adjust depth)
 *
 * Injects the bottom-right floating action button + the Vectoria chat
 * window (same design as ai-chat-widget/ver2, minimize-to-collapse).
 *
 * ── Layout contract (the overlap rules) ─────────────────────
 * All sizing comes from CSS custom properties defined here on :root:
 *
 *   --fin-fab-size        60px   FAB diameter
 *   --fin-fab-margin      24px   FAB inset from the corner
 *   --fin-fab-clearance   size + margin (= 84px). THE shared buffer token.
 *                         Use it for every end-of-scroll buffer / panel
 *                         scroll padding so the last content can scroll
 *                         clear of the FAB. Single place to tune.
 *   --fin-fab-bottom      margin (default). Pages with a fixed footer /
 *                         action bar override this so the FAB floats
 *                         ABOVE the bar and never covers it, e.g.
 *                         :root { --fin-fab-bottom: 64px; }
 *
 * The FAB always stays bottom-RIGHT; only its bottom offset adapts.
 * Pages reserve space for it via existing empty regions (e.g. the empty
 * right side of a pagination row) or end-of-scroll buffer — never a
 * permanent dead band.
 *
 * Optional page config (set before this script):
 *   window.FIN_WIDGET = { qualListHref: 'path/to/Manage-Qualifications.html' };
 * ============================================================ */
(function () {
  if (document.getElementById('fin-root')) return; // idempotent

  const CFG = window.FIN_WIDGET || {};
  const QUAL_LIST = CFG.qualListHref || '#';

  /* ---- Styles ----------------------------------------------------------- */
  const css = `
    :root {
      --fin-fab-size: 60px;
      --fin-fab-margin: 24px;
      /* THE shared clearance token: FAB height + margin. Every surface's
         scroll buffer / panel padding uses this one value. */
      --fin-fab-clearance: calc(var(--fin-fab-size) + var(--fin-fab-margin));
    }
    /* Default bottom offset. :where() keeps specificity at zero so a page's
       own  :root { --fin-fab-bottom: ... }  override always wins, no matter
       the stylesheet order (this style tag is injected last). */
    :where(:root) {
      --fin-fab-bottom: var(--fin-fab-margin);
    }
    #fin-root { font-family:"Open Sans","Segoe UI",Arial,sans-serif; }

    .fin-fab {
      position:fixed; right:var(--fin-fab-margin); bottom:var(--fin-fab-bottom); z-index:90000;
      width:var(--fin-fab-size); height:var(--fin-fab-size); border-radius:50%; border:none; cursor:pointer;
      background:#0271ce; color:#fff; box-shadow:0 8px 22px rgba(2,113,206,.42), 0 2px 6px rgba(0,0,0,.18);
      display:flex; align-items:center; justify-content:center;
      transition:transform .18s cubic-bezier(.34,1.56,.64,1), background .15s, box-shadow .15s, bottom .2s ease;
    }
    .fin-fab:hover { background:#015ba6; transform:translateY(-2px); box-shadow:0 12px 28px rgba(2,113,206,.48); }
    .fin-fab .ic { position:absolute; transition:opacity .2s, transform .3s; }
    .fin-fab .ic-open { font-size:24px; }
    .fin-fab .ic-close { font-size:20px; opacity:0; transform:rotate(-90deg) scale(.6); }
    #fin-root.open .fin-fab .ic-open { opacity:0; transform:rotate(90deg) scale(.6); }
    #fin-root.open .fin-fab .ic-close { opacity:1; transform:rotate(0) scale(1); }
    .fin-badge { position:absolute; top:-2px; right:-2px; min-width:20px; height:20px; padding:0 5px; border-radius:20px; background:#e0362f; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid #fff; }

    .fin-window {
      position:fixed; right:20px; z-index:90001;
      bottom:calc(var(--fin-fab-bottom) + var(--fin-fab-size) + 16px);
      width:min(384px, calc(100vw - 32px));
      height:min(620px, calc(100vh - (var(--fin-fab-bottom) + var(--fin-fab-size) + 16px) - 24px));
      background:#fff; border-radius:16px; overflow:hidden;
      box-shadow:0 3px 18px -2px #1c375a29, 0 12px 48px -6px #1c324f61;
      display:flex; flex-direction:column;
      opacity:0; pointer-events:none;
      transform:translateY(8px) scale(.97); transform-origin:bottom right;
      transition:opacity .2s ease, transform .22s cubic-bezier(.34,1.3,.64,1);
    }
    #fin-root.open .fin-window { opacity:1; pointer-events:auto; transform:translateY(0) scale(1); }

    .fin-hd { display:flex; align-items:center; gap:10px; padding:12px 12px 12px 8px; border-bottom:1px solid #eef1f5; flex-shrink:0; }
    .fin-hd .back { border:none; background:transparent; color:#9aa7ba; font-size:17px; width:30px; height:30px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .fin-hd .back:hover { background:#f2f5f9; color:#5a6b85; }
    .fin-brand { display:flex; align-items:center; gap:9px; flex:1; min-width:0; }
    .fin-avatar { width:30px; height:30px; border-radius:50%; background:#eaf3fc; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fin-avatar svg { width:20px; height:20px; display:block; }
    .fin-name { font-size:16px; font-weight:800; color:#16233c; line-height:1.1; }
    .fin-status { font-size:11px; color:#3fa06a; font-weight:600; display:flex; align-items:center; gap:5px; }
    .fin-status::before { content:""; width:7px; height:7px; border-radius:50%; background:#3fbd76; }
    .fin-hd-actions { display:flex; gap:2px; }
    .fin-icobtn { border:none; background:transparent; color:#9aa7ba; width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; transition:background .12s, color .12s; }
    .fin-icobtn:hover { background:#f2f5f9; color:#5a6b85; }

    .fin-body { flex:1; overflow-y:auto; padding:16px 14px 8px; background:#fff; display:flex; flex-direction:column; gap:12px; scroll-behavior:smooth; }
    .fin-body::-webkit-scrollbar { width:8px; }
    .fin-body::-webkit-scrollbar-thumb { background:#dbe2ec; border-radius:8px; }
    .fin-intro { text-align:center; font-size:12px; color:#9aa7ba; padding:2px 20px 4px; }

    .fin-msg { display:flex; max-width:86%; animation:finIn .28s ease both; }
    @keyframes finIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
    .fin-msg.ai { align-self:flex-start; }
    .fin-msg.me { align-self:flex-end; }
    .fin-bubble { padding:11px 14px; font-size:13.5px; line-height:1.5; border-radius:16px; }
    .fin-msg.ai .fin-bubble { background:#f1f3f7; color:#26334d; border-bottom-left-radius:5px; }
    .fin-msg.me .fin-bubble { background:#0271ce; color:#fff; border-bottom-right-radius:5px; }
    .fin-bubble a { color:inherit; text-decoration:underline; }

    .fin-src { align-self:flex-start; margin:-4px 0 2px; display:inline-flex; align-items:center; gap:7px; font-size:11.5px; color:#5a6b85; background:#f6f8fb; border:1px solid #e7ecf3; padding:6px 10px; border-radius:9px; max-width:86%; }
    .fin-src i { color:#0271ce; font-size:12px; }
    .fin-src b { font-weight:700; color:#3a4a63; }

    .fin-chips { display:flex; flex-wrap:wrap; gap:7px; align-self:flex-start; max-width:100%; animation:finIn .3s ease both; }
    .fin-chip { border:1px solid #d3e2f2; background:#fff; color:#0271ce; font-family:inherit; font-size:12.5px; font-weight:600; padding:8px 13px; border-radius:20px; cursor:pointer; transition:background .12s, border-color .12s; }
    .fin-chip:hover { background:#0271ce0d; border-color:#0271ce; }

    .fin-card { align-self:stretch; background:#fff; border:1px solid #e2e8f1; border-radius:14px; box-shadow:0 2px 10px rgba(28,55,90,.07); padding:16px 16px 15px; animation:finIn .3s ease both; }
    .fin-card label { display:block; font-size:13px; font-weight:700; color:#16233c; margin-bottom:9px; }
    .fin-field { display:flex; align-items:center; gap:8px; border:1px solid #d7dfea; border-radius:9px; padding:0 10px; height:42px; transition:border-color .12s, box-shadow .12s; background:#fff; }
    .fin-field:focus-within { border-color:#0271ce; box-shadow:0 0 0 3px #0271ce1a; }
    .fin-field input { flex:1; border:none; outline:none; font-family:inherit; font-size:13.5px; color:#26334d; background:transparent; }
    .fin-field .go { border:none; background:transparent; color:#0271ce; font-size:15px; cursor:pointer; width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; }
    .fin-field .go:hover { background:#0271ce1a; }
    .fin-field.done { border-color:#cfe9db; background:#f6fbf8; }
    .fin-field.done input { color:#2b6a4a; }
    .fin-field .check { color:#1f8f5f; font-size:16px; }

    .fin-actions { display:flex; flex-wrap:wrap; gap:8px; align-self:flex-start; }
    .fin-act { display:inline-flex; align-items:center; gap:7px; text-decoration:none; border:1px solid #d3e2f2; background:#fff; color:#0271ce; font-size:12.5px; font-weight:700; padding:8px 12px; border-radius:9px; cursor:pointer; transition:background .12s; font-family:inherit; }
    .fin-act:hover { background:#0271ce0d; }

    .fin-typing { align-self:flex-start; background:#f1f3f7; border-radius:16px; border-bottom-left-radius:5px; padding:13px 15px; display:flex; gap:4px; }
    .fin-typing span { width:7px; height:7px; border-radius:50%; background:#b3bdcc; animation:finDot 1.1s infinite ease-in-out; }
    .fin-typing span:nth-child(2){ animation-delay:.18s; } .fin-typing span:nth-child(3){ animation-delay:.36s; }
    @keyframes finDot { 0%,60%,100%{ transform:translateY(0); opacity:.5; } 30%{ transform:translateY(-4px); opacity:1; } }

    .fin-foot { border-top:1px solid #eef1f5; padding:10px 12px 8px; flex-shrink:0; background:#fff; }
    .fin-compose { display:flex; align-items:flex-end; gap:8px; border:1px solid #d7dfea; border-radius:22px; padding:5px 5px 5px 15px; transition:border-color .12s, box-shadow .12s; }
    .fin-compose:focus-within { border-color:#0271ce; box-shadow:0 0 0 3px #0271ce1a; }
    .fin-compose textarea { flex:1; border:none; outline:none; resize:none; font-family:inherit; font-size:13.5px; line-height:1.4; color:#26334d; background:transparent; max-height:96px; padding:8px 0; }
    .fin-send { width:36px; height:36px; border-radius:50%; border:none; background:#0271ce; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; transition:background .12s; }
    .fin-send:hover { background:#015ba6; }
    .fin-send:disabled { background:#c4d3e5; cursor:default; }
    .fin-disclaimer { text-align:center; font-size:10.5px; color:#a6b1c1; margin:7px 4px 2px; }

    @media (prefers-reduced-motion: reduce){ #fin-root *{ transition:none !important; animation:none !important; } }
  `;
  const style = document.createElement('style');
  style.id = 'fin-widget-style';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- DOM --------------------------------------------------------------- */
  const root = document.createElement('div');
  root.id = 'fin-root';
  root.innerHTML = `
    <button class="fin-fab" id="finFab" aria-label="Open Vectoria chat">
      <i class="ic ic-open fa-solid fa-comment-dots"></i>
      <i class="ic ic-close fa-solid fa-chevron-down"></i>
      <span class="fin-badge" id="finFabBadge">1</span>
    </button>
    <section class="fin-window" id="finWindow" role="dialog" aria-label="Vectoria AI chat" aria-modal="false">
      <header class="fin-hd">
        <button class="back" id="finBack" title="Back" aria-label="Back"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="fin-brand">
          <span class="fin-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 21 L11 3 L13.3 7.4 L7.3 21 Z" fill="#0271ce"/><path d="M11.6 21 L18.2 6.6 L21 12 L16.6 21 Z" fill="#38a5d1"/></svg>
          </span>
          <div>
            <div class="fin-name">Vectoria</div>
            <div class="fin-status">AI assistant</div>
          </div>
        </div>
        <div class="fin-hd-actions">
          <button class="fin-icobtn" title="More" aria-label="More options"><i class="fa-solid fa-ellipsis"></i></button>
          <button class="fin-icobtn" id="finClose" title="Minimize" aria-label="Minimize chat"><i class="fa-solid fa-window-minimize"></i></button>
        </div>
      </header>
      <div class="fin-body" id="finBody">
        <div class="fin-intro">Ask us anything, or share your feedback.</div>
      </div>
      <footer class="fin-foot">
        <form class="fin-compose" id="finForm">
          <textarea id="finInput" rows="1" placeholder="Ask a question…" aria-label="Message Vectoria"></textarea>
          <button type="submit" class="fin-send" id="finSend" aria-label="Send" disabled><i class="fa-solid fa-paper-plane"></i></button>
        </form>
        <div class="fin-disclaimer">Vectoria answers from Vector's knowledge base &amp; your Convergence data. Responses may need review.</div>
      </footer>
    </section>`;
  document.body.appendChild(root);

  /* ---- Behavior (same canned KB flows as the ai-chat-widget versions) ---- */
  const win     = document.getElementById('finWindow');
  const body    = document.getElementById('finBody');
  const fab     = document.getElementById('finFab');
  const form    = document.getElementById('finForm');
  const input   = document.getElementById('finInput');
  const sendBtn = document.getElementById('finSend');

  function clearBadges() { root.querySelectorAll('.fin-badge').forEach(b => b.style.display = 'none'); }

  let opened = false, seeded = false;
  function toggle() { opened ? close() : open(); }
  function open() {
    opened = true; root.classList.add('open'); clearBadges();
    if (!seeded) { seeded = true; seedConversation(); }
    setTimeout(() => input.focus(), 260);
  }
  function close() { opened = false; root.classList.remove('open'); }

  fab.addEventListener('click', toggle);
  document.getElementById('finClose').addEventListener('click', close);
  document.getElementById('finBack').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && opened) close(); });

  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function addMsg(who, html) {
    const m = document.createElement('div');
    m.className = 'fin-msg ' + who;
    m.innerHTML = '<div class="fin-bubble">' + html + '</div>';
    body.appendChild(m); scrollDown(); return m;
  }
  function addSource(icon, label, title) {
    const s = document.createElement('div');
    s.className = 'fin-src';
    s.innerHTML = '<i class="' + icon + '"></i><span><b>' + label + '</b> · ' + title + '</span>';
    body.appendChild(s); scrollDown(); return s;
  }
  function addActions(actions) {
    const wrap = document.createElement('div');
    wrap.className = 'fin-actions';
    actions.forEach(a => {
      const el = document.createElement(a.href ? 'a' : 'button');
      el.className = 'fin-act';
      if (a.href) el.href = a.href;
      el.innerHTML = '<i class="' + a.icon + '"></i>' + a.label;
      if (a.onClick) el.addEventListener('click', a.onClick);
      wrap.appendChild(el);
    });
    body.appendChild(wrap); scrollDown(); return wrap;
  }
  function addChips(items) {
    const wrap = document.createElement('div');
    wrap.className = 'fin-chips';
    items.forEach(text => {
      const c = document.createElement('button');
      c.className = 'fin-chip'; c.type = 'button'; c.textContent = text;
      c.addEventListener('click', () => { wrap.remove(); handleUser(text); });
      wrap.appendChild(c);
    });
    body.appendChild(wrap); scrollDown(); return wrap;
  }
  function typing(ms) {
    return new Promise(resolve => {
      const t = document.createElement('div');
      t.className = 'fin-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(t); scrollDown();
      setTimeout(() => { t.remove(); resolve(); }, ms);
    });
  }
  function askField(label, type, placeholder, fallback) {
    return new Promise(resolve => {
      const card = document.createElement('div');
      card.className = 'fin-card';
      card.innerHTML =
        '<label>' + label + '</label>' +
        '<div class="fin-field">' +
          '<input type="' + type + '" placeholder="' + placeholder + '" />' +
          '<button type="button" class="go" aria-label="Submit"><i class="fa-solid fa-arrow-right"></i></button>' +
        '</div>';
      body.appendChild(card); scrollDown();
      const field = card.querySelector('.fin-field');
      const inp   = card.querySelector('input');
      const go    = card.querySelector('.go');
      setTimeout(() => inp.focus(), 80);
      function submit() {
        const val = (inp.value || '').trim() || fallback;
        inp.value = val; inp.readOnly = true;
        field.classList.add('done');
        go.outerHTML = '<i class="fa-solid fa-circle-check check"></i>';
        addMsg('me', escapeHtml(val));
        resolve(val);
      }
      go.addEventListener('click', submit);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    });
  }
  function escapeHtml(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  const SUGGESTIONS = [
    'How do I log in?',
    'Show my qualification completions',
    'How do I assign training?',
    'Talk to a person'
  ];

  async function seedConversation() {
    await typing(650);
    addMsg('ai', "Hi there! You're speaking with <b>Vectoria</b>, Vector's AI assistant. I'm trained on Vector's knowledge base and your Convergence data, so I can answer most questions, or connect you with the team anytime.");
    await typing(500);
    addMsg('ai', 'What can I help you with today?');
    addChips(SUGGESTIONS);
  }

  async function handleUser(text) {
    addMsg('me', escapeHtml(text));
    const q = text.toLowerCase();
    if (/log ?in|sign ?in|password|can't get in|access my account/.test(q)) return flowLogin();
    if (/qualif|completion|my training|my record|progress/.test(q))        return flowQuals();
    if (/assign|wizard|training plan|catalog|enroll/.test(q))              return flowAssign();
    if (/person|human|agent|support|representative|talk to|call/.test(q))  return flowHuman();
    return flowFallback();
  }

  async function flowLogin() {
    await typing(650);
    addMsg('ai', "I'd love to help you get signed in! To pull up the right steps for your account, could you share the email address associated with your account?");
    await askField('Email', 'email', 'you@company.com', 'paul.belden@vectorsolutions.com');
    await typing(500);
    addMsg('ai', 'Thanks! And what is your full name, please?');
    const name = await askField('Name', 'text', 'First and last name', 'Paul Belden');
    await typing(800);
    const first = name.split(' ')[0];
    addMsg('ai', "Thanks, " + escapeHtml(first) + "! Here's how to sign in to Convergence:<br><br>1. Go to your organization's Convergence login page.<br>2. Enter your <b>username or email</b> and <b>password</b>.<br>3. If your organization uses single sign-on, choose <b>Sign in with SSO</b> and use your work credentials.<br><br>Forgot your password? Select <b>Forgot password</b> on the sign-in page and we'll email you a reset link.");
    addSource('fa-solid fa-book', 'Knowledge Base', 'Signing in to Convergence');
    await typing(400);
    addMsg('ai', 'Did that solve it, or would you like me to connect you with a specialist?');
    addChips(['That solved it 🎉', 'Talk to a person']);
  }

  async function flowQuals() {
    await typing(750);
    addMsg('ai', "Here's a snapshot from your record: you've completed <b>12 of 15</b> assigned qualifications this year. <b>3</b> are still in progress:");
    addMsg('ai', "• Forklift Operation (Recert): 60%<br>• Confined Space Entry: 25%<br>• Lockout / Tagout: <b>overdue</b>");
    addSource('fa-solid fa-chart-simple', 'Insights', 'Qualification completions · Orlando Organization');
    await typing(400);
    addMsg('ai', 'Want to open the details?');
    addActions([
      { icon:'fa-solid fa-list-check', label:'Open Qualifications', href: QUAL_LIST },
      { icon:'fa-solid fa-arrow-right', label:'Show overdue only', onClick: () => handleUser('Show my overdue trainings') }
    ]);
  }

  async function flowAssign() {
    await typing(700);
    addMsg('ai', "To assign training, go to <b>Administration &gt; Assignments &gt; Assign Training</b>. The wizard walks you through it in 5 steps: select the training, select assignees, set the schedule, optional settings, then review and assign.");
    addSource('fa-solid fa-book', 'Knowledge Base', 'Assigning training with the wizard');
    addChips(['How do learners see assignments?', 'Talk to a person']);
  }

  async function flowHuman() {
    await typing(650);
    addMsg('ai', "Of course — I can connect you with a Vector support specialist and pass along everything from this conversation, so you won't have to repeat yourself. What's the best email to reach you?");
    const email = await askField('Email', 'email', 'you@company.com', 'paul.belden@vectorsolutions.com');
    await typing(800);
    addMsg('ai', "Perfect, a specialist will follow up at <b>" + escapeHtml(email) + "</b> shortly. Your conversation and context have been shared with the team. Is there anything else I can help with in the meantime?");
    addChips(SUGGESTIONS.slice(0, 3));
  }

  async function flowFallback() {
    await typing(600);
    addMsg('ai', "I can help with signing in, your training and qualification status, navigating Convergence, and reports. I pull answers from Vector's public knowledge base and your Convergence data. Could you tell me a bit more about what you're looking for?");
    addChips(SUGGESTIONS);
  }

  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim() === '';
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; input.style.height = 'auto'; sendBtn.disabled = true;
    body.querySelectorAll('.fin-chips').forEach(c => c.remove());
    handleUser(text);
  });
})();
