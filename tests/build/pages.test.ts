import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/about/', () => {
  const p = page('/about/');
  it('renders the about entry title and body with a TOC', () => {
    expect(p.querySelector('h1.article-title')?.text).toBe("Hi, I'm Jairam.");
    expect(p.querySelectorAll('.prose h2').map((h) => h.text.replace('#', '').trim())).toEqual(['What I do', 'How I think', 'Elsewhere']);
    expect(p.querySelectorAll('nav.toc a').length).toBe(3);
  });
});

describe('404', () => {
  const p = page('/404.html');
  it('has a friendly message and links home and to writing', () => {
    expect(p.querySelector('h1')?.text).toBe('This page took a different path.');
    expect(p.querySelectorAll('.page-head a').map((a) => a.getAttribute('href'))).toEqual([`${BASE}/`, `${BASE}/writing/`]);
  });
});
