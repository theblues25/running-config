// Shared light/dark theme toggle, used by index.html, posts/*, and tools/*.
'use strict';
const themeState = { theme: 'light' };

function applyTheme() {
  document.documentElement.setAttribute('data-theme', themeState.theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = themeState.theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  themeState.theme = themeState.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', themeState.theme);
  applyTheme();
}

(function init() {
  themeState.theme = localStorage.getItem('theme') || 'dark';
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });
})();
