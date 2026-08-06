import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Badge, CaseTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { Select, TextInput } from '@/components/ui/Field';
import { EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import Donut from '@/components/charts/Donut';
import { useAsync } from '@/hooks/useAsync';
import { listAllRules } from '@/services/rules.service';
import { runRuleCheck } from '@/services/rules.service';
import { describeCriterion } from '@/domain/criteria';
import { formatMoney } from '@/utils/format';
import { ROUTES } from '@/utils/constants';
import { useBrand } from '@/brand/BrandProvider';

const VERDICT = {
  match: { label: 'Match', tone: 'success', copy: 'This rule would fire on this case.' },
  partial: { label: 'Partial', tone: 'warning', copy: 'Some criteria matched, so the rule did not fire.' },
  'no-match': { label: 'No match', tone: 'danger', copy: 'None of the criteria matched this case.' },
};

/**
 * Rule check (renamed from "Criteria check" — it checks a rule).
 *
 * The value is entirely in the per-criterion breakdown: "5 of 6 matched" plus
 * which one failed turns "why didn't my rule fire?" from a guessing game into
 * a one-line answer.
 */
export function RuleCheck() {
  const brand = useBrand();
  const { data: rules, status: rulesStatus } = useAsync(listAllRules, []);

  const [ruleId, setRuleId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const check = async (e) => {
    e?.preventDefault();
    setChecking(true);
    setError(null);
    setResult(null);
    try {
      setResult(await runRuleCheck({ ruleId, caseId: caseId.trim().toUpperCase() }));
    } catch (err) {
      setError(err.message ?? 'Could not run the check.');
    } finally {
      setChecking(false);
    }
  };

  if (rulesStatus === 'loading') return <SkeletonRows rows={5} />;

  const verdict = result ? VERDICT[result.verdict] : null;

  return (
    <>
      <PageHeader
        title="Rule check"
        subtitle="Test one rule against one case and see which criteria passed. Use it when a rule did not fire and you need to know why."
      />

      <div className="grid grid--split" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Card>
            <CardHead title="Run a check" />
            <CardBody>
              <form className="stack" onSubmit={check}>
                <Select
                  label="Rule"
                  value={ruleId}
                  onChange={(e) => setRuleId(e.target.value)}
                  placeholder="Select a rule…"
                  options={(rules ?? []).map((r) => ({
                    value: r.id,
                    label: `${r.name}${r.enabled ? '' : ' (disabled)'}`,
                  }))}
                />

                <TextInput
                  label="Case ID"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder={`${brand.numbering.prefix}${brand.numbering.separator}70008`}
                  hint="Enter the full case ID as it appears in the queue."
                  error={error ?? undefined}
                />

                <Button type="submit" variant="primary" icon="play" disabled={!ruleId || !caseId.trim() || checking}>
                  {checking ? 'Checking…' : 'Run check'}
                </Button>
              </form>
            </CardBody>
          </Card>

          {result && (
            <Card>
              <CardHead title="Case under test" />
              <CardBody>
                <div className="stack stack--tight">
                  <div className="row row--tight">
                    <span className="mono strong">{result.caseRecord.id}</span>
                    <CaseTypeBadge caseType={result.caseRecord.caseType} short />
                    <StatusBadge status={result.caseRecord.status} />
                  </div>
                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="detail-row__label">Reason</span>
                      <span className="detail-row__value small">
                        {result.caseRecord.reasonCode} · {result.caseRecord.reasonLabel}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Amount</span>
                      <span className="detail-row__value mono">
                        {formatMoney(result.caseRecord.amount, result.caseRecord.currency)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Queue</span>
                      <span className="detail-row__value small">{result.caseRecord.queueLabel}</span>
                    </div>
                  </div>
                  <Button
                    as={Link}
                    to={ROUTES.workCaseDetail(result.caseRecord.id)}
                    variant="secondary"
                    size="sm"
                    icon="external"
                  >
                    Open case
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <Card>
          <CardHead
            title="Result"
            actions={verdict && <Badge tone={verdict.tone}>{verdict.label}</Badge>}
          />

          {!result ? (
            <EmptyState
              icon="rules"
              title="No check run yet"
              body="Pick a rule and enter a case ID to see a criterion-by-criterion breakdown."
            />
          ) : (
            <CardBody>
              <div className="stack">
                <div className="row" style={{ alignItems: 'center', gap: 'var(--s-5)' }}>
                  <Donut
                    size={132}
                    thickness={18}
                    legend={false}
                    segments={[
                      { id: 'passed', label: 'Matched', value: result.passedCount, color: 'var(--c-success)' },
                      {
                        id: 'failed',
                        label: 'Not matched',
                        value: result.total - result.passedCount,
                        color: 'var(--c-danger)',
                      },
                    ]}
                    centreValue={`${result.passedCount}/${result.total}`}
                    centreLabel="criteria"
                  />

                  <div className="stack stack--tight" style={{ flex: 1, minWidth: 180 }}>
                    <span className="strong">
                      {result.passedCount} of {result.total} criteria matched — {verdict.label}
                    </span>
                    <span className="small muted">{verdict.copy}</span>
                    <span className="micro faint">
                      Rule matches {result.rule.matchType === 'all' ? 'all criteria (AND)' : 'any criterion (OR)'}.
                    </span>
                    {!result.rule.enabled && (
                      <Badge tone="warning">Rule is currently disabled — it would not run in production.</Badge>
                    )}
                  </div>
                </div>

                <div className="stack stack--tight">
                  <span className="eyebrow">Criteria</span>
                  {result.results.map((row, i) => (
                    <div key={i} className={`criterion criterion--${row.passed ? 'pass' : 'fail'}`}>
                      <Icon
                        name={row.passed ? 'check' : 'close'}
                        size={15}
                        className="criterion__icon"
                        style={{ color: row.passed ? 'var(--c-success)' : 'var(--c-danger)' }}
                      />
                      <div className="criterion__body">
                        <span className="criterion__label">{describeCriterion(row.criterion)}</span>
                        <span className="criterion__detail">
                          {row.fieldLabel} on this case is{' '}
                          <strong className="mono">{String(row.actual ?? '—')}</strong>
                          {!row.passed && (
                            <>
                              {' '}
                              · expected {row.operatorLabel}{' '}
                              <strong className="mono">
                                {Array.isArray(row.expected) ? row.expected.join(', ') : String(row.expected ?? '—')}
                              </strong>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="stack stack--tight">
                  <span className="eyebrow">Action if matched</span>
                  {result.rule.actions.map((a) => (
                    <span key={a.id} className="small">
                      {a.actionId}
                      {a.value ? <span className="mono"> → {a.value}</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            </CardBody>
          )}
        </Card>
      </div>
    </>
  );
}

export default RuleCheck;
