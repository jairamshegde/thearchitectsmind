import { describe, expect, it } from 'vitest';
import { BASE, built, page } from './helpers';

describe('writing article: kitchen sink', () => {
  const p = page('/writing/designing-for-failure/');

  it('links back to the writing index from the top of the article', () => {
    const back = p.querySelector('.article-head a.article-crumb');
    expect(back?.getAttribute('href')).toBe(`${BASE}/writing/`);
    expect(back?.text.trim()).toBe('← All writing');
  });

  it('renders the header: kicker, title, lead, dates, cover', () => {
    expect(p.querySelector('.article-kicker')?.text).toMatch(/^architecture · reliability · python · \d+ min read$/);
    expect(p.querySelector('h1.article-title')?.text).toBe('Designing for failure: a field guide');
    expect(p.querySelector('.article-lead')?.text).toContain('blast radius');
    expect(p.querySelector('.article-meta')?.text).toBe('Sep 20, 2026 · updated Sep 28, 2026');
    expect(p.querySelector('img.article-cover')).not.toBeNull();
  });

  it('builds the TOC rail and the inline Contents panel from H2/H3, with clean heading text', () => {
    const rail = p.querySelectorAll('nav.toc[aria-label="Contents"] a[data-toc-link]');
    expect(rail.length).toBe(9);
    expect(rail.map((a) => a.querySelector('.toc-text')?.text)).toContain('Choosing dataclass vs TypedDict');
    expect(rail[0].getAttribute('href')).toBe('#why-failure-is-the-default');
    expect(rail[0].getAttribute('style')).toMatch(/--dash: \d+px/);
    expect(p.querySelectorAll('details.toc-inline a').length).toBe(9);
  });

  it('gives headings ids and hover anchors', () => {
    const h2 = p.querySelector('.prose h2#retries-without-regret')!;
    expect(h2.querySelector('a.anchor')?.getAttribute('href')).toBe('#retries-without-regret');
  });

  it('frames code with title, highlighted lines and diff lines', () => {
    const frames = p.querySelectorAll('.prose figure.code-frame');
    expect(frames.map((f) => f.querySelector('.code-title')?.text)).toEqual(['retry.py', 'client.py']);
    expect(frames[0].querySelectorAll('.line.highlighted').length).toBe(3);
    expect(frames[1].querySelectorAll('.line.diff.add').length).toBe(1);
    expect(frames[1].querySelectorAll('.line.diff.remove').length).toBe(1);
    expect(frames[0].querySelector('pre')?.getAttribute('style')?.toLowerCase()).toContain('#0e1420');
  });

  it('renders callouts, captioned figures, wrapped tables and mermaid panels', () => {
    expect(p.querySelectorAll('.markdown-alert').map((a) => a.classNames)).toEqual([
      'markdown-alert markdown-alert-note', 'markdown-alert markdown-alert-tip', 'markdown-alert markdown-alert-warning',
    ]);
    expect(p.querySelector('figure.md-figure figcaption')?.text).toBe('Three services, one shared fate');
    expect(p.querySelector('.table-wrap > table')).not.toBeNull();
    expect(p.querySelectorAll('figure.mermaid-panel[data-mermaid] pre.mermaid-src').length).toBe(2);
  });

  it('links to the older post and has no newer link (it is the newest published)', () => {
    const prev = p.querySelector('.prev-next .pn-prev');
    expect(prev?.getAttribute('href')).toBe(`${BASE}/writing/boundaries-before-boxes/`);
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
    expect(p.querySelector('.back-link')?.getAttribute('href')).toBe(`${BASE}/notes/`);
  });

  it('shows the TOC for a note with three headings', () => {
    expect(page('/notes/reading-a-flame-graph/').querySelectorAll('nav.toc a').length).toBe(3);
  });

  it('does not build drafts', () => {
    expect(built('/notes/half-written-thought/')).toBe(false);
    expect(built('/writing/unpublished-idea/')).toBe(false);
  });
});
