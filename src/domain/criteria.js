/**
 * Criteria engine.
 *
 * One evaluator, three consumers:
 *   Rule groups   — the criteria half of the add-rule wizard
 *   Bulk actions  — the live match count in the wizard, which has to run
 *                   against the real book or the number is theatre
 *   Rule check    — per-criterion pass/fail for a single case
 *
 * Because all three share this module, a rule that says it matches 14 cases
 * matches the same 14 cases everywhere.
 */

import brand, { allReasonCodes, REASON_CATEGORIES } from '@/brand/brand.config';
import { STATUSES } from '@/domain/statuses';
import { CASE_TYPES } from '@/domain/caseTypes';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';

const DAY = 86_400_000;

/* ------------------------------------------------------------------ *
 * Operators
 * ------------------------------------------------------------------ */

export const OPERATORS = {
  equals: { id: 'equals', label: 'is', types: ['enum', 'text', 'boolean'] },
  notEquals: { id: 'notEquals', label: 'is not', types: ['enum', 'text', 'boolean'] },
  in: { id: 'in', label: 'is any of', types: ['enum'], multi: true },
  notIn: { id: 'notIn', label: 'is none of', types: ['enum'], multi: true },
  contains: { id: 'contains', label: 'contains', types: ['text'] },
  gt: { id: 'gt', label: 'is greater than', types: ['number'] },
  gte: { id: 'gte', label: 'is at least', types: ['number'] },
  lt: { id: 'lt', label: 'is less than', types: ['number'] },
  lte: { id: 'lte', label: 'is at most', types: ['number'] },
  between: { id: 'between', label: 'is between', types: ['number'], pair: true },
};

export const operatorsForType = (type) =>
  Object.values(OPERATORS).filter((op) => op.types.includes(type));

export const operatorLabel = (id) => OPERATORS[id]?.label ?? id;

/* ------------------------------------------------------------------ *
 * Fields
 * ------------------------------------------------------------------ *
 * `get` reads the value off a case; `options` drives the value picker in the
 * wizard. Everything a rule can test is declared here and nowhere else.
 */

const enumOptions = (list, valueKey = 'id', labelKey = 'label') =>
  list.map((entry) => ({ value: entry[valueKey], label: entry[labelKey] }));

export const CRITERIA_FIELDS = [
  {
    id: 'caseType',
    label: 'Case type',
    type: 'enum',
    group: 'Case',
    get: (c) => c.caseType,
    options: enumOptions(CASE_TYPES),
  },
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    group: 'Case',
    get: (c) => c.status,
    options: enumOptions(STATUSES),
  },
  {
    id: 'queueId',
    label: 'Queue',
    type: 'enum',
    group: 'Case',
    get: (c) => c.queueId,
    options: enumOptions(brand.queues),
  },
  {
    id: 'entityId',
    label: 'Entity',
    type: 'enum',
    group: 'Case',
    get: (c) => c.entityId,
    options: enumOptions(brand.entities),
  },
  {
    id: 'market',
    label: 'Market',
    type: 'enum',
    group: 'Case',
    get: (c) => c.market,
    options: brand.markets.map((m) => ({ value: m, label: m })),
  },
  {
    id: 'assigneeId',
    label: 'Assignee',
    type: 'enum',
    group: 'Case',
    get: (c) => c.assigneeId,
    options: [
      { value: null, label: 'Unassigned' },
      ...ASSIGNABLE_ANALYSTS.map((a) => ({ value: a.id, label: a.name })),
    ],
  },

  {
    id: 'schemeId',
    label: 'Card scheme',
    type: 'enum',
    group: 'Card',
    appliesTo: 'chargeback',
    get: (c) => c.schemeId,
    options: enumOptions(brand.schemes),
  },
  {
    id: 'reasonCode',
    label: 'Reason code',
    type: 'enum',
    group: 'Card',
    get: (c) => c.reasonCode,
    options: [
      ...allReasonCodes().map((rc) => ({ value: rc.code, label: `${rc.code} — ${rc.label}` })),
      ...brand.claimReasons.map((r) => ({ value: r.id, label: r.label })),
    ],
  },
  {
    id: 'reasonCategory',
    label: 'Reason category',
    type: 'enum',
    group: 'Card',
    get: (c) => c.reasonCategory,
    options: enumOptions(REASON_CATEGORIES),
  },
  {
    id: 'cycleId',
    label: 'Cycle',
    type: 'enum',
    group: 'Card',
    appliesTo: 'chargeback',
    get: (c) => c.cycleId,
    options: enumOptions(brand.cycles),
  },

  {
    id: 'amount',
    label: 'Disputed amount',
    type: 'number',
    group: 'Financial',
    unit: brand.currency,
    get: (c) => c.amount,
  },
  {
    id: 'orderTotal',
    label: 'Order total',
    type: 'number',
    group: 'Financial',
    unit: brand.currency,
    get: (c) => c.order?.total,
  },

  {
    id: 'dueInDays',
    label: 'Days until due',
    type: 'number',
    group: 'Timing',
    get: (c) => Math.floor((new Date(c.dueAt).getTime() - Date.now()) / DAY),
  },
  {
    id: 'ageInDays',
    label: 'Case age in days',
    type: 'number',
    group: 'Timing',
    get: (c) => Math.floor((Date.now() - new Date(c.presentedAt).getTime()) / DAY),
  },

  {
    id: 'itemCategory',
    label: 'Item category',
    type: 'enum',
    group: 'Marketplace',
    // No static options: categories are data, not configuration, so
    // fieldOptions() derives them from the book at runtime.
    get: (c) => c.item?.category,
  },
  {
    id: 'sellerRating',
    label: 'Seller rating',
    type: 'number',
    group: 'Marketplace',
    get: (c) => c.seller?.rating,
  },
  {
    id: 'documentCount',
    label: 'Documents attached',
    type: 'number',
    group: 'Marketplace',
    get: (c) => c.documents?.length ?? 0,
  },
  {
    id: 'hasTracking',
    label: 'Has tracking',
    type: 'boolean',
    group: 'Marketplace',
    get: (c) => Boolean(c.order?.tracking),
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
  },
];

export const getField = (id) => CRITERIA_FIELDS.find((f) => f.id === id) ?? null;

export const FIELD_GROUPS = [...new Set(CRITERIA_FIELDS.map((f) => f.group))];

/**
 * Options for a field, deriving them from the book where the config cannot
 * know them ahead of time (item categories are data, not configuration).
 */
export function fieldOptions(fieldId, cases = []) {
  const field = getField(fieldId);
  if (!field) return [];
  if (field.options) return field.options;

  const values = [...new Set(cases.map((c) => field.get(c)).filter((v) => v != null))].sort();
  return values.map((v) => ({ value: v, label: String(v) }));
}

/* ------------------------------------------------------------------ *
 * Evaluation
 * ------------------------------------------------------------------ */

/** @returns {boolean} does this one case satisfy this one criterion? */
export function evaluateCriterion(caseRecord, criterion) {
  const field = getField(criterion.fieldId);
  if (!field) return false;

  const actual = field.get(caseRecord);
  const { operator, value, value2 } = criterion;

  switch (operator) {
    case 'equals':
      return String(actual) === String(value);
    case 'notEquals':
      return String(actual) !== String(value);
    case 'in':
      return (Array.isArray(value) ? value : [value]).map(String).includes(String(actual));
    case 'notIn':
      return !(Array.isArray(value) ? value : [value]).map(String).includes(String(actual));
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
    case 'gt':
      return Number(actual) > Number(value);
    case 'gte':
      return Number(actual) >= Number(value);
    case 'lt':
      return Number(actual) < Number(value);
    case 'lte':
      return Number(actual) <= Number(value);
    case 'between':
      return Number(actual) >= Number(value) && Number(actual) <= Number(value2);
    default:
      return false;
  }
}

/**
 * Per-criterion breakdown for one case. This is what Rule check renders as
 * "5 of 6 criteria matched — Partial", so it returns every criterion with its
 * own verdict rather than a single boolean.
 */
export function checkCase(caseRecord, criteria = [], matchType = 'all') {
  const results = criteria.map((criterion) => {
    const field = getField(criterion.fieldId);
    return {
      criterion,
      fieldLabel: field?.label ?? criterion.fieldId,
      operatorLabel: operatorLabel(criterion.operator),
      expected: criterion.value,
      actual: field?.get(caseRecord),
      passed: evaluateCriterion(caseRecord, criterion),
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const matched = matchType === 'any' ? passedCount > 0 : passedCount === criteria.length;

  return {
    results,
    passedCount,
    total: criteria.length,
    matched,
    /** Partial is the interesting state — it's why an expected rule didn't fire. */
    verdict: matched ? 'match' : passedCount === 0 ? 'no-match' : 'partial',
  };
}

/** Every case the criteria select. Drives the live count in Bulk actions. */
export function matchCases(cases, criteria = [], matchType = 'all') {
  if (!criteria.length) return [];
  return cases.filter((c) => checkCase(c, criteria, matchType).matched);
}

/** Human summary of a criterion, used in rule tables and review steps. */
export function describeCriterion(criterion) {
  const field = getField(criterion.fieldId);
  const label = field?.label ?? criterion.fieldId;
  const op = operatorLabel(criterion.operator);

  const renderValue = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    const option = field?.options?.find((o) => String(o.value) === String(value));
    return option?.label ?? String(value ?? '');
  };

  if (criterion.operator === 'between') {
    return `${label} ${op} ${renderValue(criterion.value)} and ${renderValue(criterion.value2)}`;
  }
  return `${label} ${op} ${renderValue(criterion.value)}`;
}
