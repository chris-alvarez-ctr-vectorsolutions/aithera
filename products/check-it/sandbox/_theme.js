/*
  _theme.js — CheckIt-2 Sandbox Theme Toggle
  Reads/writes localStorage('checkit_theme').
  Expects:
    - <html data-theme="dark"> set on page load
    - #themeToggleBtn (optional: #themeToggleIcon, #themeToggleLabel for richer UIs)
*/
(function () {
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    /* Vaadin/Lumo components read the `theme` attribute on <html> to switch
       their internal dark palette — `data-theme` alone doesn't reach them. */
    if (theme === 'dark') {
      html.setAttribute('theme', 'dark');
    } else {
      html.removeAttribute('theme');
    }
    const icon  = document.getElementById('themeToggleIcon');
    const label = document.getElementById('themeToggleLabel');
    if (icon)  icon.className  = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (label) label.textContent = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    try { localStorage.setItem('checkit_theme', theme); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }

    /* Restore persisted preference, default to dark */
    try {
      const saved = localStorage.getItem('checkit_theme');
      applyTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
    } catch (e) {
      applyTheme('dark');
    }
  });
})();
