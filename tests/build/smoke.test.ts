import { expect, it } from 'vitest';
import { page } from './helpers';

it('builds the home page', () => {
  expect(page('/').querySelector('h1')?.text).toContain("The Architect's Mind");
});
