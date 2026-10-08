import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('home page', () => {
  const home = page('/');

  it('orders sections Hero → Logos → Featured projects → Writing → About and has no Notes section', () => {
    const ids = home.querySelectorAll('main > section').map((s) => s.getAttribute('id') ?? s.classNames);
    expect(ids).toEqual(['hero wrap', 'logos', 'projects', 'writing', 'about']);
    expect(home.querySelector('#notes')).toBeNull();
  });

  it('shows the hero headline, subtext and two CTAs, with no highlight', () => {
    expect(home.querySelector('.hero .hl')?.text).toBe('I make computers do interesting things. Then I get suspicious.');
    expect(home.querySelector('.hero .hl .mark')).toBeNull();
    expect(home.querySelector('.hero .hero-sub')?.text).toBe(
      'Writing about AI, software architecture, systems, and everything I learn while building them.',
    );
    const ctas = home.querySelectorAll('.hero .ctas a').map((a) => a.getAttribute('href'));
    expect(ctas).toEqual([`${BASE}/projects/`, `${BASE}/writing/`]);
  });

  it('shows the team image with the handwritten note and an arrow', () => {
    const figure = home.querySelector('.hero figure.hero-figure')!;
    expect(figure.querySelector('img')?.getAttribute('alt')).toMatch(/Pico/);
    expect(figure.querySelector('img')?.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/hero-cutout\./);
    expect(figure.querySelector('.hero-note-text')?.text).toBe('Meet the team: Pico leads, Claude codes, I take credit 😉');
    expect(figure.querySelector('svg.hero-arrow')).not.toBeNull();
  });

  it('shows 19 tool logos in two rows, each row duplicated once and hidden from screen readers', () => {
    expect(home.querySelector('.logos .logos-label')?.text).toBe('Tools I build with. Pico keeps an eye on all of them.');
    const rows = home.querySelectorAll('.logos .logos-row');
    expect(rows.length).toBe(2);
    for (const row of rows) {
      const [list, copy] = row.querySelectorAll('ul');
      expect(list.getAttribute('aria-hidden')).toBeUndefined();
      expect(copy.getAttribute('aria-hidden')).toBe('true');
      expect(copy.text).toBe(list.text);
    }
    const names = rows.flatMap((row) => row.querySelectorAll('ul:not([aria-hidden]) li').map((li) => li.text.trim()));
    expect(names).toHaveLength(19);
    expect(names).toContain('Claude Code');
    expect(home.querySelector('.logos .logo-icon')?.getAttribute('style')).toContain(`${BASE}/logos/claude.svg`);
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
    expect(card.querySelector('.post-meta time')?.text).toBe('Aug 2, 2026');
  });

  it('shows skeptical Pico with his note above the now list', () => {
    const side = home.querySelector('#about .about-side')!;
    const pico = side.querySelector('figure.about-pico')!;
    expect(pico.querySelector('img')?.getAttribute('alt')).toMatch(/Pico/);
    expect(pico.querySelector('.about-pico-note')?.text).toBe('I’m reading what he wrote. You tell me what it means.');
    expect(side.childNodes.filter((n) => 'tagName' in n).map((n) => (n as { tagName: string }).tagName)).toEqual(['FIGURE', 'DL']);
  });

  it('shows the about intro, now list and a Learn more button to /about/', () => {
    const about = home.querySelector('#about')!;
    expect(about.querySelectorAll('.now dt').map((d) => d.text)).toEqual(['Building', 'Reading', 'Learning', 'Writing']);
    const cta = about.querySelector('a.btn');
    expect(cta?.text).toContain('Learn more about me');
    expect(cta?.getAttribute('href')).toBe(`${BASE}/about/`);
  });
});
