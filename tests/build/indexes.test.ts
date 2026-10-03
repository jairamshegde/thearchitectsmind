import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

// Content published from the CMS is added to these lists, so assert on the starter
// entries' relative order (and draft exclusion), not on the exact list.
const starterOrder = (hrefs: (string | undefined)[], starter: string[]) => hrefs.filter((h) => h && starter.includes(h));

describe('/writing/', () => {
  const p = page('/writing/');
  it('lists published posts newest first, without drafts', () => {
    expect(p.querySelector('h1')?.text).toBe('Writing');
    const hrefs = p.querySelectorAll('a.post').map((a) => a.getAttribute('href'));
    const starter = [`${BASE}/writing/designing-for-failure/`, `${BASE}/writing/boundaries-before-boxes/`];
    expect(starterOrder(hrefs, starter)).toEqual(starter);
    expect(hrefs).not.toContain(`${BASE}/writing/unpublished-idea/`);
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

describe('/projects/', () => {
  const p = page('/projects/');
  it('lists projects with a Case study badge only on full case studies', () => {
    const rows = p.querySelectorAll('.proj-row');
    const byHref = (h: string) => rows.find((r) => r.getAttribute('href') === `${BASE}/projects/${h}/`)!;
    expect(byHref('order-pipeline-redesign').querySelector('.badge')?.text).toBe('Case study');
    expect(byHref('dotfiles-cli').querySelector('.badge')).toBeNull();
  });
});
