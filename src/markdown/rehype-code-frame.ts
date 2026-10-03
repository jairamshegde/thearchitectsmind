import type { Element, Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

const el = (tagName: string, properties: Element['properties'], children: Element['children'] = []): Element => ({
  type: 'element', tagName, properties, children,
});

/** Wrap each Shiki <pre> in the IDE-style frame: dots, title (or language), copy button. */
export function rehypeCodeFrame() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      if (!String(node.properties.class ?? '').split(' ').includes('astro-code')) return;
      const meta = String(node.properties['data-meta'] ?? '');
      const lang = String(node.properties.dataLanguage ?? 'text');
      const title = /title="([^"]+)"/.exec(meta)?.[1] ?? lang;
      delete node.properties['data-meta'];
      parent.children[index] = el('figure', { className: ['code-frame'], dataLang: lang }, [
        el('figcaption', { className: ['code-head'] }, [
          el('span', { className: ['code-dots'] }, [el('i', {}), el('i', {}), el('i', {})]),
          el('span', { className: ['code-title'] }, [{ type: 'text', value: title }]),
          el('button', { className: ['code-copy'], type: 'button', dataCopy: true, hidden: true }, [{ type: 'text', value: 'Copy' }]),
        ]),
        node,
      ]);
      return SKIP;
    });
  };
}
