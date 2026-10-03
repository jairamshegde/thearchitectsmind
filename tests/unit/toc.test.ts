import { describe, expect, it } from 'vitest';
import { TOC_MIN_HEADINGS, dashWidth, shouldShowToc, tocItems } from '../../src/lib/toc';

const h = (depth: number, text = 'Heading') => ({ depth, slug: text.toLowerCase(), text });

describe('tocItems / shouldShowToc', () => {
  it('keeps only H2 and H3', () => {
    expect(tocItems([h(1), h(2), h(3), h(4)]).map((x) => x.depth)).toEqual([2, 3]);
  });
  it(`needs at least ${TOC_MIN_HEADINGS} H2/H3 headings`, () => {
    expect(shouldShowToc([h(2), h(3)])).toBe(false);
    expect(shouldShowToc([h(2), h(4), h(4), h(4)])).toBe(false);
    expect(shouldShowToc([h(2), h(2), h(3)])).toBe(true);
  });
});

describe('dashWidth', () => {
  it('grows with heading length, clamped to 20–96px', () => {
    expect(dashWidth('Go', 2)).toBe(20);
    expect(dashWidth('A medium length heading', 2)).toBeGreaterThan(dashWidth('Short one', 2));
    expect(dashWidth('x'.repeat(200), 2)).toBe(96);
  });
  it('makes H3 dashes shorter than H2 dashes for the same text', () => {
    expect(dashWidth('Same text here', 3)).toBeLessThan(dashWidth('Same text here', 2));
  });
});
