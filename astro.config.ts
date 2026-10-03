import { defineConfig } from 'astro/config';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import { transformerMetaHighlight, transformerNotationDiff } from '@shikijs/transformers';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkAlert } from 'remark-github-blockquote-alert';
import { SITE } from './src/site.config';
import { architectTheme, transformerMetaAttr } from './src/markdown/shiki';
import { remarkReadingTime } from './src/markdown/remark-reading-time';
import { rehypeCodeFrame } from './src/markdown/rehype-code-frame';
import { rehypeMermaid } from './src/markdown/rehype-mermaid';
import { rehypeFigure } from './src/markdown/rehype-figure';
import { rehypeTableWrap } from './src/markdown/rehype-table-wrap';
import { rehypeBaseLinks } from './src/markdown/rehype-base-links';

export default defineConfig({
  site: SITE.url,
  base: SITE.base,
  markdown: {
    // Mermaid is left as plain code so rehypeMermaid can turn it into a panel.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      theme: architectTheme,
      transformers: [transformerMetaHighlight(), transformerNotationDiff(), transformerMetaAttr()],
    },
    // Astro 7's default processor does not run remark/rehype plugins; unified() does.
    processor: unified({
      remarkPlugins: [remarkAlert, remarkReadingTime],
      rehypePlugins: [
        [rehypeBaseLinks, { base: SITE.base }],
        rehypeMermaid,
        rehypeCodeFrame,
        rehypeFigure,
        rehypeTableWrap,
        rehypeHeadingIds, // must run before autolink so headings have ids
        [rehypeAutolinkHeadings, {
          behavior: 'append',
          properties: { className: ['anchor'], ariaHidden: 'true', tabIndex: -1 },
          content: { type: 'text', value: '#' },
        }],
      ],
    }),
  },
});
