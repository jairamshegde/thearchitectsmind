import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/about/', () => {
  const p = page('/about/');
  it('opens with the kicker, name, lead, and Pico with his note', () => {
    expect(p.querySelector('.article-kicker')?.text).toBe('About');
    expect(p.querySelector('h1.article-title')?.text).toBe('Jairam Hegde');
    expect(p.querySelector('.article-lead')?.text).toMatch(/^I’m a GenAI engineer\./);
    const pico = p.querySelector('.about-welcome figure.about-pico')!;
    expect(pico.querySelector('img')?.getAttribute('src')).toMatch(/^\/thearchitectsmind\/_astro\/pico-welcome\./);
    expect(pico.querySelector('.about-pico-note')?.text).toBe('I’m Pico. I’m the one asking what happens when the API is down.');
  });

  it('has What I build and How I work, with one Pico, no section images and no table of contents', () => {
    expect(p.querySelectorAll('.prose h2').map((h) => h.text.replace('#', '').trim())).toEqual(['What I build', 'How I work']);
    expect(p.querySelectorAll('.prose img')).toHaveLength(0);
    expect(p.querySelectorAll('main img')).toHaveLength(1);
    expect(p.querySelector('nav.toc')).toBeNull();
    expect(p.querySelector('details.toc-inline')).toBeNull();
  });

  it('links Mingraph to its writing series', () => {
    expect(p.querySelector('.prose a[href$="/writing/mingraph/"]')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
  });

  it('ends with the Now list', () => {
    const now = p.querySelector('.about-now')!;
    expect(now.querySelector('h2')?.text).toBe('Now');
    expect(now.querySelectorAll('.now dt').map((d) => d.text)).toEqual(['Building', 'Writing', 'Reading', 'Exploring']);
  });
});

describe('404', () => {
  const p = page('/404.html');
  it('has a friendly message and links home and to writing', () => {
    expect(p.querySelector('h1')?.text).toBe('This page took a different path.');
    expect(p.querySelectorAll('.page-head a').map((a) => a.getAttribute('href'))).toEqual([`${BASE}/`, `${BASE}/writing/`]);
  });
});
