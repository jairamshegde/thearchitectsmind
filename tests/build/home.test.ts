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
    expect(hero.querySelector('h1')?.text.replace(/\s+/g, ' ').trim()).toBe('In search of intuition.');
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

  it('features the latest project as one card with year, short title, tags and a case study pill', () => {
    const section = home.querySelector('#projects')!;
    expect(section.querySelector('.sec-top h2')?.text).toBe('Projects');
    const all = section.querySelector('.sec-top a');
    expect(all?.text.trim()).toBe('All projects');
    expect(all?.getAttribute('href')).toBe(`${BASE}/projects/`);
    const cards = section.querySelectorAll('a.feat');
    expect(cards).toHaveLength(1);
    const card = cards[0];
    expect(card.getAttribute('href')).toMatch(new RegExp(`^${BASE}/projects/[^/]+/$`));
    expect(card.querySelector('.feat-media img')).not.toBeNull();
    expect(card.querySelector('.feat-meta')?.text).toMatch(/^\d{4}, open source$/);
    expect(card.querySelector('h3')?.text).toBe('Mingraph');
    expect(card.querySelector('.feat-desc')?.text).toBeTruthy();
    const tags = card.querySelectorAll('.tags .tag');
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.length).toBeLessThanOrEqual(4);
    expect(card.querySelector('.feat-cta')?.text.trim()).toBe('View case study');
    expect(section.toString()).not.toMatch(/[→↗←]/);
  });

  it('lists the latest posts and notes in the Blog and Notes band', () => {
    const section = home.querySelector('section#writing')!;
    const rows = section.querySelectorAll('#panel-blog a.row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(5);
    for (const row of rows) {
      expect(row.getAttribute('href')).toMatch(new RegExp(`^${BASE}/writing/`));
      expect(row.querySelector('.row-time')?.text).toMatch(/\d+ min/);
    }
    const cards = section.querySelectorAll('#panel-notes a.note-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(4);
    for (const card of cards) expect(card.getAttribute('href')).toMatch(new RegExp(`^${BASE}/notes/[^/]+/$`));
    const all = section.querySelector('a[data-all]');
    expect(all?.text.trim()).toBe('All posts');
    expect(all?.getAttribute('href')).toBe(`${BASE}/writing/`);
    expect(section.toString()).not.toMatch(/[→↗←]/);
  });
});
