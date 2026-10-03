import { expect, it } from 'vitest';
import { built, raw } from './helpers';

it('publishes the CMS shell and a parseable config', () => {
  expect(built('/admin/')).toBe(true);
  expect(raw('/admin/index.html')).toContain('@sveltia/cms');
  const config = JSON.parse(raw('/admin/config.yml'));
  expect(config.backend.repo).toMatch(/\/thearchitectsmind$/);
  expect(config.collections.map((c: { name: string }) => c.name)).toEqual(['writing', 'notes', 'projects', 'site']);
});
