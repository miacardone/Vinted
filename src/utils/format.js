/**
 * Formatting helpers. Currency and locale come from the brand config, so a
 * tenant swap changes € to $ and 06 Aug to Aug 06 without touching a component.
 */

import brand from '@/brand/brand.config';

const HOUR = 3_600_000;
const DAY = 86_400_000;

export const formatMoney = (amount, currency = brand.currency) =>
  new Intl.NumberFormat(brand.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

export const formatCompactMoney = (amount, currency = brand.currency) =>
  new Intl.NumberFormat(brand.locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount ?? 0);

export const formatNumber = (n) => new Intl.NumberFormat(brand.locale).format(n ?? 0);

export const formatPercent = (n, digits = 1) =>
  n == null ? '—' : `${Number(n).toFixed(digits)}%`;

export const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat(brand.locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
    : '—';

export const formatShortDate = (iso) =>
  iso ? new Intl.DateTimeFormat(brand.locale, { day: '2-digit', month: 'short' }).format(new Date(iso)) : '—';

export const formatDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat(brand.locale, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '—';

export const relativeTime = (iso) => {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(brand.locale, { numeric: 'auto' });
  const units = [
    ['day', DAY],
    ['hour', HOUR],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === 'minute') return rtf.format(Math.round(diff / ms), unit);
  }
  return 'just now';
};

/** Hours until an ISO deadline. Negative means overdue. */
export const hoursUntil = (iso) => (new Date(iso).getTime() - Date.now()) / HOUR;

export const daysUntil = (iso) => Math.floor((new Date(iso).getTime() - Date.now()) / DAY);

/** Urgency band shared by the due-date pill, the bench sort and the KPI tiles. */
export const urgencyOf = (dueAt) => {
  if (!dueAt) return 'none';
  const hours = hoursUntil(dueAt);
  if (hours < 0) return 'overdue';
  if (hours <= 24) return 'critical';
  if (hours <= 72) return 'soon';
  return 'ok';
};

/** "3d", "18h", "Overdue 2d" — compact enough for a dense table cell. */
export const formatDueIn = (dueAt) => {
  if (!dueAt) return '—';
  const hours = hoursUntil(dueAt);
  const overdue = hours < 0;
  const abs = Math.abs(hours);

  const body = abs >= 24 ? `${Math.floor(abs / 24)}d` : `${Math.max(1, Math.round(abs))}h`;
  return overdue ? `Overdue ${body}` : body;
};

export const formatMinutes = (minutes) => {
  if (!minutes) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const formatBytes = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${formatNumber(count)} ${count === 1 ? singular : plural}`;

export const titleCase = (value = '') =>
  String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
