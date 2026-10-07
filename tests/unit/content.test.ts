import { describe, expect, it } from 'vitest';
import { byDateDesc, groupByYear, isCaseStudy, isVisible, neighbours, pickHome, topTags } from '../../src/lib/content';

const e = (date: string, extra: { draft?: boolean; featured?: boolean; id?: string } = {}) => ({
  id: extra.id ?? date,
  data: { date: new Date(date), draft: extra.draft, featured: extra.featured },
});

describe('isVisible', () => {
  it('hides drafts unless drafts are included', () => {
    expect(isVisible(e('2026-01-01', { draft: true }), false)).toBe(false);
    expect(isVisible(e('2026-01-01', { draft: true }), true)).toBe(true);
    expect(isVisible(e('2026-01-01'), false)).toBe(true);
  });
});

describe('byDateDesc', () => {
  it('sorts newest first', () => {
    const sorted = [e('2025-01-01'), e('2026-05-01'), e('2026-01-01')].sort(byDateDesc);
    expect(sorted.map((x) => x.id)).toEqual(['2026-05-01', '2026-01-01', '2025-01-01']);
  });
});

describe('pickHome', () => {
  it('puts featured first (newest first), then fills with newest non-featured', () => {
    const items = [
      e('2026-09-01', { id: 'new' }),
      e('2025-01-01', { id: 'old-featured', featured: true }),
      e('2026-08-01', { id: 'mid' }),
      e('2026-02-01', { id: 'featured', featured: true }),
    ];
    expect(pickHome(items, 3).map((x) => x.id)).toEqual(['featured', 'old-featured', 'new']);
  });

  it('returns fewer items when there are not enough, and [] for none', () => {
    expect(pickHome([e('2026-01-01')], 3)).toHaveLength(1);
    expect(pickHome([], 3)).toEqual([]);
  });
});

describe('groupByYear', () => {
  it('groups newest year first, items newest first, using the UTC year', () => {
    const groups = groupByYear([e('2025-12-31'), e('2026-01-01'), e('2026-03-01')]);
    expect(groups.map((g) => g.year)).toEqual([2026, 2025]);
    expect(groups[0].items.map((x) => x.id)).toEqual(['2026-03-01', '2026-01-01']);
  });
});

describe('neighbours', () => {
  const list = ['newest', 'middle', 'oldest'];
  it('returns the newer and older neighbours of an item in a newest-first list', () => {
    expect(neighbours(list, 1)).toEqual({ newer: 'newest', older: 'oldest' });
  });
  it('has no newer neighbour at the start and no older one at the end', () => {
    expect(neighbours(list, 0)).toEqual({ newer: undefined, older: 'middle' });
    expect(neighbours(list, 2)).toEqual({ newer: 'middle', older: undefined });
  });
});

describe('isCaseStudy', () => {
  it('is true when problem or outcome is set', () => {
    expect(isCaseStudy({ problem: 'x' })).toBe(true);
    expect(isCaseStudy({ outcome: 'y' })).toBe(true);
    expect(isCaseStudy({})).toBe(false);
  });
});

describe('topTags', () => {
  const t = (...tags: string[]) => ({ data: { tags } });
  it('ranks tags by how many entries use them, ties alphabetical, capped at n', () => {
    const items = [t('python', 'arch'), t('arch'), t('zeta', 'python'), t('arch', 'beta')];
    expect(topTags(items, 3)).toEqual(['arch', 'python', 'beta']);
  });
  it('returns fewer than n when there are fewer tags', () => {
    expect(topTags([t('a')], 10)).toEqual(['a']);
  });
});
