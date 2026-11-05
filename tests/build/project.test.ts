import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

// Mingraph is the only project: a case study with a Problem card and Lessons, but no role or timeline.
const MINGRAPH = 'mingraph-langchain-and-langgraph-building-blocks-rebuilt-from-scratch-to-learn-object-oriented-design-and-design-patterns-in-python.';

describe('case study', () => {
  const p = page(`/projects/${MINGRAPH}/`);

  it('shows kicker, title, summary and the meta grid', () => {
    expect(p.querySelector('.article-kicker')?.text).toBe('Case study · 2026');
    expect(p.querySelector('h1.article-title')?.text).toMatch(/^Mingraph/);
    expect(p.querySelector('.article-lead')?.text).toBeTruthy();
    const meta = Object.fromEntries(p.querySelectorAll('.cs-meta > div').map((d) => [d.querySelector('dt')!.text, d.querySelector('dd')!]));
    expect(Object.keys(meta)).toEqual(['Stack', 'Links']);
    expect(meta.Links.querySelector('a')?.getAttribute('href')).toBe('https://github.com/jairamshegde/mingraph');
  });

  it('renders only the Problem card, then Lessons, with the back link at the top', () => {
    expect(p.querySelectorAll('.cs-card .cs-card-title').map((t) => t.text)).toEqual(['Problem']);
    expect(p.querySelector('aside.lessons')).not.toBeNull();
    expect(p.querySelector('.article-head a.article-crumb')?.getAttribute('href')).toBe(`${BASE}/projects/`);
  });
});
