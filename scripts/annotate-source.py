#!/usr/bin/env python3
"""
Adds data-file and data-line attributes to every meaningful UI element
in an HTML mockup file. Run from the repo root:

    python3 scripts/annotate-source.py products/MyProduct/MyMockup/index.html
"""
import re
import sys

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
        # Single-line <style ...></style> — don't enter style mode
        if re.search(r'</style>', stripped, re.IGNORECASE):
            output.append(line)
            continue
        in_style = True
    if re.match(r'</style>', stripped, re.IGNORECASE):
        in_style = False
    if re.match(r'<script[\s>]', stripped, re.IGNORECASE):
        # Single-line <script ...></script> — don't enter script mode
        if re.search(r'</script>', stripped, re.IGNORECASE):
            output.append(line)
            continue
        in_script = True
        output.append(line)
        continue
    if re.search(r'</script>', stripped, re.IGNORECASE):
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
