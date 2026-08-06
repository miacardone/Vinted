/**
 * Reporting fixtures: monitoring series, report templates, the field picker
 * for the custom-report builder, and the saved/scheduled report lists.
 *
 * Note there is no separate Scheduler page in this build — scheduling is a
 * step inside the report builder, so the schedule lives on the report record.
 */

const NOW = Date.now();
const DAY = 86_400_000;
const ago = (days, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000).toISOString();
const ahead = (days) => new Date(NOW + days * DAY).toISOString();

/* ------------------------------------------------------------------ *
 * Monitoring
 * ------------------------------------------------------------------ */

/** Document processing over the last 8 weeks — stacked: processed/pending/failed. */
export const DOCUMENT_PROCESSING = [
  { period: 'W27', processed: 412, pending: 38, failed: 21 },
  { period: 'W28', processed: 456, pending: 44, failed: 18 },
  { period: 'W29', processed: 501, pending: 31, failed: 26 },
  { period: 'W30', processed: 478, pending: 52, failed: 33 },
  { period: 'W31', processed: 534, pending: 41, failed: 19 },
  { period: 'W32', processed: 562, pending: 36, failed: 14 },
  { period: 'W33', processed: 519, pending: 48, failed: 22 },
  { period: 'W34', processed: 587, pending: 29, failed: 12 },
];

/** Dispute outcomes over the same window — stacked: won/lost/written off. */
export const DISPUTE_OUTCOMES = [
  { period: 'W27', won: 64, lost: 31, writtenOff: 12 },
  { period: 'W28', won: 71, lost: 28, writtenOff: 15 },
  { period: 'W29', won: 68, lost: 35, writtenOff: 11 },
  { period: 'W30', won: 79, lost: 26, writtenOff: 18 },
  { period: 'W31', won: 84, lost: 22, writtenOff: 14 },
  { period: 'W32', won: 91, lost: 24, writtenOff: 9 },
  { period: 'W33', won: 86, lost: 30, writtenOff: 13 },
  { period: 'W34', won: 97, lost: 19, writtenOff: 10 },
];

/** Error handling by API response type. */
export const ERROR_HANDLING = [
  { period: 'W27', timeout: 9, validation: 22, upstream: 6, auth: 3 },
  { period: 'W28', timeout: 7, validation: 19, upstream: 11, auth: 2 },
  { period: 'W29', timeout: 14, validation: 26, upstream: 8, auth: 4 },
  { period: 'W30', timeout: 11, validation: 31, upstream: 14, auth: 1 },
  { period: 'W31', timeout: 6, validation: 24, upstream: 9, auth: 2 },
  { period: 'W32', timeout: 4, validation: 18, upstream: 7, auth: 0 },
  { period: 'W33', timeout: 8, validation: 21, upstream: 12, auth: 3 },
  { period: 'W34', timeout: 3, validation: 16, upstream: 5, auth: 1 },
];

export const ERROR_TYPES = [
  { id: 'timeout', label: 'Gateway timeout', http: '504', remedy: 'Retried automatically with backoff.' },
  { id: 'validation', label: 'Validation rejected', http: '422', remedy: 'Row quarantined for manual correction.' },
  { id: 'upstream', label: 'Upstream unavailable', http: '502', remedy: 'Queued for redelivery.' },
  { id: 'auth', label: 'Authentication failed', http: '401', remedy: 'Credential rotation required.' },
];

export const PROCESSING_STATES = [
  { id: 'processed', label: 'Processed', tone: 'success' },
  { id: 'pending', label: 'Pending', tone: 'warning' },
  { id: 'failed', label: 'Failed', tone: 'danger' },
];

export const OUTCOME_STATES = [
  { id: 'won', label: 'Won', tone: 'success' },
  { id: 'lost', label: 'Lost', tone: 'danger' },
  { id: 'writtenOff', label: 'Written off', tone: 'muted' },
];

/* ------------------------------------------------------------------ *
 * Custom report builder
 * ------------------------------------------------------------------ */

export const REPORT_TEMPLATES = [
  {
    id: 'tpl_operational',
    name: 'Operational queue review',
    description: 'Open cases by queue and analyst with due-date pressure.',
    icon: 'inbox',
    fields: ['caseId', 'caseType', 'status', 'queueLabel', 'assigneeName', 'dueAt', 'amount'],
    groupBy: 'queueLabel',
  },
  {
    id: 'tpl_reason',
    name: 'Reason code analysis',
    description: 'Volume and value by scheme reason code and category.',
    icon: 'chart',
    fields: ['caseId', 'schemeLabel', 'reasonCode', 'reasonLabel', 'reasonCategory', 'amount', 'status'],
    groupBy: 'reasonCategory',
  },
  {
    id: 'tpl_recovery',
    name: 'Recovery and write-off',
    description: 'Closed cases with resolution and recovered value.',
    icon: 'shield',
    fields: ['caseId', 'caseType', 'status', 'resolutionLabel', 'amount', 'closedAt', 'assigneeName'],
    groupBy: 'status',
  },
  {
    id: 'tpl_marketplace',
    name: 'Marketplace exposure',
    description: 'Seller and item context across both intake paths.',
    icon: 'tag',
    fields: ['caseId', 'caseType', 'sellerName', 'itemTitle', 'itemCategory', 'amount', 'market'],
    groupBy: 'itemCategory',
  },
];

/** Every column a custom report can output, grouped for the field picker. */
export const REPORT_FIELDS = [
  { id: 'caseId', label: 'Case ID', category: 'Case', mono: true },
  { id: 'caseType', label: 'Case type', category: 'Case' },
  { id: 'status', label: 'Status', category: 'Case' },
  { id: 'queueLabel', label: 'Queue', category: 'Case' },
  { id: 'entityLabel', label: 'Entity', category: 'Case' },
  { id: 'market', label: 'Market', category: 'Case' },
  { id: 'presentedAt', label: 'Presented date', category: 'Case', format: 'date' },

  { id: 'schemeLabel', label: 'Card scheme', category: 'Card' },
  { id: 'reasonCode', label: 'Reason code', category: 'Card', mono: true },
  { id: 'reasonLabel', label: 'Reason description', category: 'Card' },
  { id: 'reasonCategory', label: 'Reason category', category: 'Card' },
  { id: 'cycleLabel', label: 'Cycle', category: 'Card' },
  { id: 'arn', label: 'ARN', category: 'Card', mono: true },
  { id: 'cardholder', label: 'Cardholder', category: 'Card' },

  { id: 'amount', label: 'Disputed amount', category: 'Financial', format: 'money' },
  { id: 'orderTotal', label: 'Order total', category: 'Financial', format: 'money' },
  { id: 'currency', label: 'Currency', category: 'Financial' },
  { id: 'resolutionLabel', label: 'Resolution', category: 'Financial' },

  { id: 'assigneeName', label: 'Assignee', category: 'Operations' },
  { id: 'dueAt', label: 'Internal due date', category: 'Operations', format: 'date' },
  { id: 'networkDueAt', label: 'Network due date', category: 'Operations', format: 'date' },
  { id: 'closedAt', label: 'Closed date', category: 'Operations', format: 'date' },
  { id: 'handlingMinutes', label: 'Handling minutes', category: 'Operations' },
  { id: 'documentCount', label: 'Document count', category: 'Operations' },

  { id: 'sellerName', label: 'Seller', category: 'Marketplace' },
  { id: 'sellerHandle', label: 'Seller handle', category: 'Marketplace' },
  { id: 'sellerRating', label: 'Seller rating', category: 'Marketplace' },
  { id: 'buyerName', label: 'Buyer', category: 'Marketplace' },
  { id: 'itemTitle', label: 'Item title', category: 'Marketplace' },
  { id: 'itemCategory', label: 'Item category', category: 'Marketplace' },
  { id: 'orderId', label: 'Order ID', category: 'Marketplace', mono: true },
];

export const REPORT_FIELD_CATEGORIES = [...new Set(REPORT_FIELDS.map((f) => f.category))];

/** Reads a report field off a case record. */
export const REPORT_ACCESSORS = {
  caseId: (c) => c.id,
  caseType: (c) => c.caseType,
  status: (c) => c.status,
  queueLabel: (c) => c.queueLabel,
  entityLabel: (c) => c.entityLabel,
  market: (c) => c.market,
  presentedAt: (c) => c.presentedAt,
  schemeLabel: (c) => c.schemeLabel ?? '—',
  reasonCode: (c) => c.reasonCode,
  reasonLabel: (c) => c.reasonLabel,
  reasonCategory: (c) => c.reasonCategory,
  cycleLabel: (c) => c.cycleLabel ?? '—',
  arn: (c) => c.card?.arn ?? '—',
  cardholder: (c) => c.card?.cardholder ?? '—',
  amount: (c) => c.amount,
  orderTotal: (c) => c.order?.total,
  currency: (c) => c.currency,
  resolutionLabel: (c) => c.resolution?.id ?? '—',
  assigneeName: (c) => c.assigneeName ?? 'Unassigned',
  dueAt: (c) => c.dueAt,
  networkDueAt: (c) => c.networkDueAt,
  closedAt: (c) => c.resolution?.recordedAt ?? null,
  handlingMinutes: (c) => c.handlingMinutes,
  documentCount: (c) => c.documents?.length ?? 0,
  sellerName: (c) => c.seller?.name,
  sellerHandle: (c) => `@${c.seller?.handle}`,
  sellerRating: (c) => c.seller?.rating,
  buyerName: (c) => c.buyer?.name,
  itemTitle: (c) => c.item?.title,
  itemCategory: (c) => c.item?.category,
  orderId: (c) => c.order?.id,
};

export const SAVED_REPORTS = [
  {
    id: 'rep_01',
    name: 'Daily queue standup',
    description: 'Open cases by queue, ordered by due date.',
    templateId: 'tpl_operational',
    fields: ['caseId', 'caseType', 'status', 'queueLabel', 'assigneeName', 'dueAt'],
    createdBy: 'Matteo Rossi',
    createdAt: ago(64),
    lastRunAt: ago(0, 3),
    schedule: { mode: 'recurring', frequency: 'daily', hour: 8, recipients: ['ops@example.com'], format: 'csv', nextRunAt: ahead(1) },
  },
  {
    id: 'rep_02',
    name: 'Weekly reason-code mix',
    description: 'Volume and value by reason category, split by scheme.',
    templateId: 'tpl_reason',
    fields: ['caseId', 'schemeLabel', 'reasonCode', 'reasonCategory', 'amount'],
    createdBy: 'Camille Dubois',
    createdAt: ago(120),
    lastRunAt: ago(2),
    schedule: { mode: 'recurring', frequency: 'weekly', weekday: 1, hour: 9, recipients: ['risk@example.com', 'ops@example.com'], format: 'xlsx', nextRunAt: ahead(4) },
  },
  {
    id: 'rep_03',
    name: 'Month-end recovery',
    description: 'Closed cases with resolution and recovered value.',
    templateId: 'tpl_recovery',
    fields: ['caseId', 'status', 'resolutionLabel', 'amount', 'closedAt'],
    createdBy: 'Matteo Rossi',
    createdAt: ago(200),
    lastRunAt: ago(6),
    schedule: { mode: 'recurring', frequency: 'monthly', dayOfMonth: 1, hour: 7, recipients: ['finance@example.com'], format: 'xlsx', nextRunAt: ahead(9) },
  },
  {
    id: 'rep_04',
    name: 'Counterfeit seller review',
    description: 'Ad-hoc pull for the authenticity team.',
    templateId: 'tpl_marketplace',
    fields: ['caseId', 'sellerName', 'sellerRating', 'itemTitle', 'amount'],
    createdBy: 'Rasa Butkutė',
    createdAt: ago(18),
    lastRunAt: ago(18),
    schedule: { mode: 'on_demand' },
  },
];

/* ------------------------------------------------------------------ *
 * Reports centre
 * ------------------------------------------------------------------ */

/** Due-date buckets used by the Reports centre rollups. */
export const DUE_BUCKETS = [
  { id: 'overdue', label: 'Overdue', max: 0 },
  { id: 'today', label: 'Due today', max: 1 },
  { id: 'd2_3', label: '2–3 days', max: 4 },
  { id: 'd4_7', label: '4–7 days', max: 8 },
  { id: 'd8_14', label: '8–14 days', max: 15 },
  { id: 'd15_plus', label: '15+ days', max: Infinity },
];

export function bucketForDueDate(dueAt) {
  const days = Math.floor((new Date(dueAt).getTime() - NOW) / DAY);
  if (days < 0) return 'overdue';
  return DUE_BUCKETS.find((b) => days < b.max)?.id ?? 'd15_plus';
}
