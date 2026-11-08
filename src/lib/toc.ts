export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export const TOC_MIN_HEADINGS = 3;

export const tocItems = (headings: Heading[]): Heading[] => headings.filter((h) => h.depth === 2);

export const shouldShowToc = (headings: Heading[]): boolean => tocItems(headings).length >= TOC_MIN_HEADINGS;
