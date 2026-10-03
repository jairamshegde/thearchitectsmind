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

export const isCaseStudy = (d: { problem?: string; outcome?: string }): boolean => Boolean(d.problem || d.outcome);
