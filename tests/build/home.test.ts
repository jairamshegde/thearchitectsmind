import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('home page', () => {
  const home = page('/');

  it('orders sections Hero → Projects → Writing, with no logos, About or Notes section', () => {
    const ids = home.querySelectorAll('main > section').map((s) => s.getAttribute('id') ?? s.classNames);
    expect(ids).toEqual(['hero wrap', 'projects', 'writing']);
  });

  it('shows the lead-in, headline, subtext and two text links', () => {
    expect(home.querySelector('.hero .hl-lead')?.text).toBe('I turn hard problems into');
    expect(home.querySelector('.hero .hl-main')?.text).toBe('simple systems.');
    expect(home.querySelectorAll('.hero h1')).toHaveLength(1);
    expect(home.querySelector('.hero .hero-sub')?.text).toBe('Right now that means AI agents, and the evals that show they work.');
    const ctas = home.querySelectorAll('.hero .ctas a.hero-link');
    expect(ctas.map((a) => a.text.replace('→', '').trim())).toEqual(['See Mingraph', 'Read the writing']);
    expect(ctas.map((a) => a.getAttribute('href'))).toEqual([expect.stringMatching(new RegExp(`^${BASE}/projects/[^/]+/$`)), `${BASE}/writing/`]);
  });

  it('draws the problem and the system, with Pico and his note', () => {
    const art = home.querySelector('.hero .hero-art')!;
    expect(art.querySelector('svg.art-wide')?.getAttribute('aria-label')).toMatch(/heap/);
    expect(art.querySelectorAll('#hero-art rect.art-piece')).toHaveLength(14);
    expect(art.querySelector('.art-note')?.text).toBe('big problem. small pieces.');
    expect(art.querySelectorAll('svg.art-half use')).toHaveLength(2);
    const pico = art.querySelector('img.hero-pico')!;
    expect(pico.getAttribute('alt')).toMatch(/Pico/);
    expect(pico.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/pico-skeptical\./);
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
