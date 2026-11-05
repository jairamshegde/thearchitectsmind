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

  it('shows the hero image with alt text', () => {
    const art = home.querySelector('.hero figure.hero-art')!;
    const img = art.querySelector('img')!;
    expect(img.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/hero_new_workflow\./);
    expect(img.getAttribute('alt')).toMatch(/Pico/);
  });

  it('features at most 3 projects with year and stack, a link to the page and the repo', () => {
    const section = home.querySelector('#projects')!;
    const projects = section.querySelectorAll('article.home-proj');
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.length).toBeLessThanOrEqual(3);
    for (const p of projects) {
      expect(p.querySelector('h3 a')?.getAttribute('href')).toMatch(new RegExp(`^${BASE}/projects/[^/]+/$`));
      expect(p.querySelector('.home-proj-meta')?.text).toMatch(/^\d{4} · /);
      expect(p.querySelector('.home-proj-sum')?.text).toBeTruthy();
    }
    const mingraph = projects[0];
    expect(mingraph.querySelectorAll('.home-links a').map((a) => a.text.replace(/[→↗]/g, '').trim())).toEqual(['Read the case study', 'GitHub']);
    expect(mingraph.querySelector('img.home-proj-img')).not.toBeNull();
    expect(section.querySelector('.more')?.getAttribute('href')).toBe(`${BASE}/projects/`);
  });

  it('lists at most 5 dated posts with one details panel per post', () => {
    const section = home.querySelector('#writing')!;
    const items = section.querySelectorAll('a.viewer-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(5);
    for (const item of items) {
      expect(item.getAttribute('href')).toMatch(new RegExp(`^${BASE}/writing/`));
      expect(item.querySelector('time')?.getAttribute('datetime')).toBeTruthy();
      expect(item.querySelector('.viewer-meta')?.text).toMatch(/ · \d+ min$/);
    }
    const details = section.querySelectorAll('.viewer-detail');
    expect(details).toHaveLength(items.length);
    expect(details.map((d) => !d.hasAttribute('hidden'))).toEqual(items.map((_, i) => i === 0));
    expect(items[0].classNames).toContain('sel');
    expect(section.querySelector('.more')?.getAttribute('href')).toBe(`${BASE}/writing/`);
  });
});
