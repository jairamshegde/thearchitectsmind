import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('home page', () => {
  const home = page('/');

  it('orders sections Hero → Featured projects → Writing → About and has no Notes section', () => {
    const ids = home.querySelectorAll('main > section').map((s) => s.getAttribute('id') ?? s.classNames);
    expect(ids).toEqual(['hero wrap', 'projects', 'writing', 'about']);
    expect(home.querySelector('#notes')).toBeNull();
  });

  it('shows the hero headline with the highlighted phrase and two CTAs', () => {
    expect(home.querySelector('.hl .mark')?.text).toBe('how I think');
    const ctas = home.querySelectorAll('.hero .ctas a').map((a) => a.getAttribute('href'));
    expect(ctas).toEqual([`${BASE}/projects/`, `${BASE}/writing/`]);
  });

  it('shows at most 3 featured projects, featured first, linking to project pages', () => {
    const section = home.querySelector('#projects')!;
    expect(section.querySelector('h2')?.text).toBe('Featured projects');
    const rows = section.querySelectorAll('.proj-row');
    expect(rows.length).toBeLessThanOrEqual(3);
    expect(rows[0].getAttribute('href')).toBe(`${BASE}/projects/order-pipeline-redesign/`);
    expect(section.querySelector('.more')?.getAttribute('href')).toBe(`${BASE}/projects/`);
    expect(section.querySelectorAll('[data-stage-panel]').length).toBe(rows.length);
  });

  it('shows at most 3 writing cards and never a draft, even a featured one', () => {
    const section = home.querySelector('#writing')!;
    const cards = section.querySelectorAll('a.post');
    expect(cards.length).toBeLessThanOrEqual(3);
    const hrefs = cards.map((c) => c.getAttribute('href'));
    expect(hrefs[0]).toBe(`${BASE}/writing/designing-for-failure/`);
    expect(hrefs.join(' ')).not.toContain('unpublished-idea');
    expect(section.querySelector('.more')?.getAttribute('href')).toBe(`${BASE}/writing/`);
  });

  it('uses the dot-grid fallback with the first tag when a post has no cover', () => {
    const card = home.querySelectorAll('#writing a.post').find((c) => c.getAttribute('href')?.includes('boundaries-before-boxes'))!;
    expect(card.querySelector('.thumb-fallback .hand')?.text).toBe('architecture');
    expect(card.querySelector('.date')?.text).toBe('Aug 2, 2026');
  });

  it('shows the about intro, now list and a Learn more button to /about/', () => {
    const about = home.querySelector('#about')!;
    expect(about.querySelectorAll('.now dt').map((d) => d.text)).toEqual(['Building', 'Reading', 'Learning', 'Writing']);
    const cta = about.querySelector('a.btn');
    expect(cta?.text).toContain('Learn more about me');
    expect(cta?.getAttribute('href')).toBe(`${BASE}/about/`);
  });
});
