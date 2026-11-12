import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('/about/', () => {
  const p = page('/about/');
  const side = p.querySelector('aside.about-side')!;

  it('puts the name, the tagline, the GitHub link and a hidden Pico in the side column', () => {
    expect(side.querySelector('h1')?.text).toBe('Jairam Hegde.');
    expect(side.querySelectorAll('.about-tagline > span > span').map((s) => s.text)).toEqual(['Senior AI Engineer', 'Enterprise Solutions', '"Why" gives me direction']);
    const pico = side.querySelector('.about-pico')!;
    expect(pico.querySelector('button[aria-controls="pico"]')?.getAttribute('aria-expanded')).toBe('false');
    expect(pico.querySelector('img')?.getAttribute('src')).toMatch(/^\/_astro\/pico-welcome\./);
    expect(pico.querySelector('figcaption .visually-hidden')?.text).toBe('I’m Pico. I ask what the real problem is. Every time.');
    expect(side.querySelector('a.ul-on[href="https://github.com/jairamshegde"]')?.text.trim()).toBe('GitHub');
    expect(p.querySelectorAll('main img')).toHaveLength(1);
  });

  it('shows the summary in sentence case', () => {
    expect(side.querySelectorAll('dl.about-summary dt').map((d) => d.text)).toEqual(['In data and AI for', 'Working on now']);
  });

  it('names the sections by their headings, in order', () => {
    expect(p.querySelectorAll('.about-main h2').map((h) => h.text.replace(/#$/, ''))).toEqual([
      'About me',
      'What I build with',
      'What I write about',
      'Outside work',
      'Get in touch',
    ]);
    expect(p.querySelector('.about-body blockquote')?.text.trim()).toBe('“If I were building this for the first time, what would it need?”');
  });

  it('draws the stack graph with one filter button per area, the "Used together" toggle off, and a text list', () => {
    const stack = p.querySelector('#stack [data-stack]')!;
    expect(stack.querySelectorAll('.stack-legend button').map((b) => b.text)).toEqual(['Web apps', 'Agents', 'Retrieval', 'Models', 'Evals and tracing', 'Classical ML']);
    expect(stack.querySelector('.stack-box [data-cross]')?.getAttribute('aria-pressed')).toBe('false');
    expect(stack.querySelector('canvas')?.getAttribute('role')).toBe('img');
    expect(stack.querySelectorAll('ul.visually-hidden li')).toHaveLength(6);
  });

  it('hides the salt count behind its link', () => {
    expect(p.querySelector('[data-salt-link]')?.text).toBe('how many salt crystals I eat per meal');
    expect(p.querySelector('[data-salt-num]')?.text).toBe('3.1,459');
    expect(p.querySelector('[data-salt-end]')?.text).toBe("It's almost the digits of pi, so I like to say I eat pi salt.");
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
    expect(section.querySelector('.about-fine')?.text).toBe('The views here are my own.');
  });
});

describe('404', () => {
  const p = page('/404.html');
  it('has a friendly message and links home and to writing', () => {
    expect(p.querySelector('h1')?.text.replace(/\s+/g, ' ').trim()).toBe('404. This page took a different path.');
    expect(p.querySelectorAll('main a').map((a) => a.getAttribute('href'))).toEqual([`${BASE}/`, `${BASE}/writing/`]);
  });
});
