import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/about/', () => {
  const p = page('/about/');
  it('opens with the welcome section: kicker, title, lead, and Pico with his note', () => {
    expect(p.querySelector('.article-kicker')?.text).toBe('Welcome to my place 🛋️');
    expect(p.querySelector('h1.article-title')?.text).toBe("Hi, I'm Jairam 👋");
    expect(p.querySelector('.article-lead')?.text).toBe(
      'I’m an AI engineer who likes to build things that are slightly more complicated than they probably need to be.',
    );
    const pico = p.querySelector('.about-welcome figure.about-pico')!;
    expect(pico.querySelector('img')?.getAttribute('alt')).toMatch(/Pico/);
    expect(pico.querySelector('.about-pico-note')?.text).toBe('Hey curious reader, I’m Pico');
  });

  it('“What I do” shows Pico on the left and the text on the right', () => {
    const h2 = p.querySelectorAll('.prose h2').find((h) => h.text.replace('#', '').trim() === 'What I do')!;
    const split = h2.nextElementSibling!;
    expect(split.classNames).toBe('md-split md-split-left');
    expect(split.querySelector('.md-split-media img')?.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/pico-builder\./);
    expect(split.querySelector('.md-note .md-note-text')?.text).toBe('Build it. Break it. Figure out why. Repeat.');
    expect(split.querySelector('.md-note svg.md-note-arrow')).not.toBeNull();
    expect(split.querySelector('.md-split-text')?.text.trim()).toBe(
      'These days, that usually means AI systems, agents, retrieval, software architecture, and figuring out how to make all of them behave when they meet the real world.',
    );
  });

  it('renders the about body with a TOC', () => {
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
