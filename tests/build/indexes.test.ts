import { describe, expect, it } from 'vitest';
import { BASE, built, page } from './helpers';

// Content published from the CMS is added to these lists, so assert on the starter
// entries' relative order (and draft exclusion), not on the exact list.
const starterOrder = (hrefs: (string | undefined)[], starter: string[]) => hrefs.filter((h) => h && starter.includes(h));

describe('/writing/', () => {
  const p = page('/writing/');
  it('lists published posts newest first, without drafts', () => {
    expect(p.querySelector('h1')?.text).toBe('Writing');
    const hrefs = p.querySelectorAll('a.latest, a.post').map((a) => a.getAttribute('href'));
    const starter = [`${BASE}/writing/designing-for-failure/`, `${BASE}/writing/boundaries-before-boxes/`];
    expect(starterOrder(hrefs, starter)).toEqual(starter);
    expect(hrefs).not.toContain(`${BASE}/writing/unpublished-idea/`);
  });

  it('shows the newest post once, above the grid, with date and read time', () => {
    const latest = p.querySelectorAll('a.latest');
    expect(latest).toHaveLength(1);
    const gridHrefs = p.querySelectorAll('.writing-grid a.post').map((a) => a.getAttribute('href'));
    expect(gridHrefs).not.toContain(latest[0].getAttribute('href'));
    for (const card of p.querySelectorAll('a.latest, a.post')) {
      expect(card.querySelector('.post-meta time')?.getAttribute('datetime')).toBeTruthy();
      expect(card.querySelector('.post-meta')?.text).toMatch(/\d+ min read/);
    }
  });

  it('offers "All" plus at most 10 tag filters, each matching a grid card', () => {
    const buttons = p.querySelectorAll('.tag-filter button');
    expect(buttons[0].text).toBe('All');
    expect(buttons.length).toBeLessThanOrEqual(11);
    const gridTags = p.querySelectorAll('.writing-grid a.post').flatMap((a) => JSON.parse(a.getAttribute('data-tags')!));
    for (const b of buttons.slice(1)) expect(gridTags).toContain(b.getAttribute('data-tag'));
  });
});

describe('/notes/', () => {
  const p = page('/notes/');
  it('groups notes by year, newest first, without drafts', () => {
    const years = p.querySelectorAll('.year-group h2').map((h) => Number(h.text));
    expect(years).toEqual([...years].sort((a, b) => b - a));
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
  const href = (slug: string) => `${BASE}/projects/${slug}/`;

  it('shows the newest project once, above the list, with summary, stack and a View Project link to the repo', () => {
    const latest = p.querySelectorAll('.latest-proj');
    expect(latest).toHaveLength(1);
    const titleHref = latest[0].querySelector('h2 a')?.getAttribute('href');
    const cardHrefs = p.querySelectorAll('.proj-card h3 a').map((a) => a.getAttribute('href'));
    expect(cardHrefs).not.toContain(titleHref);
    expect(latest[0].querySelector('.btn-primary')?.getAttribute('href')).toMatch(/^https:\/\/github\.com\//);
    expect(latest[0].querySelector('.proj-summary')?.text).toBeTruthy();
    expect(latest[0].querySelectorAll('.proj-tags li').length).toBeGreaterThan(0);
  });

  it('renders each other project as a card with summary, stack, cover and a View Project link to the repo', () => {
    const card = p.querySelectorAll('.proj-card').find((c) => c.querySelector('h3 a')?.getAttribute('href') === href('order-pipeline-redesign'))!;
    expect(card.querySelector('h3')?.text).toBe('Order pipeline redesign');
    expect(card.querySelector('.proj-summary')?.text).toMatch(/^Split a synchronous checkout/);
    expect(card.querySelectorAll('.proj-tags li').map((li) => li.text)).toEqual(['Python', 'FastAPI', 'PostgreSQL', 'Kafka']);
    expect(card.querySelector('h3 a')?.getAttribute('href')).toBe(href('order-pipeline-redesign'));
    expect(card.querySelector('.btn-primary')?.getAttribute('href')).toBe('https://github.com/jairamshegde/');
    expect(card.querySelector('.thumb img')).not.toBeNull();
  });

  it('offers "All" plus at most 10 lowercase stack filters, each matching a card', () => {
    const buttons = p.querySelectorAll('.more-projects .tag-filter button');
    expect(buttons[0].text).toBe('All');
    expect(buttons.length).toBeLessThanOrEqual(11);
    const cardTags = p.querySelectorAll('.proj-card').flatMap((c) => JSON.parse(c.getAttribute('data-tags')!));
    for (const b of buttons.slice(1)) {
      expect(b.getAttribute('data-tag')).toBe(b.getAttribute('data-tag')!.toLowerCase());
      expect(cardTags).toContain(b.getAttribute('data-tag'));
    }
  });
});
