/**
 * Rule groups, their rules, and the change history drawer's contents.
 *
 * Criteria reference field ids from domain/criteria.js, so the same rule that
 * displays here can be executed by Rule check and counted by Bulk actions.
 */

const NOW = Date.now();
const DAY = 86_400_000;
const ago = (days, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000).toISOString();

export const RULE_ACTIONS = [
  { id: 'route_queue', label: 'Route to queue', valueType: 'queue' },
  { id: 'assign_user', label: 'Assign to analyst', valueType: 'user' },
  { id: 'set_status', label: 'Set status', valueType: 'status' },
  { id: 'set_priority_flag', label: 'Flag as high priority', valueType: 'none' },
  { id: 'add_note', label: 'Add a note', valueType: 'text' },
  { id: 'auto_write_off', label: 'Auto write off', valueType: 'none' },
  { id: 'notify_webhook', label: 'Send webhook', valueType: 'webhook' },
];

export const getRuleAction = (id) => RULE_ACTIONS.find((a) => a.id === id) ?? null;

export const RULE_GROUPS = [
  {
    id: 'rg_intake',
    name: 'Intake routing',
    description: 'Runs on every case at ingestion, before an analyst sees it.',
    enabled: true,
    runOrder: 1,
    scope: 'on_intake',
    ruleCount: 4,
    updatedAt: ago(2, 3),
    updatedBy: 'Hugo Ferreira',
  },
  {
    id: 'rg_risk',
    name: 'Risk and fraud',
    description: 'High-value fraud codes and repeat-card patterns.',
    enabled: true,
    runOrder: 2,
    scope: 'on_intake',
    ruleCount: 3,
    updatedAt: ago(6),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rg_economics',
    name: 'Write-off economics',
    description: 'Low-value cases where handling costs more than the recovery.',
    enabled: true,
    runOrder: 3,
    scope: 'on_intake',
    ruleCount: 2,
    updatedAt: ago(14),
    updatedBy: 'Hugo Ferreira',
  },
  {
    id: 'rg_deadline',
    name: 'Deadline escalation',
    description: 'Re-prioritises cases as the internal due date approaches.',
    enabled: true,
    runOrder: 4,
    scope: 'scheduled',
    ruleCount: 3,
    updatedAt: ago(1, 9),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rg_legacy',
    name: 'Legacy acquirer mapping',
    description: 'Retired after the Worldline migration. Kept for audit.',
    enabled: false,
    runOrder: 5,
    scope: 'on_intake',
    ruleCount: 2,
    updatedAt: ago(96),
    updatedBy: 'Hugo Ferreira',
  },
];

export const RULES = [
  /* --- Intake routing --------------------------------------------------- */
  {
    id: 'rule_001',
    groupId: 'rg_intake',
    name: 'Non-receipt to the not-received queue',
    description: 'Visa 13.1 and Mastercard 4855 both mean the buyer says nothing arrived.',
    enabled: true,
    matchType: 'any',
    criteria: [
      { id: 'c1', fieldId: 'reasonCode', operator: 'in', value: ['13.1', '4855', 'never_arrived'] },
    ],
    actions: [{ id: 'a1', actionId: 'route_queue', value: 'not_received' }],
    runCount: 412,
    lastRunAt: ago(0, 2),
    updatedAt: ago(9),
    updatedBy: 'Hugo Ferreira',
  },
  {
    id: 'rule_002',
    groupId: 'rg_intake',
    name: 'Not-as-described to condition review',
    description: 'Covers 13.3, 4853 and the marketplace equivalent.',
    enabled: true,
    matchType: 'any',
    criteria: [
      { id: 'c1', fieldId: 'reasonCode', operator: 'in', value: ['13.3', '4853', 'not_as_described'] },
    ],
    actions: [{ id: 'a1', actionId: 'route_queue', value: 'not_described' }],
    runCount: 388,
    lastRunAt: ago(0, 1),
    updatedAt: ago(9),
    updatedBy: 'Hugo Ferreira',
  },
  {
    id: 'rule_003',
    groupId: 'rg_intake',
    name: 'Counterfeit claims to authenticity',
    description: 'Authenticity needs a trained reviewer, not the general queue.',
    enabled: true,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'reasonCode', operator: 'equals', value: 'counterfeit' }],
    actions: [
      { id: 'a1', actionId: 'route_queue', value: 'counterfeit' },
      { id: 'a2', actionId: 'set_priority_flag', value: null },
    ],
    runCount: 96,
    lastRunAt: ago(1),
    updatedAt: ago(21),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rule_004',
    groupId: 'rg_intake',
    name: 'Logistics entity to tracking review',
    description: 'Vinted Go cases almost always turn on carrier evidence.',
    enabled: false,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'entityId', operator: 'equals', value: 'vinted_go' }],
    actions: [{ id: 'a1', actionId: 'route_queue', value: 'logistics' }],
    runCount: 54,
    lastRunAt: ago(30),
    updatedAt: ago(30),
    updatedBy: 'Hugo Ferreira',
  },

  /* --- Risk and fraud ---------------------------------------------------- */
  {
    id: 'rule_005',
    groupId: 'rg_risk',
    name: 'High-value fraud routing',
    description: 'Fraud category above the configured risk amount goes to a senior queue.',
    enabled: true,
    matchType: 'all',
    criteria: [
      { id: 'c1', fieldId: 'reasonCategory', operator: 'equals', value: 'fraud' },
      { id: 'c2', fieldId: 'amount', operator: 'gte', value: 250 },
    ],
    actions: [
      { id: 'a1', actionId: 'route_queue', value: 'fraud_high' },
      { id: 'a2', actionId: 'set_priority_flag', value: null },
    ],
    runCount: 143,
    lastRunAt: ago(0, 5),
    updatedAt: ago(6),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rule_006',
    groupId: 'rg_risk',
    name: 'Pre-arbitration to specialists',
    description: 'Pre-arb has a compressed clock and a different rulebook.',
    enabled: true,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'cycleId', operator: 'in', value: ['pre_arb', 'second_cb'] }],
    actions: [{ id: 'a1', actionId: 'route_queue', value: 'pre_arb' }],
    runCount: 78,
    lastRunAt: ago(0, 8),
    updatedAt: ago(11),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rule_007',
    groupId: 'rg_risk',
    name: 'Low-rated seller escalation',
    description: 'Sellers under 4.0 with an open dispute get a second look.',
    enabled: true,
    matchType: 'all',
    criteria: [
      { id: 'c1', fieldId: 'sellerRating', operator: 'lt', value: 4 },
      { id: 'c2', fieldId: 'status', operator: 'notEquals', value: 'completed' },
    ],
    actions: [{ id: 'a1', actionId: 'add_note', value: 'Seller rating below threshold — check seller history.' }],
    runCount: 61,
    lastRunAt: ago(2),
    updatedAt: ago(18),
    updatedBy: 'Hugo Ferreira',
  },

  /* --- Write-off economics ------------------------------------------------ */
  {
    id: 'rule_008',
    groupId: 'rg_economics',
    name: 'Auto write off below handling cost',
    description: 'Under the minimum processing amount, defending costs more than losing.',
    enabled: true,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'amount', operator: 'lt', value: 5 }],
    actions: [{ id: 'a1', actionId: 'auto_write_off', value: null }],
    runCount: 27,
    lastRunAt: ago(3),
    updatedAt: ago(40),
    updatedBy: 'Hugo Ferreira',
  },
  {
    id: 'rule_009',
    groupId: 'rg_economics',
    name: 'Low-value non-receipt with no tracking',
    description: 'No tracking means no defence — do not spend analyst time on it.',
    enabled: true,
    matchType: 'all',
    criteria: [
      { id: 'c1', fieldId: 'amount', operator: 'lt', value: 25 },
      { id: 'c2', fieldId: 'hasTracking', operator: 'equals', value: false },
    ],
    actions: [{ id: 'a1', actionId: 'auto_write_off', value: null }],
    runCount: 12,
    lastRunAt: ago(5),
    updatedAt: ago(40),
    updatedBy: 'Hugo Ferreira',
  },

  /* --- Deadline escalation ------------------------------------------------ */
  {
    id: 'rule_010',
    groupId: 'rg_deadline',
    name: 'Due within 48 hours',
    description: 'Flags anything approaching the internal due date.',
    enabled: true,
    matchType: 'all',
    criteria: [
      { id: 'c1', fieldId: 'dueInDays', operator: 'lte', value: 2 },
      { id: 'c2', fieldId: 'status', operator: 'notIn', value: ['completed', 'rejected', 'writtenOff', 'expired'] },
    ],
    actions: [{ id: 'a1', actionId: 'set_priority_flag', value: null }],
    runCount: 906,
    lastRunAt: ago(0, 1),
    updatedAt: ago(4),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rule_011',
    groupId: 'rg_deadline',
    name: 'Overdue notification',
    description: 'Fires a webhook so the ops channel hears about it.',
    enabled: true,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'dueInDays', operator: 'lt', value: 0 }],
    actions: [{ id: 'a1', actionId: 'notify_webhook', value: 'wh_ops' }],
    runCount: 188,
    lastRunAt: ago(0, 3),
    updatedAt: ago(4),
    updatedBy: 'Matteo Rossi',
  },
  {
    id: 'rule_012',
    groupId: 'rg_deadline',
    name: 'Unassigned after 24 hours',
    description: 'Nothing should sit in intake for a whole day.',
    enabled: true,
    matchType: 'all',
    criteria: [
      { id: 'c1', fieldId: 'queueId', operator: 'equals', value: 'unassigned' },
      { id: 'c2', fieldId: 'ageInDays', operator: 'gte', value: 1 },
    ],
    actions: [{ id: 'a1', actionId: 'route_queue', value: 'not_described' }],
    runCount: 219,
    lastRunAt: ago(0, 6),
    updatedAt: ago(4),
    updatedBy: 'Matteo Rossi',
  },

  /* --- Legacy -------------------------------------------------------------- */
  {
    id: 'rule_013',
    groupId: 'rg_legacy',
    name: 'Worldline case number remap',
    description: 'Superseded by the acquirer feed change in March.',
    enabled: false,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'schemeId', operator: 'equals', value: 'visa' }],
    actions: [{ id: 'a1', actionId: 'add_note', value: 'Legacy acquirer mapping applied.' }],
    runCount: 0,
    lastRunAt: null,
    updatedAt: ago(96),
    updatedBy: 'Hugo Ferreira',
  },
  {
    id: 'rule_014',
    groupId: 'rg_legacy',
    name: 'Old MID routing',
    description: 'Retired with the entity restructure.',
    enabled: false,
    matchType: 'all',
    criteria: [{ id: 'c1', fieldId: 'entityId', operator: 'equals', value: 'vinted_pro' }],
    actions: [{ id: 'a1', actionId: 'route_queue', value: 'not_described' }],
    runCount: 0,
    lastRunAt: null,
    updatedAt: ago(96),
    updatedBy: 'Hugo Ferreira',
  },
];

/** Change history shown in the rule history drawer. */
export const RULE_HISTORY = [
  { id: 'rh_01', ruleId: 'rule_005', at: ago(6), actor: 'Matteo Rossi', action: 'Criterion changed', detail: 'Disputed amount threshold raised from €200 to €250.' },
  { id: 'rh_02', ruleId: 'rule_005', at: ago(34), actor: 'Hugo Ferreira', action: 'Action added', detail: 'Added “Flag as high priority”.' },
  { id: 'rh_03', ruleId: 'rule_005', at: ago(61), actor: 'Hugo Ferreira', action: 'Rule created', detail: 'Created in group “Risk and fraud”.' },
  { id: 'rh_04', ruleId: 'rule_010', at: ago(4), actor: 'Matteo Rossi', action: 'Criterion changed', detail: 'Window tightened from 3 days to 2 days.' },
  { id: 'rh_05', ruleId: 'rule_010', at: ago(52), actor: 'Matteo Rossi', action: 'Rule created', detail: 'Created in group “Deadline escalation”.' },
  { id: 'rh_06', ruleId: 'rule_004', at: ago(30), actor: 'Hugo Ferreira', action: 'Rule disabled', detail: 'Paused pending the Vinted Go carrier integration.' },
  { id: 'rh_07', ruleId: 'rule_001', at: ago(9), actor: 'Hugo Ferreira', action: 'Criterion changed', detail: 'Added marketplace reason “never_arrived” so claims route alongside chargebacks.' },
  { id: 'rh_08', ruleId: 'rule_008', at: ago(40), actor: 'Hugo Ferreira', action: 'Rule created', detail: 'Created in group “Write-off economics”.' },
  { id: 'rh_09', ruleId: 'rule_002', at: ago(9), actor: 'Hugo Ferreira', action: 'Criterion changed', detail: 'Added 4853 following the Mastercard code consolidation.' },
  { id: 'rh_10', ruleId: 'rule_012', at: ago(4), actor: 'Matteo Rossi', action: 'Action changed', detail: 'Now routes to condition review rather than assigning directly.' },
];

export const rulesForGroup = (groupId) => RULES.filter((r) => r.groupId === groupId);

export const historyForRule = (ruleId) =>
  RULE_HISTORY.filter((h) => h.ruleId === ruleId).sort((a, b) => new Date(b.at) - new Date(a.at));
