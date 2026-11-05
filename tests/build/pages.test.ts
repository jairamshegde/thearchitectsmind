import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/about/', () => {
  const p = page('/about/');
  it('opens with the name, a two-part lead, the GitHub link, and Pico with his note', () => {
    expect(p.querySelector('.about-head h1')?.text).toBe('Jairam Hegde');
    expect(p.querySelector('.about-lead')?.text).toBe('I’m happiest when a problem doesn’t have an obvious answer yet. Lately those problems are AI agents, and whether they really work.');
    expect(p.querySelector('.about-lead span')?.text).toBe('Lately those problems are AI agents, and whether they really work.');
    expect(p.querySelector('.about-meta a')?.getAttribute('href')).toBe('https://github.com/jairamshegde');
    const pico = p.querySelector('.about-head figure.about-pico')!;
    expect(pico.querySelector('img')?.getAttribute('src')).toMatch(/^\/_astro\/pico-welcome\./);
    expect(pico.querySelector('.about-pico-note')?.text).toBe('I’m Pico. I ask what the real problem is. Every time.');
    expect(p.querySelectorAll('main img')).toHaveLength(1);
  });

  it('shows the summary strip', () => {
    expect(p.querySelectorAll('.about-summary dt').map((d) => d.text)).toEqual(['approach', 'working on now', 'usual stack', 'reviewed by']);
  });

  it('numbers the sections in order', () => {
    expect(p.querySelectorAll('.about-label').map((h) => h.text)).toEqual([
      '01How I take a problem apart',
      '02What I’m working on now',
      '03What I won’t sign off on',
      '04Known quirks',
      '05Right now',
      '06Get in touch',
    ]);
  });

  it('shows four step cards, the body under "working on now", and the Now list', () => {
    expect(p.querySelectorAll('.about-steps li h3').map((h) => h.text)).toEqual([
      'Find the real problem.', 'Break it into small pieces.', 'Build the simplest thing that works.', 'Prove it works.',
    ]);
    expect(p.querySelector('#working-on .about-body p')?.text).toMatch(/^AI agents, and the checks around them\./);
    expect(p.querySelectorAll('.about-now dt').map((d) => d.text)).toEqual(['building', 'writing', 'reading', 'exploring']);
  });

  it('links Mingraph in the quirks to its writing series, under the base path', () => {
    expect(p.querySelector('.about-quirks a')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
  });
});

describe('404', () => {
  const p = page('/404.html');
  it('has a friendly message and links home and to writing', () => {
    expect(p.querySelector('h1')?.text).toBe('This page took a different path.');
    expect(p.querySelectorAll('.page-head a').map((a) => a.getAttribute('href'))).toEqual([`${BASE}/`, `${BASE}/writing/`]);
  });
});
