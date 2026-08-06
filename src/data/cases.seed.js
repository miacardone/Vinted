/**
 * The demo book: ~120 cases across both intake paths.
 *
 * TWO PROPERTIES MATTER HERE, AND THEY PULL AGAINST EACH OTHER:
 *
 * 1. Determinism. Everything is drawn from one fixed seed, so the table, the
 *    charts and the consolidation groups are identical on every reload. A demo
 *    that reshuffles itself between screenshots is worthless.
 *
 * 2. Live dates. If the seed also froze the calendar, every due date would be
 *    months expired by the time anyone ran the demo. So dates are anchored to
 *    now() at module load and the *offsets* are what the seed controls.
 *
 * Consolidation groups are planted at fixed indices rather than left to chance
 * — see PLANTED below for why.
 */

import brand from '@/brand/brand.config';
import createDraw from '@/data/rng';
import {
  CARRIERS,
  CATEGORIES,
  DOCUMENT_TYPES,
  FIRST_NAMES,
  HISTORY_ACTIONS,
  ITEMS,
  LAST_NAMES,
  MARKET_CITIES,
  NOTE_TEMPLATES,
  SELLER_HANDLES,
} from '@/data/catalogue';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';
import { isClosed } from '@/domain/statuses';

const SEED = 20260806;
const CASE_COUNT = 120;

/** Captured once so every date in the book shares one reference point. */
const NOW = Date.now();
const DAY = 86_400_000;

const iso = (ms) => new Date(ms).toISOString();
const daysFromNow = (days, hours = 0) => iso(NOW + days * DAY + hours * 3_600_000);

/* ------------------------------------------------------------------ *
 * Planted consolidation groups
 * ------------------------------------------------------------------ *
 * Left purely to chance, a 120-case book either produces no groups at all or
 * — with a small seller pool — produces so many that the flag stops carrying
 * information. Planting fixes the composition exactly, and keeps the demo
 * narrative stable: the cross-channel group is always the same two cases.
 *
 * Indices respect the caseType rule below (index % 3 === 2 is a claim), so
 * card groups only ever contain chargebacks — a Buyer Protection claim has no
 * card leg to share.
 */
const PLANTED = {
  sameCard: [
    [3, 40],
    [12, 55, 88],
  ],
  sameOrder: [
    // THE CROSS-CHANNEL GROUP: one order disputed as a chargeback AND as a
    // Buyer Protection claim. Worked separately, the refund gets paid twice.
    [7, 74],
    [19, 93],
  ],
  sameSeller: [
    [24, 48, 62],
    [31, 57, 83, 110],
  ],
};

const PLANTED_INDICES = new Set([
  ...PLANTED.sameCard.flat(),
  ...PLANTED.sameOrder.flat(),
  ...PLANTED.sameSeller.flat(),
]);

/* ------------------------------------------------------------------ *
 * Distributions
 * ------------------------------------------------------------------ */

const STATUS_WEIGHTS = [
  ['open', 13],
  ['ready', 11],
  ['assigned', 15],
  ['working', 17],
  ['pended', 9],
  ['represented', 12],
  ['completed', 10],
  ['rejected', 5],
  ['expired', 2],
  ['writtenOff', 3],
];

/**
 * Derived from the tenant's own entity list, never hard-coded ids — the second
 * tenant's entities are called something else entirely, and naming them here
 * would make the generator silently produce cases with no entity.
 * The weights are positional: most volume on the primary entity.
 */
const ENTITY_WEIGHT_BY_POSITION = [68, 21, 11];
const ENTITY_WEIGHTS = brand.entities.map((entity, i) => [
  entity.id,
  ENTITY_WEIGHT_BY_POSITION[i] ?? 5,
]);

const CYCLE_WEIGHTS = [
  ['first_cb', 66],
  ['second_cb', 17],
  ['pre_arb', 9],
  ['rfi', 8],
];

/** Which queue a case belongs in, given its reason category and reason id. */
function queueFor(caseType, reasonId, category, amount) {
  if (caseType === 'claim') {
    if (reasonId === 'counterfeit') return 'counterfeit';
    if (reasonId === 'never_arrived') return 'not_received';
    if (reasonId === 'not_as_described') return 'not_described';
    return 'buyer_protection';
  }
  if (category === 'fraud') {
    return amount >= brand.thresholds.riskAmount ? 'fraud_high' : 'not_described';
  }
  if (reasonId === '13.1' || reasonId === '4855') return 'not_received';
  if (reasonId === '13.3' || reasonId === '4853') return 'not_described';
  return 'logistics';
}

/* ------------------------------------------------------------------ *
 * Generator
 * ------------------------------------------------------------------ */

function buildPeople(draw) {
  const buyers = Array.from({ length: 96 }, (_, i) => {
    const market = draw.pick(brand.markets);
    return {
      id: `buyer_${String(i + 1).padStart(3, '0')}`,
      name: `${draw.pick(FIRST_NAMES)} ${draw.pick(LAST_NAMES)}`,
      handle: `${draw.pick(FIRST_NAMES).toLowerCase()}${draw.int(10, 99)}`,
      market,
      city: draw.pick(MARKET_CITIES[market] ?? ['—']),
      joinedAt: daysFromNow(-draw.int(60, 1400)),
    };
  });

  /**
   * One seller per case, and this is load-bearing.
   *
   * Drawing sellers randomly from a small pool was measured at 60% of the book
   * flagged; widening the pool to 88 still left 28%, because at ~1.4 disputes
   * per seller roughly a sixth of sellers still reach three, and the rule takes
   * the largest run inside its window. A flag on a quarter of the queue is not
   * a signal.
   *
   * So repeat sellers are not left to chance at all: every case starts with a
   * distinct seller, and the only sellers carrying a cluster are the ones
   * planted below. That is also the realistic shape — across 120 disputes on a
   * marketplace this size, two sharing a seller is genuinely unusual, which is
   * precisely why it is worth flagging when it happens.
   */
  const sellers = Array.from({ length: CASE_COUNT }, (_, i) => {
    const handle = i < SELLER_HANDLES.length
      ? SELLER_HANDLES[i]
      : `${SELLER_HANDLES[i % SELLER_HANDLES.length]}_${Math.floor(i / SELLER_HANDLES.length) + 1}`;
    const market = draw.pick(brand.markets);
    return {
      id: `seller_${String(i + 1).padStart(3, '0')}`,
      name: `${draw.pick(FIRST_NAMES)} ${draw.pick(LAST_NAMES)}`,
      handle,
      market,
      rating: Math.round(draw.float(3.4, 5.0) * 10) / 10,
      sales: draw.int(12, 2400),
      joinedAt: daysFromNow(-draw.int(120, 2000)),
    };
  });

  // Shuffled once so the unique-seller assignment does not correlate with the
  // case sequence (seller_001 would otherwise always be the oldest case).
  return { buyers, sellers: draw.shuffle(sellers) };
}

function buildDocuments(draw, caseRecord) {
  const relevant = DOCUMENT_TYPES.filter((d) => {
    if (caseRecord.caseType === 'claim' && d.id === 'issuer_letter') return false;
    if (caseRecord.caseType === 'claim' && d.id === 'avs_cvv_result') return false;
    return true;
  });

  const count = draw.int(2, 5);
  return draw.sample(relevant, count).map((type, i) => ({
    id: `${caseRecord.id}-DOC-${i + 1}`,
    typeId: type.id,
    label: type.label,
    kind: type.kind,
    pages: type.kind === 'pdf' ? draw.int(1, 6) : 1,
    sizeKb: draw.int(48, 3400),
    uploadedAt: iso(
      new Date(caseRecord.presentedAt).getTime() + draw.int(1, 96) * 3_600_000,
    ),
    uploadedBy: draw.pick(['Acquirer feed', 'Seller upload', 'Buyer upload', 'Analyst']),
    /** Drives the processing-status chart on Monitoring. */
    processing: draw.weighted([
      ['processed', 78],
      ['pending', 13],
      ['failed', 9],
    ]),
  }));
}

function buildHistory(draw, caseRecord) {
  const start = new Date(caseRecord.presentedAt).getTime();
  const span = Math.max(NOW - start, DAY);
  const count = draw.int(4, 8);

  return Array.from({ length: count }, (_, i) => {
    const at = start + (span / (count + 1)) * (i + 1);
    return {
      id: `${caseRecord.id}-EV-${i + 1}`,
      action: i === 0 ? HISTORY_ACTIONS[0] : draw.pick(HISTORY_ACTIONS.slice(1)),
      actor: i === 0 ? 'System' : draw.pick([...ASSIGNABLE_ANALYSTS.map((a) => a.name), 'System', 'Rule engine']),
      at: iso(at),
      detail: draw.pick([
        'Automatic ingestion from the acquirer file.',
        'Matched rule “High-value fraud routing”.',
        'Queue changed following a routing threshold change.',
        'Document received and indexed.',
        'Status transition recorded.',
        'Assignment reason recorded as workload balancing.',
      ]),
    };
  });
}

function buildNotes(draw, caseRecord) {
  const count = draw.weighted([[0, 26], [1, 34], [2, 26], [3, 14]]);
  return Array.from({ length: count }, (_, i) => ({
    id: `${caseRecord.id}-NOTE-${i + 1}`,
    body: draw.pick(NOTE_TEMPLATES),
    author: draw.pick(ASSIGNABLE_ANALYSTS).name,
    at: iso(new Date(caseRecord.presentedAt).getTime() + draw.int(4, 200) * 3_600_000),
    pinned: i === 0 && draw.bool(0.18),
  }));
}

function generateCases() {
  const draw = createDraw(SEED);
  const { buyers, sellers } = buildPeople(draw);
  const { schemeDays, cycleDays, claimDays, internalBufferDays } = brand.dueDateOffsets;

  const cases = Array.from({ length: CASE_COUNT }, (_, index) => {
    // Exactly 1 in 3 is a claim — the 2:1 chargeback-to-claim split.
    const caseType = index % 3 === 2 ? 'claim' : 'chargeback';

    const status = draw.weighted(STATUS_WEIGHTS);
    const closed = isClosed(status);

    const entityId = draw.weighted(ENTITY_WEIGHTS);
    const entity = brand.entities.find((e) => e.id === entityId);

    const itemSpec = draw.pick(ITEMS);
    const listedPrice = draw.money(itemSpec.low, itemSpec.high);
    const shipping = draw.money(2.5, 9.9);
    const orderTotal = Math.round((listedPrice + shipping) * 100) / 100;

    // Most disputes are for the full order; a minority are partial.
    const amount = draw.bool(0.82) ? orderTotal : Math.round(orderTotal * draw.float(0.35, 0.8) * 100) / 100;

    const buyer = draw.pick(buyers);
    // Indexed, not drawn — see buildPeople for why sellers must start unique.
    const seller = sellers[index];
    const market = buyer.market;

    /* --- Reason + scheme ------------------------------------------------ */
    let schemeId = null;
    let schemeLabel = null;
    let reasonCode;
    let reasonLabel;
    let reasonCategory;
    let cycleId = null;
    let cycleLabel = null;

    if (caseType === 'chargeback') {
      const scheme = draw.weighted([[brand.schemes[0], 58], [brand.schemes[1], 42]]);
      const rc = draw.pick(scheme.reasonCodes);
      schemeId = scheme.id;
      schemeLabel = scheme.label;
      reasonCode = rc.code;
      reasonLabel = rc.label;
      reasonCategory = rc.category;
      // Draw once and then look up — calling weighted() inside the predicate
      // would re-roll for every candidate and effectively never match.
      const drawnCycle = draw.weighted(CYCLE_WEIGHTS);
      const cycle = brand.cycles.find((c) => c.id === drawnCycle);
      cycleId = cycle.id;
      cycleLabel = cycle.short;
    } else {
      const reason = draw.pick(brand.claimReasons);
      reasonCode = reason.id;
      reasonLabel = reason.label;
      reasonCategory = reason.category;
    }

    /* --- Dates ----------------------------------------------------------- *
     * Work backwards from the due date so the queue always has live work in
     * it. Closed cases sit in the past; everything else clusters ahead of now
     * with a realistic slice already overdue. */
    const windowDays =
      caseType === 'claim'
        ? claimDays - internalBufferDays
        : schemeDays[schemeId] + cycleDays[cycleId] - internalBufferDays;

    const dueOffsetDays = closed
      ? -draw.int(2, 48)
      : draw.weighted([
          [-draw.int(1, 3), 11], // already overdue but still being worked
          [draw.int(0, 2), 16], // due today or tomorrow
          [draw.int(3, 8), 34],
          [draw.int(9, 18), 27],
          [draw.int(19, 30), 12],
        ]);

    let dueMs = NOW + dueOffsetDays * DAY + draw.int(-8, 8) * 3_600_000;
    let presentedMs = dueMs - windowDays * DAY;

    // A short window (pre-arb compresses Visa to 12 days) plus a far-future due
    // date would put the presentment in the future. Slide the whole pair back
    // so the case was always received before today, without distorting the
    // window between the two dates.
    if (presentedMs > NOW - DAY) {
      const shift = presentedMs - (NOW - draw.int(1, 6) * DAY);
      presentedMs -= shift;
      dueMs -= shift;
    }

    const dueAt = iso(dueMs);
    const presentedAt = iso(presentedMs);
    // The hard scheme deadline sits after our internal one by the buffer.
    const networkDueAt = iso(
      presentedMs + (caseType === 'chargeback' ? schemeDays[schemeId] : claimDays) * DAY,
    );

    const orderPlacedAt = iso(presentedMs - draw.int(4, 40) * DAY);

    /* --- Ownership -------------------------------------------------------- */
    const needsOwner = !['open', 'ready'].includes(status);
    const analyst = needsOwner ? draw.pick(ASSIGNABLE_ANALYSTS) : null;
    const queueId = status === 'open' ? 'unassigned' : queueFor(caseType, reasonCode, reasonCategory, amount);
    const queue = brand.queues.find((q) => q.id === queueId);

    const sequence = brand.numbering.nextSequence + index + 1;
    const id = `${brand.numbering.prefix}${brand.numbering.separator}${sequence}`;

    /* --- Card leg --------------------------------------------------------- */
    const scheme = schemeId ? brand.schemes.find((s) => s.id === schemeId) : null;
    const panPrefix = schemeId === 'visa' ? '4' : '5';
    const bin = `${panPrefix}${draw.digits(5)}`;
    const last4 = draw.digits(4);
    const mcc = draw.pick(brand.mccs);

    const card =
      caseType === 'chargeback'
        ? {
            arn: `${draw.digits(2)}${draw.digits(21)}`,
            pan: `${bin.slice(0, 4)} ${bin.slice(4)}•• •••• ${last4}`,
            last4,
            bin,
            mid: entity.mid,
            mcc: mcc.code,
            mccLabel: mcc.label,
            acquirer: draw.pick(brand.acquirers),
            acquirerCaseId: `${draw.pick(['ADY', 'WLN', 'CKO'])}-${draw.digits(7)}`,
            cardholder: `${draw.pick(FIRST_NAMES)} ${draw.pick(LAST_NAMES)}`,
            scheme: scheme.label,
          }
        : null;

    const claim =
      caseType === 'claim'
        ? {
            reasonId: reasonCode,
            escrowHeld: !closed && draw.bool(0.62),
            returnTracking: draw.bool(0.55) ? `${draw.pick(CARRIERS).slice(0, 3).toUpperCase()}${draw.digits(11)}` : null,
          }
        : null;

    const record = {
      id,
      sequence,
      caseType,
      status,
      queueId,
      queueLabel: queue.label,

      assigneeId: analyst?.id ?? null,
      assigneeName: analyst?.name ?? null,
      assigneeInitials: analyst?.initials ?? null,
      assignmentReasonId: analyst ? draw.pick(brand.assignmentReasons).id : null,

      amount,
      currency: brand.currency,
      entityId,
      entityLabel: entity.label,
      market,

      schemeId,
      schemeLabel,
      reasonCode,
      reasonLabel,
      reasonCategory,
      cycleId,
      cycleLabel,

      presentedAt,
      dueAt,
      networkDueAt,
      createdAt: presentedAt,
      updatedAt: daysFromNow(-draw.float(0, 6)),

      card,
      claim,

      item: {
        title: itemSpec.title,
        category: itemSpec.category ?? draw.pick(CATEGORIES),
        price: listedPrice,
        condition: draw.pick(['New with tags', 'Very good', 'Good', 'Satisfactory']),
        photoCount: draw.int(3, 12),
      },

      order: {
        id: `ORD-${draw.digits(8)}`,
        total: orderTotal,
        shipping,
        placedAt: orderPlacedAt,
        carrier: draw.pick(CARRIERS),
        tracking: `${draw.digits(3)}-${draw.digits(9)}`,
        deliveredAt: draw.bool(0.72) ? iso(new Date(orderPlacedAt).getTime() + draw.int(2, 11) * DAY) : null,
      },

      buyer,
      seller,

      /** Minutes of analyst handling time, used for the AHT table. */
      handlingMinutes: needsOwner ? draw.int(8, 74) : 0,
      touches: needsOwner ? draw.int(1, 9) : 0,
    };

    record.documents = buildDocuments(draw, record);
    record.history = buildHistory(draw, record);
    record.notes = buildNotes(draw, record);

    record.resolution = closed
      ? {
          id:
            status === 'writtenOff'
              ? 'write_off'
              : status === 'rejected'
                ? 'represent'
                : status === 'expired'
                  ? null
                  : draw.pick(['represent', 'refund', 'split']),
          recordedAt: daysFromNow(-draw.int(1, 30)),
          recordedBy: analyst?.name ?? 'System',
          amount,
          note: draw.pick(NOTE_TEMPLATES),
        }
      : null;

    return record;
  });

  applyPlantedGroups(cases, createDraw(SEED + 7));
  return cases;
}

/* ------------------------------------------------------------------ *
 * Planting
 * ------------------------------------------------------------------ */

/**
 * Rewrites the linking fields on the planted indices so the consolidation
 * engine finds exactly the groups we intend. Everything else about those cases
 * — amounts, reason codes, analysts — is left as generated.
 */
function applyPlantedGroups(cases, draw) {
  // --- Same card -----------------------------------------------------------
  PLANTED.sameCard.forEach((indices, groupIndex) => {
    const anchor = cases[indices[0]];
    const cardholder = `${draw.pick(FIRST_NAMES)} ${draw.pick(LAST_NAMES)}`;
    const bin = anchor.card.bin;
    const last4 = anchor.card.last4;

    indices.forEach((i, position) => {
      const c = cases[i];
      c.card = {
        ...c.card,
        bin,
        last4,
        pan: anchor.card.pan,
        cardholder,
        // Same card, different presentments — each keeps its own ARN.
        arn: c.card.arn,
      };
      c.schemeId = anchor.schemeId;
      c.schemeLabel = anchor.schemeLabel;
      c.card.scheme = anchor.schemeLabel;
      // Keep them inside the 90-day window the rule looks at.
      if (position > 0) {
        c.presentedAt = iso(new Date(anchor.presentedAt).getTime() + draw.int(2, 40) * DAY);
      }
      c.plantedGroup = `card-${groupIndex + 1}`;
    });
  });

  // --- Same order ----------------------------------------------------------
  PLANTED.sameOrder.forEach((indices, groupIndex) => {
    const anchor = cases[indices[0]];
    indices.forEach((i, position) => {
      const c = cases[i];
      c.order = { ...anchor.order };
      c.item = { ...anchor.item };
      c.buyer = anchor.buyer;
      c.seller = anchor.seller;
      c.amount = anchor.amount;
      if (position > 0) {
        c.presentedAt = iso(new Date(anchor.presentedAt).getTime() + draw.int(1, 16) * DAY);
      }
      c.plantedGroup = `order-${groupIndex + 1}`;
    });
  });

  // The cross-channel pair is the whole point of the hybrid model, so it gets
  // states that make the double-refund risk real: both still open, the claim
  // still holding escrow, and an amount worth the alarm. A €40 duplicate is a
  // rounding error; a high-value order is the one somebody has to catch.
  const [cbIndex, claimIndex] = PLANTED.sameOrder[0];
  const premium = { title: 'Mulberry Bayswater, oak', category: 'Women — Bags', price: 615, condition: 'Very good', photoCount: 9 };
  const premiumTotal = Math.round((premium.price + 6.9) * 100) / 100;

  [cbIndex, claimIndex].forEach((i) => {
    cases[i].item = { ...premium };
    cases[i].order = { ...cases[cbIndex].order, total: premiumTotal };
    cases[i].amount = premiumTotal;
  });

  Object.assign(cases[cbIndex], { status: 'working', queueId: 'not_received', queueLabel: 'Item not received' });
  Object.assign(cases[claimIndex], { status: 'assigned', queueId: 'buyer_protection', queueLabel: 'Buyer Protection' });
  if (cases[claimIndex].claim) cases[claimIndex].claim.escrowHeld = true;

  // --- Same seller ---------------------------------------------------------
  // The rule is open-only inside 30 days, so the planted members must satisfy
  // both or the group silently fails to form.
  PLANTED.sameSeller.forEach((indices, groupIndex) => {
    const anchor = cases[indices[0]];
    const openStatuses = ['open', 'ready', 'assigned', 'working', 'pended'];

    indices.forEach((i, position) => {
      const c = cases[i];
      c.seller = anchor.seller;
      if (isClosed(c.status)) c.status = openStatuses[position % openStatuses.length];
      c.presentedAt = daysFromNow(-draw.int(2, 24));
      c.plantedGroup = `seller-${groupIndex + 1}`;
    });
  });

  // Any case whose presentedAt moved needs its due date rebuilt, or the two
  // fields contradict each other in the detail panel.
  const { schemeDays, cycleDays, claimDays, internalBufferDays } = brand.dueDateOffsets;
  PLANTED_INDICES.forEach((i) => {
    const c = cases[i];
    const windowDays =
      c.caseType === 'claim'
        ? claimDays - internalBufferDays
        : schemeDays[c.schemeId] + cycleDays[c.cycleId] - internalBufferDays;

    c.dueAt = iso(new Date(c.presentedAt).getTime() + windowDays * DAY);
    c.networkDueAt = iso(
      new Date(c.presentedAt).getTime() +
        (c.caseType === 'claim' ? claimDays : schemeDays[c.schemeId]) * DAY,
    );
    c.createdAt = c.presentedAt;
  });
}

export const CASES = generateCases();

export const CASE_BY_ID = Object.fromEntries(CASES.map((c) => [c.id, c]));

/** The two cases that make up the cross-channel consolidation story. */
export const CROSS_CHANNEL_CASE_IDS = PLANTED.sameOrder[0].map((i) => CASES[i].id);

export default CASES;
