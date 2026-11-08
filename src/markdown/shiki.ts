// Muted Shiki theme: near-greys with the accent reserved for keywords.
export const architectTheme = {
  name: 'architect-ink',
  type: 'dark' as const,
  colors: { 'editor.background': '#17171A', 'editor.foreground': '#E9E9E4' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'], settings: { foreground: '#8A8A84', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.logical', 'keyword.operator.new', 'constant.language', 'variable.language'], settings: { foreground: '#FF8A63' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call.generic', 'variable.function', 'entity.name.function.decorator', 'meta.decorator'], settings: { foreground: '#F4F4F1' } },
    { scope: ['string', 'constant.numeric', 'constant.character', 'constant.other'], settings: { foreground: '#C9C2A8' } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class'], settings: { foreground: '#D9D4C7' } },
    { scope: ['variable.parameter', 'variable.parameter.function.language.python'], settings: { foreground: '#BDBDB6' } },
    { scope: ['entity.name.tag', 'support.type.property-name', 'meta.object-literal.key'], settings: { foreground: '#D9D4C7' } },
    { scope: ['punctuation', 'keyword.operator'], settings: { foreground: '#9C9C96' } },
  ],
};

/** Copies the raw fence meta (e.g. `title="app.py" {2}`) onto <pre data-meta> for rehypeCodeFrame. */
export function transformerMetaAttr() {
  return {
    name: 'architect:meta-attr',
    pre(this: { options: { meta?: { __raw?: string } } }, node: { properties: Record<string, unknown> }) {
      node.properties['data-meta'] = this.options.meta?.__raw ?? '';
    },
  };
}
