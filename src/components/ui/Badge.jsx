import { getStatus } from '@/domain/statuses';
import { getCaseType } from '@/domain/caseTypes';

export function Badge({ tone = 'neutral', dot = false, className = '', children, ...rest }) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()} {...rest}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

/** Status badge — tone comes from the lifecycle definition, never the caller. */
export function StatusBadge({ status }) {
  const spec = getStatus(status);
  return (
    <Badge tone={spec.tone} dot>
      {spec.label}
    </Badge>
  );
}

/** Chargeback vs claim. Short form in dense tables, full label elsewhere. */
export function CaseTypeBadge({ caseType, short = false }) {
  const spec = getCaseType(caseType);
  return <Badge tone={spec.tone}>{short ? spec.short : spec.label}</Badge>;
}

export default Badge;
