// Frontmatter dates are calendar days parsed as UTC midnight, so always format in UTC.
const long = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export const formatDate = (d: Date): string => long.format(d);
export const formatDayMonth = (d: Date): string => dayMonth.format(d);

/** Split a headline around the phrase to highlight, or null when there is nothing to highlight. */
export function splitHighlight(text: string, phrase?: string): [string, string, string] | null {
  if (!phrase) return null;
  const at = text.indexOf(phrase);
  if (at === -1) return null;
  return [text.slice(0, at), phrase, text.slice(at + phrase.length)];
}
