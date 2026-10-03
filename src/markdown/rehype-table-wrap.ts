import type { Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

/** Tables scroll sideways on narrow screens instead of breaking the layout. */
export function rehypeTableWrap() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      parent.children[index] = { type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [node] };
      return SKIP;
    });
  };
}
