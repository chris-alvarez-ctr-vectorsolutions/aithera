/* ============================================================================
   md-doc-view.js — readable views of the repo's markdown docs (window.MdDocView)
   ----------------------------------------------------------------------------
   Renders a fetched .md into a page, so the HTML views never drift from their
   markdown sources. Used by scenario-simulator-alignment-notes.html and the
   generic viewer doc-view.html; pair with css/md-doc.css for the shared look.

   The renderer covers exactly the constructs our docs use: #–#### headings,
   paragraphs, * / - / 1. lists, pipe tables, fenced code, > blockquotes, ---,
   and inline bold / italic / `code` / [text](url). It is NOT a general
   markdown parser — if a doc grows a construct this misses, extend it here.

   API:
     MdDocView.render(md)       → html string
     MdDocView.mount(el, path)  → fetch path, render into el, set the document
                                  title from the doc's own h1, honor #hash
   ============================================================================ */
(function () {
  'use strict';

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Inline pass. Code spans are stashed first behind NUL-delimited tokens —
     NUL because it can never occur in the markdown itself — so *, _, [ and &
     inside backticks are never touched by the emphasis or link rules. */
  function inline(raw) {
    const stash = [];
    let s = esc(raw).replace(/`([^`]+)`/g, function (_, code) {
      stash.push('<code>' + code + '</code>');
      return '\u0000' + (stash.length - 1) + '\u0000';
    });
    s = s.replace(/\[([^\]]+)\]\(([^()\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(—·"“])\*([^*\n]+)\*(?=[\s)—·.,;:"”]|$)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return stash[+i]; });
    return s;
  }

  function slug(text) {
    return text.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9. ]+/g, '')
      .trim().replace(/[. ]+/g, '-');
  }

  function render(md) {
    const lines = md.split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (/^```/.test(line)) {                        // fenced code
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      if (/^---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        const level = h[1].length;
        out.push('<h' + level + ' id="' + slug(h[2]) + '">' + inline(h[2]) + '</h' + level + '>');
        i++; continue;
      }

      if (/^\|/.test(line)) {                          // pipe table
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]);
        const body = rows.slice(2);                    // row 1 is the separator
        let t = '<div class="table-scroll"><table><thead><tr>';
        head.forEach((c) => { t += '<th>' + inline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        body.forEach((r) => {
          t += '<tr>';
          cells(r).forEach((c) => { t += '<td>' + inline(c) + '</td>'; });
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        out.push(t);
        continue;
      }

      if (/^>\s?/.test(line)) {                        // blockquote
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote><p>' + inline(buf.join(' ')) + '</p></blockquote>');
        continue;
      }

      const ul = /^[*-]\s+/.test(line), ol = /^\d+\.\s+/.test(line);
      if (ul || ol) {                                  // list (items may wrap)
        const tag = ul ? 'ul' : 'ol';
        const marker = ul ? /^[*-]\s+/ : /^\d+\.\s+/;
        const items = [];
        while (i < lines.length && marker.test(lines[i])) {
          let item = lines[i].replace(marker, '');
          i++;
          while (i < lines.length && /^\s{2,}\S/.test(lines[i])) { item += ' ' + lines[i].trim(); i++; }
          items.push('<li>' + inline(item) + '</li>');
        }
        out.push('<' + tag + '>' + items.join('') + '</' + tag + '>');
        continue;
      }

      if (line.trim() === '') { i++; continue; }

      const buf = [line];                              // paragraph (may wrap)
      i++;
      while (i < lines.length && lines[i].trim() !== '' &&
             !/^(#{1,4}\s|[*-]\s|\d+\.\s|\||>|```|---)/.test(lines[i])) {
        buf.push(lines[i]); i++;
      }
      out.push('<p>' + inline(buf.join(' ')) + '</p>');
    }
    return out.join('\n');
  }

  function mount(el, path) {
    fetch(path, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then((md) => {
        el.innerHTML = render(md);
        const h1 = el.querySelector('h1');
        if (h1) document.title = h1.textContent;
        if (location.hash) {
          const target = document.getElementById(location.hash.slice(1));
          if (target) target.scrollIntoView();
        }
      })
      .catch((err) => {
        el.innerHTML = '<p>Could not load <code>' + esc(path) + '</code> (' +
          esc(String(err.message || err)) + '). This page fetches the markdown source, ' +
          'so it needs to be served over http(s) — GitHub Pages or a local server — ' +
          'rather than opened as a file.</p>';
      });
  }

  window.MdDocView = { render: render, mount: mount };
}());
