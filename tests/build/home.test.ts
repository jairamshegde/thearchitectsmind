import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('home page', () => {
  const home = page('/');

  it('orders sections Hero → Projects → Writing, with no logos, About or Notes section', () => {
    const ids = home.querySelectorAll('main > section').map((s) => s.getAttribute('id') ?? s.classNames);
    expect(ids).toEqual(['hero wrap', 'projects', 'writing']);
  });

  it('shows the kicker, headline, subtext and two text links', () => {
    expect(home.querySelector('.hero .hero-kicker')?.text).toBe('Jairam Hegde · GenAI engineer');
    expect(home.querySelector('.hero .hl')?.text).toBe('I make computers do interesting things. Then I get suspicious.');
    expect(home.querySelector('.hero .hero-sub')?.text).toMatch(/^I design and build GenAI systems/);
    const ctas = home.querySelectorAll('.hero .ctas a.btn-text').map((a) => a.getAttribute('href'));
    expect(ctas).toEqual([`${BASE}/projects/`, `${BASE}/writing/`]);
    expect(home.querySelector('.hero .btn-primary')).toBeNull();
  });

  it('shows skeptical Pico beside the hero with his note', () => {
    const pico = home.querySelector('.hero figure.hero-pico')!;
    expect(pico.querySelector('img')?.getAttribute('alt')).toMatch(/Pico/);
    expect(pico.querySelector('img')?.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/pico-skeptical\./);
    expect(pico.querySelector('.about-pico-note')?.text).toBe('Pico runs code review here. He has never approved a first draft.');
  });

  it('lists at most 3 projects as rows linking to project pages', () => {
    const section = home.querySelector('#projects')!;
    const rows = section.querySelectorAll('a.row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(3);
    for (const row of rows) {
      expect(row.getAttribute('href')).toMatch(new RegExp(`^${BASE}/projects/[^/]+/$`));
      expect(row.querySelector('.row-title')?.text).toBeTruthy();
      expect(row.querySelector('.row-desc')?.text).toBeTruthy();
    }
    expect(section.querySelector('.more')?.getAttribute('href')).toBe(`${BASE}/projects/`);
  });

  it('lists at most 5 posts as dated rows and never a draft', () => {
    const section = home.querySelector('#writing')!;
    const rows = section.querySelectorAll('a.row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(5);
    for (const row of rows) {
      expect(row.getAttribute('href')).toMatch(new RegExp(`^${BASE}/writing/`));
      expect(row.querySelector('time.row-meta')?.getAttribute('datetime')).toBeTruthy();
    }
    expect(rows.map((r) => r.getAttribute('href')).join(' ')).not.toContain('unpublished-idea');
    expect(section.querySelector('.more')?.getAttribute('href')).toBe(`${BASE}/writing/`);
  });
});
