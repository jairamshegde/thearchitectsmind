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

  it('has the name linking home, a theme toggle and a contact pill without a dot', () => {
    const brand = home.querySelector('a.brand');
    expect(brand?.getAttribute('href')).toBe(`${BASE}/`);
    expect(brand?.text.trim()).toBe('Jairam Hegde');
    expect(home.querySelector('[data-theme-toggle]')?.getAttribute('aria-label')).toBe('Switch to dark theme');
    const contact = home.querySelector('nav.nav a.contact-pill');
    expect(contact?.getAttribute('href')).toBe(`${BASE}/about/#get-in-touch`);
    for (const route of ['/notes/', '/writing/mingraph/phase-0-oop-finally-clicked/']) {
      expect(page(route).querySelector('nav.nav a.contact-pill')?.getAttribute('href'), route).toBe(`${BASE}/about/#get-in-touch`);
    }
    expect(contact?.text.trim()).toBe('Contact');
    expect(contact?.querySelector('i')).toBeNull();
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

  it('ends every page with the contact band', () => {
    for (const route of ['/', '/writing/mingraph/phase-0-oop-finally-clicked/', '/notes/']) {
      const band = page(route).querySelector('footer#contact.band')!;
      expect(band.querySelector('.band-big')?.text, route).toBe('Let’s talk about anything.');
      expect(band.querySelector('[data-footer-word]')?.getAttribute('data-topics'), route).toBe('AI agents|RAG pipelines|evals|observability');
      expect(band.querySelector('.band-sub')?.text, route).toContain('AI agents, RAG pipelines, evals and observability');
      const cta = band.querySelector('a.cta');
      expect(cta?.text.trim(), route).toBe('Say hello');
      expect(cta?.getAttribute('href'), route).toMatch(/^mailto:/);
      expect(band.querySelectorAll('.band-act a.ul').map((a) => a.text.trim()), route).toEqual(['GitHub', 'LinkedIn']);
      expect(band.querySelector('.band-foot span')?.text, route).toBe(`© ${new Date().getFullYear()} Jairam Hegde.`);
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
