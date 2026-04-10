# Source Inspector — Click-to-Source Setup Guide

Alt+click any element in a mockup to jump directly to its line in VS Code.

---

## How it works

Two things work together:

1. **`data-file` / `data-line` attributes** on every meaningful HTML element map it back to its source file and line number.
2. **A small `<script>` block** at the bottom of the file listens for Alt+click and opens a `vscode://` protocol URL, which VS Code intercepts to navigate to that exact file and line.

---

## Setting up a new mockup file

### Step 1 — Annotate elements with source attributes

Run the following Python script from the **repo root**. Pass the path to the HTML file you want to annotate.

```bash
python3 scripts/annotate-source.py products/YourProduct/YourMockup/index.html
```

> **First time?** Create the script file at `scripts/annotate-source.py` using the code in the appendix at the bottom of this document.

The script adds `data-file` and `data-line` to every meaningful UI element in the static HTML — buttons, inputs, Vaadin/vwc components, named divs, labels, etc. It skips `<style>` and `<script>` blocks so your JavaScript is untouched.

### Step 2 — Add the inspector script to the HTML file

Paste this block immediately before `</body>` in your HTML file. **Update the `repoRoot` path to match where you cloned the repo on your machine.**

```html
<!-- SOURCE INSPECTOR — Alt+click any element to open it in VS Code -->
<script>
document.addEventListener('click', function (e) {
  if (!e.altKey) return;

  e.preventDefault();
  e.stopPropagation();

  // Walk up from the clicked target to find the nearest annotated element
  let el = e.target;
  while (el && el !== document.documentElement) {
    if (el.dataset && el.dataset.file) break;
    el = el.parentElement;
  }

  if (!el || !el.dataset.file) {
    console.warn('[source-inspector] No data-file found on this element or any ancestor.');
    return;
  }

  // ⚠️  Update this to your local repo root path
  const repoRoot = '/Users/yourname/path/to/ux-mockups/';

  const absPath = repoRoot + el.dataset.file;
  const line    = el.dataset.line || '1';
  const url     = `vscode://file${absPath}:${line}`;

  const a = document.createElement('a');
  a.href = url;
  a.click();
});
</script>
```

### Step 3 — Allow VS Code to handle the protocol URL

The first time you Alt+click, your browser will ask if it should allow `vscode://` links. Click **Allow** (or **Open VS Code**). Most browsers remember this choice permanently.

If VS Code doesn't open automatically, make sure it is installed and accessible from your system — the `vscode://` URI handler is registered by the VS Code installer on macOS, Windows, and Linux.

---

## Using it

- Open any annotated mockup HTML file directly in your browser (no local server needed).
- **Hold Alt and click** any UI element.
- VS Code opens to the exact line where that element is defined in the source file.

> **Tip:** Clicking icons or text inside a button works fine — the script walks up to the nearest annotated ancestor automatically.

---

## Re-annotating after edits

Line numbers drift when you add or remove lines. To re-annotate:

1. Remove existing `data-file` and `data-line` attributes (the script skips elements that already have them, so you need to clear them first if line numbers have changed significantly).
2. Re-run the annotate script.

A quick way to strip existing annotations before re-running:

```bash
sed -i '' 's/ data-file="[^"]*"//g; s/ data-line="[^"]*"//g' products/YourProduct/YourMockup/index.html
```

Then run the annotate script again.

---

## Appendix — `scripts/annotate-source.py`

Create this file at `scripts/annotate-source.py` in the repo root.

```python
#!/usr/bin/env python3
"""
Adds data-file and data-line attributes to every meaningful UI element
in an HTML mockup file. Run from the repo root:

    python3 scripts/annotate-source.py products/MyProduct/MyMockup/index.html
"""
import re
import sys
import os

if len(sys.argv) < 2:
    print("Usage: python3 scripts/annotate-source.py <path/to/file.html>")
    sys.exit(1)

FILE     = sys.argv[1]
REL_PATH = FILE.replace('\\', '/')  # normalize on Windows

MEANINGFUL_TAGS = {
    'button', 'a', 'input', 'select', 'textarea', 'label',
    'vaadin-button', 'vaadin-text-field', 'vaadin-text-area', 'vaadin-number-field',
    'vaadin-password-field', 'vaadin-checkbox', 'vaadin-radio-button', 'vaadin-radio-group',
    'vaadin-select', 'vaadin-combo-box', 'vaadin-multi-select-combo-box',
    'vaadin-date-picker', 'vaadin-date-time-picker', 'vaadin-dialog',
    'vaadin-notification', 'vaadin-upload', 'vaadin-tabs', 'vaadin-tab',
    'vaadin-accordion', 'vaadin-accordion-panel', 'vaadin-details', 'vaadin-badge',
    'vwc-card', 'vwc-drawer', 'vwc-topnav', 'vwc-sidenav', 'vwc-headline',
    'vwc-spinner', 'vwc-icon', 'vwc-switch', 'vwc-divider', 'vwc-badge',
    'vwc-stepper', 'vwc-stepper-step', 'vwc-toggle-button', 'vwc-toggle-button-group',
    'header', 'nav', 'main', 'footer', 'form',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
}

SKIP_CLASSES = {
    'wh-divider', 'dd-sep', 'rte-sep', 'tpl-prop-divider',
    'editor-divider', 'playhead-cap', 'preview-overlay', 'rte-color-bar',
}

TAG_RE = re.compile(
    r'(<(?P<tag>[a-zA-Z][a-zA-Z0-9-]*)(?P<attrs>(?:[^>"\']|"[^"]*"|\'[^\']*\')*)(?P<selfclose>/)?>)',
    re.DOTALL
)

def is_meaningful(tag, attrs):
    tag = tag.lower()
    if tag in MEANINGFUL_TAGS:
        return True
    if tag in ('div', 'span'):
        if re.search(r'\bid\s*=', attrs):
            return True
        cls_m = re.search(r'class\s*=\s*["\']([^"\']+)["\']', attrs)
        if cls_m:
            cls_set = set(cls_m.group(1).split())
            if cls_set & SKIP_CLASSES:
                return False
            return True
    return False

def already_annotated(attrs):
    return 'data-file=' in attrs or 'data-line=' in attrs

with open(FILE, 'r') as f:
    lines = f.readlines()

in_script = False
in_style  = False
output    = []

for lineno, line in enumerate(lines, start=1):
    stripped = line.strip()

    if re.match(r'<style[\s>]', stripped, re.IGNORECASE):
        in_style = True
    if re.match(r'</style>', stripped, re.IGNORECASE):
        in_style = False
    if re.match(r'<script[\s>]', stripped, re.IGNORECASE):
        in_script = True
        output.append(line)
        continue
    if re.match(r'</script>', stripped, re.IGNORECASE):
        in_script = False
        output.append(line)
        continue

    if in_script or in_style:
        output.append(line)
        continue

    def replace_tag(m):
        tag       = m.group('tag')
        attrs     = m.group('attrs') or ''
        selfclose = m.group('selfclose') or ''
        full      = m.group(0)

        if full.startswith('</') or full.startswith('<!--'):
            return full
        if already_annotated(attrs):
            return full
        if not is_meaningful(tag, attrs):
            return full

        data = f' data-file="{REL_PATH}" data-line="{lineno}"'
        if selfclose:
            return f'<{tag}{attrs}{data} />'
        else:
            return f'<{tag}{attrs}{data}>'

    output.append(TAG_RE.sub(replace_tag, line))

with open(FILE, 'w') as f:
    f.writelines(output)

count = sum(1 for l in output if 'data-file=' in l)
print(f"Done. Annotated elements found on {count} lines in {FILE}")
print("Note: multi-line tags (opening tag spans multiple lines) are not annotated")
print("      by this script. Annotate those manually if needed.")
```
