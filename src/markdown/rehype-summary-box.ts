import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

/** The bold first line of a blockquote, normalised, mapped to its box style and new heading. */
const BOXES: Record<string, { kind: 'tldr' | 'aidr'; heading: string }> = {
  'tl;dr (for humans)': { kind: 'tldr', heading: 'TL;DR, for humans' },
  "aidr (ai, don't read)": { kind: 'aidr', heading: 'AIDR, AI don’t read' },
  'in a hurry?': { kind: 'tldr', heading: 'In a hurry?' },
};

const isBlank = (n: ElementContent) => n.type === 'text' && n.value.trim() === '';
const textOf = (n: ElementContent): string => (n.type === 'text' ? n.value : n.type === 'element' ? n.children.map(textOf).join('') : '');

/** A blockquote that opens with **TL;DR (for humans)**, **AIDR (AI, don't read)** or **In a hurry?** becomes a summary box. */
export function rehypeSummaryBox() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'blockquote' || !parent || index === undefined || parent.type !== 'root') return;
      const kids = node.children.filter((k) => !isBlank(k));
      const first = kids[0];
      if (first?.type !== 'element' || first.tagName !== 'p') return;
      const inner = first.children.filter((k) => !isBlank(k));
      if (inner.length !== 1 || inner[0].type !== 'element' || inner[0].tagName !== 'strong') return;
      const box = BOXES[textOf(inner[0]).trim().replace(/’/g, "'").toLowerCase()];
      if (!box) return;
      const section: Element = {
        type: 'element', tagName: 'section', properties: { className: ['box', `box-${box.kind}`] },
        children: [
          { type: 'element', tagName: 'p', properties: { className: ['box-h'] }, children: [{ type: 'text', value: box.heading }] },
          ...kids.slice(1),
        ],
      };
      parent.children[index] = section;
    });
  };
}
