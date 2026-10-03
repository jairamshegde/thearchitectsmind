import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/url';

describe('withBase', () => {
  const base = '/thearchitectsmind';

  it('prefixes site-root paths', () => {
    expect(withBase('/writing/', base)).toBe('/thearchitectsmind/writing/');
    expect(withBase('/', base)).toBe('/thearchitectsmind/');
    expect(withBase('/#about', base)).toBe('/thearchitectsmind/#about');
  });

  it('accepts a base with a trailing slash and a path without a leading slash', () => {
    expect(withBase('notes/', '/thearchitectsmind/')).toBe('/thearchitectsmind/notes/');
  });

  it('works when the site lives at the domain root (custom domain)', () => {
    expect(withBase('/', '/')).toBe('/');
    expect(withBase('/writing/', '/')).toBe('/writing/');
  });

  it('leaves external, protocol and fragment links untouched', () => {
    expect(withBase('https://github.com', base)).toBe('https://github.com');
    expect(withBase('mailto:me@example.com', base)).toBe('mailto:me@example.com');
    expect(withBase('//cdn.example.com/x.js', base)).toBe('//cdn.example.com/x.js');
    expect(withBase('#intro', base)).toBe('#intro');
  });
});
