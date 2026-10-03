import { describe, expect, it } from 'vitest';
import { formatDate, formatDayMonth, splitHighlight } from '../../src/lib/format';
import { renderMarkdown } from '../../src/lib/markdown-text';

// `npm test` runs with TZ=America/Los_Angeles. A date parsed from "2026-09-20" is UTC midnight,
// which is still Sep 19 in LA, so these tests fail if formatting is not done in UTC.
describe('date formatting', () => {
  it('shows the calendar day written in the frontmatter, in any timezone', () => {
    expect(formatDate(new Date('2026-09-20'))).toBe('Sep 20, 2026');
    expect(formatDayMonth(new Date('2026-01-01'))).toBe('Jan 1');
  });
});

describe('splitHighlight', () => {
  it('splits around the first occurrence of the phrase', () => {
    expect(splitHighlight('I think in systems', 'think')).toEqual(['I ', 'think', ' in systems']);
  });
  it('returns null when the phrase is missing or empty', () => {
    expect(splitHighlight('I think', 'nope')).toBeNull();
    expect(splitHighlight('I think', undefined)).toBeNull();
    expect(splitHighlight('I think', '')).toBeNull();
  });
});

describe('renderMarkdown', () => {
  it('renders short markdown to HTML', () => {
    const html = renderMarkdown('Cut p99 by **40%** using `asyncio`.\n\n- one\n- two');
    expect(html).toContain('<strong>40%</strong>');
    expect(html).toContain('<code>asyncio</code>');
    expect(html).toContain('<li>two</li>');
  });
  it('returns an empty string for missing or blank input', () => {
    expect(renderMarkdown(undefined)).toBe('');
    expect(renderMarkdown('   ')).toBe('');
  });
});
