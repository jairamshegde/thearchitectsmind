import { defineConfig } from 'astro/config';
import { SITE } from './src/site.config';

export default defineConfig({
  site: SITE.url,
  base: SITE.base,
});
