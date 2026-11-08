import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('home page', () => {
  const home = page('/');

  it('orders sections Hero → Projects → Writing', () => {
    const ids = home.querySelectorAll('main > section').map((s) => s.getAttribute('id'));
    expect(ids).toEqual(['hero', 'projects', 'writing']);
  });

  it('shows the two-line title with an accent period, subtitle, bio and three links', () => {
    const hero = home.querySelector('#hero')!;
    expect(hero.querySelectorAll('h1')).toHaveLength(1);
    const lines = hero.querySelectorAll('h1 .mask');
    expect(lines.map((l) => l.text)).toEqual(['In search of', 'intuition.']);
    expect(lines[1].querySelector('.accent-dot')?.text).toBe('.');
    expect(hero.querySelector('.hero-sub')?.text).toBe('Building intuition for complex systems.');
    expect(hero.querySelector('.hero-bio')?.text).toBe('I’m Jairam. I write and build my way to the simple shape inside hard problems, lately AI agents, and the evals that show they work.');
    const links = hero.querySelectorAll('.hero-links a');
    expect(links.map((a) => a.text.trim())).toEqual(['See the projects', 'Read the blog', 'GitHub']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#projects', '#writing', 'https://github.com/jairamshegde']);
    expect(links[1].getAttribute('data-tab-link')).toBe('blog');
  });

  it('draws the pixel field beside the title with a text alternative', () => {
    const field = home.querySelector('#hero [data-pf]')!;
    expect(field.getAttribute('role')).toBe('img');
    expect(field.getAttribute('aria-label')).toMatch(/spark/);
    expect(field.querySelector('[data-pf-sq]')?.getAttribute('aria-hidden')).toBe('true');
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
