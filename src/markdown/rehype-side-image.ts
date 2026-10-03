import type { Element, ElementContent, Root, RootContent } from 'hast';

type Side = 'left' | 'right';

const isWhitespace = (n: RootContent | ElementContent) => n.type === 'text' && !n.value.trim();
const isHeading = (n: RootContent) => n.type === 'element' && /^h[1-6]$/.test(n.tagName);
const el = (tagName: string, className: string, children: ElementContent[], extra: Element['properties'] = {}): Element => ({
  type: 'element', tagName, properties: { className: className.split(' '), ...extra }, children,
});
const svgPath = (d: string, className?: string): Element => ({
  type: 'element', tagName: 'path', properties: { ...(className ? { className: [className] } : {}), pathLength: 1, d }, children: [],
});

/** A paragraph holding only an image titled "left" / "right", optionally "left: a handwritten note". */
function sideImage(node: RootContent): { img: Element; side: Side; note?: string } | null {
  if (node.type !== 'element' || node.tagName !== 'p') return null;
  const kids = node.children.filter((c) => !isWhitespace(c));
  const img = kids[0];
  if (kids.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return null;
  const match = /^(left|right)(?::\s*([\s\S]+))?$/.exec(String(img.properties.title ?? ''));
  return match ? { img, side: match[1] as Side, note: match[2]?.trim() } : null;
}

/** Handwritten note with a curvy arrow; the arrow tip is the note's bottom-right corner (see prose.css). */
const noteFor = (text: string): Element =>
  el('span', 'md-note', [
    el('span', 'md-note-text', [{ type: 'text', value: text }]),
    {
      type: 'element',
      tagName: 'svg',
      properties: { className: ['md-note-arrow'], viewBox: '0 0 120 80', ariaHidden: 'true' },
      children: [svgPath('M4 14 C 58 -6, 120 8, 120 76'), svgPath('M111 65 L120 80 L128 66', 'md-note-arrow-head')],
    },
  ]);

/**
 * `![alt](./pic.png "left")` (or "right") puts the image beside the content that follows it,
 * up to the next heading. `"left: Some note"` also adds a handwritten note with an arrow pointing
 * at the image. Any other image title is left alone (it becomes a caption).
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
          match.note
            ? el('div', 'md-split-media', [noteFor(match.note), match.img], { dataRevealNote: '' })
            : el('div', 'md-split-media', [match.img]),
          el('div', 'md-split-text', text as ElementContent[]),
        ]),
        ...trailing,
      );
      i = j - 1;
    }
    tree.children = out;
  };
}
