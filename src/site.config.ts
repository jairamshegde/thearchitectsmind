/**
 * The only place the site's address lives.
 *
 * Moving to a custom domain later:
 *   url:  'https://yourdomain.com'
 *   base: '/'
 * then add the domain in repo Settings → Pages and set the DNS records (see spec §2).
 */
export const SITE = {
  title: "The Architect's Mind",
  author: 'Jairam',
  owner: 'jairamshegde',
  repo: 'thearchitectsmind',
  branch: 'main',
  url: 'https://jairamshegde.github.io',
  base: '/thearchitectsmind',
} as const;
