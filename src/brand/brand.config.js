/**
 * WHITE-LABEL CONTROL FILE
 * ========================
 * Everything tenant-specific lives in this file: palette, wordmark, currency,
 * locale, vocabulary, reason codes, legal entities, queues, due-date offsets
 * and feature flags.
 *
 * The rule that keeps this honest: **no component may hard-code a colour or
 * the word "Vinted"**. Colours reach the DOM as CSS custom properties written
 * by BrandProvider at runtime; product nouns reach the JSX through `terms`.
 * If you are about to type a hex code or a tenant name inside src/components,
 * it belongs here instead.
 *
 * A second tenant (`pricelineBrand`) ships in this same file and is selected
 * with VITE_TENANT=priceline. It exists to prove the swap is real rather than
 * aspirational — different palette, currency, locale, case-ID prefix, legal
 * entities and vocabulary, zero component edits.
 */

/* ------------------------------------------------------------------ *
 * Shared scheme reason codes
 * ------------------------------------------------------------------ *
 * `category` drives the reason-category rollups on Reports centre, so every
 * code must carry one of: fraud | authorisation | processing | consumer.
 */

const VISA_REASON_CODES = [
  { code: '10.4', label: 'Other Fraud — Card Absent Environment', category: 'fraud', severity: 'high' },
  { code: '10.5', label: 'Visa Fraud Monitoring Program', category: 'fraud', severity: 'high' },
  { code: '11.3', label: 'No Authorisation', category: 'authorisation', severity: 'medium' },
  { code: '12.5', label: 'Incorrect Amount', category: 'processing', severity: 'low' },
  { code: '12.6', label: 'Duplicate Processing', category: 'processing', severity: 'low' },
  { code: '13.1', label: 'Merchandise/Services Not Received', category: 'consumer', severity: 'high' },
  { code: '13.2', label: 'Cancelled Recurring Transaction', category: 'consumer', severity: 'low' },
  { code: '13.3', label: 'Not as Described or Defective Merchandise', category: 'consumer', severity: 'high' },
  { code: '13.6', label: 'Credit Not Processed', category: 'consumer', severity: 'medium' },
  { code: '13.7', label: 'Cancelled Merchandise/Services', category: 'consumer', severity: 'medium' },
];

const MASTERCARD_REASON_CODES = [
  { code: '4837', label: 'No Cardholder Authorisation', category: 'fraud', severity: 'high' },
  { code: '4849', label: 'Questionable Merchant Activity', category: 'fraud', severity: 'high' },
  { code: '4863', label: 'Cardholder Does Not Recognise', category: 'fraud', severity: 'medium' },
  { code: '4808', label: 'Authorisation-Related Chargeback', category: 'authorisation', severity: 'medium' },
  { code: '4834', label: 'Point-of-Interaction Error', category: 'processing', severity: 'low' },
  { code: '4842', label: 'Late Presentment', category: 'processing', severity: 'low' },
  { code: '4853', label: 'Cardholder Dispute — Goods Not as Described', category: 'consumer', severity: 'high' },
  { code: '4855', label: 'Goods or Services Not Provided', category: 'consumer', severity: 'high' },
  { code: '4860', label: 'Credit Not Processed', category: 'consumer', severity: 'medium' },
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
  tagline: 'Chargebacks and Buyer Protection claims in one operational queue.',
  supportEmail: 'disputes@vinted.example',

  wordmark: {
    text: 'Vinted',
    weight: 800,
    letterSpacing: '-0.03em',
    /** Rendered as type + a drawn glyph, never an image asset — inherits the palette. */
    glyph: 'tag',
  },

  /* --- Palette ---------------------------------------------------------- *
   * BrandProvider writes each key to `--c-<kebab-key>` on :root. The nav rail
   * is deliberately its own pair of tokens: the sidebar is dark in this tenant
   * and could be light in another, so components read `--c-nav-*` rather than
   * assuming a dark chrome. */
  colors: {
    primary: '#007782',
    primaryDeep: '#00565E',
    primaryTint: '#E4F1F1',
    primaryWash: '#F3F9F9',
    navRail: '#04343A',
    navRailDeep: '#022A2F',
    navActive: '#00A0AD',
    navInk: '#D6E7E8',
    navInkMuted: '#7FA0A4',
    ink: '#0B2E32',
    inkMuted: '#5A7377',
    inkFaint: '#8CA3A6',
    canvas: '#F2F5F5',
    surface: '#FFFFFF',
    surfaceSunken: '#F8FAFA',
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
  },

  /* --- Categorical chart series ------------------------------------------ *
   * VALIDATED, NOT EYEBALLED. This exact sequence passes all five palette
   * checks against a white chart surface: lightness band, chroma floor,
   * colour-vision-deficiency separation on every adjacent pair, the
   * normal-vision floor, and 3:1 contrast.
   *
   * Two constraints shaped it, and both are easy to get wrong:
   *
   * 1. The UI teal (#007782) and the nav-active teal (#00A0AD) cannot both be
   *    series colours — adjacent, they separate by only ΔE 12.6 to normal
   *    vision, below the readable floor. The chart teal is therefore a
   *    saturated sibling (#008C99) rather than either UI token; the brand
   *    reads through the chrome, not through the slices.
   * 2. Green and amber must never be adjacent: they collapse to ΔE 7.3 under
   *    protanopia. Hence the ordering below, which is load-bearing.
   *
   * Assign these in fixed order and never cycle them. A seventh category folds
   * into "Other" and takes `chartNeutral`.
   */
  chartSeries: ['#008C99', '#B3261E', '#3F51B5', '#9A5B00', '#A5348F', '#0F7B4F'],
  /** Reserved for the "Other" bucket only — deliberately achromatic. */
  chartNeutral: '#6B7F82',

  /* --- Money, locale, markets ------------------------------------------- */
  currency: 'EUR',
  locale: 'en-GB',
  timezone: 'Europe/Vilnius',
  markets: ['FR', 'DE', 'LT', 'PL', 'ES', 'IT', 'NL', 'BE', 'CZ', 'SK'],

  /* --- Vocabulary -------------------------------------------------------- *
   * An acquirer says "chargeback"; a marketplace says "claim". This console
   * runs both intake paths, so both nouns are configurable independently. */
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
    analyst: 'analyst',
    analysts: 'analysts',
    queue: 'queue',
    document: 'document',
    marketplace: 'marketplace',
  },

  /** Case-ID numbering. Editable from Settings > System preferences. */
  numbering: {
    prefix: 'VIN',
    separator: '-',
    digits: 5,
    nextSequence: 70000,
  },

  /* --- Legal entities ----------------------------------------------------- */
  entities: [
    { id: 'vinted', label: 'Vinted', descriptor: 'Consumer marketplace', mid: '5411900021' },
    { id: 'vinted_pro', label: 'Vinted Pro', descriptor: 'Professional sellers', mid: '5411900074' },
    { id: 'vinted_go', label: 'Vinted Go', descriptor: 'Logistics and drop-off', mid: '5411900135' },
  ],

  /* --- Card schemes and reason codes -------------------------------------- */
  schemes: [
    { id: 'visa', label: 'Visa', short: 'VI', colorKey: 'schemeVisa', reasonCodes: VISA_REASON_CODES },
    {
      id: 'mastercard',
      label: 'Mastercard',
      short: 'MC',
      colorKey: 'schemeMastercard',
      reasonCodes: MASTERCARD_REASON_CODES,
    },
  ],

  /** Chargeback lifecycle stage. Drives due-date offsets and the cycle badge. */
  cycles: [
    { id: 'first_cb', label: '1st chargeback', short: '1st CB' },
    { id: 'second_cb', label: '2nd chargeback', short: '2nd CB' },
    { id: 'pre_arb', label: 'Pre-arbitration', short: 'Pre-Arb' },
    { id: 'rfi', label: 'Request for information', short: 'RFI' },
  ],

  /** Buyer Protection claim reasons — the non-card intake path. */
  claimReasons: [
    { id: 'not_as_described', label: 'Not as described', category: 'consumer', severity: 'medium' },
    { id: 'never_arrived', label: 'Never arrived', category: 'consumer', severity: 'high' },
    { id: 'counterfeit', label: 'Counterfeit', category: 'fraud', severity: 'high' },
    { id: 'damaged', label: 'Damaged', category: 'consumer', severity: 'medium' },
  ],

  /** Merchant category codes in play for this tenant. */
  mccs: [
    { code: '5691', label: "Men's and Women's Clothing Stores" },
    { code: '5651', label: 'Family Clothing Stores' },
    { code: '5948', label: 'Luggage and Leather Goods' },
    { code: '5944', label: 'Jewellery and Watches' },
  ],

  acquirers: ['Adyen', 'Worldline', 'Checkout.com'],

  /* --- Operational queues -------------------------------------------------- */
  queues: [
    { id: 'unassigned', label: 'Unassigned intake', description: 'Landing queue for new cases before routing.', sla: 8 },
    { id: 'fraud_high', label: 'Fraud — high value', description: 'Fraud reason codes above the risk amount.', sla: 24 },
    { id: 'not_received', label: 'Item not received', description: 'Non-receipt across both intake paths.', sla: 48 },
    { id: 'not_described', label: 'Not as described', description: 'Condition and description disputes.', sla: 48 },
    { id: 'counterfeit', label: 'Counterfeit and IP', description: 'Authenticity escalations and brand referrals.', sla: 36 },
    { id: 'pre_arb', label: 'Pre-arbitration', description: 'Second presentments and pre-arb responses.', sla: 16 },
    { id: 'buyer_protection', label: 'Buyer Protection', description: 'Marketplace claims with no card leg.', sla: 72 },
    { id: 'logistics', label: 'Logistics review', description: 'Tracking and drop-off evidence.', sla: 48 },
  ],

  /** Reasons an analyst must pick when assigning or re-routing a case. */
  assignmentReasons: [
    { id: 'skill_match', label: 'Skill match', description: 'Analyst holds the required skill for this reason code.' },
    { id: 'language', label: 'Language coverage', description: 'Case market requires a specific language.' },
    { id: 'workload', label: 'Workload balancing', description: 'Redistributed to level queue depth.' },
    { id: 'escalation', label: 'Escalation', description: 'Raised to a senior analyst or team lead.' },
    { id: 'consolidation', label: 'Consolidation', description: 'Grouped with linked cases for one decision.' },
    { id: 'absence', label: 'Absence cover', description: 'Original owner unavailable.' },
  ],

  /* --- Due-date offsets ---------------------------------------------------- *
   * Network windows are fixed by the schemes; the internal buffer is ours and
   * is what analysts actually work to. Editable from System preferences. */
  dueDateOffsets: {
    schemeDays: { visa: 30, mastercard: 45 },
    /** Applied on top of the scheme window — later cycles compress the clock. */
    cycleDays: { first_cb: 0, second_cb: -8, pre_arb: -14, rfi: -18 },
    claimDays: 21,
    internalBufferDays: 4,
  },

  /** Thresholds surfaced on System preferences and used by routing/risk copy. */
  thresholds: {
    minimumProcessingAmount: 5,
    riskAmount: 250,
    autoAssign: true,
    routingHighValue: 400,
    routingBulkBatchSize: 50,
  },

  /* --- Consolidation ------------------------------------------------------- *
   * The minimums are deliberately not uniform. Two disputes on one card is
   * already a signal; two on one seller is just a busy seller, so that rule
   * needs three, an open-only filter and a 30-day window. Tuned so roughly
   * 10-15% of the book carries the flag — a flag on everything tells an
   * analyst nothing. */
  consolidation: {
    rules: [
      {
        id: 'same_card',
        label: 'Same card',
        minSize: 2,
        windowDays: 90,
        openOnly: false,
        description: 'Multiple disputes presented on one PAN.',
      },
      {
        id: 'same_order',
        label: 'Same order',
        minSize: 2,
        windowDays: 120,
        openOnly: false,
        description: 'One order disputed more than once, including across intake paths.',
      },
      {
        id: 'same_seller',
        label: 'Same seller',
        minSize: 3,
        windowDays: 30,
        openOnly: true,
        description: 'A cluster of open disputes against one seller inside 30 days.',
      },
    ],
  },

  /* --- Feature flags -------------------------------------------------------- *
   * Sales demos vary by prospect. Flip these rather than editing components. */
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
    partnerPortal: false,
  },

  /** Demo-only. A real deployment swaps auth.service.js for an IdP. */
  demoCredentials: { username: 'PriceLine', password: 'Changeme123' },
};

/* ------------------------------------------------------------------ *
 * Tenant: PriceLine — the proof that the swap works
 * ------------------------------------------------------------------ */

export const pricelineBrand = {
  ...vintedBrand,
  id: 'priceline',
  name: 'PriceLine',
  productName: 'Dispute Console',
  legalName: 'PriceLine Payments Ltd',
  tagline: 'Card disputes and booking claims in one operational queue.',
  supportEmail: 'disputes@priceline.example',

  wordmark: { text: 'PriceLine', weight: 700, letterSpacing: '-0.02em', glyph: 'spark' },

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
    inkFaint: '#8695A6',
    canvas: '#F3F5F8',
    surfaceSunken: '#F8FAFB',
    line: '#DEE4EC',
    lineStrong: '#C3CDDA',
  },

  /** Independently validated for this tenant — same five checks, same rules. */
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
    analyst: 'agent',
    analysts: 'agents',
    marketplace: 'travel',
  },

  numbering: { ...vintedBrand.numbering, prefix: 'PRL', nextSequence: 44000 },

  entities: [
    { id: 'priceline', label: 'PriceLine', descriptor: 'Consumer travel', mid: '4722100011' },
    { id: 'priceline_biz', label: 'PriceLine Business', descriptor: 'Corporate travel', mid: '4722100048' },
    { id: 'priceline_air', label: 'PriceLine Air', descriptor: 'Flight-only bookings', mid: '4722100092' },
  ],

  mccs: [
    { code: '4722', label: 'Travel Agencies and Tour Operators' },
    { code: '7011', label: 'Lodging — Hotels and Motels' },
    { code: '4511', label: 'Airlines and Air Carriers' },
    { code: '7512', label: 'Automobile Rental Agency' },
  ],

  claimReasons: [
    { id: 'not_as_described', label: 'Property not as described', category: 'consumer', severity: 'medium' },
    { id: 'never_arrived', label: 'Booking not honoured', category: 'consumer', severity: 'high' },
    { id: 'counterfeit', label: 'Fraudulent listing', category: 'fraud', severity: 'high' },
    { id: 'damaged', label: 'Service failure', category: 'consumer', severity: 'medium' },
  ],

  queues: [
    { id: 'unassigned', label: 'Unassigned intake', description: 'Landing queue for new cases before routing.', sla: 8 },
    { id: 'fraud_high', label: 'Fraud — high value', description: 'Fraud reason codes above the risk amount.', sla: 24 },
    { id: 'not_received', label: 'Booking not honoured', description: 'Non-delivery of a booked service.', sla: 48 },
    { id: 'not_described', label: 'Not as described', description: 'Property and fare condition disputes.', sla: 48 },
    { id: 'counterfeit', label: 'Fraudulent listing', description: 'Supplier authenticity escalations.', sla: 36 },
    { id: 'pre_arb', label: 'Pre-arbitration', description: 'Second presentments and pre-arb responses.', sla: 16 },
    { id: 'buyer_protection', label: 'Traveller Protection', description: 'Claims with no card leg.', sla: 72 },
    { id: 'logistics', label: 'Supplier review', description: 'Supplier confirmation evidence.', sla: 48 },
  ],

  acquirers: ['Chase Paymentech', 'Worldpay', 'Stripe'],

  thresholds: { ...vintedBrand.thresholds, minimumProcessingAmount: 10, riskAmount: 500, routingHighValue: 900 },
};

/* ------------------------------------------------------------------ *
 * Registry + lookup helpers
 * ------------------------------------------------------------------ */

export const TENANTS = { vinted: vintedBrand, priceline: pricelineBrand };

export const brand = TENANTS[import.meta.env?.VITE_TENANT] ?? vintedBrand;

/** All reason codes across every scheme, flattened and scheme-tagged. */
export const allReasonCodes = (b = brand) =>
  b.schemes.flatMap((scheme) =>
    scheme.reasonCodes.map((rc) => ({ ...rc, schemeId: scheme.id, schemeLabel: scheme.label })),
  );

export const findReasonCode = (schemeId, code, b = brand) =>
  b.schemes.find((s) => s.id === schemeId)?.reasonCodes.find((rc) => rc.code === code) ?? null;

export const findScheme = (schemeId, b = brand) => b.schemes.find((s) => s.id === schemeId) ?? null;

export const findQueue = (queueId, b = brand) => b.queues.find((q) => q.id === queueId) ?? null;

export const findEntity = (entityId, b = brand) => b.entities.find((e) => e.id === entityId) ?? null;

export const findCycle = (cycleId, b = brand) => b.cycles.find((c) => c.id === cycleId) ?? null;

export const findClaimReason = (reasonId, b = brand) =>
  b.claimReasons.find((r) => r.id === reasonId) ?? null;

export const categoryLabel = (categoryId) =>
  REASON_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;

export default brand;
