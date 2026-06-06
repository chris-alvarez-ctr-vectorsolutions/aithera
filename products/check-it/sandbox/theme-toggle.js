// theme-toggle.js — Sandbox-wide light/dark theme persistence
//
// Two responsibilities:
//   1. Apply the persisted theme to <html> ASAP (called from the document <head>
//      to avoid a flash of the wrong theme).
//   2. Provide `window.checkitToggleTheme(iconEl?)` for header buttons to call.
//
// Persistence key is shared across all sandbox pages.
//
// Load via <script src="theme-toggle.js"></script> in the document <head> so the
// initial paint already reflects the user's choice.

(function () {
  const STORAGE_KEY = 'checkit-sandbox-theme';

  function readStoredTheme() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (_) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('theme', theme);
  }

  // Apply on script load — no DOMContentLoaded wait so initial paint is right.
  const stored = readStoredTheme();
  if (stored) {
    applyTheme(stored);
  }

  // Public toggle. Pass an icon <i> element to have its class flipped between
  // sun/moon. Returns the new theme string.
  window.checkitToggleTheme = function (iconEl) {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') !== 'light';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    writeStoredTheme(next);
    if (iconEl) {
      iconEl.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    // Also update any other theme-icon elements on the page (e.g. multiple buttons)
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.className = (next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon') + ' ' + (el.dataset.themeIconExtra || '');
    });
    return next;
  };

  // On DOM ready, set initial icon state for any [data-theme-icon] elements.
  function syncIcons() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.className = (isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon') + ' ' + (el.dataset.themeIconExtra || '');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncIcons);
  } else {
    syncIcons();
  }
})();
