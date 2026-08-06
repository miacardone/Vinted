/**
 * API documentation content.
 *
 * These are the same endpoints services/*.js call through request(), so the
 * documentation page describes the real contract rather than a parallel
 * fiction. If you add an endpoint to a service, add it here too.
 */

export const API_BASE = 'https://api.example.com/v1';

export const API_GROUPS = [
  { id: 'cases', label: 'Cases' },
  { id: 'rules', label: 'Rules' },
  { id: 'admin', label: 'Case admin' },
  { id: 'reports', label: 'Reports' },
  { id: 'users', label: 'Users' },
  { id: 'system', label: 'System' },
];

export const API_ENDPOINTS = [
  {
    id: 'list_cases',
    groupId: 'cases',
    method: 'GET',
    path: '/cases',
    summary: 'List cases across both intake paths.',
    description:
      'Returns the unified book. Chargebacks and Buyer Protection claims share one collection and are distinguished by `caseType`; card-specific fields are null on claims.',
    query: [
      { name: 'caseType', type: 'string', required: false, description: 'chargeback | claim' },
      { name: 'status', type: 'string[]', required: false, description: 'Filter by one or more lifecycle statuses.' },
      { name: 'queueId', type: 'string', required: false, description: 'Restrict to one queue.' },
      { name: 'assigneeId', type: 'string', required: false, description: 'Owner user id, or `unassigned`.' },
      { name: 'search', type: 'string', required: false, description: 'Matches case ID, ARN, order ID, item title, buyer or seller.' },
      { name: 'page', type: 'integer', required: false, description: 'Defaults to 1.' },
      { name: 'pageSize', type: 'integer', required: false, description: 'Defaults to 25, max 200.' },
    ],
    response: {
      data: [
        {
          id: 'VIN-70008',
          caseType: 'chargeback',
          status: 'working',
          amount: 621.9,
          currency: 'EUR',
          schemeId: 'visa',
          reasonCode: '13.1',
          reasonLabel: 'Merchandise/Services Not Received',
          cycleId: 'first_cb',
          queueId: 'not_received',
          assigneeId: 'u_02',
          dueAt: '2026-08-21T09:00:00.000Z',
          card: { arn: '74537286104920117364520', pan: '4539 12•• •••• 8841', bin: '453912', mid: '5411900021' },
          order: { id: 'ORD-38340681', total: 621.9 },
          seller: { id: 'seller_044', handle: 'archive_amsterdam' },
        },
      ],
      meta: { page: 1, pageSize: 25, total: 120 },
    },
  },
  {
    id: 'get_case',
    groupId: 'cases',
    method: 'GET',
    path: '/cases/{caseId}',
    summary: 'Retrieve one case with documents, history and notes.',
    description:
      'The full record, including the marketplace context carried by chargebacks — item, order and seller — which is what makes defending a 13.3 possible without a second system.',
    params: [{ name: 'caseId', type: 'string', required: true, description: 'e.g. VIN-70008' }],
    response: {
      id: 'VIN-70008',
      caseType: 'chargeback',
      status: 'working',
      item: { title: 'Mulberry Bayswater, oak', category: 'Women — Bags', price: 615 },
      documents: [{ id: 'VIN-70008-DOC-1', label: 'Proof of delivery', kind: 'pdf', processing: 'processed' }],
      history: [{ id: 'VIN-70008-EV-1', action: 'Case received from acquirer feed', at: '2026-07-26T11:04:00.000Z' }],
      notes: [],
    },
  },
  {
    id: 'update_case',
    groupId: 'cases',
    method: 'PATCH',
    path: '/cases/{caseId}',
    summary: 'Update status, queue, assignee or flags.',
    description: 'Partial update. Every change is appended to the case history with the acting user.',
    params: [{ name: 'caseId', type: 'string', required: true }],
    body: [
      { name: 'status', type: 'string', required: false, description: 'Target lifecycle status.' },
      { name: 'queueId', type: 'string', required: false },
      { name: 'assigneeId', type: 'string', required: false },
      { name: 'assignmentReasonId', type: 'string', required: false, description: 'Required whenever assigneeId changes.' },
      { name: 'note', type: 'string', required: false },
    ],
    response: { id: 'VIN-70008', status: 'pended', updatedAt: '2026-08-06T10:22:00.000Z' },
  },
  {
    id: 'bulk_update',
    groupId: 'cases',
    method: 'POST',
    path: '/cases/bulk',
    summary: 'Apply one change set to many cases.',
    description: 'Backs both the bulk-edit modal and the bulk-action wizard. Returns per-case results so partial failures are visible.',
    body: [
      { name: 'caseIds', type: 'string[]', required: true },
      { name: 'changes', type: 'object', required: true, description: 'Same shape as the PATCH body.' },
    ],
    response: { applied: 14, failed: 0, results: [{ id: 'VIN-70012', ok: true }] },
  },
  {
    id: 'record_decision',
    groupId: 'cases',
    method: 'POST',
    path: '/cases/{caseId}/decision',
    summary: 'Record a resolution against a case.',
    params: [{ name: 'caseId', type: 'string', required: true }],
    body: [
      { name: 'resolution', type: 'string', required: true, description: 'represent | write_off | split | refund | request_info' },
      { name: 'amount', type: 'number', required: false, description: 'Required when resolution is `split`.' },
      { name: 'note', type: 'string', required: false },
    ],
    response: { id: 'VIN-70008', status: 'represented', resolution: { id: 'represent' } },
  },
  {
    id: 'consolidation',
    groupId: 'cases',
    method: 'GET',
    path: '/cases/{caseId}/consolidation',
    summary: 'Linked cases that should be worked together.',
    description:
      'Returns every consolidation group the case belongs to, with total exposure. `duplicateRefundRisk` marks the dangerous one: the same order disputed as both a chargeback and a claim.',
    params: [{ name: 'caseId', type: 'string', required: true }],
    response: {
      groups: [
        {
          id: 'same_order:ORD-38340681',
          ruleId: 'same_order',
          label: 'Order ORD-38340681',
          size: 2,
          totalExposure: 1243.8,
          crossChannel: true,
          duplicateRefundRisk: true,
          caseIds: ['VIN-70008', 'VIN-70075'],
        },
      ],
    },
  },

  {
    id: 'list_rule_groups',
    groupId: 'rules',
    method: 'GET',
    path: '/rule-groups',
    summary: 'List rule groups with their rule counts.',
    response: { data: [{ id: 'rg_intake', name: 'Intake routing', enabled: true, ruleCount: 4 }] },
  },
  {
    id: 'toggle_rule',
    groupId: 'rules',
    method: 'PATCH',
    path: '/rules/{ruleId}',
    summary: 'Enable, disable or edit a rule.',
    params: [{ name: 'ruleId', type: 'string', required: true }],
    body: [
      { name: 'enabled', type: 'boolean', required: false },
      { name: 'criteria', type: 'object[]', required: false },
      { name: 'actions', type: 'object[]', required: false },
    ],
    response: { id: 'rule_005', enabled: false },
  },
  {
    id: 'rule_check',
    groupId: 'rules',
    method: 'POST',
    path: '/rules/{ruleId}/check',
    summary: 'Test one case against one rule.',
    description: 'Returns a verdict per criterion, so a rule that did not fire can be explained rather than guessed at.',
    params: [{ name: 'ruleId', type: 'string', required: true }],
    body: [{ name: 'caseId', type: 'string', required: true }],
    response: {
      verdict: 'partial',
      passedCount: 5,
      total: 6,
      results: [{ fieldLabel: 'Reason category', expected: 'fraud', actual: 'fraud', passed: true }],
    },
  },
  {
    id: 'preview_bulk',
    groupId: 'rules',
    method: 'POST',
    path: '/bulk-actions/preview',
    summary: 'Count the cases a criteria set would match.',
    description: 'Used for the live match count in the bulk-action wizard before anything is applied.',
    body: [
      { name: 'criteria', type: 'object[]', required: true },
      { name: 'matchType', type: 'string', required: false, description: 'all | any' },
    ],
    response: { matched: 14, sample: ['VIN-70012', 'VIN-70044'] },
  },

  {
    id: 'list_queues',
    groupId: 'admin',
    method: 'GET',
    path: '/queues',
    summary: 'Queues with live depth and SLA.',
    response: { data: [{ id: 'not_received', label: 'Item not received', sla: 48, depth: 23 }] },
  },
  {
    id: 'assignment_reasons',
    groupId: 'admin',
    method: 'GET',
    path: '/assignment-reasons',
    summary: 'Reasons selectable when assigning a case.',
    response: { data: [{ id: 'workload', label: 'Workload balancing' }] },
  },
  {
    id: 'upload_cases',
    groupId: 'admin',
    method: 'POST',
    path: '/cases/import',
    summary: 'Import cases from CSV.',
    description: 'Multipart upload. Rows failing validation are rejected individually and reported back rather than failing the batch.',
    body: [{ name: 'file', type: 'file', required: true, description: 'CSV matching the documented column set.' }],
    response: { uploadId: 'up_015', rows: 48, accepted: 47, rejected: 1 },
  },

  {
    id: 'reports_summary',
    groupId: 'reports',
    method: 'GET',
    path: '/reports/summary',
    summary: 'Totals by reason category and due-date bucket.',
    response: { byCategory: [{ category: 'consumer', count: 61, value: 18422.5 }], byDueBucket: [{ bucket: 'overdue', count: 13 }] },
  },
  {
    id: 'run_report',
    groupId: 'reports',
    method: 'POST',
    path: '/reports/{reportId}/run',
    summary: 'Run a saved report now.',
    params: [{ name: 'reportId', type: 'string', required: true }],
    response: { rows: 120, format: 'csv', url: 'https://api.example.com/v1/downloads/rep_01.csv' },
  },
  {
    id: 'monitoring',
    groupId: 'reports',
    method: 'GET',
    path: '/monitoring',
    summary: 'Document processing, outcomes and error series.',
    response: { documentProcessing: [{ period: 'W34', processed: 587, pending: 29, failed: 12 }] },
  },

  {
    id: 'list_users',
    groupId: 'users',
    method: 'GET',
    path: '/users',
    summary: 'Users with roles, groups and skills.',
    response: { data: [{ id: 'u_02', name: 'Lukas Kazlauskas', roleId: 'senior_analyst' }] },
  },
  {
    id: 'permissions',
    groupId: 'users',
    method: 'GET',
    path: '/permissions',
    summary: 'The permission matrix by role.',
    response: { data: [{ id: 'cases.work', roles: { analyst: true, read_only: false } }] },
  },

  {
    id: 'system_preferences',
    groupId: 'system',
    method: 'GET',
    path: '/system/preferences',
    summary: 'Numbering, currency, due-date offsets and thresholds.',
    response: {
      numbering: { prefix: 'VIN', digits: 5 },
      dueDateOffsets: { schemeDays: { visa: 30, mastercard: 45 }, internalBufferDays: 4 },
      thresholds: { riskAmount: 250, minimumProcessingAmount: 5 },
    },
  },
  {
    id: 'webhooks',
    groupId: 'system',
    method: 'POST',
    path: '/webhooks',
    summary: 'Register a webhook endpoint.',
    body: [
      { name: 'name', type: 'string', required: true },
      { name: 'url', type: 'string', required: true },
      { name: 'topics', type: 'string[]', required: true },
    ],
    response: { id: 'wh_new', status: 'active' },
  },
];

export const endpointsForGroup = (groupId) => API_ENDPOINTS.filter((e) => e.groupId === groupId);

export const AUTH_NOTE = {
  title: 'Authentication',
  body: 'All requests take a bearer token in the Authorization header. Tokens are scoped to a tenant, so the same client credentials cannot read another tenant’s book.',
  sample: 'Authorization: Bearer <token>',
};
