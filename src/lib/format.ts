// Frontmatter dates are calendar days parsed as UTC midnight, so always format in UTC.
const long = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export const formatDate = (d: Date): string => long.format(d);
export const formatDayMonth = (d: Date): string => dayMonth.format(d);
