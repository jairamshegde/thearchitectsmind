import { describe, expect, it } from 'vitest';
import { BASE, built, page } from './helpers';

// The sample "kitchen sink" posts were deleted from the CMS, so these checks run against a real
// series post and assert on structure, not wording. Markdown features (callouts, figures, mermaid,
// highlighted and diff lines) are covered by tests/unit/markdown.test.ts.
describe('writing article: the last Mingraph part', () => {
  const POST = '/writing/mingraph/phase-7-state-pattern-and-agent-loop/';
  const p = page(POST);

  it('has no back-arrow crumb at the top', () => {
    expect(p.querySelector('.article-crumb')).toBeNull();
  });

  it('renders the post head in order: series line, title, dek, meta', () => {
    const head = p.querySelector('header.post-head')!;
    const order = head.querySelectorAll('.series-line, .post-title, .dek, .post-meta').map((el) => el.classNames.split(' ').find((c) => ['series-line', 'post-title', 'dek', 'post-meta'].includes(c)));
    expect(order).toEqual(['series-line', 'post-title', 'dek', 'post-meta']);
    const series = head.querySelector('.series-line')!;
    expect(series.text.replace(/\s+/g, ' ').trim()).toBe('Mingraph series, part 8 of 8 · See all parts');
    expect(series.querySelector('a')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
    expect(head.querySelectorAll('h1.post-title .mask').length).toBe(2);
    expect(head.querySelector('.dek')?.text).toBeTruthy();
    expect(head.querySelectorAll('dl.post-meta dt').map((d) => d.text)).toEqual(['Published', 'Reading time', 'Part', 'Tags']);
    expect(head.querySelectorAll('dl.post-meta dd')[1].text).toMatch(/^\d+ min$/);
    expect(head.querySelectorAll('dl.post-meta dd')[2].text).toBe('8 of 8');
    expect(head.querySelectorAll('dl.post-meta .tag').length).toBeGreaterThan(0);
    expect(head.querySelector('[data-pf]')?.getAttribute('role')).toBe('img');
  });

  it('puts the cover after the head, and a reading progress bar at the top', () => {
    const cover = p.querySelector('figure.post-cover img');
    expect(cover).not.toBeNull();
    expect(p.querySelector('.progress[aria-hidden="true"] > i')).not.toBeNull();
  });

  it('builds the TOC rail and the inline Contents panel from every H2, with clean heading text', () => {
    const h2s = p.querySelectorAll('.prose h2');
    const rail = p.querySelectorAll('nav.toc[aria-label="Contents"] a[data-toc-link]');
    expect(rail.length).toBe(h2s.length);
    expect(rail[0].getAttribute('href')).toBe(`#${h2s[0].id}`);
    expect(rail[0].querySelector('.toc-text')?.text).toBe(h2s[0].text.replace('#', '').trim());
    expect(rail[0].getAttribute('style')).toMatch(/--dash: \d+px/);
    expect(p.querySelectorAll('details.toc-inline a').length).toBe(h2s.length);
  });

  it('gives headings ids and hover anchors', () => {
    for (const h2 of p.querySelectorAll('.prose h2')) {
      expect(h2.id).toMatch(/^[a-z0-9-]+$/);
      expect(h2.querySelector('a.anchor')?.getAttribute('href')).toBe(`#${h2.id}`);
    }
  });

  it('frames code blocks on the dark editor background and wraps tables', () => {
    const frames = p.querySelectorAll('.prose figure.code-frame');
    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0].querySelector('.code-title')?.text).toBe('python');
    expect(frames[0].querySelector('pre')?.getAttribute('style')?.toLowerCase()).toContain('#0e1420');
    expect(p.querySelector('.table-wrap > table')).not.toBeNull();
  });

  it('links to the previous part and has no next link (it is the last part)', () => {
    expect(p.querySelector('.prev-next .pn-prev')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/phase-6-di-and-rag/`);
    expect(p.querySelector('.prev-next .pn-next')).toBeNull();
  });
});

describe('notes', () => {
  it('shows no TOC (rail or inline) for a short note with one heading', () => {
    const p = page('/notes/dataclass-slots/');
    expect(p.querySelector('h1.article-title')?.text).toBe('Dataclasses with slots=True');
    expect(p.querySelector('nav.toc')).toBeNull();
    expect(p.querySelector('details.toc-inline')).toBeNull();
    expect(p.querySelector('.article-meta')?.text).toBe('Sep 12, 2026 · python');
    expect(p.querySelector('.article-head a.article-crumb')?.getAttribute('href')).toBe(`${BASE}/notes/`);
  });

  it('shows the TOC for a note with three headings', () => {
    expect(page('/notes/reading-a-flame-graph/').querySelectorAll('nav.toc a').length).toBe(3);
  });

  it('does not build drafts', () => {
    expect(built('/notes/half-written-thought/')).toBe(false);
  });
});
