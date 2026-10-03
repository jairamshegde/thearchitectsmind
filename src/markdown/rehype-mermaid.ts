import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

const textOf = (nodes: ElementContent[]): string =>
  nodes.map((n) => (n.type === 'text' ? n.value : n.type === 'element' ? textOf(n.children) : '')).join('');

const isMermaidCode = (node: ElementContent | undefined): node is Element =>
  node?.type === 'element' &&
  node.tagName === 'code' &&
  ([] as unknown[]).concat(node.properties.className ?? []).includes('language-mermaid');

/** ```mermaid blocks → a panel the client script renders (source kept as the no-JS / error fallback). */
export function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      const code = node.children.find((c) => c.type === 'element');
      if (!isMermaidCode(code)) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['mermaid-panel'], dataMermaid: '' },
        children: [{ type: 'element', tagName: 'pre', properties: { className: ['mermaid-src'] }, children: [{ type: 'text', value: textOf(code.children) }] }],
      };
    });
  };
}
