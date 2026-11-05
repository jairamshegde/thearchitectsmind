/**
 * The only place the site's address lives.
 * The domain itself is also in public/CNAME, which GitHub Pages reads.
 */
export const SITE = {
  title: "The Architect's Mind",
  author: 'Jairam Hegde',
  owner: 'jairamshegde',
  repo: 'thearchitectsmind',
  branch: 'main',
  url: 'https://jairamhegde.in',
  base: '/',
} as const;
