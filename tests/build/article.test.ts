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

  it('builds the "On this page" list from the H2s only', () => {
    const h2s = p.querySelectorAll('.prose h2');
    const toc = p.querySelector('nav.toc[aria-label="On this page"]')!;
    expect(toc.querySelector('.toc-label')?.text).toBe('On this page');
    const links = toc.querySelectorAll('ol > li > a[data-toc-link]');
    expect(links.length).toBe(h2s.length);
    expect(links[0].getAttribute('href')).toBe(`#${h2s[0].id}`);
    expect(links[0].text.trim()).toBe(h2s[0].text.replace('#', '').trim());
    expect(p.querySelector('details.toc-inline')).toBeNull();
  });

  it('gives headings ids and hover anchors', () => {
    for (const h2 of p.querySelectorAll('.prose h2')) {
      expect(h2.id).toMatch(/^[a-z0-9-]+$/);
      expect(h2.querySelector('a.anchor')?.getAttribute('href')).toBe(`#${h2.id}`);
    }
  });

  it('frames code blocks on the dark code background with keywords in the accent, and wraps tables', () => {
    const frames = p.querySelectorAll('.prose figure.code-frame');
    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0].querySelector('.code-lang')?.text).toBe('python');
    expect(frames[0].querySelector('pre')?.getAttribute('style')?.toLowerCase()).toContain('#17171a');
    const keyword = p.querySelectorAll('.prose pre span').find((s) => ['class', 'def', 'return', 'import'].includes(s.text.trim()));
    expect(keyword?.getAttribute('style')?.toLowerCase()).toContain('#ff8a63');
    expect(p.querySelector('.table-wrap > table')).not.toBeNull();
  });

  it('ends the series with all bars filled and a way back to the series', () => {
    const end = p.querySelector('section.series-end')!;
    expect(end.querySelector('.series-of')?.text.replace(/\s+/g, ' ').trim()).toBe('Part 8 of 8 in the Mingraph series');
    expect(end.querySelector('.series-of a')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
    expect(end.querySelectorAll('ol.series-bars li')).toHaveLength(8);
    expect(end.querySelectorAll('ol.series-bars li.done')).toHaveLength(8);
    const card = end.querySelector('a.next-card')!;
    expect(card.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
    expect(card.querySelector('.next-title')?.text).toBe('Back to the series');
    expect(end.toString()).not.toMatch(/[→↗←]/);
    expect(p.querySelector('.prev-next')).toBeNull();
  });
});

describe('writing article: the first Mingraph part', () => {
  const p = page('/writing/mingraph/phase-0-oop-finally-clicked/');

  it('keeps a space between the two title lines in the heading text', () => {
    expect(p.querySelector('h1.post-title')?.text.replace(/\s+/g, ' ').trim()).toBe('Learning OOP through the design questions I already ask at work');
  });

  it('fills one bar and points the next card at part 2', () => {
    const end = p.querySelector('section.series-end')!;
    expect(end.querySelectorAll('ol.series-bars li.done')).toHaveLength(1);
    const card = end.querySelector('a.next-card')!;
    expect(card.getAttribute('href')).toBe(`${BASE}/writing/mingraph/phase-1-abstraction-and-polymorphism/`);
    expect(card.querySelector('.next-kicker')?.text).toMatch(/^Next, part 2 \u00b7 \d+ min$/);
    expect(card.querySelector('.next-title')?.text).toBeTruthy();
    expect(card.querySelector('.next-go')?.text).toBe('Read next');
  });
});

describe('writing article: Pico and the summary boxes', () => {
  const p = page('/writing/mingraph/phase-0-oop-finally-clicked/');

  it('turns every Pico line into a margin note beside its paragraph', () => {
    expect(p.querySelectorAll('.prose .pico-row > aside.pico')).toHaveLength(3);
    expect(p.querySelectorAll('.prose p').filter((el) => el.text.startsWith('Pico:'))).toEqual([]);
  });

  it('turns the TL;DR and AIDR quotes into boxes', () => {
    expect(p.querySelector('.prose section.box-tldr .box-h')?.text).toBe('TL;DR, for humans');
    expect(p.querySelector('.prose section.box-aidr .box-h')?.text).toBe('AIDR, AI don\u2019t read');
  });
});

describe('notes', () => {
  it('shows no TOC (rail or inline) for a short note with one heading', () => {
    const p = page('/notes/dataclass-slots/');
    expect(p.querySelector('h1.article-title')?.text).toBe('Dataclasses with slots=True');
    expect(p.querySelector('nav.toc')).toBeNull();
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
