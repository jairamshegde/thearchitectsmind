/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Astro's Vite config lets tests render .astro components through the container API.
export default getViteConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
