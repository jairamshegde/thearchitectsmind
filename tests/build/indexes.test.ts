import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/writing/', () => {
  const p = page('/writing/');
  it('lists every published post newest first, without drafts', () => {
    expect(p.querySelector('h1')?.text).toBe('Writing');
    expect(p.querySelectorAll('a.post').map((a) => a.getAttribute('href'))).toEqual([
      `${BASE}/writing/designing-for-failure/`,
      `${BASE}/writing/boundaries-before-boxes/`,
    ]);
  });
});

describe('/notes/', () => {
  const p = page('/notes/');
  it('groups notes by year, newest first, without drafts', () => {
    expect(p.querySelectorAll('.year-group h2').map((h) => h.text)).toEqual(['2026']);
    const rows = p.querySelectorAll('a.note-row');
    expect(rows.map((a) => a.getAttribute('href'))).toEqual([
      `${BASE}/notes/dataclass-slots/`,
      `${BASE}/notes/reading-a-flame-graph/`,
    ]);
    expect(rows[0].querySelector('.note-date')?.text).toBe('Sep 12');
    expect(rows[0].querySelector('.note-tags')?.text).toBe('python');
  });
});

describe('/projects/', () => {
  const p = page('/projects/');
  it('lists all projects with a Case study badge only on full case studies', () => {
    const rows = p.querySelectorAll('.proj-row');
    expect(rows.map((r) => r.getAttribute('href'))).toEqual([
      `${BASE}/projects/order-pipeline-redesign/`,
      `${BASE}/projects/dotfiles-cli/`,
    ]);
    expect(rows[0].querySelector('.badge')?.text).toBe('Case study');
    expect(rows[1].querySelector('.badge')).toBeNull();
  });
});
