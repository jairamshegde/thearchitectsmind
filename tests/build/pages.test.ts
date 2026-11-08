import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/about/', () => {
  const p = page('/about/');
  const side = p.querySelector('aside.about-side')!;

  it('puts Pico, the name, the lead and the GitHub link in the side column', () => {
    expect(side.querySelector('h1')?.text).toBe('Jairam Hegde');
    expect(side.querySelector('.about-lead')?.text).toBe('I’m happiest when a problem doesn’t have an obvious answer yet. Lately those problems are AI agents, and whether they really work.');
    expect(side.querySelector('.about-lead span')?.text).toBe('Lately those problems are AI agents, and whether they really work.');
    const pico = side.querySelector('figure.about-pico')!;
    expect(pico.querySelector('img')?.getAttribute('src')).toMatch(/^\/_astro\/pico-welcome\./);
    expect(pico.querySelector('figcaption')?.text).toBe('I’m Pico. I ask what the real problem is. Every time.');
    expect(side.querySelector('a.ul-on[href="https://github.com/jairamshegde"]')?.text.trim()).toBe('GitHub');
    expect(p.querySelectorAll('main img')).toHaveLength(1);
  });

  it('shows the summary in sentence case', () => {
    expect(side.querySelectorAll('dl.about-summary dt').map((d) => d.text)).toEqual(['Approach', 'Working on now', 'Usual stack', 'Reviewed by']);
  });

  it('names the sections by their headings only, in order', () => {
    expect(p.querySelectorAll('.about-main section .sec-top h2').map((h) => h.text)).toEqual([
      'What I’m working on now',
      'How I take a problem apart',
      'What I won’t sign off on',
      'Known quirks',
      'Right now',
      'Get in touch',
    ]);
    expect(p.querySelector('main')?.toString()).not.toMatch(/[→↗←]|>0\d</);
  });

  it('shows the steps, the body under "working on now", and the Now list', () => {
    expect(p.querySelectorAll('ol.about-steps li b').map((h) => h.text)).toEqual([
      'Find the real problem.', 'Break it into small pieces.', 'Build the simplest thing that works.', 'Prove it works.',
    ]);
    expect(p.querySelector('#working-on .about-copy p')?.text).toMatch(/^AI agents, and the checks around them\./);
    expect(p.querySelectorAll('dl.about-now dt').map((d) => d.text)).toEqual(['Building', 'Writing', 'Reading', 'Exploring']);
  });

  it('offers email, LinkedIn and GitHub as icon links under "Get in touch"', () => {
    const section = p.querySelector('.about-main section#get-in-touch')!;
    expect(section.querySelector('h2')?.text).toBe('Get in touch');
    expect(p.querySelector('aside.about-side a.pill')?.getAttribute('href')).toBe('#get-in-touch');
    const links = section.querySelectorAll('ul.socials a');
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual(['Email', 'LinkedIn', 'GitHub']);
    expect(links[0].getAttribute('href')).toMatch(/^mailto:/);
    expect(links[1].getAttribute('href')).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(links[2].getAttribute('href')).toBe('https://github.com/jairamshegde');
    for (const a of links) expect(a.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('links Mingraph in the quirks to its writing series, under the base path', () => {
    expect(p.querySelector('.about-quirks a')?.getAttribute('href')).toBe(`${BASE}/writing/mingraph/`);
  });
});

describe('404', () => {
  const p = page('/404.html');
  it('has a friendly message and links home and to writing', () => {
    expect(p.querySelector('h1')?.text.replace(/\s+/g, ' ').trim()).toBe('404. This page took a different path.');
    expect(p.querySelectorAll('main a').map((a) => a.getAttribute('href'))).toEqual([`${BASE}/`, `${BASE}/writing/`]);
  });
});
