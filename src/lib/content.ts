export interface Entry {
  data: { date: Date; draft?: boolean; featured?: boolean };
}

export const isVisible = (e: Entry, includeDrafts: boolean): boolean => includeDrafts || !e.data.draft;

export const byDateDesc = (a: Entry, b: Entry): number => b.data.date.getTime() - a.data.date.getTime();

/** Featured entries first (newest first), then the newest of the rest, capped at n. */
export function pickHome<T extends Entry>(items: T[], n: number): T[] {
  const sorted = [...items].sort(byDateDesc);
  return [...sorted.filter((i) => i.data.featured), ...sorted.filter((i) => !i.data.featured)].slice(0, n);
}

export function groupByYear<T extends Entry>(items: T[]): { year: number; items: T[] }[] {
  const groups = new Map<number, T[]>();
  for (const item of [...items].sort(byDateDesc)) {
    const year = item.data.date.getUTCFullYear();
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return [...groups].map(([year, list]) => ({ year, items: list }));
}

/** Neighbours in a newest-first list: `newer` is the item before, `older` the item after. */
export function neighbours<T>(sorted: T[], index: number): { newer?: T; older?: T } {
  return { newer: sorted[index - 1], older: sorted[index + 1] };
}

interface Post {
  id: string;
  data: { series?: string; part?: number };
}

/** A post's path under /writing/: "<series>/<slug>" when it belongs to a series, else "<slug>". */
export const postSlug = (p: Post): string => (p.data.series ? `${p.data.series}/${p.id}` : p.id);
export const postPath = (p: Post): string => `/writing/${postSlug(p)}/`;

/** The posts of one series in part order. Throws on a missing or repeated part number. */
export function seriesParts<T extends Post>(posts: T[], series: string): T[] {
  const parts = posts.filter((p) => p.data.series === series).sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0));
  parts.forEach((p, i) => {
    if (p.data.part === undefined) throw new Error(`Post "${p.id}" is in series "${series}" but has no part number`);
    if (i > 0 && parts[i - 1].data.part === p.data.part) throw new Error(`Series "${series}" has two posts as part ${p.data.part}`);
  });
  return parts;
}

export const isCaseStudy = (d: { problem?: string; outcome?: string }): boolean => Boolean(d.problem || d.outcome);

/** The n most-used tags, most used first; ties sort alphabetically. */
export function topTags(items: { data: { tags: string[] } }[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const tag of items.flatMap((i) => i.data.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).slice(0, n).map(([tag]) => tag);
}
