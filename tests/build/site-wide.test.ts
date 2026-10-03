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

/** Slugs of entries marked `draft: true`, read from the content itself (no hard-coded names). */
const draftSlugs = ['writing', 'notes', 'projects'].flatMap((collection) => {
  const dir = join(process.cwd(), 'src/content', collection);
  return readdirSync(dir)
    .filter((slug) => /^draft:\s*true\s*$/m.test(readFileSync(join(dir, slug, 'index.md'), 'utf8').split(/^---\s*$/m)[1] ?? ''))
    .map((slug) => ({ collection, slug }));
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

  it('never builds or links to a draft', () => {
    expect(draftSlugs.length).toBeGreaterThan(0); // the starter content includes drafts; keeps this check honest
    const leaks = draftSlugs.flatMap(({ collection, slug }) =>
      pages.filter(({ file, html }) => file.startsWith(`${collection}/${slug}/`) || html.toString().includes(`/${collection}/${slug}/`))
        .map(({ file }) => `${collection}/${slug} in ${file}`));
    expect(leaks).toEqual([]);
  });

  it('has an h1 and a title containing the brand', () => {
    for (const { file, html } of pages) {
      expect(html.querySelectorAll('h1').length, file).toBeGreaterThanOrEqual(1);
      expect(html.querySelector('title')?.text, file).toContain("The Architect's Mind");
    }
  });
});
