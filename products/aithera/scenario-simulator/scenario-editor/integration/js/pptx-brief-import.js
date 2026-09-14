/* =========================================================================
   AITHERA — SCENARIO BRIEF .pptx IMPORTER
   Reads a Scenario Brief deck (see tools/build-scenario-brief.py) straight
   from its raw XML — no PowerPoint, no server. A .pptx is a zip of XML;
   JSZip unzips it (window.JSZip, loaded before this file) and DOMParser
   reads each slide. Every field the brief template writes carries its
   machine key as the shape's own name (`p:cNvPr/@name`, e.g. "brief.topic",
   "step.tier.strong") — the exact contract build-scenario-brief.py
   documents for "a future .pptx importer." This is that importer's read
   side.

   outlineText() reproduces the SAME text a designer gets today from
   PowerPoint's own View -> Outline -> copy (slide title, then every
   field's paragraphs, in deck order — the field's own label line included,
   exactly as Outline view shows it). A dropped .pptx is a strict upgrade
   on the copy-paste path, never a different one: whatever a wizard spec
   doesn't know how to place more precisely, the model still gets, verbatim.

   On top of that, `slides` and `lookup()` expose the deck by machine key,
   so a wizard spec can pre-fill its OWN interview fields exactly rather
   than leaving the model to re-derive them from prose (see `importPptx`
   in studio-v2-v4-universal-wizard.js).

   Exposes window.AitheraPptxImport = { parse(file) -> Promise<Deck> }.
   Deck: { slides: [{ title, fields: { name: string[] } }] — one paragraph
           per array entry, the field's own label line included — plus
           lookup(name) -> string[] | null, outlineText() -> string }
   No modules, no build step — a plain global, matching the rest of the
   studio.
   ========================================================================= */
(function () {
  'use strict';

  function textOf(paraEl) {
    // Concatenate every <a:t> under one <a:p> — a paragraph can carry
    // several runs (e.g. mixed formatting) that must read as one line.
    let out = '';
    const ts = paraEl.getElementsByTagName('a:t');
    for (let i = 0; i < ts.length; i++) out += ts[i].textContent;
    return out;
  }

  function paragraphs(txBody) {
    const ps = txBody.getElementsByTagName('a:p');
    const out = [];
    for (let i = 0; i < ps.length; i++) out.push(textOf(ps[i]));
    return out;
  }

  // One slide's XML -> { title, fields }. Returns null on unparseable XML
  // rather than throwing, so one bad slide doesn't sink the whole deck.
  function parseSlideXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return null;
    const shapes = doc.getElementsByTagName('p:sp');
    let title = '';
    const fields = {};
    for (let i = 0; i < shapes.length; i++) {
      const sp = shapes[i];
      const ph = sp.getElementsByTagName('p:ph')[0];
      if (!ph) continue;   // decoration (panels, helper text) lives on the LAYOUT, never the slide
      const txBody = sp.getElementsByTagName('p:txBody')[0];
      const paras = txBody ? paragraphs(txBody) : [];
      if (ph.getAttribute('type') === 'title') {
        title = paras.join(' ').trim();
      } else {
        const cNvPr = sp.getElementsByTagName('p:cNvPr')[0];
        const name = cNvPr && cNvPr.getAttribute('name');
        if (name) fields[name] = paras;
      }
    }
    return { title: title, fields: fields };
  }

  // Slide order per ppt/presentation.xml + its rels — NOT filename sort,
  // since a reordered deck's slide1.xml need not be the first slide shown.
  async function slideFileOrder(zip) {
    const presEntry = zip.file('ppt/presentation.xml');
    const relsEntry = zip.file('ppt/_rels/presentation.xml.rels');
    if (!presEntry || !relsEntry) throw new Error('That doesn’t look like a PowerPoint file.');
    const relTarget = {};
    const relDoc = new DOMParser().parseFromString(await relsEntry.async('string'), 'application/xml');
    const rels = relDoc.getElementsByTagName('Relationship');
    for (let i = 0; i < rels.length; i++) relTarget[rels[i].getAttribute('Id')] = rels[i].getAttribute('Target');

    const presDoc = new DOMParser().parseFromString(await presEntry.async('string'), 'application/xml');
    const ids = presDoc.getElementsByTagName('p:sldId');
    const RELNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const order = [];
    for (let i = 0; i < ids.length; i++) {
      const rid = ids[i].getAttributeNS(RELNS, 'id') || ids[i].getAttribute('r:id');
      const target = relTarget[rid];
      if (target) order.push(target.replace(/^.*\//, ''));   // "slides/slideN.xml" -> "slideN.xml"
    }
    return order;
  }

  function buildDeck(slides) {
    function lookup(key) {
      for (let i = 0; i < slides.length; i++) if (slides[i].fields[key]) return slides[i].fields[key];
      return null;
    }
    // The label line IS the first paragraph (Rule 2: "keep the label line") —
    // Outline view shows it too, so reproducing it here is fidelity, not noise.
    function outlineText() {
      const out = [];
      slides.forEach((s) => {
        out.push(s.title || '(untitled slide)');
        Object.keys(s.fields).forEach((key) => {
          s.fields[key].forEach((p) => out.push('  ' + p));
        });
        out.push('');
      });
      return out.join('\n').trim();
    }
    return { slides: slides, lookup: lookup, outlineText: outlineText };
  }

  async function parse(file) {
    if (!window.JSZip) throw new Error('Couldn’t load the .pptx reader — check your connection.');
    let zip;
    try {
      zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    } catch (e) {
      throw new Error('That file doesn’t look like a .pptx — try File > Save As > PowerPoint Presentation first.');
    }
    const order = await slideFileOrder(zip);
    const slides = [];
    for (let i = 0; i < order.length; i++) {
      const entry = zip.file('ppt/slides/' + order[i]);
      if (!entry) continue;
      const parsed = parseSlideXml(await entry.async('string'));
      if (parsed) slides.push(parsed);
    }
    if (!slides.length) throw new Error('No slides found in that file.');
    return buildDeck(slides);
  }

  window.AitheraPptxImport = { parse: parse };
})();
