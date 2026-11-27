import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

// Mingraph is the only project: a case study with a Problem card and Lessons, but no role or timeline.
const MINGRAPH = 'mingraph-langchain-and-langgraph-building-blocks-rebuilt-from-scratch-to-learn-object-oriented-design-and-design-patterns-in-python.';

describe('case study', () => {
  const p = page(`/projects/${MINGRAPH}/`);

  it('shows the kicker without a year, the title, and a table of Problem and Links only', () => {
    expect(p.querySelector('.article-kicker')?.text).toBe('Case study');
    expect(p.querySelector('h1.article-title')?.text).toMatch(/^Mingraph/);
    expect(p.querySelector('.article-lead')).toBeNull();
    const rows = p.querySelectorAll('.article-head dl.cs-table > div');
    expect(rows.map((r) => r.querySelector('dt')!.text)).toEqual(['Problem', 'Links']);
    expect(rows[0].querySelector('dd')!.text.trim()).toBeTruthy();
    expect(rows[1].querySelector('a')?.getAttribute('href')).toBe('https://github.com/jairamshegde/mingraph');
  });

  it('puts year and stack in the sidebar, one stack item per line', () => {
    const facts = p.querySelector('.article-shell aside.cs-facts')!;
    const items = Object.fromEntries(facts.querySelectorAll('dl > div').map((d) => [d.querySelector('dt')!.text, d.querySelector('dd')!]));
    expect(Object.keys(items)).toEqual(['Year', 'Stack']);
    expect(items.Year.text).toBe('2026');
    expect(items.Stack.querySelectorAll('li').map((li) => li.text)).toEqual(['Python', 'LangChain', 'LangGraph', 'Design patterns']);
  });

  it('drops the old meta grid, the cards and the lessons', () => {
    expect(p.querySelector('.cs-meta')).toBeNull();
    expect(p.querySelector('.cs-cards')).toBeNull();
    expect(p.querySelector('aside.lessons')).toBeNull();
    expect(p.querySelector('.article-head a.back-link')?.getAttribute('href')).toBe(`${BASE}/projects/`);
    expect(p.querySelector('.article-head a.back-link')?.text.trim()).toBe('Back to projects');
    const first = p.querySelector('.article-head .back-link')!.nextElementSibling!;
    if (p.querySelector('figure.cs-cover')) expect(first.classNames).toContain('cs-cover');
  });
});
