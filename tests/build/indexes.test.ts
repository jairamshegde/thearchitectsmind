import { describe, expect, it } from 'vitest';
import { BASE, built, page } from './helpers';

// Notes published from the CMS are added to the list, so assert on the starter
// notes' relative order (and draft exclusion), not on the exact list.
const starterOrder = (hrefs: (string | undefined)[], starter: string[]) => hrefs.filter((h) => h && starter.includes(h));

describe('/writing/', () => {
  const p = page('/writing/');
  const cards = p.querySelectorAll('a.latest-card, a.wcard');

  it('has the two-line page title and an intro', () => {
    expect(p.querySelector('h1.page-title')?.text.replace(/\s+/g, ' ').trim()).toBe('Long-form writing.');
    expect(p.querySelector('.page-intro')?.text).toBeTruthy();
  });

  it('lists published posts newest first, the latest one large and once', () => {
    expect(p.querySelectorAll('a.latest-card')).toHaveLength(1);
    expect(cards.length).toBeGreaterThan(1);
    const hrefs = cards.map((c) => c.getAttribute('href'));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href).toMatch(new RegExp(`^${BASE}/writing/`));
    const dates = cards.map((c) => Date.parse(c.querySelector('time')!.getAttribute('datetime')!));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('shows date and read time on every card, and no series names', () => {
    for (const card of cards) {
      expect(card.querySelector('.card-meta')?.text).toMatch(/^\w{3} \d{1,2}, \d{4} \u00b7 \d+ min$/);
      expect(card.querySelector('.card-meta')?.text).not.toMatch(/part|series/i);
    }
    expect(p.querySelector('a.latest-card .pill')?.text.trim()).toBe('Read the post');
    expect(p.querySelector('main')?.toString()).not.toMatch(/[→↗←]/);
  });

  it('offers "All" plus at most 10 tag filters, each matching a card', () => {
    const buttons = p.querySelectorAll('.tag-filter button');
    expect(buttons[0].text).toBe('All');
    expect(buttons.length).toBeLessThanOrEqual(11);
    const cardTags = p.querySelectorAll('a.wcard').flatMap((a) => JSON.parse(a.getAttribute('data-tags')!));
    for (const b of buttons.slice(1)) expect(cardTags).toContain(b.getAttribute('data-tag'));
  });
});

describe('/notes/', () => {
  const p = page('/notes/');
  it('has the two-line page title', () => {
    expect(p.querySelector('h1.page-title')?.text.replace(/\s+/g, ' ').trim()).toBe('Short notes.');
  });

  it('groups notes by month, newest first, without drafts', () => {
    const months = p.querySelectorAll('.month-group h2').map((h) => Date.parse(`1 ${h.text}`));
    expect(months.length).toBeGreaterThan(0);
    expect(months).toEqual([...months].sort((a, b) => b - a));
    const rows = p.querySelectorAll('a.note-row');
    const hrefs = rows.map((a) => a.getAttribute('href'));
    const starter = [`${BASE}/notes/dataclass-slots/`, `${BASE}/notes/reading-a-flame-graph/`];
    expect(starterOrder(hrefs, starter)).toEqual(starter);
    expect(hrefs).not.toContain(`${BASE}/notes/half-written-thought/`);
    const slots = rows.find((a) => a.getAttribute('href') === starter[0])!;
    expect(slots.querySelector('.note-date')?.text).toBe('Sep 12');
    expect(slots.querySelector('.note-tags')?.text).toBe('python');
  });
});

describe('/notes/ pagination', () => {
  // The number of notes grows from the CMS, so check whatever pages were built.
  const pages: number[] = [];
  for (let n = 1; n === 1 || built(`/notes/${n}/`); n++) pages.push(n);
  const route = (n: number) => (n === 1 ? '/notes/' : `/notes/${n}/`);

  it('shows at most 10 notes per page and never builds /notes/1/', () => {
    for (const n of pages) expect(page(route(n)).querySelectorAll('a.note-row').length).toBeLessThanOrEqual(10);
    expect(built('/notes/1/')).toBe(false);
  });

  it('links every page with Newer/Older and marks the current page', () => {
    for (const n of pages) {
      const nav = page(route(n)).querySelector('nav.pagination');
      if (pages.length === 1) {
        expect(nav).toBeNull();
        continue;
      }
      expect(nav?.querySelector('[aria-current="page"]')?.text).toBe(String(n));
      expect(nav?.querySelectorAll('.pg-num').length).toBe(pages.length);
      expect(nav?.querySelector('a[rel="prev"]')?.getAttribute('href') ?? null).toBe(n > 1 ? `${BASE}${route(n - 1)}` : null);
      expect(nav?.querySelector('a[rel="next"]')?.getAttribute('href') ?? null).toBe(n < pages.length ? `${BASE}${route(n + 1)}` : null);
    }
  });
});

describe('/projects/', () => {
  const p = page('/projects/');

  it('has the two-line page title', () => {
    expect(p.querySelector('h1.page-title')?.text.replace(/\s+/g, ' ').trim()).toBe('Things I build.');
  });

  it('shows the newest project as the featured card, with the CMS summary', () => {
    const cards = p.querySelectorAll('a.feat');
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute('href')).toMatch(new RegExp(`^${BASE}/projects/[^/]+/$`));
    expect(cards[0].querySelector('.feat-desc')?.text).toMatch(/^The core of LangChain and LangGraph/);
    expect(cards[0].querySelector('.feat-cta')?.text.trim()).toBe('View case study');
    const featured = cards[0].getAttribute('href');
    expect(p.querySelectorAll('.proj-rows a').map((a) => a.getAttribute('href'))).not.toContain(featured);
    expect(p.querySelector('main')?.toString()).not.toMatch(/[→↗←]/);
  });
});
