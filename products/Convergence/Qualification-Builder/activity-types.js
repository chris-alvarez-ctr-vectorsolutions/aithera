/* ============================================================
 * Convergence activity types: the single source of truth.
 *
 * Every page that lists, filters, or edits activities reads this list
 * (Manage-Activities.html, Manage-Quizzes.html, Edit-Activity.html,
 * Preview-Activity.html). Do not hardcode type names elsewhere: add a
 * type here and every filter, badge and editor picks it up.
 *
 *   key        stored value on an activity record (activity.type)
 *   label      short label shown in grids and badges
 *   longLabel  full name shown in the editor header
 *   icon       Font Awesome class used next to the label
 *   content    which Content tab editor plugs in for this type:
 *                'quiz'  fully built (competencies + questions)
 *                'cbt'   course package: Configure / Learning Studio
 *                other   placeholder panel describing that type's editor
 *   contentNote copy for the placeholder Content panel
 * ============================================================ */
(function () {
  window.ACTIVITY_TYPES = [
    { key: 'CBT',       label: 'CBT',       longLabel: 'Computer-Based', icon: 'fa-desktop',          content: 'cbt',
      contentNote: 'A course package (SCORM or Vector content). Its content can only be edited in Learning Studio.' },
    { key: 'Quiz',      label: 'Quiz',      longLabel: 'Quiz',           icon: 'fa-circle-question',  content: 'quiz',
      contentNote: 'Questions grouped into competencies.' },
    { key: 'Tasklist',  label: 'Tasklist',  longLabel: 'Tasklist',       icon: 'fa-list-check',       content: 'tasklist',
      contentNote: 'The tasks a learner checks off on the job. The Tasklist editor plugs in here.' },
    { key: 'Class',     label: 'Class',     longLabel: 'Class',          icon: 'fa-chalkboard-user',  content: 'class',
      contentNote: 'Topics and sessions for instructor-led training. The Class editor plugs in here.' },
    { key: 'Signature', label: 'Signature', longLabel: 'Signature',      icon: 'fa-signature',        content: 'signature',
      contentNote: 'The statement a learner acknowledges and signs. The Signature editor plugs in here.' },
    { key: 'Document',  label: 'Document',  longLabel: 'Document',       icon: 'fa-file-lines',       content: 'file',
      contentNote: 'The attached document is the content. Replace it from the File field on the Details tab.' },
    { key: 'Event',     label: 'Event',     longLabel: 'Event',          icon: 'fa-calendar',         content: 'event',
      contentNote: 'Date, location and capacity for a one-off scheduled activity. The Event editor plugs in here.' },
    { key: 'Survey',    label: 'Survey',    longLabel: 'Survey',         icon: 'fa-clipboard',        content: 'survey',
      contentNote: 'Survey slides with no pass or fail. The Survey editor plugs in here.' },
    { key: 'Video',     label: 'Video',     longLabel: 'Video',          icon: 'fa-circle-play',      content: 'file',
      contentNote: 'The attached video is the content. Replace it from the File field on the Details tab.' },
  ];

  /* Look up a type by key. Unknown keys fall back to a generic entry so a
     renderer never crashes on unexpected data. */
  window.ACTIVITY_TYPE = function (key) {
    return window.ACTIVITY_TYPES.find(t => t.key === key) ||
      { key: key, label: key, longLabel: key, icon: 'fa-cube', content: 'none', contentNote: '' };
  };

  /* Keys only, for filter controls. */
  window.ACTIVITY_TYPE_KEYS = window.ACTIVITY_TYPES.map(t => t.key);
})();
