/* Floating switcher between the AI Qualification Builder versions.
   Included by the three sibling files (V1, V2, V3). Navigation preserves the
   query string, so deep links like ?qual=<name> or ?ai=1 follow you across
   versions. Styled as a compact dark pill (bottom left) matching the repo's
   version-loader dock; overlays and modals (z-index 700+) sit above it. */
(function(){
  var VERSIONS = [
    { label: 'V1', file: 'AI-Qualification-Builder.html',    hint: 'Conversational assistant (free text)' },
    { label: 'V2', file: 'AI-Qualification-Builder-v2.html', hint: 'Guided questions, live building' },
    { label: 'V3', file: 'AI-Qualification-Builder-v3.html', hint: 'Purple assistant, clarifying uploads, start over' },
  ];
  var current = decodeURIComponent(location.pathname.split('/').pop() || VERSIONS[0].file);

  var css = document.createElement('style');
  css.textContent = [
    '#qb-version-switch { position: fixed; left: 16px; bottom: 14px; z-index: 660; display: flex; align-items: center; gap: 3px;',
    '  background: #18181b; border-radius: 999px; padding: 5px 6px 5px 12px; box-shadow: 0 4px 18px rgba(0,0,0,.28); font-family: inherit; }',
    '#qb-version-switch .lbl { font-size: 11px; font-weight: 600; color: #9ca3af; margin-right: 5px; white-space: nowrap; }',
    '#qb-version-switch a { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 24px;',
    '  border-radius: 999px; font-size: 11.5px; font-weight: 700; color: #d1d5db; text-decoration: none; padding: 0 8px; }',
    '#qb-version-switch a:hover { background: rgba(255,255,255,.14); color: #fff; }',
    '#qb-version-switch a.cur { background: #fff; color: #111827; cursor: default; }',
  ].join('\n');
  document.head.appendChild(css);

  var wrap = document.createElement('div');
  wrap.id = 'qb-version-switch';
  wrap.innerHTML = '<span class="lbl">AI Builder</span>' + VERSIONS.map(function(v){
    var cur = v.file === current;
    return '<a href="' + (cur ? '#' : v.file + location.search) + '"' +
      (cur ? ' class="cur" onclick="return false"' : '') +
      ' title="' + v.hint + '">' + v.label + '</a>';
  }).join('');
  document.body.appendChild(wrap);
})();
