import { marked } from 'marked';

/** Render short, author-written markdown from frontmatter fields (problem, outcome, intro…). */
export function renderMarkdown(src: string | undefined): string {
  if (!src?.trim()) return '';
  return marked.parse(src, { async: false, gfm: true }) as string;
}
