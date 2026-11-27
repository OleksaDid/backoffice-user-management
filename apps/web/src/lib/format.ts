const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const full = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'long' });

/** DASH-16: short, locale-aware date and time for tables. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** DASH-16: the full timestamp, for tooltips and assistive technology. */
export function formatFullDateTime(iso: string): string {
  return full.format(new Date(iso));
}

export function fullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`;
}
