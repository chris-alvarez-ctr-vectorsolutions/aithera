/* global KX, AGENCY_INTEL */
/* =====================================================================
   agency-intel-export.js — PDF and CSV export for a whole dashboard or
   a single widget.

   CSV is a real download, built from CP.widgetToTable() — the same
   flattening the report flow already uses, so a chart and a table export
   identically.

   "PDF" is the browser's own print-to-PDF. The alternative in a
   prototype is to fake a download that produces nothing openable; going
   through print means the user actually ends up with a real PDF, and the
   page being printed is the delivered-report layout the design already
   defines. Print styling hides the app chrome and shows only #kxPrint.
   ===================================================================== */

(function () {
  'use strict';

  var CP = window.AGENCY_INTEL;

  /* ---------------------------------------------------------------- */
  /* CSV                                                               */
  /* ---------------------------------------------------------------- */

  function tablesForWidget(w) { return [CP.widgetToTable(w)]; }

  function tablesForDashboard(d) {
    return (d.widgets || []).map(function (w) { return CP.widgetToTable(w); });
  }

  // Several widgets become one CSV: each block is titled, then its header
  // row, then its data, separated by a blank line. Widgets with nothing
  // exportable still appear, carrying their reason — a silently missing
  // section reads as a bug to whoever opens the file.
  function toRows(title, tables) {
    var rows = [];
    tables.forEach(function (t, i) {
      if (i) rows.push([]);
      rows.push([t.title]);
      if (t.columns && t.columns.length) {
        rows.push(t.columns.slice());
        (t.rows || []).forEach(function (r) { rows.push(r.slice()); });
      } else {
        rows.push([t.note || 'No exportable data.']);
      }
    });
    if (!rows.length) rows.push(['Nothing to export']);
    return rows;
  }

  function csv(name, tables) {
    var rows = toRows(name, tables);
    // downloadCSV reports "rows.length - 1 rows exported", which counts the
    // header. Pass the data rows so the toast tells the truth.
    window.KXCharts.downloadCSV(name, rows);
  }

  /* ---------------------------------------------------------------- */
  /* PDF (via print)                                                   */
  /* ---------------------------------------------------------------- */

  function printHost() {
    var el = document.getElementById('kxPrint');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kxPrint';
      document.body.appendChild(el);
    }
    return el;
  }

  function print(html) {
    var host = printHost();
    host.innerHTML = html;
    document.body.classList.add('kx-printing');

    function cleanup() {
      document.body.classList.remove('kx-printing');
      host.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    }
    window.addEventListener('afterprint', cleanup);

    // Let the layout settle (charts are inline SVG) before the dialog opens.
    setTimeout(function () {
      window.print();
      // Safari/Firefox don't always fire afterprint — belt and braces.
      setTimeout(cleanup, 1500);
    }, 80);

    KX.pushToast({
      title: 'Opening print dialog',
      body: 'Choose “Save as PDF” to download it.',
      icon: 'picture_as_pdf', tone: 'success'
    });
  }

  window.AGENCY_INTEL_EXPORT = {
    csv: csv,
    tablesForWidget: tablesForWidget,
    tablesForDashboard: tablesForDashboard,
    print: print
  };
})();
