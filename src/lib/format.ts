// Frontmatter dates are calendar days parsed as UTC midnight, so always format in UTC.
const long = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export const formatDate = (d: Date): string => long.format(d);
export const formatDayMonth = (d: Date): string => dayMonth.format(d);

/** Split a title into two lines of similar length at a word boundary (for the masked title reveal). */
export function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [title.trim(), ''];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) [best, bestDiff] = [i, diff];
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
