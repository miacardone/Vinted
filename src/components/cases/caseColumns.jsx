import { Badge } from '@/components/ui/Surface';
import { TruncatedText } from '@/components/ui/Overlay';
import Icon from '@/components/ui/Icon';
import brand from '@/brand/brand.config';
import { CASES } from '@/data/cases';
import { columnsFor, getCaseType } from '@/domain/caseTypes';
import { DOC_STATUSES, OUTCOMES, STATUSES, getDocStatus, getOutcome, getStatus } from '@/domain/statuses';
import { formatCurrency, formatDueIn, formatShortDate, urgencyOf } from '@/utils/format';

/**
 * Cell renderers for the case table, shared by Case management and Work case.
 *
 * The `reference` column is the adaptive one: on the mixed view it renders
 * whichever identifier the row actually has — an ARN for a chargeback, the item
 * title for a claim — instead of showing both columns half-empty.
 */

/**
 * BADGE COLUMNS GET A FLOOR.
 *
 * Fit mode divides the width by weight, which is right for prose — "Item Not
 * Rece…" is still readable and carries a tooltip. It is wrong for a badge. A
 * badge is an atomic token you recognise by its shape and colour, so clipping
 * it does not shorten the word, it changes it: at 1280 the status column was
 * rendering "Represented" as "Represen" and doc status as "Not Requi", which
 * read as different values or as a rendering fault. These are also the columns
 * a reader looks at first, because they are the colour in the row.
 *
 * The floor is derived from the LONGEST label the column can actually hold,
 * so adding a status with a longer name widens the column instead of quietly
 * clipping it. `ch` keeps it tied to the font rather than to a pixel guess.
 *
 * Deliberately NOT applied to numeric columns: measured at 1280 and 1440, the
 * amount column never clips — the tenant's amounts are six or seven characters
 * — so a floor there would be complexity against a failure this data cannot
 * produce.
 */
const widestLabel = (items) => items.reduce((max, i) => Math.max(max, i.label.length), 0);

/**
 * Floor = the longest label's text width, plus the badge's own chrome and the
 * cell padding.
 *
 * The 0.77 is measured, not guessed. `ch` is the width of "0", which in Inter
 * is about 30% wider than its average mixed-case letter — sizing at a flat 1ch
 * per character produced columns ~20px wider than the badge inside them, which
 * just moves the squeeze onto the prose columns next door. Against the rendered
 * badges ("Represented" with a dot measures 95px, "Not Required" 86px) 0.77ch
 * per character lands within a couple of pixels.
 *
 * Staying in `ch` rather than raw px means the floor tracks the font size
 * instead of silently going wrong the next time the table's type scale moves.
 */
const badgeFloor = (items, { dot = false } = {}) =>
  `calc(${(widestLabel(items) * 0.77).toFixed(2)}ch + ${dot ? 41 : 27}px)`;

const BADGE_MIN_WIDTH = {
  status: badgeFloor(STATUSES, { dot: true }),
  outcome: badgeFloor(OUTCOMES),
  docStatus: badgeFloor(DOC_STATUSES),
};

/**
 * MONEY GETS A FLOOR TOO.
 *
 * A truncated word is still readable from its first half. A truncated number
 * is not merely unreadable, it is WRONG — "€1,234.5…" reads as a smaller
 * figure than it is, and nothing on screen says it was cut. Prose can carry
 * the compression; a figure cannot.
 *
 * Measured, this column does not currently clip: the tenant's amounts run to
 * six or seven characters and the column sits comfortably wider. The floor is
 * here as a guarantee rather than a repair — a tenant with larger amounts, or
 * a currency whose symbol and grouping are wider, must not be able to
 * introduce a silently wrong number by changing a config value.
 *
 * Sized from the widest figure the tenant's own thresholds imply, not from a
 * fixed guess, and via the real formatter so the currency symbol, grouping
 * separators and decimal places are the ones that will actually render.
 */
const widestMoney = () => {
  /*
   * The widest string this column renders is the TOTAL, not any single cell —
   * and the totals row is wider than every amount above it by orders of
   * magnitude. Sizing to the cells alone clipped "€215,805.27" to fit a column
   * built for "€162.07", which is precisely the silently-wrong number this
   * floor exists to prevent. Caught by measuring the footer rather than
   * trusting the change that introduced it.
   *
   * Taken from the book itself so it tracks the real data, with the
   * high-value threshold as a floor for the case where a filter leaves a
   * single large row and no meaningful total.
   */
  const bookTotal = CASES.reduce((sum, c) => sum + (c.disputeAmount ?? 0), 0);
  const ceiling = (brand.thresholds?.routingHighValue ?? 1000) * 10;
  return Math.max(formatCurrency(bookTotal).length, formatCurrency(ceiling).length);
};

const MONEY_MIN_WIDTH = `calc(${(widestMoney() * 0.77).toFixed(2)}ch + 20px)`;

const schemeVar = (colorKey) => `var(--c-${colorKey.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)})`;

export function SchemeChip({ networkId }) {
  const scheme = brand.schemes.find((s) => s.id === networkId);
  if (!scheme) return <span className="subtle">—</span>;
  return (
    <span className="scheme-chip">
      <span className="scheme-chip__mark" style={{ background: schemeVar(scheme.colorKey) }} />
      {scheme.label}
    </span>
  );
}

export function DueCell({ dueDate }) {
  const urgency = urgencyOf(dueDate);
  return (
    <span className={`due due--${urgency}`} title={formatShortDate(dueDate)}>
      {urgency === 'overdue' && <Icon name="alert" size={10} />}
      {formatDueIn(dueDate)}
    </span>
  );
}

export function CaseTypeBadge({ caseType }) {
  const spec = getCaseType(caseType);
  return <Badge tone={spec.tone}>{spec.short}</Badge>;
}

function Reference({ row }) {
  if (row.caseType === 'chargeback') {
    return (
      <TruncatedText value={row.arn} className="mono" tooltip={`ARN ${row.arn} · ${row.reasonCode} ${row.reasonLabel}`} />
    );
  }
  return <TruncatedText value={row.itemTitle} tooltip={`${row.itemTitle} · ${row.reasonLabel}`} />;
}

const RENDERERS = {
  id: (r) => <span className="mono strong nowrap">{r.id}</span>,
  caseType: (r) => <CaseTypeBadge caseType={r.caseType} />,
  reference: (r) => <Reference row={r} />,
  arn: (r) => <TruncatedText value={r.arn ?? '—'} className="mono" />,
  network: (r) => <SchemeChip networkId={r.network} />,
  reasonCode: (r) => <TruncatedText value={`${r.reasonCode} · ${r.reasonLabel}`} tooltip={r.reasonLabel} />,
  cycle: (r) => <TruncatedText value={r.cycleLabel ?? '—'} />,
  cardholder: (r) => <TruncatedText value={r.cardholder ?? '—'} />,
  mid: (r) => <span className="mono">{r.mid}</span>,
  itemTitle: (r) => <TruncatedText value={r.itemTitle} />,
  claimReason: (r) => <TruncatedText value={r.reasonLabel} />,
  buyer: (r) => <TruncatedText value={r.buyer} />,
  seller: (r) => <TruncatedText value={r.seller} />,
  orderId: (r) => <span className="mono">{r.orderId}</span>,
  paymentMethod: (r) => <TruncatedText value={r.paymentMethod} />,
  entityLabel: (r) => <TruncatedText value={r.entityLabel} />,
  disputeAmount: (r) => <span className="mono">{formatCurrency(r.disputeAmount, r.currency)}</span>,
  status: (r) => <Badge tone={getStatus(r.status).tone} dot>{getStatus(r.status).label}</Badge>,
  outcome: (r) => {
    const o = getOutcome(r.outcome);
    return o ? <Badge tone={o.tone}>{o.label}</Badge> : <span className="subtle">—</span>;
  },
  docStatus: (r) => {
    const d = getDocStatus(r.docStatus);
    return d ? <Badge tone={d.tone}>{d.label}</Badge> : <span className="subtle">—</span>;
  },
  queueLabel: (r) => <TruncatedText value={r.queueLabel} />,
  worker: (r) => (r.worker === '—' ? <span className="subtle">Unassigned</span> : <TruncatedText value={r.worker} className="mono" />),
  dueDate: (r) => <DueCell dueDate={r.dueDate} />,
};

/**
 * Table columns for a case-type filter, with renderers and export accessors.
 *
 * SORTABLE BY DEFAULT. No column set `sortable`, and DataTable only draws the
 * sort control for `c.sortable && onSort` — so Work case and Case management
 * both held sort state, passed an `onSort` handler and computed a sorted list,
 * while every header rendered as inert text. The machinery was complete and
 * simply unreachable. Every column here is backed by a field on the row, so
 * the default is on and a column opts out rather than in.
 *
 * `reference` is the one column whose key is not a row field — it shows the
 * ARN for a chargeback and the item title for a claim — so it sorts on the
 * value actually displayed via `sortValue` rather than on `undefined`.
 */
export function buildCaseColumns(caseType = 'all', { linkedIds } = {}) {
  return columnsFor(caseType).map((c) => ({
    sortable: true,
    ...(BADGE_MIN_WIDTH[c.key] ? { minWidth: BADGE_MIN_WIDTH[c.key] } : null),
    ...(c.key === 'disputeAmount'
      ? { minWidth: MONEY_MIN_WIDTH, totalCell: (sum) => formatCurrency(sum) }
      : null),
    ...(c.key === 'reference'
      ? { sortValue: (row) => (row.caseType === 'chargeback' ? row.arn ?? '' : row.itemTitle ?? '') }
      : null),
    ...c,
    cell: (row) => {
      const content = RENDERERS[c.key]?.(row) ?? <TruncatedText value={String(row[c.key] ?? '—')} />;
      if (c.key !== 'id' || !linkedIds?.has(row.id)) return content;
      return (
        <span className="row row--xtight row--nowrap">
          {content}
          <Icon name="link" size={11} style={{ color: 'var(--c-primary)' }} title="Consolidated with other cases" />
        </span>
      );
    },
    exportValue: (row) => {
      if (c.key === 'reference') return row.caseType === 'chargeback' ? row.arn : row.itemTitle;
      if (c.key === 'status') return getStatus(row.status).label;
      if (c.key === 'outcome') return getOutcome(row.outcome)?.label ?? '';
      if (c.key === 'docStatus') return getDocStatus(row.docStatus)?.label ?? '';
      return row[c.key] ?? '';
    },
  }));
}
