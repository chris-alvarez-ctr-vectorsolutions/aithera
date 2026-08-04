# Keystone Hub Announcement Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the light announcement card on the three embedded host-app homepage mocks with a dark, Keystone-branded banner matching the approved design.

**Architecture:** Three standalone, self-contained HTML prototype files. Each has one `<style>` block in `<head>` and its markup inline in `<body>`. The banner is one CSS block plus one `<section>` per file, swapped in place. The CSS values are byte-identical across the three files apart from the class prefix (`ts-` / `ci-` / `sch-`), so the banner hands off to dev as a single component. Existing element IDs are preserved, so each file's existing dismiss/CTA JavaScript is untouched.

**Tech Stack:** Vanilla HTML/CSS, Vector Web Components (`vaadin-button`) via CDN, self-hosted Font Awesome 6 Pro. No build step, no test runner, no package manager — files open directly via `file://`. Verification is browser-based via the Playwright MCP tools.

**Spec:** `docs/superpowers/specs/2026-08-04-keystone-hub-announcement-banner-design.md`

## Global Constraints

- **No test runner exists in this repo and none is to be added.** The test cycle for each task is: apply the edit → open the file in the browser → run the assertion script (given verbatim in each task) → require `PASS` → screenshot at two widths → commit. Do not introduce npm, a bundler, or a framework.
- **Vanilla only.** No JS frameworks or libraries. ES6+ vanilla JS is fine; no new JS is needed by this plan.
- **Edit `ver1/index.html` in place.** Do not create `ver2` folders and do not add a version switcher to a design file.
- **Identical in all three files.** Every CSS value in the banner block is the same in all three; only the `ts-` / `ci-` / `sch-` class prefix and the element IDs differ. This includes `margin-bottom: 20px`, which replaces the three different old values (20px / 22px / 16px) — that uniformity is intentional and is checked by a hash test in Task 4.
- **Do not delete the `*-new-pill` CSS rule.** It is also used by a nav badge elsewhere in each file (`ts-` line ~541, `ci-` line ~450, `sch-` line ~604). Only its use *inside the banner* goes away.
- **Do not touch the `vaadin-button { --vaadin-button-border-radius: 999px; }` rule** that follows the banner CSS block in each file. The banner's own buttons override the radius locally.
- **Preserve these element IDs exactly:** `<prefix>-announce`, `<prefix>-announce-cta`, `<prefix>-announce-dismiss`. Existing JS at the bottom of each file binds to them (`window.tsSetView('hub')` / `window.ciSetView('hub')` / `window.schSetView('hub')` for the CTA; `banner.hidden = true` for dismiss).
- **Copy, verbatim:** eyebrow `New in Keystone` (uppercased by CSS), pill `Live` (uppercased by CSS), headline `Stop hunting for what's due.`, body `The <strong>Department Hub</strong> gathers every open task across your Vector applications, prioritized in one place — with department readiness at a glance.`, CTA `View the Department Hub`, subline `Or find it any time in the left navigation`. Use a real em dash (—), not `--`.
- **Silent icon failure is a known trap here.** A Font Awesome class not in the loaded set renders as a zero-width invisible glyph with no console error. The assertion script in every task checks for this; an empty result is required.
- **Commit after each task.** One commit per file.

---

### Task 1: Target Solutions banner

**Files:**
- Modify: `products/Keystone Department Hub/embedded-target-solutions/ver1/index.html` — CSS block at lines 390–423, markup at lines 627–650

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the canonical banner CSS and markup. Tasks 2 and 3 reproduce it verbatim with the prefix swapped (`ci-`, `sch-`) and IDs swapped (`ci-announce*`, `sch-announce*`). The class names it establishes, all of which Tasks 2 and 3 mirror: `<prefix>-announce-copy`, `<prefix>-announce-eyebrow`, `<prefix>-announce-mark`, `<prefix>-announce-kicker`, `<prefix>-announce-live`, `<prefix>-announce-actions`, `<prefix>-announce-cta-wrap`, `<prefix>-announce-sub`.

- [ ] **Step 1: Replace the banner CSS block**

In `products/Keystone Department Hub/embedded-target-solutions/ver1/index.html`, find this block (starts at line 390, ends with the `.ts-announce-actions` line — stop *before* the `/* Buttons are pill-shaped */` comment, which stays):

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     The one genuinely new element on this page, so it is built from Vector
     components and theme tokens rather than the hand-matched legacy styles
     above. Dismissal is session-only, on purpose: no storage is written, so
     a reload always restores it and the demo resets to a known state.
     ==================================================================== */
  #ts-announce {
    display: flex; align-items: center; gap: 18px;
    background: var(--ts-surface);
    border: 1px solid var(--ts-hairline);
    border-left: 5px solid var(--lumo-primary-color, #0271ce);
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(16,24,40,.10);
    padding: 16px 18px; margin-bottom: 20px;
  }
  #ts-announce[hidden] { display: none; }
  .ts-announce-mark {
    width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
    display: grid; place-items: center; font-size: 19px;
    background: var(--lumo-primary-color-10pct, #0271ce1a);
    color: var(--lumo-primary-text-color, #0271ce);
  }
  .ts-announce-copy { flex: 1; min-width: 0; }
  .ts-announce-copy h3 {
    margin: 0 0 3px; font-size: 16px; font-weight: 700;
    color: var(--lumo-header-text-color, #1f2933);
    display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  }
  .ts-announce-copy p {
    margin: 0; font-size: 14px; line-height: 1.5;
    color: var(--lumo-secondary-text-color, #5b6673);
  }
  .ts-announce-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
```

Replace it with:

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     A dark, Keystone-branded banner that deliberately breaks the host app's
     light-card rhythm: this is a product announcement, not another panel.
     The values here are identical in all three embedded mocks (only the
     class prefix differs), so it hands off to dev as ONE component.

     Dismissal is session-only, on purpose: no storage is written, so a
     reload always restores it and the demo resets to a known state.
     ==================================================================== */
  #ts-announce {
    position: relative;
    display: flex; align-items: center; gap: 28px;
    padding: 26px 30px; margin-bottom: 20px;
    border-radius: 14px;
    background: linear-gradient(100deg, #08172b 0%, #0d3a72 55%, #0f5fbd 100%);
  }
  #ts-announce[hidden] { display: none; }

  /* ---- left column: eyebrow row, headline, body ---- */
  .ts-announce-copy { flex: 1; min-width: 0; }
  .ts-announce-eyebrow {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .ts-announce-mark {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    display: grid; place-items: center; font-size: 16px;
    background: var(--lumo-primary-color, #0271ce); color: #fff;
  }
  .ts-announce-kicker {
    font-size: 12px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #77b6f2;
  }
  .ts-announce-live {
    font-size: 11px; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; padding: 3px 10px; border-radius: 999px;
    background: #6ee7ad; color: #0a3b2a;
  }
  .ts-announce-copy h3 {
    margin: 0 0 8px; font-size: 30px; line-height: 1.12; font-weight: 700;
    letter-spacing: -.01em; color: #fff;
  }
  .ts-announce-copy p {
    margin: 0; max-width: 68ch; font-size: 15px; line-height: 1.5;
    color: #bcd8f5;
  }
  .ts-announce-copy p strong { color: #fff; font-weight: 700; }

  /* ---- right column: CTA + subline, then the dismiss square ---- */
  .ts-announce-actions {
    display: flex; align-items: center; gap: 14px; flex-shrink: 0;
  }
  .ts-announce-cta-wrap { display: flex; flex-direction: column; gap: 8px; }
  .ts-announce-sub { font-size: 13px; color: #9dc6ec; text-align: center; }

  /* A white-on-dark button is NOT a stock Vector variant — the closest,
     theme="contrast primary", is dark-filled and would vanish on this
     background. Scoped inverse override; call it out at dev handoff.
     Both the custom properties and the direct declarations are set: outer
     author styles win over the component's own :host rules, and the custom
     props cover the same ground through the documented API. */
  #ts-announce-cta {
    --vaadin-button-border-radius: 10px;
    --vaadin-button-background: #fff;
    --vaadin-button-text-color: #0d2a4d;
    background: #fff; color: #0d2a4d; font-weight: 700;
  }
  #ts-announce-dismiss {
    --vaadin-button-border-radius: 8px;
    --vaadin-button-background: rgba(255,255,255,.12);
    --vaadin-button-text-color: #fff;
    width: 36px; min-width: 36px; height: 36px; padding: 0;
    background: rgba(255,255,255,.12); color: #fff;
  }

  /* ---- narrow: action column stacks under the copy, ✕ pins top-right ---- */
  @media (max-width: 900px) {
    #ts-announce {
      flex-direction: column; align-items: stretch;
      gap: 20px; padding: 24px 22px 26px;
    }
    .ts-announce-copy h3 { font-size: 24px; padding-right: 44px; }
    .ts-announce-actions { flex-direction: column; align-items: stretch; }
    .ts-announce-cta-wrap { width: 100%; }
    #ts-announce-cta { width: 100%; }
    #ts-announce-dismiss { position: absolute; top: 14px; right: 14px; }
  }
```

- [ ] **Step 2: Replace the banner markup**

Find this block (line 627):

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="ts-announce" role="region"
                 aria-label="New feature announcement">
          <div class="ts-announce-mark">
            <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
          </div>
          <div class="ts-announce-copy">
            <h3>
              Introducing the Keystone Department Hub
              <span class="ts-new-pill">NEW</span>
            </h3>
            <p>
              Every open task across your Vector applications, prioritized in one place —
              with department readiness at a glance. Find it any time in the left
              navigation.
            </p>
          </div>
          <div class="ts-announce-actions">
            <vaadin-button theme="primary" id="ts-announce-cta">View the Department Hub</vaadin-button>
            <vaadin-button theme="tertiary" id="ts-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

Replace it with:

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="ts-announce" role="region"
                 aria-label="New feature announcement">
          <div class="ts-announce-copy">
            <div class="ts-announce-eyebrow">
              <span class="ts-announce-mark">
                <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
              </span>
              <span class="ts-announce-kicker">New in Keystone</span>
              <span class="ts-announce-live">Live</span>
            </div>
            <h3>Stop hunting for what&rsquo;s due.</h3>
            <p>
              The <strong>Department Hub</strong> gathers every open task across your Vector
              applications, prioritized in one place — with department readiness at a glance.
            </p>
          </div>
          <div class="ts-announce-actions">
            <div class="ts-announce-cta-wrap">
              <vaadin-button theme="primary" id="ts-announce-cta">View the Department Hub</vaadin-button>
              <span class="ts-announce-sub">Or find it any time in the left navigation</span>
            </div>
            <vaadin-button theme="tertiary" id="ts-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

- [ ] **Step 3: Open the file in the browser at desktop width**

Use `mcp__playwright__browser_resize` to 1400×900, then `mcp__playwright__browser_navigate` to:

`file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/embedded-target-solutions/ver1/index.html`

- [ ] **Step 4: Run the assertion script — this is the test**

Run via `mcp__playwright__browser_evaluate` with this function:

```js
() => {
  const b = document.getElementById('ts-announce');
  if (!b) return ['banner element missing'];
  const cs = getComputedStyle(b);
  const cta = document.getElementById('ts-announce-cta');
  const dis = document.getElementById('ts-announce-dismiss');
  const h3 = b.querySelector('h3');
  const fails = [];

  if (!/linear-gradient/.test(cs.backgroundImage)) fails.push('gradient missing: ' + cs.backgroundImage);
  if (cs.borderRadius !== '14px') fails.push('radius = ' + cs.borderRadius);
  if (getComputedStyle(h3).color !== 'rgb(255, 255, 255)') fails.push('headline not white: ' + getComputedStyle(h3).color);
  if (h3.textContent.trim() !== 'Stop hunting for what’s due.') fails.push('headline copy = ' + JSON.stringify(h3.textContent.trim()));
  if (!b.querySelector('p strong')) fails.push('body is missing the bold "Department Hub"');

  // CTA must actually render white-on-navy, not fall back to Vaadin's blue fill.
  const ctaBg = getComputedStyle(cta).backgroundColor;
  if (ctaBg !== 'rgb(255, 255, 255)') fails.push('CTA background = ' + ctaBg);
  if (cta.getBoundingClientRect().width < 100) fails.push('CTA too narrow: ' + cta.getBoundingClientRect().width);
  if (dis.getBoundingClientRect().width < 20) fails.push('dismiss button not rendering');

  // Silent-icon check: a missing FA glyph is zero-width with no console error.
  const invisible = [...b.querySelectorAll('i[class*="fa-"]')]
    .filter(e => !e.getBoundingClientRect().width).map(e => e.className);
  if (invisible.length) fails.push('invisible icons: ' + invisible.join(' | '));

  // The banner must not push the page wider than the viewport.
  if (b.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    fails.push('banner overflows viewport');

  return fails.length ? fails : 'PASS';
}
```

Expected: `PASS`. If it returns a list, fix the reported items and re-run before continuing.

- [ ] **Step 5: Screenshot desktop and compare to the approved design**

`mcp__playwright__browser_take_screenshot` (viewport, not full page). Compare against the approved screenshot: dark navy→blue gradient left to right, flame on a blue tile, `NEW IN KEYSTONE` + green `LIVE`, large white headline, white CTA with the subline beneath it, translucent ✕ at the far right. Fix any visible mismatch before continuing.

- [ ] **Step 6: Verify the interactions still work**

Click `#ts-announce-cta` (`mcp__playwright__browser_click`). Expected: the mock switches to the Keystone Hub view and the sidebar selection moves to Keystone Hub. Then navigate back to the file URL, click `#ts-announce-dismiss`. Expected: the banner disappears. Reload. Expected: the banner is back (dismissal writes no storage).

- [ ] **Step 7: Verify the narrow layout**

`mcp__playwright__browser_resize` to 760×900, reload the file, re-run the Step 4 script (expected: `PASS` — the overflow check is the point at this width), and screenshot. Expected: copy on top, full-width CTA with the subline centred beneath it, ✕ pinned to the banner's top-right corner, no horizontal overflow, headline not colliding with the ✕.

- [ ] **Step 8: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/embedded-target-solutions/ver1/index.html"
git commit -m "Keystone embeds: dark announcement banner in Target Solutions"
```

---

### Task 2: Check It banner

**Files:**
- Modify: `products/Keystone Department Hub/embedded-check-it/ver1/index.html` — CSS block at lines 254–284, markup at lines 530–551

**Interfaces:**
- Consumes: the canonical banner CSS/markup from Task 1, reproduced below with the `ci-` prefix and `ci-announce*` IDs. Values are otherwise byte-identical — Task 4 hash-checks this.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Replace the banner CSS block**

In `products/Keystone Department Hub/embedded-check-it/ver1/index.html`, find this block (starts at line 254, ends with the `.ci-announce-actions` line — stop *before* the `/* Buttons are pill-shaped */` comment, which stays):

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     The one genuinely new element, so it is built from Vector components and
     theme tokens rather than the hand-matched legacy styles elsewhere.
     Dismissal is session-only, on purpose: no storage is written, so a reload
     always restores it and the demo resets to a known state.
     ==================================================================== */
  #ci-announce {
    display: flex; align-items: center; gap: 16px;
    background: #fff; border: 1px solid var(--ci-hairline);
    border-left: 5px solid var(--lumo-primary-color, #0271ce);
    border-radius: 4px; padding: 14px 16px; margin-bottom: 22px;
  }
  #ci-announce[hidden] { display: none; }
  .ci-announce-mark {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: grid; place-items: center; font-size: 18px;
    background: var(--lumo-primary-color-10pct, #0271ce1a);
    color: var(--lumo-primary-text-color, #0271ce);
  }
  .ci-announce-copy { flex: 1; min-width: 0; }
  .ci-announce-copy h3 {
    margin: 0 0 3px; font-size: 15px; font-weight: 700;
    color: var(--lumo-header-text-color, #2f2f2f);
    display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  }
  .ci-announce-copy p {
    margin: 0; font-size: 13px; line-height: 1.5;
    color: var(--lumo-secondary-text-color, #666);
  }
  .ci-announce-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
```

Replace it with:

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     A dark, Keystone-branded banner that deliberately breaks the host app's
     light-card rhythm: this is a product announcement, not another panel.
     The values here are identical in all three embedded mocks (only the
     class prefix differs), so it hands off to dev as ONE component.

     Dismissal is session-only, on purpose: no storage is written, so a
     reload always restores it and the demo resets to a known state.
     ==================================================================== */
  #ci-announce {
    position: relative;
    display: flex; align-items: center; gap: 28px;
    padding: 26px 30px; margin-bottom: 20px;
    border-radius: 14px;
    background: linear-gradient(100deg, #08172b 0%, #0d3a72 55%, #0f5fbd 100%);
  }
  #ci-announce[hidden] { display: none; }

  /* ---- left column: eyebrow row, headline, body ---- */
  .ci-announce-copy { flex: 1; min-width: 0; }
  .ci-announce-eyebrow {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .ci-announce-mark {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    display: grid; place-items: center; font-size: 16px;
    background: var(--lumo-primary-color, #0271ce); color: #fff;
  }
  .ci-announce-kicker {
    font-size: 12px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #77b6f2;
  }
  .ci-announce-live {
    font-size: 11px; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; padding: 3px 10px; border-radius: 999px;
    background: #6ee7ad; color: #0a3b2a;
  }
  .ci-announce-copy h3 {
    margin: 0 0 8px; font-size: 30px; line-height: 1.12; font-weight: 700;
    letter-spacing: -.01em; color: #fff;
  }
  .ci-announce-copy p {
    margin: 0; max-width: 68ch; font-size: 15px; line-height: 1.5;
    color: #bcd8f5;
  }
  .ci-announce-copy p strong { color: #fff; font-weight: 700; }

  /* ---- right column: CTA + subline, then the dismiss square ---- */
  .ci-announce-actions {
    display: flex; align-items: center; gap: 14px; flex-shrink: 0;
  }
  .ci-announce-cta-wrap { display: flex; flex-direction: column; gap: 8px; }
  .ci-announce-sub { font-size: 13px; color: #9dc6ec; text-align: center; }

  /* A white-on-dark button is NOT a stock Vector variant — the closest,
     theme="contrast primary", is dark-filled and would vanish on this
     background. Scoped inverse override; call it out at dev handoff.
     Both the custom properties and the direct declarations are set: outer
     author styles win over the component's own :host rules, and the custom
     props cover the same ground through the documented API. */
  #ci-announce-cta {
    --vaadin-button-border-radius: 10px;
    --vaadin-button-background: #fff;
    --vaadin-button-text-color: #0d2a4d;
    background: #fff; color: #0d2a4d; font-weight: 700;
  }
  #ci-announce-dismiss {
    --vaadin-button-border-radius: 8px;
    --vaadin-button-background: rgba(255,255,255,.12);
    --vaadin-button-text-color: #fff;
    width: 36px; min-width: 36px; height: 36px; padding: 0;
    background: rgba(255,255,255,.12); color: #fff;
  }

  /* ---- narrow: action column stacks under the copy, ✕ pins top-right ---- */
  @media (max-width: 900px) {
    #ci-announce {
      flex-direction: column; align-items: stretch;
      gap: 20px; padding: 24px 22px 26px;
    }
    .ci-announce-copy h3 { font-size: 24px; padding-right: 44px; }
    .ci-announce-actions { flex-direction: column; align-items: stretch; }
    .ci-announce-cta-wrap { width: 100%; }
    #ci-announce-cta { width: 100%; }
    #ci-announce-dismiss { position: absolute; top: 14px; right: 14px; }
  }
```

- [ ] **Step 2: Replace the banner markup**

Find this block (line 530):

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="ci-announce" role="region" aria-label="New feature announcement">
          <div class="ci-announce-mark">
            <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
          </div>
          <div class="ci-announce-copy">
            <h3>
              Introducing the Keystone Department Hub
              <span class="ci-new-pill">NEW</span>
            </h3>
            <p>
              Every open task across your Vector applications, prioritized in one place —
              with department readiness at a glance. Find it any time in the left navigation.
            </p>
          </div>
          <div class="ci-announce-actions">
            <vaadin-button theme="primary" id="ci-announce-cta">View the Department Hub</vaadin-button>
            <vaadin-button theme="tertiary" id="ci-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

Replace it with:

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="ci-announce" role="region" aria-label="New feature announcement">
          <div class="ci-announce-copy">
            <div class="ci-announce-eyebrow">
              <span class="ci-announce-mark">
                <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
              </span>
              <span class="ci-announce-kicker">New in Keystone</span>
              <span class="ci-announce-live">Live</span>
            </div>
            <h3>Stop hunting for what&rsquo;s due.</h3>
            <p>
              The <strong>Department Hub</strong> gathers every open task across your Vector
              applications, prioritized in one place — with department readiness at a glance.
            </p>
          </div>
          <div class="ci-announce-actions">
            <div class="ci-announce-cta-wrap">
              <vaadin-button theme="primary" id="ci-announce-cta">View the Department Hub</vaadin-button>
              <span class="ci-announce-sub">Or find it any time in the left navigation</span>
            </div>
            <vaadin-button theme="tertiary" id="ci-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

- [ ] **Step 3: Open the file in the browser at desktop width**

`mcp__playwright__browser_resize` to 1400×900, then navigate to:

`file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/embedded-check-it/ver1/index.html`

- [ ] **Step 4: Run the assertion script — this is the test**

```js
() => {
  const b = document.getElementById('ci-announce');
  if (!b) return ['banner element missing'];
  const cs = getComputedStyle(b);
  const cta = document.getElementById('ci-announce-cta');
  const dis = document.getElementById('ci-announce-dismiss');
  const h3 = b.querySelector('h3');
  const fails = [];

  if (!/linear-gradient/.test(cs.backgroundImage)) fails.push('gradient missing: ' + cs.backgroundImage);
  if (cs.borderRadius !== '14px') fails.push('radius = ' + cs.borderRadius);
  if (getComputedStyle(h3).color !== 'rgb(255, 255, 255)') fails.push('headline not white: ' + getComputedStyle(h3).color);
  if (h3.textContent.trim() !== 'Stop hunting for what’s due.') fails.push('headline copy = ' + JSON.stringify(h3.textContent.trim()));
  if (!b.querySelector('p strong')) fails.push('body is missing the bold "Department Hub"');

  const ctaBg = getComputedStyle(cta).backgroundColor;
  if (ctaBg !== 'rgb(255, 255, 255)') fails.push('CTA background = ' + ctaBg);
  if (cta.getBoundingClientRect().width < 100) fails.push('CTA too narrow: ' + cta.getBoundingClientRect().width);
  if (dis.getBoundingClientRect().width < 20) fails.push('dismiss button not rendering');

  const invisible = [...b.querySelectorAll('i[class*="fa-"]')]
    .filter(e => !e.getBoundingClientRect().width).map(e => e.className);
  if (invisible.length) fails.push('invisible icons: ' + invisible.join(' | '));

  if (b.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    fails.push('banner overflows viewport');

  return fails.length ? fails : 'PASS';
}
```

Expected: `PASS`.

- [ ] **Step 5: Screenshot desktop and compare to the approved design**

Screenshot the viewport and check it against the approved screenshot and against the Task 1 result — they should be indistinguishable apart from the surrounding host page.

- [ ] **Step 6: Verify the interactions still work**

Click `#ci-announce-cta`. Expected: the mock switches to the Keystone Hub view (`window.ciSetView('hub')`). Navigate back, click `#ci-announce-dismiss`. Expected: the banner hides. Reload. Expected: it returns.

- [ ] **Step 7: Verify the narrow layout**

Resize to 760×900, reload, re-run the Step 4 script (expected: `PASS`), screenshot. Expected: stacked copy, full-width CTA, centred subline, ✕ at the top-right, no overflow.

- [ ] **Step 8: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/embedded-check-it/ver1/index.html"
git commit -m "Keystone embeds: dark announcement banner in Check It"
```

---

### Task 3: Scheduling banner

**Files:**
- Modify: `products/Keystone Department Hub/embedded-scheduling/ver1/index.html` — CSS block at lines 298–328, markup at lines 685–706

**Interfaces:**
- Consumes: the canonical banner CSS/markup from Task 1, reproduced below with the `sch-` prefix and `sch-announce*` IDs. Values are otherwise byte-identical — Task 4 hash-checks this.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Replace the banner CSS block**

In `products/Keystone Department Hub/embedded-scheduling/ver1/index.html`, find this block (starts at line 298, ends with the `.sch-announce-actions` line — stop *before* the `/* Buttons are pill-shaped */` comment, which stays):

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     The one genuinely new element, so it is built from Vector components and
     theme tokens rather than the hand-matched legacy styles elsewhere.
     Dismissal is session-only, on purpose: no storage is written, so a reload
     always restores it and the demo resets to a known state.
     ==================================================================== */
  #sch-announce {
    display: flex; align-items: center; gap: 16px;
    background: #fff; border: 1px solid var(--sch-hairline);
    border-left: 5px solid var(--lumo-primary-color, #0271ce);
    border-radius: 3px; padding: 14px 16px; margin-bottom: 16px;
  }
  #sch-announce[hidden] { display: none; }
  .sch-announce-mark {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: grid; place-items: center; font-size: 18px;
    background: var(--lumo-primary-color-10pct, #0271ce1a);
    color: var(--lumo-primary-text-color, #0271ce);
  }
  .sch-announce-copy { flex: 1; min-width: 0; }
  .sch-announce-copy h3 {
    margin: 0 0 3px; font-size: 15px; font-weight: 700;
    color: var(--lumo-header-text-color, #333);
    display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  }
  .sch-announce-copy p {
    margin: 0; font-size: 13px; line-height: 1.5;
    color: var(--lumo-secondary-text-color, #666);
  }
  .sch-announce-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
```

Replace it with:

```css
  /* ====================================================================
     ANNOUNCEMENT BANNER — NEW
     A dark, Keystone-branded banner that deliberately breaks the host app's
     light-card rhythm: this is a product announcement, not another panel.
     The values here are identical in all three embedded mocks (only the
     class prefix differs), so it hands off to dev as ONE component.

     Dismissal is session-only, on purpose: no storage is written, so a
     reload always restores it and the demo resets to a known state.
     ==================================================================== */
  #sch-announce {
    position: relative;
    display: flex; align-items: center; gap: 28px;
    padding: 26px 30px; margin-bottom: 20px;
    border-radius: 14px;
    background: linear-gradient(100deg, #08172b 0%, #0d3a72 55%, #0f5fbd 100%);
  }
  #sch-announce[hidden] { display: none; }

  /* ---- left column: eyebrow row, headline, body ---- */
  .sch-announce-copy { flex: 1; min-width: 0; }
  .sch-announce-eyebrow {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .sch-announce-mark {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    display: grid; place-items: center; font-size: 16px;
    background: var(--lumo-primary-color, #0271ce); color: #fff;
  }
  .sch-announce-kicker {
    font-size: 12px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #77b6f2;
  }
  .sch-announce-live {
    font-size: 11px; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; padding: 3px 10px; border-radius: 999px;
    background: #6ee7ad; color: #0a3b2a;
  }
  .sch-announce-copy h3 {
    margin: 0 0 8px; font-size: 30px; line-height: 1.12; font-weight: 700;
    letter-spacing: -.01em; color: #fff;
  }
  .sch-announce-copy p {
    margin: 0; max-width: 68ch; font-size: 15px; line-height: 1.5;
    color: #bcd8f5;
  }
  .sch-announce-copy p strong { color: #fff; font-weight: 700; }

  /* ---- right column: CTA + subline, then the dismiss square ---- */
  .sch-announce-actions {
    display: flex; align-items: center; gap: 14px; flex-shrink: 0;
  }
  .sch-announce-cta-wrap { display: flex; flex-direction: column; gap: 8px; }
  .sch-announce-sub { font-size: 13px; color: #9dc6ec; text-align: center; }

  /* A white-on-dark button is NOT a stock Vector variant — the closest,
     theme="contrast primary", is dark-filled and would vanish on this
     background. Scoped inverse override; call it out at dev handoff.
     Both the custom properties and the direct declarations are set: outer
     author styles win over the component's own :host rules, and the custom
     props cover the same ground through the documented API. */
  #sch-announce-cta {
    --vaadin-button-border-radius: 10px;
    --vaadin-button-background: #fff;
    --vaadin-button-text-color: #0d2a4d;
    background: #fff; color: #0d2a4d; font-weight: 700;
  }
  #sch-announce-dismiss {
    --vaadin-button-border-radius: 8px;
    --vaadin-button-background: rgba(255,255,255,.12);
    --vaadin-button-text-color: #fff;
    width: 36px; min-width: 36px; height: 36px; padding: 0;
    background: rgba(255,255,255,.12); color: #fff;
  }

  /* ---- narrow: action column stacks under the copy, ✕ pins top-right ---- */
  @media (max-width: 900px) {
    #sch-announce {
      flex-direction: column; align-items: stretch;
      gap: 20px; padding: 24px 22px 26px;
    }
    .sch-announce-copy h3 { font-size: 24px; padding-right: 44px; }
    .sch-announce-actions { flex-direction: column; align-items: stretch; }
    .sch-announce-cta-wrap { width: 100%; }
    #sch-announce-cta { width: 100%; }
    #sch-announce-dismiss { position: absolute; top: 14px; right: 14px; }
  }
```

- [ ] **Step 2: Replace the banner markup**

Find this block (line 685):

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="sch-announce" role="region" aria-label="New feature announcement">
          <div class="sch-announce-mark">
            <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
          </div>
          <div class="sch-announce-copy">
            <h3>
              Introducing the Keystone Department Hub
              <span class="sch-new-pill">NEW</span>
            </h3>
            <p>
              Every open task across your Vector applications, prioritized in one place —
              with department readiness at a glance. Find it any time in the left navigation.
            </p>
          </div>
          <div class="sch-announce-actions">
            <vaadin-button theme="primary" id="sch-announce-cta">View the Department Hub</vaadin-button>
            <vaadin-button theme="tertiary" id="sch-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

Replace it with:

```html
        <!-- ================= ANNOUNCEMENT (NEW) ================= -->
        <section id="sch-announce" role="region" aria-label="New feature announcement">
          <div class="sch-announce-copy">
            <div class="sch-announce-eyebrow">
              <span class="sch-announce-mark">
                <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
              </span>
              <span class="sch-announce-kicker">New in Keystone</span>
              <span class="sch-announce-live">Live</span>
            </div>
            <h3>Stop hunting for what&rsquo;s due.</h3>
            <p>
              The <strong>Department Hub</strong> gathers every open task across your Vector
              applications, prioritized in one place — with department readiness at a glance.
            </p>
          </div>
          <div class="sch-announce-actions">
            <div class="sch-announce-cta-wrap">
              <vaadin-button theme="primary" id="sch-announce-cta">View the Department Hub</vaadin-button>
              <span class="sch-announce-sub">Or find it any time in the left navigation</span>
            </div>
            <vaadin-button theme="tertiary" id="sch-announce-dismiss" aria-label="Dismiss announcement">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </vaadin-button>
          </div>
        </section>
```

- [ ] **Step 3: Open the file in the browser at desktop width**

`mcp__playwright__browser_resize` to 1400×900, then navigate to:

`file:///Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone%20Department%20Hub/embedded-scheduling/ver1/index.html`

- [ ] **Step 4: Run the assertion script — this is the test**

```js
() => {
  const b = document.getElementById('sch-announce');
  if (!b) return ['banner element missing'];
  const cs = getComputedStyle(b);
  const cta = document.getElementById('sch-announce-cta');
  const dis = document.getElementById('sch-announce-dismiss');
  const h3 = b.querySelector('h3');
  const fails = [];

  if (!/linear-gradient/.test(cs.backgroundImage)) fails.push('gradient missing: ' + cs.backgroundImage);
  if (cs.borderRadius !== '14px') fails.push('radius = ' + cs.borderRadius);
  if (getComputedStyle(h3).color !== 'rgb(255, 255, 255)') fails.push('headline not white: ' + getComputedStyle(h3).color);
  if (h3.textContent.trim() !== 'Stop hunting for what’s due.') fails.push('headline copy = ' + JSON.stringify(h3.textContent.trim()));
  if (!b.querySelector('p strong')) fails.push('body is missing the bold "Department Hub"');

  const ctaBg = getComputedStyle(cta).backgroundColor;
  if (ctaBg !== 'rgb(255, 255, 255)') fails.push('CTA background = ' + ctaBg);
  if (cta.getBoundingClientRect().width < 100) fails.push('CTA too narrow: ' + cta.getBoundingClientRect().width);
  if (dis.getBoundingClientRect().width < 20) fails.push('dismiss button not rendering');

  const invisible = [...b.querySelectorAll('i[class*="fa-"]')]
    .filter(e => !e.getBoundingClientRect().width).map(e => e.className);
  if (invisible.length) fails.push('invisible icons: ' + invisible.join(' | '));

  if (b.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    fails.push('banner overflows viewport');

  return fails.length ? fails : 'PASS';
}
```

Expected: `PASS`.

- [ ] **Step 5: Screenshot desktop and compare to the approved design**

Screenshot the viewport. Note this page's homepage is a two-column layout — confirm the banner spans the full content width above the columns and does not squeeze into one.

- [ ] **Step 6: Verify the interactions still work**

Click `#sch-announce-cta`. Expected: the mock switches to the Keystone Hub view (`window.schSetView('hub')`). Navigate back, click `#sch-announce-dismiss`. Expected: the banner hides. Reload. Expected: it returns.

- [ ] **Step 7: Verify the narrow layout**

Resize to 760×900, reload, re-run the Step 4 script (expected: `PASS`), screenshot. Expected: stacked copy, full-width CTA, centred subline, ✕ at the top-right, no overflow.

- [ ] **Step 8: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add "products/Keystone Department Hub/embedded-scheduling/ver1/index.html"
git commit -m "Keystone embeds: dark announcement banner in Scheduling"
```

---

### Task 4: Cross-file consistency check and dashboard dates

**Files:**
- Modify: `products.json` (repo root) — the `modified` field on the three entries under the "Embedded App Views" folder: `In Target Solutions`, `In Vector Scheduling`, `In Vector Check It`

**Interfaces:**
- Consumes: the three completed banners from Tasks 1–3.
- Produces: nothing.

- [ ] **Step 1: Write the consistency test and watch it verify all three files**

This is the test for the "identical in all three" constraint: it slices the banner CSS out of each file, normalises the `ts-` / `ci-` / `sch-` prefixes to `X-`, and hashes the result. Run:

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone Department Hub"
python3 - <<'PY'
import re, hashlib
files = {'ts': 'embedded-target-solutions/ver1/index.html',
         'ci': 'embedded-check-it/ver1/index.html',
         'sch': 'embedded-scheduling/ver1/index.html'}
hashes = {}
for p, f in files.items():
    s = open(f, encoding='utf-8').read()
    start = s.index('ANNOUNCEMENT BANNER — NEW')
    end = s.index('Buttons are pill-shaped', start)
    css = re.sub(r'(--)?\b(ts|ci|sch)-', lambda m: (m.group(1) or '') + 'X-', s[start:end])
    hashes[p] = hashlib.md5(css.encode()).hexdigest()
    print(p, hashes[p])
print('IDENTICAL' if len(set(hashes.values())) == 1 else 'MISMATCH')
PY
```

Expected: three identical hashes and `IDENTICAL`. If it prints `MISMATCH`, diff the offending file's banner CSS against Task 1's block and correct it — a mismatch means one file drifted, which is exactly the handoff problem this constraint exists to prevent.

- [ ] **Step 2: Confirm no stray references to the old banner structure remain**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups/products/Keystone Department Hub"
grep -n "Introducing the Keystone Department Hub" embedded-*/ver1/index.html; echo "exit: $?"
grep -c "new-pill" embedded-target-solutions/ver1/index.html embedded-check-it/ver1/index.html embedded-scheduling/ver1/index.html
```

Expected: the first grep finds nothing (`exit: 1`). The second prints `2` for each file — the `*-new-pill` CSS rule plus its one remaining nav-badge use. A count of `3` means a banner still holds the old NEW pill; a count of `1` means the shared CSS rule was wrongly deleted.

- [ ] **Step 3: Run the contrast check**

The background is a gradient, so each text colour is checked against the gradient colour at its
own horizontal position. Run:

```bash
python3 - <<'PY'
def lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    h = h.lstrip('#')
    return (0.2126 * lin(int(h[0:2], 16)) + 0.7152 * lin(int(h[2:4], 16))
            + 0.0722 * lin(int(h[4:6], 16)))

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

pairs = [
    ('headline',      '#ffffff', '#0d3a72', 4.5),
    ('body',          '#bcd8f5', '#0d3a72', 4.5),
    ('eyebrow',       '#77b6f2', '#08172b', 4.5),
    ('LIVE pill text','#0a3b2a', '#6ee7ad', 4.5),
    ('subline',       '#9dc6ec', '#0e468b', 4.5),
    ('CTA label',     '#0d2a4d', '#ffffff', 4.5),
]
bad = 0
for name, fg, bg, floor in pairs:
    r = ratio(fg, bg)
    ok = r >= floor
    bad += not ok
    print(f'{"ok  " if ok else "FAIL"} {name:15} {fg} on {bg}  {r:.2f}:1')
print('ALL PASS' if not bad else f'{bad} FAILING')
PY
```

Expected: `ALL PASS`, with ratios near 11.3 / 7.7 / 8.4 / 8.2 / 5.2 / 14.4 respectively. If a colour
was altered during Tasks 1–3 and now fails, lighten the offending text colour rather than darkening
the gradient — the gradient is the approved design.

- [ ] **Step 4: Update the three `modified` dates in `products.json`**

In `products.json` at the repo root, inside the `"folder": "Embedded App Views"` group, set `"modified": "2026-08-04"` on the three entries whose `rel` values are `embedded-target-solutions`, `embedded-check-it`, and `embedded-scheduling`. Change nothing else — leave `status`, `desc`, `name`, and `rel` as they are.

- [ ] **Step 5: Verify the JSON still parses**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
python3 -c "import json; d=json.load(open('products.json')); print('JSON OK')"
```

Expected: `JSON OK`. A trailing comma or a lost brace here breaks both the landing index and every product dashboard, so do not skip this.

- [ ] **Step 6: Confirm the dates landed**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
python3 -c "
import json
d = json.load(open('products.json'))
def walk(items):
    for it in items:
        if 'folder' in it: walk(it['items'])
        elif it.get('rel','').startswith('embedded-'): print(it['rel'], it.get('modified'))
for p in (d['products'] if isinstance(d, dict) else d): walk(p.get('items', []))
"
```

Expected: all three `embedded-*` rows show `2026-08-04`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/johnlangford/Documents/VibeCode/ux-mockups"
git add products.json
git commit -m "Keystone embeds: refresh dashboard dates for the new banner"
```

---

## Notes carried forward to dev handoff

Not part of this plan's work — record these for whoever runs the dev-handoff process later:

- The white-on-dark CTA is **not** a stock Vector button variant. `theme="contrast primary"` is dark-filled and unusable on this background, so the banner ships a scoped inverse override. This is a design-system gap worth raising, not something dev should reinvent per app.
- The CTA's 10px radius deliberately departs from the `--vaadin-button-border-radius: 999px` pill these mocks apply everywhere else. It matches the approved design.
- Dismissal is session-only by design (no storage), so demos always reset on reload. Real product behaviour — whether dismissal should persist per user — is an open product question, not a design omission.
