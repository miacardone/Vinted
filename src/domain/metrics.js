/**
 * Derived analytics.
 *
 * Everything the dashboard and the reports pages draw is computed from the
 * same book the case table shows — no parallel "analytics" fixture that can
 * quietly disagree with the queue. If the table says 93 open cases, the KPI
 * says 93 too, because it is the same array.
 */

import brand, { REASON_CATEGORIES } from '@/brand/brand.config';
import { ACTIVE_STATUSES, isClosed } from '@/domain/statuses';
import { DUE_BUCKETS, bucketForDueDate } from '@/data/reports.seed';

const DAY = 86_400_000;

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** ISO-ish week label, good enough for axis ticks. */
const weekLabel = (ms) => {
  const d = new Date(ms);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / DAY + jan1.getDay() + 1) / 7);
  return `W${week}`;
};

/* ------------------------------------------------------------------ *
 * Headline KPIs
 * ------------------------------------------------------------------ */

export function caseKpis(cases) {
  const open = cases.filter((c) => !isClosed(c.status));
  const active = cases.filter((c) => ACTIVE_STATUSES.includes(c.status));
  const overdue = open.filter((c) => new Date(c.dueAt) < new Date());
  const dueSoon = open.filter((c) => {
    const hours = (new Date(c.dueAt) - Date.now()) / 3_600_000;
    return hours >= 0 && hours <= 48;
  });

  const closed = cases.filter((c) => isClosed(c.status));
  const won = closed.filter((c) => c.status === 'completed');
  const openValue = open.reduce((sum, c) => sum + c.amount, 0);
  const recovered = won.reduce((sum, c) => sum + c.amount, 0);

  const handled = cases.filter((c) => c.handlingMinutes > 0);
  const avgHandling = handled.length
    ? handled.reduce((sum, c) => sum + c.handlingMinutes, 0) / handled.length
    : 0;

  return {
    openCases: open.length,
    activeCases: active.length,
    overdueCases: overdue.length,
    dueSoonCases: dueSoon.length,
    unassignedCases: open.filter((c) => !c.assigneeId).length,
    openValue: Math.round(openValue * 100) / 100,
    recoveredValue: Math.round(recovered * 100) / 100,
    winRate: closed.length ? (won.length / closed.length) * 100 : 0,
    avgHandlingMinutes: Math.round(avgHandling),
    chargebackCount: cases.filter((c) => c.caseType === 'chargeback').length,
    claimCount: cases.filter((c) => c.caseType === 'claim').length,
  };
}

/* ------------------------------------------------------------------ *
 * Time series
 * ------------------------------------------------------------------ */

/**
 * Weekly intake split by case type — the stacked bars on the dashboard.
 * Stacking by intake path rather than by status is the more useful cut here:
 * it shows the hybrid mix moving week to week.
 */
export function weeklyCaseActivity(cases, weeks = 8) {
  const now = Date.now();
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY;
    return {
      period: weekLabel(end),
      start: end - 7 * DAY,
      end,
      chargeback: 0,
      claim: 0,
    };
  });

  cases.forEach((c) => {
    const at = new Date(c.presentedAt).getTime();
    const bucket = buckets.find((b) => at > b.start && at <= b.end);
    if (bucket) bucket[c.caseType] += 1;
  });

  return buckets.map(({ period, chargeback, claim }) => ({
    period,
    chargeback,
    claim,
    total: chargeback + claim,
  }));
}

/** Daily intake for the area chart. */
export function dailyIntake(cases, days = 30) {
  const today = startOfDay(Date.now());
  const buckets = Array.from({ length: days }, (_, i) => ({
    at: today - (days - 1 - i) * DAY,
    label: new Intl.DateTimeFormat(brand.locale, { day: '2-digit', month: 'short' }).format(
      today - (days - 1 - i) * DAY,
    ),
    count: 0,
    value: 0,
  }));

  cases.forEach((c) => {
    const day = startOfDay(new Date(c.presentedAt).getTime());
    const bucket = buckets.find((b) => b.at === day);
    if (bucket) {
      bucket.count += 1;
      bucket.value += c.amount;
    }
  });

  return buckets;
}

/* ------------------------------------------------------------------ *
 * Distributions
 * ------------------------------------------------------------------ */

/**
 * Reason-code split for one scheme — the Visa and Mastercard donuts.
 * Only chargebacks have scheme reason codes, so claims are excluded by
 * construction rather than filtered out at the call site.
 */
export function reasonCodeDistribution(cases, schemeId, topN = 6) {
  const relevant = cases.filter((c) => c.caseType === 'chargeback' && c.schemeId === schemeId);

  const counts = new Map();
  relevant.forEach((c) => {
    const key = c.reasonCode;
    if (!counts.has(key)) {
      counts.set(key, { code: c.reasonCode, label: c.reasonLabel, category: c.reasonCategory, count: 0, value: 0 });
    }
    const entry = counts.get(key);
    entry.count += 1;
    entry.value += c.amount;
  });

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
  const head = sorted.slice(0, topN);
  const tail = sorted.slice(topN);

  if (tail.length) {
    head.push({
      code: 'other',
      label: `${tail.length} other codes`,
      category: 'other',
      count: tail.reduce((s, e) => s + e.count, 0),
      value: tail.reduce((s, e) => s + e.value, 0),
    });
  }

  return { segments: head, total: relevant.length };
}

export function totalsByReasonCategory(cases) {
  return REASON_CATEGORIES.map((category) => {
    const matching = cases.filter((c) => c.reasonCategory === category.id);
    return {
      id: category.id,
      label: category.label,
      count: matching.length,
      value: Math.round(matching.reduce((sum, c) => sum + c.amount, 0) * 100) / 100,
    };
  }).filter((row) => row.count > 0);
}

export function totalsByDueBucket(cases) {
  const open = cases.filter((c) => !isClosed(c.status));
  return DUE_BUCKETS.map((bucket) => {
    const matching = open.filter((c) => bucketForDueDate(c.dueAt) === bucket.id);
    return {
      id: bucket.id,
      label: bucket.label,
      count: matching.length,
      value: Math.round(matching.reduce((sum, c) => sum + c.amount, 0) * 100) / 100,
    };
  });
}

export function totalsByQueue(cases) {
  const open = cases.filter((c) => !isClosed(c.status));
  return brand.queues.map((queue) => {
    const matching = open.filter((c) => c.queueId === queue.id);
    const overdue = matching.filter((c) => new Date(c.dueAt) < new Date()).length;
    return {
      id: queue.id,
      label: queue.label,
      sla: queue.sla,
      depth: matching.length,
      overdue,
      value: Math.round(matching.reduce((sum, c) => sum + c.amount, 0) * 100) / 100,
    };
  });
}

export function totalsByStatus(cases) {
  const counts = new Map();
  cases.forEach((c) => counts.set(c.status, (counts.get(c.status) ?? 0) + 1));
  return counts;
}

/* ------------------------------------------------------------------ *
 * Analyst handling
 * ------------------------------------------------------------------ */

/**
 * Average handling time per analyst, plus the workload context that makes an
 * AHT number interpretable — a fast analyst with two cases is not the same as
 * a fast analyst with twenty.
 */
export function analystHandling(cases, analysts) {
  return analysts
    .map((analyst) => {
      const owned = cases.filter((c) => c.assigneeId === analyst.id);
      const handled = owned.filter((c) => c.handlingMinutes > 0);
      const closed = owned.filter((c) => isClosed(c.status));
      const won = closed.filter((c) => c.status === 'completed').length;
      const openOwned = owned.filter((c) => !isClosed(c.status));
      const overdue = openOwned.filter((c) => new Date(c.dueAt) < new Date()).length;

      const avg = handled.length
        ? handled.reduce((sum, c) => sum + c.handlingMinutes, 0) / handled.length
        : 0;

      return {
        id: analyst.id,
        name: analyst.name,
        initials: analyst.initials,
        capacity: analyst.capacity,
        assigned: owned.length,
        open: openOwned.length,
        overdue,
        closed: closed.length,
        avgHandlingMinutes: Math.round(avg),
        totalTouches: owned.reduce((sum, c) => sum + c.touches, 0),
        winRate: closed.length ? (won / closed.length) * 100 : null,
        utilisation: analyst.capacity ? (openOwned.length / analyst.capacity) * 100 : 0,
      };
    })
    .filter((row) => row.assigned > 0)
    .sort((a, b) => b.assigned - a.assigned);
}
