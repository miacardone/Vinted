import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { CaseTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { columnsFor, gridTemplateFor } from '@/domain/caseTypes';
import { formatDueIn, formatMoney, formatShortDate, urgencyOf } from '@/utils/format';
import { ROUTES } from '@/utils/constants';
import { useBrand } from '@/brand/BrandProvider';

/**
 * Dense case table with columns that adapt to the active case-type filter.
 *
 * With "All" selected we show the columns that mean something for both intake
 * paths plus one Reference column that renders whichever identifier the row
 * actually has — an ARN for a chargeback, the item title for a claim. Filter to
 * one type and the real columns for that type appear. The alternative, showing
 * every field for every row, is a wall of N/A that nobody can scan.
 */

function SchemeChip({ schemeId, label }) {
  const brand = useBrand();
  const scheme = brand.schemes.find((s) => s.id === schemeId);
  if (!scheme) return <span className="faint">—</span>;

  return (
    <span className="scheme-chip">
      <span className="scheme-chip__mark" style={{ background: `var(--c-${scheme.colorKey.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)})` }} />
      {label ?? scheme.label}
    </span>
  );
}

function DueCell({ dueAt }) {
  const urgency = urgencyOf(dueAt);
  return (
    <span className={`due due--${urgency}`}>
      {urgency === 'overdue' && <Icon name="alert" size={11} />}
      {formatDueIn(dueAt)}
    </span>
  );
}

/** The mixed-view Reference column: the right identifier for the row's type. */
function ReferenceCell({ record }) {
  if (record.caseType === 'chargeback') {
    return (
      <span className="dt__cell--stack" style={{ display: 'flex' }}>
        <span className="mono truncate" title={record.card?.arn}>
          {record.card?.arn?.slice(0, 18)}…
        </span>
        <span className="dt__secondary truncate">
          {record.reasonCode} · {record.reasonLabel}
        </span>
      </span>
    );
  }

  return (
    <span className="dt__cell--stack" style={{ display: 'flex' }}>
      <span className="truncate dt__primary" title={record.item?.title}>
        {record.item?.title}
      </span>
      <span className="dt__secondary truncate">{record.reasonLabel}</span>
    </span>
  );
}

function renderCell(column, record) {
  switch (column.id) {
    case 'caseId':
      return <span className="mono strong">{record.id}</span>;
    case 'caseType':
      return <CaseTypeBadge caseType={record.caseType} short />;
    case 'context':
      return <ReferenceCell record={record} />;
    case 'arn':
      return (
        <span className="mono truncate" title={record.card?.arn}>
          {record.card?.arn ?? '—'}
        </span>
      );
    case 'scheme':
      return <SchemeChip schemeId={record.schemeId} />;
    case 'reasonCode':
      return (
        <span className="dt__cell--stack" style={{ display: 'flex' }}>
          <span className="mono">{record.reasonCode}</span>
          <span className="dt__secondary truncate">{record.reasonLabel}</span>
        </span>
      );
    case 'cycle':
      return <span className="small">{record.cycleLabel ?? '—'}</span>;
    case 'cardholder':
      return <span className="truncate">{record.card?.cardholder ?? '—'}</span>;
    case 'item':
      return (
        <span className="dt__cell--stack" style={{ display: 'flex' }}>
          <span className="truncate dt__primary" title={record.item?.title}>
            {record.item?.title}
          </span>
          <span className="dt__secondary truncate">{record.item?.category}</span>
        </span>
      );
    case 'claimReason':
      return <span className="truncate">{record.reasonLabel}</span>;
    case 'buyer':
      return <span className="truncate">{record.buyer?.name}</span>;
    case 'seller':
      return <span className="truncate">@{record.seller?.handle}</span>;
    case 'orderId':
      return <span className="mono">{record.order?.id}</span>;
    case 'amount':
      return <span className="mono strong">{formatMoney(record.amount, record.currency)}</span>;
    case 'status':
      return <StatusBadge status={record.status} />;
    case 'queue':
      return <span className="truncate small">{record.queueLabel}</span>;
    case 'assignee':
      return record.assigneeName ? (
        <span className="row row--tight row--nowrap">
          <span className="avatar avatar--sm">{record.assigneeInitials}</span>
          <span className="truncate small">{record.assigneeName}</span>
        </span>
      ) : (
        <span className="faint small">Unassigned</span>
      );
    case 'dueAt':
      return (
        <span className="dt__cell--stack" style={{ display: 'flex' }}>
          <DueCell dueAt={record.dueAt} />
          <span className="dt__secondary">{formatShortDate(record.dueAt)}</span>
        </span>
      );
    default:
      return null;
  }
}

export function CaseTable({
  cases = [],
  caseType = 'all',
  selection,
  sort,
  onSortChange,
  linkedCaseIds = new Set(),
}) {
  const columns = columnsFor(caseType);
  const template = gridTemplateFor(columns, { selectable: Boolean(selection) });

  const allOnPageSelected = cases.length > 0 && cases.every((c) => selection?.isSelected(c.id));
  const someOnPageSelected = cases.some((c) => selection?.isSelected(c.id));

  return (
    <div className="table-wrap">
      <div className="dt">
        <div className="dt__head" style={{ gridTemplateColumns: template }}>
          {selection && (
            <span className="dt__th">
              <input
                type="checkbox"
                className="checkbox"
                aria-label="Select all rows on this page"
                checked={allOnPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                }}
                onChange={(e) => selection.toggleMany(cases.map((c) => c.id), e.target.checked)}
              />
            </span>
          )}

          {columns.map((column) =>
            column.sortable && onSortChange ? (
              <button
                key={column.id}
                type="button"
                className={`dt__th dt__th--sortable ${column.align === 'right' ? 'dt__th--right' : ''}`.trim()}
                onClick={() =>
                  onSortChange({
                    field: column.id,
                    direction: sort?.field === column.id && sort.direction === 'asc' ? 'desc' : 'asc',
                  })
                }
              >
                {column.label}
                {sort?.field === column.id && (
                  <Icon name={sort.direction === 'asc' ? 'arrowUp' : 'arrowDown'} size={11} className="dt__sort" />
                )}
              </button>
            ) : (
              <span
                key={column.id}
                className={`dt__th ${column.align === 'right' ? 'dt__th--right' : ''}`.trim()}
              >
                {column.label}
              </span>
            ),
          )}
        </div>

        {cases.map((record) => (
          <Link
            key={record.id}
            to={ROUTES.workCaseDetail(record.id)}
            className={`dt__row ${selection?.isSelected(record.id) ? 'is-selected' : ''}`.trim()}
            style={{ gridTemplateColumns: template }}
          >
            {selection && (
              <span
                className="dt__cell"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selection.toggle(record.id);
                }}
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selection.isSelected(record.id)}
                  onChange={() => {}}
                  aria-label={`Select ${record.id}`}
                  tabIndex={-1}
                />
              </span>
            )}

            {columns.map((column) => (
              <span
                key={column.id}
                className={`dt__cell ${column.align === 'right' ? 'dt__cell--right' : ''}`.trim()}
              >
                {renderCell(column, record)}
                {/* The consolidation flag rides on the case ID so it is visible
                    in the list, not only after opening the case. */}
                {column.id === 'caseId' && linkedCaseIds.has(record.id) && (
                  <Icon name="link" size={12} title="Linked to other cases" style={{ color: 'var(--c-primary)' }} />
                )}
              </span>
            ))}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CaseTable;
