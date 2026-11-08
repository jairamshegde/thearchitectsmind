import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('base layout', () => {
  const home = page('/');

  it('has nav links that point at the index pages', () => {
    const links = home.querySelectorAll('nav.nav a[data-nav]').map((a) => [a.text.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Projects', `${BASE}/projects/`],
      ['Blog', `${BASE}/writing/`],
      ['Notes', `${BASE}/notes/`],
      ['About', `${BASE}/about/`],
    ]);
  });

  it('has a name and site title linking home, a theme toggle and a contact pill', () => {
    const brand = home.querySelector('a.brand');
    expect(brand?.getAttribute('href')).toBe(`${BASE}/`);
    expect(brand?.querySelector('b')?.text).toBe('Jairam Hegde');
    expect(brand?.querySelector('small')?.text).toBe('The Architect’s Mind');
    expect(home.querySelector('[data-theme-toggle]')?.getAttribute('aria-label')).toBe('Switch to dark theme');
    const contact = home.querySelector('nav.nav a.contact-pill');
    expect(contact?.getAttribute('href')).toBe('#contact');
    expect(contact?.text.trim()).toBe('Contact');
  });

  it('marks the current section in the nav', () => {
    const current = (route: string) => page(route).querySelectorAll('nav.nav a[aria-current="page"]').map((a) => a.getAttribute('data-nav'));
    expect(current('/')).toEqual([]);
    expect(current('/writing/')).toEqual(['blog']);
    expect(current('/writing/mingraph/phase-0-oop-finally-clicked/')).toEqual(['blog']);
    expect(current('/notes/')).toEqual(['notes']);
    expect(current('/projects/')).toEqual(['projects']);
    expect(current('/about/')).toEqual(['about']);
  });

  it('ends the homepage with the contact band', () => {
    const band = home.querySelector('footer#contact.band')!;
    expect(band.querySelector('.band-big')?.text.replace(/\s+/g, ' ')).toBe('Got a hard problem?');
    const cta = band.querySelector('a.cta');
    expect(cta?.text.trim()).toBe('Let’s talk it through');
    expect(cta?.getAttribute('href')).toMatch(/^mailto:/);
    expect(band.querySelector('.band-quote')?.text).toBe('“Every hard problem has a simple shape. Finding it is the job.”');
    expect(band.querySelectorAll('.band-foot nav a').map((a) => a.text.trim())).toEqual(['GitHub', 'Notes']);
    expect(band.querySelector('.band-foot span')?.text).toBe(`© ${new Date().getFullYear()} Jairam Hegde. Written and built by hand.`);
  });

  it('ends other pages with the short contact band and a way back up', () => {
    for (const route of ['/writing/mingraph/phase-0-oop-finally-clicked/', '/notes/']) {
      const band = page(route).querySelector('footer#contact.band')!;
      expect(band.querySelector('.band-big')?.text, route).toBe('Every hard problem has a simple shape.');
      expect(band.querySelector('a.cta')?.getAttribute('href'), route).toMatch(/^mailto:/);
      expect(band.querySelector('.band-row a.gh')?.text.trim(), route).toBe('GitHub');
      expect(band.querySelector('.band-foot a[href="#top"]')?.text.trim(), route).toBe('Back to top');
    }
  });

  it('sets the theme before first paint and loads the fonts', () => {
    const head = home.querySelector('head')!.toString();
    expect(head).toContain("localStorage.getItem('theme')");
    const fonts = home.querySelector('link[href*="fonts.googleapis.com/css2"]')?.getAttribute('href') ?? '';
    for (const f of ['Funnel+Display', 'Inter+Tight', 'JetBrains+Mono']) expect(fonts).toContain(f);
    expect(fonts).not.toContain('Shantell');
    expect(fonts).not.toContain('IBM+Plex');
  });

  it('lets the page draw under phone safe areas', () => {
    expect(home.querySelector('meta[name="viewport"]')?.getAttribute('content')).toContain('viewport-fit=cover');
  });
});
