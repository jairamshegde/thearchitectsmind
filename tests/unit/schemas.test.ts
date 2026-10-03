import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { aboutSchema, noteSchema, projectSchema, settingsSchema, writingSchema } from '../../src/lib/schemas';

const image = () => z.string();

describe('writingSchema', () => {
  const valid = { title: 'T', description: 'D', date: '2026-09-20', tags: ['architecture'] };

  it('coerces dates and defaults flags', () => {
    const r = writingSchema(image).parse(valid);
    expect(r.date).toBeInstanceOf(Date);
    expect(r.draft).toBe(false);
    expect(r.featured).toBe(false);
  });

  it('rejects a post without tags', () => {
    expect(() => writingSchema(image).parse({ ...valid, tags: [] })).toThrow();
  });

  it('treats CMS-emptied optional fields as unset', () => {
    const r = writingSchema(image).parse({ ...valid, cover: '', updated: null });
    expect(r.cover).toBeUndefined();
    expect(r.updated).toBeUndefined();
  });
});

describe('noteSchema', () => {
  it('needs only title, date and tags', () => {
    const r = noteSchema.parse({ title: 'N', date: '2026-09-01', tags: ['python'], description: '' });
    expect(r.description).toBeUndefined();
  });
});

describe('projectSchema', () => {
  const valid = { title: 'P', summary: 'S', stack: ['Python'], date: '2026-06-01' };

  it('accepts a light project', () => {
    expect(projectSchema(image).parse(valid).problem).toBeUndefined();
  });

  it('treats CMS-emptied optional fields (including nested links) as unset', () => {
    const r = projectSchema(image).parse({
      ...valid, role: '', problem: null, cover: '', links: { repo: '', demo: '' },
    });
    expect(r.role).toBeUndefined();
    expect(r.problem).toBeUndefined();
    expect(r.cover).toBeUndefined();
    expect(r.links?.repo).toBeUndefined();
  });

  it('rejects a malformed link', () => {
    expect(() => projectSchema(image).parse({ ...valid, links: { repo: 'not a url' } })).toThrow();
  });

  it('requires at least one stack item', () => {
    expect(() => projectSchema(image).parse({ ...valid, stack: [] })).toThrow();
  });
});

describe('aboutSchema and settingsSchema', () => {
  it('parses the about entry', () => {
    const r = aboutSchema.parse({ title: 'Hi', intro: 'I build things.', now: [{ label: 'Reading', value: 'DDIA' }] });
    expect(r.now).toHaveLength(1);
  });

  it('parses site settings with mailto links and optional popover text', () => {
    const r = settingsSchema(image).parse({
      heroHeadline: 'H', heroSub: 'Sub', heroNote: 'N', heroImage: '', footerStatement: 'F', footerSub: 'S',
      socials: [{ label: 'Email', url: 'mailto:me@example.com', meta: '', note: '' }],
    });
    expect(r.socials[0].meta).toBeUndefined();
    expect(r.heroImage).toBeUndefined();
  });
});
