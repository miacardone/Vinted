/**
 * WHITE-LABEL CONTROL FILE
 * ========================
 * Everything tenant-specific lives here: palette, wordmark, logo path,
 * currency, locale, timezone, vocabulary, reason codes, entities, queues,
 * due-date offsets and feature flags.
 *
 * THE RULE: no component may hard-code a colour, a brand name, or any
 * tenant-specific value. Colours reach the DOM as CSS custom properties written
 * by BrandProvider; nouns reach the JSX through `terms`; the logo reaches the
 * DOM as a *path*, never an import.
 *
 * This rule has been broken before by a lookup table keyed on tenant data — an
 * entity-weight map naming vinted/vinted_pro/vinted_go, which silently produced
 * entity-less cases the moment a second tenant generated. So: any map, weight
 * table or constant keyed by tenant values belongs in this file and must be
 * derived positionally from the tenant's own lists, never named literally.
 * See ENTITY_WEIGHTS in data/cases.js for how that is done.
 */

/* ------------------------------------------------------------------ *
 * Scheme reason codes
 * ------------------------------------------------------------------ *
 * `category` drives the reason-category rollups on Reports centre, so every
 * code carries one of: fraud | authorisation | processing | consumer.
 */

const VISA_REASON_CODES = [
  { code: '10.4', label: 'Other Fraud — Card Absent Environment', category: 'fraud' },
  { code: '11.2', label: 'Declined Authorisation', category: 'authorisation' },
  { code: '11.3', label: 'No Authorisation', category: 'authorisation' },
  { code: '12.5', label: 'Incorrect Amount', category: 'processing' },
  { code: '12.6.2', label: 'Duplicate Processing', category: 'processing' },
  { code: '13.1', label: 'Merchandise/Services Not Received', category: 'consumer' },
  { code: '13.3', label: 'Not as Described or Defective Merchandise', category: 'consumer' },
  { code: '13.6', label: 'Credit Not Processed', category: 'consumer' },
  { code: '13.7', label: 'Cancelled Merchandise/Services', category: 'consumer' },
];

const MASTERCARD_REASON_CODES = [
  { code: '4837', label: 'No Cardholder Authorisation', category: 'fraud' },
  { code: '4840', label: 'Fraudulent Processing of Transactions', category: 'fraud' },
  { code: '4834', label: 'Point-of-Interaction Error', category: 'processing' },
  { code: '4842', label: 'Late Presentment', category: 'processing' },
  { code: '4853', label: 'Cardholder Dispute — Goods Not as Described', category: 'consumer' },
  { code: '4855', label: 'Goods or Services Not Provided', category: 'consumer' },
  { code: '4860', label: 'Credit Not Processed', category: 'consumer' },
];

const AMEX_REASON_CODES = [
  { code: 'C08', label: 'Goods/Services Not Received or Only Partially Received', category: 'consumer' },
  { code: 'C31', label: 'Goods/Services Not as Described', category: 'consumer' },
  { code: 'F29', label: 'Card Not Present', category: 'fraud' },
];

export const REASON_CATEGORIES = [
  { id: 'fraud', label: 'Fraud' },
  { id: 'authorisation', label: 'Authorisation' },
  { id: 'processing', label: 'Processing error' },
  { id: 'consumer', label: 'Consumer dispute' },
];

/* ------------------------------------------------------------------ *
 * Tenant: Vinted
 * ------------------------------------------------------------------ */

export const vintedBrand = {
  id: 'vinted',
  name: 'Vinted',
  productName: 'Dispute Console',
  legalName: 'Vinted UAB',
  shortName: 'VIN',
  tagline: 'Chargebacks and Buyer Protection claims in one operational queue.',
  supportEmail: 'disputes@vinted.example',
  emailDomain: 'vinted.example',

  /** Path only — never imported into a component. Served from /public. */
  logo: '/tenant-vinted.svg',

  wordmark: { text: 'Vinted', accent: 'Console', weight: 700 },

  /* --- Palette ---------------------------------------------------------- */
  colors: {
    primary: '#007782',
    primaryDeep: '#00565E',
    primaryTint: '#E4F1F1',
    primaryWash: '#F3F9F9',

    /* Nav rail is its own token pair: dark for this tenant, but a light-chrome
       tenant swaps these without touching a component. */
    navRail: '#04343A',
    navRailDeep: '#022A2F',
    navActive: '#00A0AD',
    navInk: '#D6E7E8',
    navInkMuted: '#7FA0A4',

    ink: '#0B2E32',
    inkMuted: '#5A7377',
    inkSubtle: '#8CA3A6',
    canvas: '#F2F5F5',
    surface: '#FFFFFF',
    surfaceSunken: '#F7FAFA',
    line: '#DCE7E7',
    lineStrong: '#BFD3D3',

    success: '#0F7B4F',
    successTint: '#E4F4EC',
    warning: '#9A5B00',
    warningTint: '#FBF0DD',
    danger: '#B3261E',
    dangerTint: '#FBE9E7',
    info: '#3F51B5',
    infoTint: '#ECEEFB',

    schemeVisa: '#1A1F71',
    schemeMastercard: '#C8102E',
    schemeAmex: '#016FD0',
  },

  /* --- Chart ramp -------------------------------------------------------- *
   * VALIDATED, NOT EYEBALLED. Passes all five palette checks against a white
   * chart surface: lightness band, chroma floor, CVD separation on every
   * adjacent pair, the normal-vision floor, and 3:1 contrast.
   *
   * Two constraints shaped it, both load-bearing:
   *  1. Brand teal #007782 and nav-active #00A0AD separate by only ΔE 12.6 to
   *     normal vision — unreadable as adjacent slices. The chart teal is a
   *     saturated sibling; the brand reads through the chrome, not the data.
   *  2. Green and amber are never adjacent — they collapse to ΔE 7.3 under
   *     protanopia. The ordering encodes that.
   * Assign in fixed order, never cycle. A 7th category folds into "Other". */
  chartSeries: ['#008C99', '#B3261E', '#3F51B5', '#9A5B00', '#A5348F', '#0F7B4F'],
  chartNeutral: '#6B7F82',

  /* --- Money, locale, markets ------------------------------------------- */
  currency: 'EUR',
  locale: 'en-GB',
  timezone: 'Europe/Vilnius',
  markets: ['FR', 'DE', 'LT', 'PL', 'ES', 'IT', 'NL', 'BE', 'CZ', 'SK'],

  /* --- Vocabulary -------------------------------------------------------- */
  terms: {
    case: 'case',
    cases: 'cases',
    chargeback: 'chargeback',
    chargebacks: 'chargebacks',
    claim: 'claim',
    claims: 'claims',
    claimProgramme: 'Buyer Protection',
    buyer: 'buyer',
    seller: 'seller',
    order: 'order',
    item: 'item',
    entity: 'entity',
    analyst: 'Dispute Specialist',
    analysts: 'Dispute Specialists',
    queue: 'queue',
    marketplace: 'marketplace',
  },

  /** Case-ID numbering, editable from System preferences. */
  numbering: { prefix: 'VIN', separator: '-', digits: 6, nextSequence: 720000 },

  /* --- Entities ----------------------------------------------------------- */
  entities: [
    { id: 'vinted', label: 'Vinted', descriptor: 'Consumer marketplace', mid: '5411900021' },
    { id: 'vinted_pro', label: 'Vinted Pro', descriptor: 'Professional sellers', mid: '5411900074' },
    { id: 'vinted_go', label: 'Vinted Go', descriptor: 'Logistics and drop-off', mid: '5411900135' },
  ],

  /* --- Card schemes -------------------------------------------------------- */
  schemes: [
    { id: 'visa', label: 'Visa', short: 'VI', colorKey: 'schemeVisa', binPrefix: '4', reasonCodes: VISA_REASON_CODES },
    { id: 'mastercard', label: 'Mastercard', short: 'MC', colorKey: 'schemeMastercard', binPrefix: '5', reasonCodes: MASTERCARD_REASON_CODES },
    { id: 'amex', label: 'Amex', short: 'AX', colorKey: 'schemeAmex', binPrefix: '3', reasonCodes: AMEX_REASON_CODES },
  ],

  cardTypes: ['Credit', 'Debit', 'Prepaid', 'Corporate'],

  cycles: [
    { id: 'first_cb', label: '1st Chargeback', short: '1st CB' },
    { id: 'second_cb', label: '2nd Chargeback', short: '2nd CB' },
    { id: 'pre_arb', label: 'Pre-Arbitration', short: 'Pre-Arb' },
    { id: 'retrieval', label: 'Retrieval', short: 'Retr' },
    { id: 'rfi', label: 'RFI', short: 'RFI' },
  ],

  /** Buyer Protection claim reasons — the non-card intake path. */
  claimReasons: [
    { id: 'not_as_described', label: 'Not as described', category: 'consumer' },
    { id: 'never_arrived', label: 'Never arrived', category: 'consumer' },
    { id: 'counterfeit', label: 'Counterfeit', category: 'fraud' },
    { id: 'damaged', label: 'Damaged', category: 'consumer' },
    { id: 'wrong_item', label: 'Wrong item', category: 'consumer' },
  ],

  paymentMethods: ['Card', 'Wallet balance', 'PayPal', 'Apple Pay', 'Google Pay', 'iDEAL', 'Bancontact'],

  mccs: [
    { code: '5691', label: "Men's and Women's Clothing Stores" },
    { code: '5651', label: 'Family Clothing Stores' },
    { code: '5948', label: 'Luggage and Leather Goods' },
    { code: '5944', label: 'Jewellery and Watches' },
    { code: '5699', label: 'Miscellaneous Apparel and Accessories' },
  ],

  acquirers: ['Adyen', 'Worldline', 'Checkout.com'],

  /* --- Queues -------------------------------------------------------------- */
  queues: [
    { id: 'all_chargebacks', label: 'All Chargebacks', description: 'Landing queue for every inbound chargeback.', sla: 24 },
    { id: 'buyer_protection', label: 'Buyer Protection', description: 'Marketplace claims with no card leg.', sla: 72 },
    { id: 'second_cycle', label: '2nd Cycle Chargeback', description: 'Second presentments and pre-arbitration.', sla: 16 },
    { id: 'high_value', label: 'High Value Disputes', description: 'Cases above the configured risk amount.', sla: 24 },
    { id: 'counterfeit', label: 'Counterfeit and IP', description: 'Authenticity escalations and brand referrals.', sla: 36 },
    { id: 'not_received', label: 'Item Not Received', description: 'Non-receipt across both intake paths.', sla: 48 },
    { id: 'logistics', label: 'Logistics Review', description: 'Tracking and drop-off evidence.', sla: 48 },
    { id: 'supervisor', label: 'Supervisor', description: 'Cases escalated to a supervisor.', sla: 12 },
    { id: 'no_docs', label: 'No Documents Available', description: 'Cases where evidence was never delivered.', sla: 48 },
  ],

  assignmentReasons: [
    { id: 'review_resolve', label: 'Review and Resolve Dispute', description: 'Standard review of an inbound dispute.' },
    { id: 'merchant_docs', label: 'Seller Docs Received', description: 'Seller evidence has arrived and needs assessment.' },
    { id: 'timeframe', label: 'Potential Timeframe Breach', description: 'Approaching or past the scheme deadline.' },
    { id: 'inbound', label: 'Inbound Correspondence', description: 'New correspondence attached to the case.' },
    { id: 'zero_doc', label: '1st CB with 0 Doc Indicator', description: 'First chargeback arrived with no documents.' },
    { id: 'high_value', label: 'High Value — Manual Review', description: 'Above the risk amount, needs a senior decision.' },
    { id: 'consolidation', label: 'Consolidation', description: 'Grouped with linked cases for one decision.' },
    { id: 'duplicate', label: 'Duplicate Item — Existing in Open', description: 'A matching case already exists.' },
  ],

  /* --- Due-date offsets ---------------------------------------------------- *
   * Network windows are fixed by the schemes; the internal buffer is ours and
   * is what analysts actually work to. Editable from System preferences. */
  dueDateOffsets: {
    schemeDays: { visa: 30, mastercard: 45, amex: 20 },
    cycleDays: { first_cb: 0, second_cb: -8, pre_arb: -14, retrieval: -10, rfi: -18 },
    claimDays: 21,
    internalBufferDays: 4,
  },

  thresholds: {
    minimumProcessingAmount: 5,
    riskAmount: 250,
    autoAssign: true,
    routingHighValue: 400,
    defaultReviewer: 'matteo.rossi',
  },

  /* --- Consolidation ------------------------------------------------------- *
   * Minimums are deliberately asymmetric. Two disputes on one card is already
   * a signal; two against one seller is just a seller with volume — hence
   * three, open-only, inside 30 days. Tuned loosely this flagged 60% then 28%
   * of the book, at which point the flag carries no information. Target 10-15%. */
  consolidation: {
    rules: [
      { id: 'same_card', label: 'Same card', minSize: 2, windowDays: 90, openOnly: false, description: 'Multiple disputes presented on one PAN.' },
      { id: 'same_order', label: 'Same order', minSize: 2, windowDays: 120, openOnly: false, description: 'One order disputed more than once, including across intake paths.' },
      { id: 'same_seller', label: 'Same seller', minSize: 3, windowDays: 30, openOnly: true, description: 'A cluster of open disputes against one seller inside 30 days.' },
    ],
  },

  features: {
    bulkActions: true,
    ruleCheck: true,
    consolidation: true,
    customReports: true,
    monitoring: true,
    uploadCases: true,
    webhooks: true,
    apiDocs: true,
    help: true,
  },

  demoCredentials: { username: 'PriceLine', password: 'Changeme123' },
};

/* ------------------------------------------------------------------ *
 * Tenant: PriceLine — proof the swap is real
 * ------------------------------------------------------------------ */

export const pricelineBrand = {
  ...vintedBrand,
  id: 'priceline',
  name: 'PriceLine',
  legalName: 'PriceLine Payments Ltd',
  shortName: 'PRL',
  tagline: 'Card disputes and booking claims in one operational queue.',
  supportEmail: 'disputes@priceline.example',
  emailDomain: 'priceline.example',
  logo: '/tenant-priceline.svg',
  wordmark: { text: 'PriceLine', accent: 'Console', weight: 700 },

  colors: {
    ...vintedBrand.colors,
    primary: '#0F4C99',
    primaryDeep: '#0A3A76',
    primaryTint: '#E6EEF9',
    primaryWash: '#F5F8FD',
    navRail: '#0B1F3B',
    navRailDeep: '#07162B',
    navActive: '#3E8FE0',
    navInk: '#D8E3F2',
    navInkMuted: '#8299B7',
    ink: '#101C2E',
    inkMuted: '#556579',
    inkSubtle: '#8695A6',
    canvas: '#F3F5F8',
    surfaceSunken: '#F8FAFB',
    line: '#DEE4EC',
    lineStrong: '#C3CDDA',
  },

  /** Independently validated — same five checks, same rules. */
  chartSeries: ['#1565C0', '#B3261E', '#008C99', '#9A5B00', '#7B4FA8', '#0F7B4F'],
  chartNeutral: '#6E7C8C',

  currency: 'USD',
  locale: 'en-US',
  timezone: 'America/New_York',
  markets: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU'],

  terms: {
    ...vintedBrand.terms,
    claim: 'booking claim',
    claims: 'booking claims',
    claimProgramme: 'Traveller Protection',
    buyer: 'traveller',
    seller: 'supplier',
    order: 'booking',
    item: 'reservation',
    marketplace: 'travel',
  },

  numbering: { ...vintedBrand.numbering, prefix: 'PRL', nextSequence: 440000 },

  entities: [
    { id: 'priceline', label: 'PriceLine', descriptor: 'Consumer travel', mid: '4722100011' },
    { id: 'priceline_biz', label: 'PriceLine Business', descriptor: 'Corporate travel', mid: '4722100048' },
    { id: 'priceline_air', label: 'PriceLine Air', descriptor: 'Flight-only bookings', mid: '4722100092' },
  ],

  claimReasons: [
    { id: 'not_as_described', label: 'Property not as described', category: 'consumer' },
    { id: 'never_arrived', label: 'Booking not honoured', category: 'consumer' },
    { id: 'counterfeit', label: 'Fraudulent listing', category: 'fraud' },
    { id: 'damaged', label: 'Service failure', category: 'consumer' },
    { id: 'wrong_item', label: 'Wrong reservation supplied', category: 'consumer' },
  ],

  paymentMethods: ['Card', 'Wallet balance', 'PayPal', 'Apple Pay', 'Google Pay', 'Affirm'],

  mccs: [
    { code: '4722', label: 'Travel Agencies and Tour Operators' },
    { code: '7011', label: 'Lodging — Hotels and Motels' },
    { code: '4511', label: 'Airlines and Air Carriers' },
    { code: '7512', label: 'Automobile Rental Agency' },
    { code: '4131', label: 'Bus Lines' },
  ],

  acquirers: ['Chase Paymentech', 'Worldpay', 'Stripe'],

  queues: [
    { id: 'all_chargebacks', label: 'All Chargebacks', description: 'Landing queue for every inbound chargeback.', sla: 24 },
    { id: 'buyer_protection', label: 'Traveller Protection', description: 'Claims with no card leg.', sla: 72 },
    { id: 'second_cycle', label: '2nd Cycle Chargeback', description: 'Second presentments and pre-arbitration.', sla: 16 },
    { id: 'high_value', label: 'High Value Disputes', description: 'Cases above the configured risk amount.', sla: 24 },
    { id: 'counterfeit', label: 'Fraudulent Listing', description: 'Supplier authenticity escalations.', sla: 36 },
    { id: 'not_received', label: 'Booking Not Honoured', description: 'Non-delivery of a booked service.', sla: 48 },
    { id: 'logistics', label: 'Supplier Review', description: 'Supplier confirmation evidence.', sla: 48 },
    { id: 'supervisor', label: 'Supervisor', description: 'Cases escalated to a supervisor.', sla: 12 },
    { id: 'no_docs', label: 'No Documents Available', description: 'Cases where evidence was never delivered.', sla: 48 },
  ],

  thresholds: { ...vintedBrand.thresholds, minimumProcessingAmount: 10, riskAmount: 500, routingHighValue: 900 },
};

/* ------------------------------------------------------------------ *
 * Registry + lookups
 * ------------------------------------------------------------------ */

export const TENANTS = { vinted: vintedBrand, priceline: pricelineBrand };

export const brand = TENANTS[import.meta.env?.VITE_TENANT] ?? vintedBrand;

export const allReasonCodes = (b = brand) =>
  b.schemes.flatMap((s) => s.reasonCodes.map((rc) => ({ ...rc, schemeId: s.id, schemeLabel: s.label })));

export const findReasonCode = (code, b = brand) =>
  allReasonCodes(b).find((rc) => rc.code === code) ?? null;

export const findScheme = (id, b = brand) => b.schemes.find((s) => s.id === id) ?? null;
export const findQueue = (id, b = brand) => b.queues.find((q) => q.id === id) ?? null;
export const findEntity = (id, b = brand) => b.entities.find((e) => e.id === id) ?? null;
export const findCycle = (id, b = brand) => b.cycles.find((c) => c.id === id) ?? null;
export const findClaimReason = (id, b = brand) => b.claimReasons.find((r) => r.id === id) ?? null;
export const categoryLabel = (id) => REASON_CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** Reason label for either intake path — claims have no scheme code. */
export const reasonLabelFor = (code, b = brand) =>
  findReasonCode(code, b)?.label ?? findClaimReason(code, b)?.label ?? code;

export default brand;
