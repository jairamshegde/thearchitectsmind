// Custom Shiki theme mapped to the design system's --ide-* and --syn-* tokens.
export const architectTheme = {
  name: 'architect-ide',
  type: 'dark' as const,
  colors: { 'editor.background': '#0E1420', 'editor.foreground': '#D7DEE8' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'], settings: { foreground: '#6B7A92', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.logical', 'keyword.operator.new', 'constant.language', 'variable.language'], settings: { foreground: '#C084FC' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call.generic', 'variable.function', 'entity.name.function.decorator', 'meta.decorator'], settings: { foreground: '#60A5FA' } },
    { scope: ['string', 'constant.numeric', 'constant.character', 'constant.other'], settings: { foreground: '#FB923C' } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class'], settings: { foreground: '#4ADE80' } },
    { scope: ['variable.parameter', 'variable.parameter.function.language.python'], settings: { foreground: '#FBBF24' } },
    { scope: ['entity.name.tag', 'support.type.property-name', 'meta.object-literal.key'], settings: { foreground: '#60A5FA' } },
    { scope: ['punctuation', 'keyword.operator'], settings: { foreground: '#AAB6C6' } },
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
