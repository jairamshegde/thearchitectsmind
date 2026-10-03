import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import type { Root } from 'hast';
import { remarkReadingTime } from '../../src/markdown/remark-reading-time';
import { rehypeCodeFrame } from '../../src/markdown/rehype-code-frame';
import { rehypeMermaid } from '../../src/markdown/rehype-mermaid';
import { rehypeFigure } from '../../src/markdown/rehype-figure';
import { rehypeTableWrap } from '../../src/markdown/rehype-table-wrap';
import { rehypeBaseLinks } from '../../src/markdown/rehype-base-links';

function html(md: string, ...plugins: Array<() => (tree: Root) => void>): string {
  let p = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);
  for (const plugin of plugins) p = p.use(plugin);
  return String(p.use(rehypeStringify).processSync(md));
}

describe('remarkReadingTime', () => {
  it('stores whole minutes (at least 1) on astro frontmatter', () => {
    const file = { data: {} as Record<string, any> };
    const tree = unified().use(remarkParse).parse('word '.repeat(600));
    remarkReadingTime()(tree, file);
    expect(file.data.astro.frontmatter.minutesRead).toBe(3);

    const short = { data: {} as Record<string, any> };
    remarkReadingTime()(unified().use(remarkParse).parse('hi'), short);
    expect(short.data.astro.frontmatter.minutesRead).toBe(1);
  });
});

describe('rehypeMermaid', () => {
  it('turns a mermaid code block into a panel holding the escaped source', () => {
    const out = html('```mermaid\ngraph LR; A-->B<C\n```', rehypeMermaid);
    expect(out).toContain('<figure class="mermaid-panel" data-mermaid="">');
    expect(out).toContain('<pre class="mermaid-src">graph LR; A-->B&#x3C;C\n</pre>');
    expect(out).not.toContain('language-mermaid');
  });

  it('leaves other code blocks alone', () => {
    expect(html('```python\nx = 1\n```', rehypeMermaid)).toContain('language-python');
  });
});

describe('rehypeFigure', () => {
  it('wraps a titled standalone image in a figure with a caption', () => {
    const out = html('![Alt](./a.png "The caption")', rehypeFigure);
    expect(out).toBe('<figure class="md-figure"><img src="./a.png" alt="Alt" title="The caption"><figcaption>The caption</figcaption></figure>');
  });

  it('leaves untitled or inline images alone', () => {
    expect(html('![Alt](./a.png)', rehypeFigure)).toBe('<p><img src="./a.png" alt="Alt"></p>');
    expect(html('Text ![Alt](./a.png "t") more', rehypeFigure)).toContain('<p>Text');
  });
});

describe('rehypeTableWrap', () => {
  it('wraps tables in a horizontally scrollable container', () => {
    const out = html('| a | b |\n|---|---|\n| 1 | 2 |', rehypeTableWrap);
    expect(out).toMatch(/^<div class="table-wrap"><table>/);
    expect(out).toMatch(/<\/table><\/div>$/);
  });
});

describe('rehypeCodeFrame', () => {
  // Shape copied from real Astro 7 + Shiki output (properties use `class`, not `className`).
  const shikiPre = (meta: string, lang = 'python'): Root => ({
    type: 'root',
    children: [{
      type: 'element', tagName: 'pre',
      properties: { class: 'astro-code architect-ide', tabindex: '0', dataLanguage: lang, 'data-meta': meta },
      children: [{ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: 'x = 1' }] }],
    }],
  });
  const run = (tree: Root) => { rehypeCodeFrame()(tree); return String(unified().use(rehypeStringify).stringify(tree)); };

  it('wraps Shiki output in a frame titled from title="…"', () => {
    const out = run(shikiPre('title="retry.py" {6-8}'));
    expect(out).toMatch(/^<figure class="code-frame" data-lang="python"><figcaption class="code-head">/);
    expect(out).toContain('<span class="code-title">retry.py</span>');
    expect(out).toContain('<button class="code-copy" type="button" data-copy hidden>Copy</button>');
    expect(out).toContain('<pre class="astro-code architect-ide"');
  });

  it('falls back to the language as the title', () => {
    expect(run(shikiPre('', 'bash'))).toContain('<span class="code-title">bash</span>');
  });

  it('ignores <pre> elements that are not Shiki output', () => {
    const tree: Root = { type: 'root', children: [{ type: 'element', tagName: 'pre', properties: {}, children: [] }] };
    expect(run(tree)).toBe('<pre></pre>');
  });
});

describe('rehypeBaseLinks', () => {
  const run = (md: string, base: string) =>
    String(unified().use(remarkParse).use(remarkRehype).use(rehypeBaseLinks, { base }).use(rehypeStringify).processSync(md));

  it('prefixes root-relative links and images written in markdown', () => {
    const out = run('[post](/writing/foo/) ![pic](/uploads/a.png)', '/thearchitectsmind');
    expect(out).toContain('href="/thearchitectsmind/writing/foo/"');
    expect(out).toContain('src="/thearchitectsmind/uploads/a.png"');
  });

  it('leaves external, protocol-relative, fragment, relative and already-based URLs alone', () => {
    const out = run('[a](https://x.com) [b](//cdn.x.com/y) [c](#top) ![d](./d.png) [e](/thearchitectsmind/notes/)', '/thearchitectsmind');
    expect(out).toContain('href="https://x.com"');
    expect(out).toContain('href="//cdn.x.com/y"');
    expect(out).toContain('href="#top"');
    expect(out).toContain('src="./d.png"');
    expect(out).toContain('href="/thearchitectsmind/notes/"');
  });

  it('is a no-op when the site lives at the domain root', () => {
    expect(run('[post](/writing/foo/)', '/')).toContain('href="/writing/foo/"');
  });
});
