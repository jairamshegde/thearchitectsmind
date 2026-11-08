import { describe, expect, it } from 'vitest';
import { TOC_MIN_HEADINGS, shouldShowToc, tocItems } from '../../src/lib/toc';

const h = (depth: number, text = 'Heading') => ({ depth, slug: text.toLowerCase(), text });

describe('tocItems / shouldShowToc', () => {
  it('keeps only H2s', () => {
    expect(tocItems([h(1), h(2), h(3), h(4), h(2)]).map((x) => x.depth)).toEqual([2, 2]);
  });
  it(`needs at least ${TOC_MIN_HEADINGS} H2 headings`, () => {
    expect(shouldShowToc([h(2), h(2), h(3)])).toBe(false);
    expect(shouldShowToc([h(2), h(2), h(2)])).toBe(true);
  });
});
