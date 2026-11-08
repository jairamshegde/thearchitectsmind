import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';
import WritingBand from '../../src/components/WritingBand.astro';

const post = (n: number) => ({ href: `/writing/p${n}/`, date: new Date(Date.UTC(2026, 9, n)), title: `Post ${n}`, minutes: n });
const note = (n: number) => ({ href: `/notes/n${n}/`, topic: 'tools', date: new Date(Date.UTC(2026, 9, n)), title: `Note ${n}` });

async function band(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return parse(await container.renderToString(WritingBand, { props }));
}

describe('WritingBand', () => {
  it('has Blog and Notes tabs with no counts, Blog selected', async () => {
    const html = await band({ posts: [post(1)], notes: [note(1)] });
    const tabs = html.querySelectorAll('[role="tablist"] button[role="tab"]');
    expect(tabs.map((t) => t.text.trim())).toEqual(['Blog', 'Notes']);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(html.querySelector('#panel-notes')?.hasAttribute('hidden')).toBe(true);
  });

  it('says so when there are no notes yet', async () => {
    const html = await band({ posts: [post(1), post(2)], notes: [] });
    expect(html.querySelector('#panel-notes')?.text).toContain('No notes yet.');
    expect(html.querySelectorAll('#panel-notes .note-card')).toHaveLength(0);
  });

  it('says so when there are no posts yet', async () => {
    const html = await band({ posts: [], notes: [note(1)] });
    expect(html.querySelector('#panel-blog')?.text).toContain('First post coming soon.');
  });

  it('shows the date, title and read time on each row and the topic, date and title on each card', async () => {
    const html = await band({ posts: [post(3)], notes: [note(4)] });
    const row = html.querySelector('#panel-blog a.row')!;
    expect(row.getAttribute('href')).toBe('/writing/p3/');
    expect(row.querySelector('.row-label')).toBeNull();
    expect(row.querySelector('time.row-date')?.getAttribute('datetime')).toBe('2026-10-03');
    expect(row.querySelector('time.row-date')?.text).toBe('Oct 3, 2026');
    expect(row.querySelector('.row-title')?.text).toBe('Post 3');
    expect(row.querySelector('.row-time')?.text).toContain('3 min');
    const card = html.querySelector('#panel-notes a.note-card')!;
    expect(card.querySelector('.card-topic')?.text).toBe('tools');
    expect(card.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-04');
    expect(card.querySelector('.card-title')?.text).toBe('Note 4');
  });
});
