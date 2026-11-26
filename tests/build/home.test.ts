import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('home page', () => {
  const home = page('/');

  it('orders sections Hero → Featured series → Writing → Featured project', () => {
    const ids = home.querySelectorAll('main > section').map((s) => s.getAttribute('id'));
    expect(ids).toEqual(['hero', 'series', 'writing', 'projects']);
  });

  it('shows the two-line title with an accent period, subtitle, a primary button and two links', () => {
    const hero = home.querySelector('#hero')!;
    expect(hero.querySelectorAll('h1')).toHaveLength(1);
    const lines = hero.querySelectorAll('h1 .mask');
    expect(lines.map((l) => l.text)).toEqual(['In search of', 'intuition.']);
    expect(lines[1].querySelector('.accent-dot')?.text).toBe('.');
    expect(hero.querySelector('h1')?.text.replace(/\s+/g, ' ').trim()).toBe('In search of intuition.');
    expect(hero.querySelector('.hero-sub')?.text).toBe('An AI engineer’s working notes on building reliable agents, designing evals, and shipping AI that survives production.');
    expect(hero.querySelector('.hero-bio')).toBeNull();
    const links = hero.querySelectorAll('.hero-actions a');
    expect(links.map((a) => a.text.trim())).toEqual(['Read the Writing', 'Projects', 'About']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([`${BASE}/writing/`, `${BASE}/projects/`, `${BASE}/about/`]);
    expect(links[0].classList.contains('pill-accent')).toBe(true);
  });

  it('features each series that has published parts, with its first parts and a start link', () => {
    const section = home.querySelector('#series')!;
    expect(section.querySelector('.sec-top h2')?.text).toBe('Featured series');
    expect(section.querySelector('.sec-top a')?.getAttribute('href')).toBe(`${BASE}/writing/`);
    const mingraph = section.querySelectorAll('.series').find((s) => s.querySelector('h3')?.text === 'Mingraph')!;
    expect(mingraph.querySelector('h3 a')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
    expect(mingraph.querySelector('.series-meta')?.text).toMatch(/^\d+ parts · \d+ min$/);
    const parts = mingraph.querySelectorAll('a.part');
    expect(parts).toHaveLength(4);
    expect(parts[0].querySelector('.part-n')?.text).toBe('Part 1');
    expect(mingraph.querySelector('.series-cta')?.getAttribute('href')).toBe(parts[0].getAttribute('href'));
    expect(mingraph.querySelector('.parts-more a')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
  });

  it('draws the pixel field beside the title with a text alternative', () => {
    const field = home.querySelector('#hero [data-pf]')!;
    expect(field.getAttribute('role')).toBe('img');
    expect(field.getAttribute('aria-label')).toMatch(/spark/);
    expect(field.querySelector('[data-pf-sq]')).toBeNull();
    expect(home.querySelector('#hero [data-hero-sq]')?.getAttribute('aria-hidden')).toBe('true');
    expect(home.querySelector('#hero [data-hero-dot]')?.text).toBe('.');
  });

  it('features one project as a card with year, short title, tags and a case study pill', () => {
    const section = home.querySelector('#projects')!;
    expect(section.querySelector('.sec-top h2')?.text).toBe('Featured project');
    const all = section.querySelector('.sec-top a');
    expect(all?.text.trim()).toBe('All projects');
    expect(all?.getAttribute('href')).toBe(`${BASE}/projects/`);
    const cards = section.querySelectorAll('a.feat');
    expect(cards).toHaveLength(1);
    const card = cards[0];
    expect(card.getAttribute('href')).toMatch(new RegExp(`^${BASE}/projects/[^/]+/$`));
    expect(card.querySelector('.feat-meta')?.text).toMatch(/^\d{4}/);
    expect(card.querySelector('h3')?.text).toBeTruthy();
    expect(card.querySelector('.feat-desc')?.text).toBeTruthy();
    const tags = card.querySelectorAll('.tags .tag');
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.length).toBeLessThanOrEqual(4);
    expect(card.querySelector('.feat-cta')?.text.trim()).toBe('View case study');
    expect(section.querySelectorAll('.proj-rows')).toHaveLength(0);
    expect(section.toString()).not.toMatch(/[→↗←]/);
  });

  it('lists the latest posts and notes in the Writing and Notes band', () => {
    const section = home.querySelector('section#writing')!;
    const rows = section.querySelectorAll('#panel-writing a.row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(5);
    for (const row of rows) {
      expect(row.getAttribute('href')).toMatch(new RegExp(`^${BASE}/writing/`));
      expect(row.querySelector('.row-time')?.text).toMatch(/\d+ min/);
    }
    const cards = section.querySelectorAll('#panel-notes a.note-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(section.querySelectorAll('.panel-desc')).toHaveLength(0);
    for (const card of cards) expect(card.getAttribute('href')).toMatch(new RegExp(`^${BASE}/notes/[^/]+/$`));
    const all = section.querySelector('a[data-all]');
    expect(all?.text.trim()).toBe('All writing');
    expect(all?.getAttribute('href')).toBe(`${BASE}/writing/`);
    expect(section.toString()).not.toMatch(/[→↗←]/);
  });
});
