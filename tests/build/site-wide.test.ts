import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'node-html-parser';
import { BASE, DIST } from './helpers';

const htmlFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'admin' ? [] : htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });

const pages = htmlFiles(DIST).map((file) => ({ file: relative(DIST, file), html: parse(readFileSync(file, 'utf8')) }));

describe('every built page', () => {
  it('found the expected set of pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(12);
  });

  it('keeps every internal link and asset under the base path', () => {
    const bad: string[] = [];
    for (const { file, html } of pages) {
      for (const el of html.querySelectorAll('[href], [src], [srcset]')) {
        for (const attr of ['href', 'src', 'srcset']) {
          const value = el.getAttribute(attr);
          if (!value) continue;
          for (const url of value.split(',').map((s) => s.trim().split(' ')[0])) {
            if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith(`${BASE}/`) && url !== BASE) bad.push(`${file}: ${attr}="${url}"`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('never mentions a draft', () => {
    const leaks = pages.filter(({ html }) => /unpublished-idea|half-written-thought|Unpublished idea|Half-written thought/.test(html.toString()));
    expect(leaks.map((p) => p.file)).toEqual([]);
  });

  it('has exactly one h1 and a title containing the brand', () => {
    for (const { file, html } of pages) {
      expect(html.querySelectorAll('h1').length, file).toBe(1);
      expect(html.querySelector('title')?.text, file).toContain("The Architect's Mind");
    }
  });
});
