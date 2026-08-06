/**
 * Case-administration fixtures: upload history, bulk-action history and the
 * saved system preferences that Settings edits.
 *
 * Queues and assignment reasons are NOT here — they are tenant configuration
 * and live in brand.config. Admin pages read them from there and layer runtime
 * counts on top.
 */

const NOW = Date.now();
const DAY = 86_400_000;
const ago = (days, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000).toISOString();

export const UPLOAD_HISTORY = [
  {
    id: 'up_014',
    filename: 'adyen-chargebacks-2026-08-05.csv',
    uploadedAt: ago(0, 4),
    uploadedBy: 'Matteo Rossi',
    rows: 48,
    accepted: 47,
    rejected: 1,
    status: 'completed',
    note: '1 row rejected: unknown reason code “13.9”.',
  },
  {
    id: 'up_013',
    filename: 'worldline-visa-batch-0804.csv',
    uploadedAt: ago(1, 6),
    uploadedBy: 'Hugo Ferreira',
    rows: 112,
    accepted: 112,
    rejected: 0,
    status: 'completed',
    note: null,
  },
  {
    id: 'up_012',
    filename: 'buyer-protection-claims-w31.csv',
    uploadedAt: ago(2, 2),
    uploadedBy: 'Camille Dubois',
    rows: 64,
    accepted: 61,
    rejected: 3,
    status: 'completed',
    note: '3 rows rejected: order IDs not found.',
  },
  {
    id: 'up_011',
    filename: 'checkout-mc-prearb-0801.csv',
    uploadedAt: ago(5, 8),
    uploadedBy: 'Matteo Rossi',
    rows: 19,
    accepted: 0,
    rejected: 19,
    status: 'failed',
    note: 'Column “acquirer_case_id” missing from the header row.',
  },
  {
    id: 'up_010',
    filename: 'adyen-chargebacks-2026-07-29.csv',
    uploadedAt: ago(8),
    uploadedBy: 'Hugo Ferreira',
    rows: 87,
    accepted: 87,
    rejected: 0,
    status: 'completed',
    note: null,
  },
  {
    id: 'up_009',
    filename: 'manual-adjustments-july.csv',
    uploadedAt: ago(13, 3),
    uploadedBy: 'Matteo Rossi',
    rows: 6,
    accepted: 6,
    rejected: 0,
    status: 'completed',
    note: null,
  },
];

/**
 * Columns the CSV importer expects — shown on the Upload cases page.
 *
 * Built from the brand so the worked example uses the active tenant's own
 * entity id and currency. A hard-coded 'vinted' here would be wrong for every
 * other tenant.
 */
export const buildUploadSchema = (brand) => [
  { column: 'case_type', required: true, example: 'chargeback', note: 'chargeback or claim' },
  { column: 'external_id', required: true, example: 'ADY-8834712', note: 'Acquirer case number or claim reference' },
  { column: 'amount', required: true, example: '128.40', note: 'Decimal, no currency symbol' },
  { column: 'currency', required: true, example: brand.currency },
  { column: 'reason_code', required: true, example: '13.3', note: 'Scheme code, or claim reason for claims' },
  { column: 'scheme', required: false, example: 'visa', note: 'Chargebacks only' },
  { column: 'cycle', required: false, example: 'first_cb', note: 'Chargebacks only' },
  { column: 'arn', required: false, example: '74537286...', note: 'Chargebacks only' },
  { column: 'order_id', required: true, example: 'ORD-38340681' },
  { column: 'entity', required: true, example: brand.entities[0].id },
  { column: 'presented_at', required: true, example: '2026-07-28', note: 'ISO date' },
];

export const BULK_ACTION_HISTORY = [
  {
    id: 'ba_007',
    name: 'Route overdue non-receipt to logistics',
    runAt: ago(1, 2),
    runBy: 'Matteo Rossi',
    matched: 14,
    applied: 14,
    status: 'completed',
  },
  {
    id: 'ba_006',
    name: 'Reassign Jonas Weber’s open cases',
    runAt: ago(4),
    runBy: 'Matteo Rossi',
    matched: 9,
    applied: 9,
    status: 'completed',
  },
  {
    id: 'ba_005',
    name: 'Write off disputes below the processing minimum',
    runAt: ago(11),
    runBy: 'Hugo Ferreira',
    matched: 6,
    applied: 6,
    status: 'completed',
  },
];

/**
 * Live system preferences. Seeded from brand.config so the tenant defaults
 * are the starting point, then editable at runtime.
 */
export const buildSystemPreferences = (brand) => ({
  numbering: { ...brand.numbering },
  currency: brand.currency,
  locale: brand.locale,
  timezone: brand.timezone,
  dueDateOffsets: {
    schemeDays: { ...brand.dueDateOffsets.schemeDays },
    claimDays: brand.dueDateOffsets.claimDays,
    internalBufferDays: brand.dueDateOffsets.internalBufferDays,
  },
  thresholds: { ...brand.thresholds },
  routing: {
    autoAssign: brand.thresholds.autoAssign,
    highValue: brand.thresholds.routingHighValue,
    bulkBatchSize: brand.thresholds.routingBulkBatchSize,
  },
});

export const WEBHOOK_TOPICS = [
  { id: 'case.created', label: 'Case created', description: 'A case has entered the book from any intake path.' },
  { id: 'case.assigned', label: 'Case assigned', description: 'Ownership changed.' },
  { id: 'case.status_changed', label: 'Status changed', description: 'Any lifecycle transition.' },
  { id: 'case.due_soon', label: 'Case due soon', description: 'Inside the internal due-date buffer.' },
  { id: 'case.overdue', label: 'Case overdue', description: 'Past the internal due date.' },
  { id: 'case.decision_recorded', label: 'Decision recorded', description: 'A resolution was recorded.' },
  { id: 'consolidation.detected', label: 'Consolidation detected', description: 'A new linked group formed.' },
  { id: 'upload.completed', label: 'Upload completed', description: 'A CSV import finished.' },
];

export const WEBHOOKS = [
  {
    id: 'wh_ops',
    name: 'Ops alerting',
    url: 'https://hooks.example.com/disputes/ops-alerts',
    topics: ['case.overdue', 'case.due_soon'],
    status: 'active',
    createdAt: ago(120),
    lastDeliveryAt: ago(0, 2),
    lastStatus: 200,
    failures24h: 0,
  },
  {
    id: 'wh_datalake',
    name: 'Data lake sink',
    url: 'https://ingest.example.com/disputes/events',
    topics: ['case.created', 'case.status_changed', 'case.decision_recorded'],
    status: 'active',
    createdAt: ago(210),
    lastDeliveryAt: ago(0, 1),
    lastStatus: 200,
    failures24h: 0,
  },
  {
    id: 'wh_fraud',
    name: 'Fraud platform',
    url: 'https://fraud.internal.example.com/webhooks/consolidation',
    topics: ['consolidation.detected'],
    status: 'failing',
    createdAt: ago(64),
    lastDeliveryAt: ago(0, 7),
    lastStatus: 502,
    failures24h: 11,
  },
];
