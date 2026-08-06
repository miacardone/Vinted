/**
 * The hybrid model.
 * =================
 * Two intake paths land in one operational queue, keyed on `caseType`:
 *
 *   chargeback — a card network dispute. Carries ARN, masked PAN, acquirer
 *                case number, BIN, MID, MCC, scheme, reason code, cycle and
 *                cardholder.
 *   claim      — a Buyer Protection claim raised inside the marketplace. No
 *                card leg at all: item, category, buyer, seller, order and a
 *                claim reason.
 *
 * The payoff is that chargebacks ALSO carry the marketplace context. An
 * analyst defending a Visa 13.3 ("not as described") needs to see the actual
 * listing, its photos and the seller's history — not just an ARN. Modelling
 * the card leg as an *addition* to the order rather than a parallel universe
 * is what makes that possible.
 *
 * The cost of one shared queue is a table that would otherwise be half N/A.
 * `columnsFor()` solves that by adapting the column set to the active filter
 * instead of rendering every field for every row.
 */

export const CASE_TYPES = [
  {
    id: 'chargeback',
    label: 'Chargeback',
    short: 'CB',
    tone: 'info',
    description: 'Card network dispute with a scheme deadline.',
  },
  {
    id: 'claim',
    label: 'Claim',
    short: 'BP',
    tone: 'primary',
    description: 'Buyer Protection claim raised in the marketplace.',
  },
];

export const CASE_TYPE_IDS = CASE_TYPES.map((t) => t.id);

const TYPE_MAP = Object.fromEntries(CASE_TYPES.map((t) => [t.id, t]));

export const getCaseType = (id) => TYPE_MAP[id] ?? TYPE_MAP.chargeback;

export const isChargeback = (c) => c?.caseType === 'chargeback';
export const isClaim = (c) => c?.caseType === 'claim';

/* ------------------------------------------------------------------ *
 * Adaptive table columns
 * ------------------------------------------------------------------ *
 * `appliesTo` is the whole trick. With a case-type filter active we show that
 * path's real columns; on the mixed view we fall back to the columns that mean
 * something for both, plus a single "context" column that renders whichever
 * identifier the row actually has.
 */

export const CASE_COLUMNS = [
  { id: 'caseId', label: 'Case ID', appliesTo: 'both', width: '110px', mono: true, sortable: true },
  { id: 'caseType', label: 'Type', appliesTo: 'both', width: '76px' },
  { id: 'context', label: 'Reference', appliesTo: 'mixed', width: 'minmax(180px, 1fr)' },

  // Chargeback-only
  { id: 'arn', label: 'ARN', appliesTo: 'chargeback', width: '188px', mono: true },
  { id: 'scheme', label: 'Scheme', appliesTo: 'chargeback', width: '104px' },
  { id: 'reasonCode', label: 'Reason', appliesTo: 'chargeback', width: 'minmax(180px, 1fr)', sortable: true },
  { id: 'cycle', label: 'Cycle', appliesTo: 'chargeback', width: '96px' },
  { id: 'cardholder', label: 'Cardholder', appliesTo: 'chargeback', width: 'minmax(140px, 1fr)' },

  // Claim-only
  { id: 'item', label: 'Item', appliesTo: 'claim', width: 'minmax(200px, 1.4fr)' },
  { id: 'claimReason', label: 'Claim reason', appliesTo: 'claim', width: 'minmax(150px, 1fr)', sortable: true },
  { id: 'buyer', label: 'Buyer', appliesTo: 'claim', width: 'minmax(130px, 1fr)' },
  { id: 'seller', label: 'Seller', appliesTo: 'claim', width: 'minmax(130px, 1fr)' },
  { id: 'orderId', label: 'Order', appliesTo: 'claim', width: '124px', mono: true },

  // Shared operational tail
  { id: 'amount', label: 'Amount', appliesTo: 'both', width: '104px', align: 'right', mono: true, sortable: true },
  { id: 'status', label: 'Status', appliesTo: 'both', width: '116px', sortable: true },
  { id: 'queue', label: 'Queue', appliesTo: 'both', width: 'minmax(140px, 1fr)' },
  { id: 'assignee', label: 'Assignee', appliesTo: 'both', width: 'minmax(130px, 1fr)' },
  { id: 'dueAt', label: 'Due', appliesTo: 'both', width: '112px', sortable: true },
];

/**
 * @param {'chargeback'|'claim'|'all'} caseType
 * @returns {Array} the columns worth rendering for this view
 */
export function columnsFor(caseType = 'all') {
  if (caseType === 'chargeback' || caseType === 'claim') {
    return CASE_COLUMNS.filter((c) => c.appliesTo === 'both' || c.appliesTo === caseType);
  }
  return CASE_COLUMNS.filter((c) => c.appliesTo === 'both' || c.appliesTo === 'mixed');
}

/** Grid template for the dense table — column widths come from the defs. */
export const gridTemplateFor = (columns, { selectable = true } = {}) =>
  [selectable ? '36px' : null, ...columns.map((c) => c.width ?? '1fr')].filter(Boolean).join(' ');

/* ------------------------------------------------------------------ *
 * Field groups for the Work case detail panel
 * ------------------------------------------------------------------ */

/**
 * Detail sections shown on Work case. The marketplace block is rendered for
 * BOTH case types — that is the hybrid payoff made visible: a chargeback shows
 * its listing right under its ARN.
 */
export function detailSectionsFor(caseRecord) {
  if (!caseRecord) return [];

  const financial = {
    id: 'financial',
    title: 'Financial',
    fields: [
      { label: 'Disputed amount', value: caseRecord.amount, format: 'money' },
      { label: 'Order total', value: caseRecord.order?.total, format: 'money' },
      { label: 'Currency', value: caseRecord.currency },
      { label: 'Entity', value: caseRecord.entityLabel },
    ],
  };

  const marketplace = {
    id: 'marketplace',
    title: 'Marketplace context',
    // Always present. On a chargeback this is the hybrid payoff.
    fields: [
      { label: 'Item', value: caseRecord.item?.title },
      { label: 'Category', value: caseRecord.item?.category },
      { label: 'Listed price', value: caseRecord.item?.price, format: 'money' },
      { label: 'Order ID', value: caseRecord.order?.id, mono: true },
      { label: 'Ordered', value: caseRecord.order?.placedAt, format: 'date' },
      { label: 'Buyer', value: caseRecord.buyer?.name },
      { label: 'Seller', value: caseRecord.seller?.name },
      { label: 'Seller rating', value: caseRecord.seller?.rating, format: 'rating' },
    ],
  };

  if (caseRecord.caseType === 'chargeback') {
    return [
      {
        id: 'card',
        title: 'Card dispute',
        fields: [
          { label: 'ARN', value: caseRecord.card?.arn, mono: true },
          { label: 'Card number', value: caseRecord.card?.pan, mono: true },
          { label: 'Scheme', value: caseRecord.schemeLabel },
          { label: 'Reason code', value: `${caseRecord.reasonCode} — ${caseRecord.reasonLabel}` },
          { label: 'Cycle', value: caseRecord.cycleLabel },
          { label: 'Cardholder', value: caseRecord.card?.cardholder },
          { label: 'Acquirer case #', value: caseRecord.card?.acquirerCaseId, mono: true },
          { label: 'Acquirer', value: caseRecord.card?.acquirer },
          { label: 'BIN', value: caseRecord.card?.bin, mono: true },
          { label: 'MID', value: caseRecord.card?.mid, mono: true },
          { label: 'MCC', value: `${caseRecord.card?.mcc} — ${caseRecord.card?.mccLabel}` },
          { label: 'Presented', value: caseRecord.presentedAt, format: 'date' },
        ],
      },
      financial,
      marketplace,
    ];
  }

  return [
    {
      id: 'claim',
      title: 'Buyer Protection claim',
      fields: [
        { label: 'Claim reason', value: caseRecord.reasonLabel },
        { label: 'Raised by', value: caseRecord.buyer?.name },
        { label: 'Raised', value: caseRecord.presentedAt, format: 'date' },
        { label: 'Escrow held', value: caseRecord.claim?.escrowHeld ? 'Yes' : 'Released' },
        { label: 'Return tracking', value: caseRecord.claim?.returnTracking, mono: true },
      ],
    },
    financial,
    marketplace,
  ];
}
