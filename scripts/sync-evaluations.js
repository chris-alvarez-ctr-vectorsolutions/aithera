#!/usr/bin/env node
/**
 * Reads products/Evaluations/STATUS.md and rewrites products/Evaluations/index.html.
 * Usage: node scripts/sync-evaluations.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATUS_FILE = path.join(ROOT, 'products/Evaluations/STATUS.md');
const INDEX_FILE = path.join(ROOT, 'products/Evaluations/index.html');

// --- Parse STATUS.md ---

function parseStatus(md) {
  const sections = [];
  let currentSection = null;
  let currentProto = null;

  const lines = md.split('\n');

  for (const raw of lines) {
    const line = raw.trim();

    // H2 = section heading
    if (line.startsWith('## ')) {
      if (currentProto && currentSection) currentSection.protos.push(currentProto);
      currentProto = null;
      currentSection = { title: line.slice(3).trim(), protos: [] };
      sections.push(currentSection);
      continue;
    }

    // H3 = prototype entry
    if (line.startsWith('### ')) {
      if (currentProto && currentSection) currentSection.protos.push(currentProto);
      currentProto = { title: line.slice(4).trim(), file: '', status: '', description: '', updated: '', notes: '' };
      continue;
    }

    if (!currentProto) continue;

    // Field lines: - **key:** value
    const fieldMatch = line.match(/^-\s+\*\*(\w+):\*\*\s*(.*)/);
    if (fieldMatch) {
      const key = fieldMatch[1].toLowerCase();
      const val = fieldMatch[2].trim();
      if (key in currentProto) currentProto[key] = val;
    }
  }

  if (currentProto && currentSection) currentSection.protos.push(currentProto);
  return sections;
}

// --- Status badge config ---

const STATUS_CONFIG = {
  'in-progress': { label: 'In Progress', bg: '#fff3cd', color: '#856404', dot: '#f59e0b' },
  'review':      { label: 'In Review',   bg: '#cce5ff', color: '#004085', dot: '#3b82f6' },
  'on-hold':     { label: 'On Hold',     bg: '#f8d7da', color: '#721c24', dot: '#ef4444' },
  'complete':    { label: 'Complete',    bg: '#d4edda', color: '#155724', dot: '#22c55e' },
};

const SECTION_ICONS = {
  'Event Forms':       'fa-file-lines',
  'Manage Activities': 'fa-list-check',
  'Reports':           'fa-chart-bar',
};

const PROTO_ICONS = {
  'event-forms/index.html':                    'fa-file-lines',
  'manage-activities/index.html':              'fa-list-check',
  'Reports/index.html':                        'fa-chart-bar',
  'Reports/report-nav-explorations-v2.html':   'fa-compass',
  'Reports/report-nav-explorations.html':      'fa-compass-drafting',
};

function iconFor(file) {
  return PROTO_ICONS[file] || 'fa-file-code';
}

// --- HTML generation ---

function badgeHtml(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#e9ecef', color: '#495057', dot: '#6c757d' };
  return `<span class="status-badge" style="background:${cfg.bg};color:${cfg.color};">` +
    `<span class="status-dot" style="background:${cfg.dot};"></span>${cfg.label}</span>`;
}

function cardHtml(proto) {
  const icon = iconFor(proto.file);
  const notes = proto.notes
    ? `<div class="card-notes">${proto.notes}</div>`
    : '';
  const updated = proto.updated
    ? `<div class="card-meta">Updated ${proto.updated}</div>`
    : '';

  return `                <a class="proto-card status-${proto.status}" href="${proto.file}" target="_blank" rel="noopener">
                    <div class="card-top">
                        <div class="card-icon"><i class="fa-solid ${icon}"></i></div>
                        <span class="card-arrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                    </div>
                    <div class="card-title">${proto.title}</div>
                    ${badgeHtml(proto.status)}
                    <div class="card-description">${proto.description}</div>
                    ${notes}
                    <div class="card-footer">
                        <div class="card-path">${proto.file}</div>
                        ${updated}
                    </div>
                </a>`;
}

function sectionHtml(section) {
  const cards = section.protos.map(cardHtml).join('\n');
  return `        <div class="section">
            <p class="section-title">${section.title}</p>
            <div class="card-grid">
${cards}
            </div>
        </div>`;
}

function buildIndex(sections) {
  const sectionsHtml = sections.map(sectionHtml).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evaluations — UX Prototypes</title>
    <script type="module" src="https://cdn.vsp-prod.com/web-components/@vector-web-components/core/v1.19.0/core.iife.js"></script>
    <script src="https://cdn.vsp-prod.com/web-components/@vector-web-components/themes/v1.5.0/styles.js"></script>
    <link rel="stylesheet" href="https://cdn.vsp-prod.com/web-components/@vector-web-components/assets/v1.0.0/fonts/open-sans/v43/open-sans.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background-color: var(--vwc-color-neutral-50, #f5f5f5);
            color: var(--vwc-color-neutral-900, #1a1a1a);
            min-height: 100vh;
        }

        header {
            background-color: var(--vwc-color-neutral-0, #ffffff);
            border-bottom: 1px solid var(--vwc-color-neutral-200, #e0e0e0);
            padding: 20px 40px;
        }

        header .eyebrow {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--vwc-color-neutral-500, #757575);
            margin-bottom: 4px;
        }

        header h1 {
            font-size: 22px;
            font-weight: 700;
            color: var(--vwc-color-neutral-900, #1a1a1a);
        }

        main {
            max-width: 960px;
            margin: 0 auto;
            padding: 40px 40px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--vwc-color-neutral-500, #757575);
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vwc-color-neutral-200, #e0e0e0);
        }

        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 16px;
        }

        .proto-card {
            background-color: var(--vwc-color-neutral-0, #ffffff);
            border: 1px solid var(--vwc-color-neutral-200, #e0e0e0);
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .proto-card:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border-color: var(--vwc-color-primary-400, #5c6bc0);
        }

        .proto-card:hover .card-arrow {
            opacity: 1;
            transform: translateX(0);
        }

        .card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
        }

        .card-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background-color: var(--vwc-color-primary-50, #e8eaf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: var(--vwc-color-primary-600, #3949ab);
            flex-shrink: 0;
        }

        .card-arrow {
            font-size: 13px;
            color: var(--vwc-color-neutral-400, #bdbdbd);
            opacity: 0;
            transform: translateX(-4px);
            transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .card-title {
            font-size: 14px;
            font-weight: 600;
            line-height: 1.4;
            color: var(--vwc-color-neutral-900, #1a1a1a);
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 20px;
            width: fit-content;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .card-description {
            font-size: 12px;
            line-height: 1.5;
            color: var(--vwc-color-neutral-600, #555);
        }

        .card-notes {
            font-size: 11px;
            line-height: 1.5;
            color: var(--vwc-color-neutral-500, #757575);
            font-style: italic;
            border-left: 2px solid var(--vwc-color-neutral-200, #e0e0e0);
            padding-left: 8px;
        }

        .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-top: auto;
        }

        .card-path {
            font-size: 11px;
            color: var(--vwc-color-neutral-400, #bdbdbd);
            font-family: monospace;
        }

        .card-meta {
            font-size: 11px;
            color: var(--vwc-color-neutral-400, #bdbdbd);
            white-space: nowrap;
        }
    </style>
</head>
<body>

    <header>
        <p class="eyebrow">UX Prototypes</p>
        <h1>Evaluations</h1>
    </header>

    <main>

${sectionsHtml}

    </main>

</body>
</html>
`;
}

// --- Run ---

const md = fs.readFileSync(STATUS_FILE, 'utf8');
const sections = parseStatus(md);
const html = buildIndex(sections);
fs.writeFileSync(INDEX_FILE, html, 'utf8');

console.log(`✓ index.html updated (${sections.length} sections, ${sections.reduce((n, s) => n + s.protos.length, 0)} prototypes)`);
