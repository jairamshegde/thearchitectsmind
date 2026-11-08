import type { Element, ElementContent, Root, RootContent } from 'hast';

const PICO = /^Pico:\s*["“]([\s\S]+)["”]\s*$/;
const isElement = (n: RootContent | undefined): n is Element => n?.type === 'element';
const isBlank = (n: RootContent) => n.type === 'text' && n.value.trim() === '';

function text(node: ElementContent | RootContent): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(text).join('');
  return '';
}

/** The paragraph's content without the leading `Pico: "` and the trailing quote. */
function lineContent(p: Element): ElementContent[] {
  const kids = structuredClone(p.children);
  const first = kids[0];
  const last = kids[kids.length - 1];
  if (first?.type === 'text') first.value = first.value.replace(/^Pico:\s*["“]/, '');
  if (last?.type === 'text') last.value = last.value.replace(/["”]\s*$/, '');
  return kids.filter((k) => !(k.type === 'text' && k.value === ''));
}

const el = (tagName: string, className: string | undefined, children: ElementContent[], extra: Element['properties'] = {}): Element => ({
  type: 'element', tagName, properties: { ...(className ? { className: [className] } : {}), ...extra }, children,
});

/**
 * A top-level paragraph `Pico: "..."` becomes Pico's margin note, paired with the element before it:
 * <div class="pico-row"><p>…</p><aside class="pico">…</aside></div>
 */
export function rehypePico() {
  return (tree: Root) => {
    const out: RootContent[] = [];
    for (const node of tree.children) {
      if (!(isElement(node) && node.tagName === 'p' && PICO.test(text(node).trim()))) {
        out.push(node);
        continue;
      }
      const aside = el('aside', 'pico', [
        el('span', 'pico-av', [el('i', undefined, [])], { ariaHidden: 'true' }),
        el('span', 'pico-text', [el('span', 'pico-name', [{ type: 'text', value: 'Pico' }]), ...lineContent(node)]),
      ]);
      while (out.length && isBlank(out[out.length - 1])) out.pop();
      const prev = out[out.length - 1];
      if (isElement(prev) && String(prev.properties.className ?? '').includes('pico-row')) {
        prev.children.push(aside);
      } else if (isElement(prev)) {
        out[out.length - 1] = el('div', 'pico-row', [prev, aside]);
      } else {
        out.push(el('div', 'pico-row', [aside]));
      }
    }
    tree.children = out;
  };
}
