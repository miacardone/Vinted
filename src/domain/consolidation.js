/**
 * CONSOLIDATION
 * =============
 * Groups cases that belong together operationally, so an analyst decides once
 * instead of N times — and, more importantly, so they never pay the same money
 * out twice.
 *
 * Three linking rules, configured in brand.config:
 *
 *   same card    min 2, 90-day window   — one PAN, several presentments
 *   same order   min 2, 120-day window  — one order disputed more than once
 *   same seller  min 3, 30-day window, open only
 *
 * WHY THE THRESHOLDS DIFFER. Two disputes on one card is already a signal
 * worth surfacing. Two disputes against one seller is just a seller with
 * volume — which is why that rule needs three, an open-only filter and a
 * tight window. Get this wrong and every case carries a consolidation flag,
 * at which point the flag has stopped telling anyone anything. Tuned to land
 * around 10-15% of the book.
 *
 * THE CROSS-CHANNEL CASE is the one that justifies the hybrid data model. The
 * same order can arrive as a card chargeback *and* as a Buyer Protection
 * claim. Two analysts, two queues, two refunds — for one order. Only a system
 * that holds both intake paths in one book can see it.
 */

import brand from '@/brand/brand.config';
import { isClosed } from '@/domain/statuses';

const DAY = 86_400_000;

/** Linking key per rule. Returning null excludes the case from that rule. */
const KEY_BUILDERS = {
  same_card: (c) => (c.card ? `${c.card.bin}:${c.card.last4}` : null),
  same_order: (c) => c.order?.id ?? null,
  same_seller: (c) => c.seller?.id ?? null,
};

/** Human label for the group header. */
const LABEL_BUILDERS = {
  same_card: (cases) => `Card •••• ${cases[0].card?.last4 ?? '____'}`,
  same_order: (cases) => `Order ${cases[0].order?.id ?? '—'}`,
  same_seller: (cases) => `Seller @${cases[0].seller?.handle ?? '—'}`,
};

/**
 * Largest run of cases whose presentedAt dates all fall inside `windowDays`.
 *
 * A plain min/max span check would reject a genuine cluster just because one
 * stale case shares the key, so this slides a window across the sorted list
 * and keeps the best run instead.
 */
function largestClusterWithin(cases, windowDays) {
  if (windowDays == null) return cases;

  const sorted = [...cases].sort(
    (a, b) => new Date(a.presentedAt) - new Date(b.presentedAt),
  );
  const windowMs = windowDays * DAY;

  let best = [];
  let start = 0;

  for (let end = 0; end < sorted.length; end += 1) {
    while (
      new Date(sorted[end].presentedAt) - new Date(sorted[start].presentedAt) >
      windowMs
    ) {
      start += 1;
    }
    const run = sorted.slice(start, end + 1);
    if (run.length > best.length) best = run;
  }

  return best;
}

/**
 * Builds every consolidation group in the book.
 *
 * @param {Array} cases
 * @param {object} config  defaults to brand.consolidation
 * @returns {Array} groups, largest exposure first
 */
export function buildConsolidationGroups(cases, config = brand.consolidation) {
  const groups = [];

  config.rules.forEach((rule) => {
    const buildKey = KEY_BUILDERS[rule.id];
    if (!buildKey) return;

    const eligible = cases.filter((c) => {
      if (rule.openOnly && isClosed(c.status)) return false;
      return buildKey(c) != null;
    });

    const buckets = new Map();
    eligible.forEach((c) => {
      const key = buildKey(c);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(c);
    });

    buckets.forEach((bucket, key) => {
      if (bucket.length < rule.minSize) return;

      const cluster = largestClusterWithin(bucket, rule.windowDays);
      if (cluster.length < rule.minSize) return;

      const caseTypes = new Set(cluster.map((c) => c.caseType));
      const totalExposure = cluster.reduce((sum, c) => sum + (c.amount ?? 0), 0);

      groups.push({
        id: `${rule.id}:${key}`,
        ruleId: rule.id,
        ruleLabel: rule.label,
        ruleDescription: rule.description,
        key,
        label: LABEL_BUILDERS[rule.id]?.(cluster) ?? key,
        size: cluster.length,
        caseIds: cluster.map((c) => c.id),
        cases: cluster,
        totalExposure: Math.round(totalExposure * 100) / 100,
        currency: cluster[0].currency,
        /** Both intake paths present in one group. */
        crossChannel: caseTypes.size > 1,
        /**
         * The double-refund risk is specific to a shared ORDER. A seller group
         * can mix a chargeback and a claim quite innocently — different orders,
         * different money. Only the same order billed through two channels can
         * actually be paid out twice.
         */
        duplicateRefundRisk: caseTypes.size > 1 && rule.id === 'same_order',
        openCount: cluster.filter((c) => !isClosed(c.status)).length,
        windowDays: rule.windowDays,
      });
    });
  });

  return groups.sort((a, b) => b.totalExposure - a.totalExposure);
}

/** caseId -> groups containing it. Built once, read everywhere. */
export function indexGroupsByCase(groups) {
  const index = new Map();
  groups.forEach((group) => {
    group.caseIds.forEach((caseId) => {
      if (!index.has(caseId)) index.set(caseId, []);
      index.get(caseId).push(group);
    });
  });
  return index;
}

/**
 * Headline numbers for the panel and the dashboard. `flaggedRate` is the one
 * to watch — if it drifts far above ~15% the thresholds need retuning, because
 * a flag on everything is a flag on nothing.
 */
export function consolidationStats(cases, groups) {
  const flagged = new Set(groups.flatMap((g) => g.caseIds));
  const crossChannel = groups.filter((g) => g.crossChannel);
  const duplicateRisk = groups.filter((g) => g.duplicateRefundRisk);

  return {
    groupCount: groups.length,
    flaggedCases: flagged.size,
    flaggedRate: cases.length ? (flagged.size / cases.length) * 100 : 0,
    crossChannelGroups: crossChannel.length,
    duplicateRiskGroups: duplicateRisk.length,
    totalExposure: Math.round(groups.reduce((sum, g) => sum + g.totalExposure, 0) * 100) / 100,
    /**
     * What would actually be paid out twice if each cross-channel order group
     * were worked separately: everything past the first case in the group.
     */
    duplicateRefundExposure:
      Math.round(
        duplicateRisk.reduce((sum, g) => sum + g.totalExposure - (g.cases[0]?.amount ?? 0), 0) * 100,
      ) / 100,
  };
}

/**
 * Panel copy. Kept next to the rules rather than in the component so the
 * explanation and the threshold can never drift apart.
 */
export function explainGroup(group) {
  if (group.duplicateRefundRisk) {
    return `This order is being disputed through two channels at once — a card chargeback and a ${brand.terms.claimProgramme} claim. Worked separately, the same order gets refunded twice.`;
  }
  switch (group.ruleId) {
    case 'same_card':
      return `${group.size} disputes were presented on the same card within ${group.windowDays} days. A shared card usually means one decision, and often one fraud pattern.`;
    case 'same_order':
      return `The same order has been disputed ${group.size} times. Check for a duplicate presentment before responding to either.`;
    case 'same_seller':
      return `${group.size} open disputes against this ${brand.terms.seller} inside ${group.windowDays} days. Treat as a seller-level pattern rather than ${group.size} unrelated cases.`;
    default:
      return group.ruleDescription;
  }
}
