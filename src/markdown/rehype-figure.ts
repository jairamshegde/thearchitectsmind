import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/** A paragraph holding only an image with a title becomes <figure> + <figcaption>. */
export function rehypeFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return;
      const kids = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
      const img = kids[0];
      if (kids.length !== 1 || img.type !== 'element' || img.tagName !== 'img' || !img.properties.title) return;
      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['md-figure'] },
        children: [img, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: String(img.properties.title) }] }],
      };
      parent.children[index] = figure;
    });
  };
}
