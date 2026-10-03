import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { SITE } from '../../src/site.config';

export const DIST = join(process.cwd(), 'dist');
export const BASE = SITE.base.replace(/\/$/, '');

function fileFor(route: string): string {
  const clean = route.replace(/^\/+|\/+$/g, '');
  if (clean === '') return join(DIST, 'index.html');
  if (clean.endsWith('.html') || clean.endsWith('.yml')) return join(DIST, clean);
  return join(DIST, clean, 'index.html');
}

/** True when `astro build` produced this route (route is site-relative, without the base). */
export function built(route: string): boolean {
  return existsSync(fileFor(route));
}

/** Parsed HTML for a built route, e.g. page('/writing/designing-for-failure/'). */
export function page(route: string): HTMLElement {
  const file = fileFor(route);
  if (!existsSync(file)) throw new Error(`Route not built: ${route} (${file})`);
  return parse(readFileSync(file, 'utf8'));
}

/** Raw text of a built file, e.g. raw('/admin/config.yml'). */
export function raw(route: string): string {
  return readFileSync(fileFor(route), 'utf8');
}
