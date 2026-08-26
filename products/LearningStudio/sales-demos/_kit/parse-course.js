/* ============================================================
   COURSE MARKDOWN PARSER

   Turns a course.md into the COURSE object both screens render from.
   Shared by build-course.js; kept separate so the format has one
   definition and can be unit-checked on its own.

   FORMAT
   ------
     # <course title>
     sku: <sku>

     ## <section title>

     ### <learning object title>
     objective: <one line>          (optional)
     duration: 1:32                 (optional — derived from scenes if absent)
     state: complete|in-progress|not-started    (optional, default not-started)
     type: title-card|lesson        (optional, inferred from the title)

     #### scene 1 | 0:20 | image.jpg
     <transcript text, one or more lines>

   RULES
   -----
   • An LO with at least one `#### scene` block is CLICKABLE (opensManager).
     One without is a stub: it renders as plain text in the course overview
     and cannot be opened. This keeps click paths from dead-ending.
   • Durations roll up: LO from its scenes (when it has them), section from
     its LOs, course from its sections. Only leaves are ever authored.
   • Blank lines inside a transcript are preserved; leading/trailing are not.
   ============================================================ */

'use strict';

/** "1:32" | "92" | "0:08" -> seconds */
function parseDuration(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.includes(':')) {
    const parts = s.split(':').map(n => parseInt(n, 10));
    if (parts.some(isNaN)) return null;
    return parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
  }
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/** Stable, human-readable ids so URLs stay meaningful: s03, s03-o02. */
function sectionId(i) { return 's' + String(i + 1).padStart(2, '0'); }
function objectId(si, oi) { return sectionId(si) + '-o' + String(oi + 1).padStart(2, '0'); }

/** `key: value` on its own line. Returns null when the line isn't one. */
function readMeta(line) {
  const m = /^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
  return m ? { key: m[1].toLowerCase(), value: m[2].trim() } : null;
}

function parseCourse(md) {
  // Strip HTML comments first. Author notes routinely contain example
  // markup (### / #### lines), which would otherwise parse as real
  // sections and objects.
  const lines = String(md)
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');

  const course = { sku: '', title: '', sections: [] };
  const warnings = [];

  let section = null;   // current section
  let obj = null;       // current learning object
  let scene = null;     // current scene
  let seenTitle = false;

  const flushScene = () => {
    if (!scene || !obj) return;
    scene.transcript = scene._lines.join('\n').replace(/^\n+|\n+$/g, '');
    delete scene._lines;
    obj.scenes.push(scene);
    scene = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // ---- headings ----
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();

      if (level === 1) {
        flushScene();
        if (seenTitle) warnings.push(`line ${i + 1}: extra "# ${text}" ignored — a course has one title`);
        else { course.title = text; seenTitle = true; }
        obj = null; section = null;
        continue;
      }

      if (level === 2) {
        flushScene();
        section = { id: sectionId(course.sections.length), name: text, objects: [] };
        course.sections.push(section);
        obj = null;
        continue;
      }

      if (level === 3) {
        flushScene();
        if (!section) {
          warnings.push(`line ${i + 1}: "### ${text}" appears before any "## section" — skipped`);
          obj = null;
          continue;
        }
        obj = {
          id: objectId(course.sections.length - 1, section.objects.length),
          name: text,
          // A "Section Title Card" is a title card; everything else is a lesson.
          type: /title card/i.test(text) ? 'title-card' : 'lesson',
          state: 'not-started',
          objective: '',
          dur: null,
          scenes: []
        };
        section.objects.push(obj);
        continue;
      }

      if (level === 4) {
        flushScene();
        if (!obj) {
          warnings.push(`line ${i + 1}: "#### ${text}" appears before any "### learning object" — skipped`);
          continue;
        }
        // `scene 1 | 0:20 | image.jpg` — number is positional, so only the
        // duration and image matter.
        const parts = text.split('|').map(p => p.trim());
        scene = {
          dur: parseDuration(parts[1]) || 0,
          image: parts[2] || '',
          _lines: []
        };
        continue;
      }
    }

    // ---- metadata (only directly under an LO or section, before scenes) ----
    if (!scene) {
      const meta = readMeta(trimmed);
      if (meta && obj) {
        if (meta.key === 'objective') { obj.objective = meta.value; continue; }
        if (meta.key === 'duration')  { obj.dur = parseDuration(meta.value); continue; }
        if (meta.key === 'state')     { obj.state = meta.value || 'not-started'; continue; }
        if (meta.key === 'type')      { obj.type = meta.value; continue; }
      }
      if (meta && !obj && meta.key === 'sku') { course.sku = meta.value; continue; }
      // Anything else outside a scene is prose — ignored, so the file can
      // carry notes without breaking the parse.
      continue;
    }

    // ---- transcript body ----
    scene._lines.push(line);
  }
  flushScene();

  // ---- derive ----
  course.sections.forEach(sec => {
    sec.objects.forEach(o => {
      // Scenes are the source of truth for an LO's duration when present.
      if (o.scenes.length) {
        const sum = o.scenes.reduce((n, s) => n + (s.dur || 0), 0);
        if (sum > 0) o.dur = sum;
      }
      if (o.dur == null) { o.dur = 0; warnings.push(`"${o.name}" has no duration and no scenes — treated as 0:00`); }

      // An LO is clickable only if it has scenes to show.
      o.opensManager = o.scenes.length > 0;

      if (!['complete', 'in-progress', 'not-started'].includes(o.state)) {
        warnings.push(`"${o.name}" has unknown state "${o.state}" — using not-started`);
        o.state = 'not-started';
      }
    });

    // Number the lessons within a section (title cards stay unnumbered).
    let n = 0;
    sec.objects.forEach(o => { if (o.type !== 'title-card') o.numbered = ++n; });
  });

  if (!course.title) warnings.push('no "# course title" found');
  if (!course.sku)   warnings.push('no "sku:" found');

  return { course, warnings };
}

module.exports = { parseCourse, parseDuration };
