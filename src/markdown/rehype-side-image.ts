import type { Element, ElementContent, Root, RootContent } from 'hast';

type Side = 'left' | 'right';

const isWhitespace = (n: RootContent | ElementContent) => n.type === 'text' && !n.value.trim();
const isHeading = (n: RootContent) => n.type === 'element' && /^h[1-6]$/.test(n.tagName);
const el = (tagName: string, className: string, children: ElementContent[]): Element => ({
  type: 'element', tagName, properties: { className: className.split(' ') }, children,
});

/** A paragraph holding only an image whose title is "left" or "right". */
function sideImage(node: RootContent): { img: Element; side: Side } | null {
  if (node.type !== 'element' || node.tagName !== 'p') return null;
  const kids = node.children.filter((c) => !isWhitespace(c));
  const img = kids[0];
  if (kids.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return null;
  const side = img.properties.title;
  return side === 'left' || side === 'right' ? { img, side } : null;
}

/**
 * `![alt](./pic.png "left")` (or "right") puts the image beside the content that follows it,
 * up to the next heading. Any other image title is left alone (it becomes a caption).
 */
export function rehypeSideImage() {
  return (tree: Root) => {
    const kids = tree.children;
    const out: RootContent[] = [];
    for (let i = 0; i < kids.length; i++) {
      const match = sideImage(kids[i]);
      if (!match) {
        out.push(kids[i]);
        continue;
      }
      delete match.img.properties.title;
      let j = i + 1;
      const text: RootContent[] = [];
      while (j < kids.length && !isHeading(kids[j]) && !sideImage(kids[j])) text.push(kids[j++]);
      while (text.length && isWhitespace(text[0])) text.shift();
      const trailing: RootContent[] = [];
      while (text.length && isWhitespace(text[text.length - 1])) trailing.unshift(text.pop()!);
      out.push(
        el('div', `md-split md-split-${match.side}`, [
          el('div', 'md-split-media', [match.img]),
          el('div', 'md-split-text', text as ElementContent[]),
        ]),
        ...trailing,
      );
      i = j - 1;
    }
    tree.children = out;
  };
}
