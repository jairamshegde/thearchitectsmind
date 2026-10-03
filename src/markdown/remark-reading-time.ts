import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';
import type { Root } from 'mdast';

type FileLike = { data: Record<string, unknown> };

/** Adds `minutesRead` to the entry's remarkPluginFrontmatter. */
export function remarkReadingTime() {
  return (tree: Root, file: FileLike) => {
    const minutes = Math.max(1, Math.round(getReadingTime(toString(tree)).minutes));
    const astro = (file.data.astro ??= {}) as { frontmatter?: Record<string, unknown> };
    astro.frontmatter ??= {};
    astro.frontmatter.minutesRead = minutes;
  };
}
