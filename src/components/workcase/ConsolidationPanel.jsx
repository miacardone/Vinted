import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { Badge, CaseTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { explainGroup } from '@/domain/consolidation';
import { formatMoney, formatShortDate } from '@/utils/format';
import { ROUTES } from '@/utils/constants';
import { useBrand } from '@/brand/BrandProvider';

/**
 * Consolidation flag.
 *
 * Answers four questions in order: what linked these, how big is the group,
 * how much money is on the table across all of it, and which cases are they.
 * Then it offers the one action that follows — work them together.
 *
 * A cross-channel order group escalates to the danger treatment, because that
 * is not a tidiness problem: the same order is being refunded through two
 * different channels, and nobody sees it from inside a single case.
 */
export function ConsolidationPanel({ groups = [], currentCaseId, onWorkAll }) {
  const brand = useBrand();

  if (!groups.length) {
    return (
      <div className="row row--tight small muted">
        <Icon name="check" size={14} style={{ color: 'var(--c-success)' }} />
        No linked cases — this one stands alone.
      </div>
    );
  }

  return (
    <div className="stack stack--tight">
      {groups.map((group) => {
        const risky = group.duplicateRefundRisk;

        return (
          <div key={group.id} className={`consolidation ${risky ? 'consolidation--risk' : ''}`.trim()}>
            <div className="consolidation__head">
              <Icon
                name={risky ? 'alert' : 'link'}
                size={16}
                style={{ color: risky ? 'var(--c-danger)' : 'var(--c-primary)', flex: 'none', marginTop: 1 }}
              />
              <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                <span className="consolidation__title">
                  {risky ? 'Disputed through two channels' : group.ruleLabel}
                </span>
                <span className="micro faint mono">{group.label}</span>
              </div>
              {risky && <Badge tone="danger">Double refund risk</Badge>}
            </div>

            <p className="consolidation__copy">{explainGroup(group)}</p>

            <div className="consolidation__stats">
              <div className="consolidation__stat">
                <span className="consolidation__stat-label">Cases linked</span>
                <span className="consolidation__stat-value">{group.size}</span>
              </div>
              <div className="consolidation__stat">
                <span className="consolidation__stat-label">Total exposure</span>
                <span className="consolidation__stat-value">
                  {formatMoney(group.totalExposure, group.currency)}
                </span>
              </div>
              <div className="consolidation__stat">
                <span className="consolidation__stat-label">Still open</span>
                <span className="consolidation__stat-value">{group.openCount}</span>
              </div>
              <div className="consolidation__stat">
                <span className="consolidation__stat-label">Linked by</span>
                <span className="consolidation__stat-value" style={{ fontSize: 'var(--fs-small)' }}>
                  {group.ruleLabel}
                </span>
              </div>
            </div>

            <div className="consolidation__cases">
              {group.cases.map((linked) => {
                const isCurrent = linked.id === currentCaseId;
                return (
                  <Link
                    key={linked.id}
                    to={ROUTES.workCaseDetail(linked.id)}
                    className={`consolidation__case ${isCurrent ? 'is-current' : ''}`.trim()}
                  >
                    <span className="mono strong">{linked.id}</span>
                    <CaseTypeBadge caseType={linked.caseType} short />
                    <span className="truncate muted" style={{ flex: 1 }}>
                      {linked.reasonLabel}
                    </span>
                    <span className="mono">{formatMoney(linked.amount, linked.currency)}</span>
                    <StatusBadge status={linked.status} />
                    {isCurrent ? (
                      <span className="micro faint nowrap">This case</span>
                    ) : (
                      <Icon name="chevron" size={12} className="faint" />
                    )}
                  </Link>
                );
              })}
            </div>

            {risky && (
              <p className="micro" style={{ color: 'var(--c-danger)' }}>
                Resolve as one decision. Refunding the {brand.terms.claim} and conceding the {brand.terms.chargeback}{' '}
                pays {formatMoney(group.totalExposure - (group.cases[0]?.amount ?? 0), group.currency)} more than the
                order was worth.
              </p>
            )}

            <Button
              variant={risky ? 'danger' : 'subtle'}
              size="sm"
              icon="layers"
              onClick={() => onWorkAll?.(group)}
            >
              Work all {group.size} together
            </Button>

            <span className="micro faint">
              Matched within a {group.windowDays}-day window · {formatShortDate(group.cases[0]?.presentedAt)} onward
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ConsolidationPanel;
