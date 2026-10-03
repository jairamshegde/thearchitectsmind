import type { Root } from 'hast';
import { visit } from 'unist-util-visit';
import { withBase } from '../lib/url';

/** Root-relative links/images written in markdown ("/writing/foo/") get the site base path. */
export function rehypeBaseLinks({ base }: { base: string }) {
  const root = base.endsWith('/') ? base.slice(0, -1) : base;
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      for (const attr of ['href', 'src'] as const) {
        const value = node.properties[attr];
        if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) continue;
        if (root && (value === root || value.startsWith(`${root}/`))) continue;
        node.properties[attr] = withBase(value, base);
      }
    });
  };
}
