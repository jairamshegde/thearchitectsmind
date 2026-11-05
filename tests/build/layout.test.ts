import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('base layout', () => {
  const home = page('/');

  it('has nav links that point at the index pages', () => {
    const links = home.querySelectorAll('nav.nav a.nl').map((a) => [a.text.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Projects', `${BASE}/projects/`],
      ['Writing', `${BASE}/writing/`],
      ['Notes', `${BASE}/notes/`],
      ['About', `${BASE}/about/`],
    ]);
  });

  it('has a wordmark linking home and a theme toggle', () => {
    expect(home.querySelector('a.logo')?.getAttribute('href')).toBe(`${BASE}/`);
    expect(home.querySelector('a.logo')?.text).toBe("The Architect's Mind");
    expect(home.querySelector('[data-theme-toggle]')?.getAttribute('aria-label')).toBe('Toggle dark mode');
  });

  it('renders the footer from site settings', () => {
    expect(home.querySelectorAll('.foot .big .big-line').map((l) => l.text)).toEqual(['Every hard problem has a simple shape.', 'Finding it is the job.']);
    expect(home.querySelector('.foot .foot-side .sub')?.text).toBe('Got a hard problem? Happy to talk it through.');
    const pico = home.querySelector('.foot .foot-side figure.foot-pico img');
    expect(pico?.getAttribute('alt')).toMatch(/Pico/);
    expect(pico?.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/pico-finding\./);
    const socials = home.querySelectorAll('.foot .links > li > a').map((a) => a.text.replace('↗', '').trim());
    expect(socials).toEqual(['GitHub']);
    expect(home.querySelector('.foot .pop .pop-note')?.text).toBe('Where the code lives.');
  });

  it('sets the theme before first paint and loads the fonts', () => {
    const head = home.querySelector('head')!.toString();
    expect(head).toContain("localStorage.getItem('theme')");
    expect(head).toContain('family=Funnel+Display');
  });
});
