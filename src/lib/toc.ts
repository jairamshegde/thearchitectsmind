export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export const TOC_MIN_HEADINGS = 3;

export const tocItems = (headings: Heading[]): Heading[] => headings.filter((h) => h.depth === 2 || h.depth === 3);

export const shouldShowToc = (headings: Heading[]): boolean => tocItems(headings).length >= TOC_MIN_HEADINGS;

/** Rail dash length in px: proportional to the heading text, clamped; H3s are 75% as long. */
export function dashWidth(text: string, depth: number): number {
  const width = Math.min(96, Math.max(20, Math.round(12 + text.length * 1.6)));
  return depth === 3 ? Math.round(width * 0.75) : width;
}
