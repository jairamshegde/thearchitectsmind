export type Theme = 'light' | 'dark';

const KEY = 'theme';
const darkQuery = () => matchMedia('(prefers-color-scheme: dark)');

export function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return darkQuery().matches ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the theme still applies to this page.
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export function initThemeToggle(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(currentTheme() === 'dark')));
  buttons.forEach((b) => b.addEventListener('click', () => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    sync();
  }));
  darkQuery().addEventListener('change', () => {
    if (document.documentElement.dataset.theme) return; // an explicit choice wins over the system
    sync();
    document.dispatchEvent(new CustomEvent('themechange', { detail: currentTheme() }));
  });
  sync();
}
