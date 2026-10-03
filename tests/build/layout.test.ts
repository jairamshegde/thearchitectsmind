import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('base layout', () => {
  const home = page('/');

  it('has nav links that point at home sections (Notes goes straight to /notes/)', () => {
    const links = home.querySelectorAll('nav.nav a.nl').map((a) => [a.text.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Writing', `${BASE}/#writing`],
      ['Notes', `${BASE}/notes/`],
      ['Projects', `${BASE}/#projects`],
      ['About', `${BASE}/#about`],
    ]);
  });

  it('has a wordmark linking home and a theme toggle', () => {
    expect(home.querySelector('a.logo')?.getAttribute('href')).toBe(`${BASE}/`);
    expect(home.querySelector('a.logo')?.text).toBe("The Architect's Mind");
    expect(home.querySelector('[data-theme-toggle]')?.getAttribute('aria-label')).toBe('Toggle dark mode');
  });

  it('renders the footer from site settings', () => {
    expect(home.querySelector('.foot .big')?.text).toBe('Every system has a story. The fun is finding it.');
    const pico = home.querySelector('.foot .foot-statement figure.foot-pico img');
    expect(pico?.getAttribute('alt')).toMatch(/Pico/);
    expect(pico?.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/pico-finding\./);
    const socials = home.querySelectorAll('.foot .links > li > a').map((a) => a.text.replace('↗', '').trim());
    expect(socials).toEqual(['GitHub', 'LinkedIn', 'Email']);
    expect(home.querySelector('.foot .pop .pop-note')?.text).toBe('Where the code lives.');
  });

  it('sets the theme before first paint and loads the fonts', () => {
    const head = home.querySelector('head')!.toString();
    expect(head).toContain("localStorage.getItem('theme')");
    expect(head).toContain('family=Bricolage+Grotesque');
  });
});
