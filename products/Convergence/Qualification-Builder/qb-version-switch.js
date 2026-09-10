/* Switcher between the AI Qualification Builder versions.
   Included by the sibling files (V3, V1). Navigation preserves the query string,
   so deep links like ?qual=<name> or ?ai=1 follow you across versions.

   The pill is marked `.version-switcher` with its buttons in
   `#loader-version-group`, which is the shape the Design Toolbox adopts: the
   toolbox merges the comment + flow-map launchers into THIS element, so the
   page shows ONE bottom-center dock instead of two floating widgets. That also
   means the toolbox's own controls (drag grip, collapse chevron, dismiss ×)
   apply to the version buttons too, so the whole review cluster can be tucked
   away or dismissed in one gesture. With the toolbox absent (?toolbox=off), the
   styles below still stand the pill up on its own. */
(function(){
  var VERSIONS = [
    { label: 'V3', file: 'AI-Qualification-Builder-v3.html', hint: 'Purple assistant: 3-way requirement picks, auto/ask toggle, course lookup' },
    { label: 'V1', file: 'AI-Qualification-Builder.html',    hint: 'Conversational assistant (free text)' },
  ];
  var current = decodeURIComponent(location.pathname.split('/').pop() || VERSIONS[0].file);

  var css = document.createElement('style');
  css.textContent = [
    /* Bottom-center to match the toolbox dock: when the toolbox adopts this pill
       it keeps these coordinates, and its collapse transform assumes them. */
    '#qb-version-switch { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 999990;',
    '  display: inline-flex; align-items: center; gap: 6px;',
    '  background: #18181b; border-radius: 999px; padding: 6px 8px; box-shadow: 0 6px 20px rgba(0,0,0,.28); font-family: inherit; }',
    '#loader-version-group { display: inline-flex; align-items: center; gap: 3px; }',
    '#qb-version-switch .lbl { font-size: 11px; font-weight: 600; color: #9ca3af; margin: 0 5px 0 4px; white-space: nowrap; }',
    '#qb-version-switch a { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 26px;',
    '  border-radius: 999px; font-size: 11.5px; font-weight: 700; color: #d1d5db; text-decoration: none; padding: 0 9px; }',
    '#qb-version-switch a:hover { background: rgba(255,255,255,.14); color: #fff; }',
    '#qb-version-switch a.cur { background: #fff; color: #111827; cursor: default; }',
  ].join('\n');
  document.head.appendChild(css);

  var wrap = document.createElement('div');
  wrap.id = 'qb-version-switch';
  wrap.className = 'version-switcher';
  var group = document.createElement('div');
  group.id = 'loader-version-group';
  group.innerHTML = '<span class="lbl">AI Builder</span>' + VERSIONS.map(function(v){
    var cur = v.file === current;
    return '<a href="' + (cur ? '#' : v.file + location.search) + '"' +
      (cur ? ' class="cur" onclick="return false"' : '') +
      ' title="' + v.hint + '">' + v.label + '</a>';
  }).join('');
  wrap.appendChild(group);
  document.body.appendChild(wrap);
})();
