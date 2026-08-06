import { useMemo, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Stepper from '@/components/ui/Stepper';
import { Select, Textarea } from '@/components/ui/Field';
import { EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import { CaseTypeBadge, StatusBadge } from '@/components/ui/Badge';
import CriteriaBuilder from '@/components/rules/CriteriaBuilder';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { bulkUpdateCases, listAllCases } from '@/services/cases.service';
import { listBulkActionHistory, recordBulkAction } from '@/services/admin.service';
import { describeCriterion, matchCases } from '@/domain/criteria';
import { STATUSES } from '@/domain/statuses';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';
import { useBrand } from '@/brand/BrandProvider';
import { formatDateTime, formatMoney, formatNumber, pluralise } from '@/utils/format';

const STEPS = [
  { id: 'criteria', label: 'Criteria' },
  { id: 'actions', label: 'Actions' },
  { id: 'review', label: 'Review' },
];

export function BulkActions() {
  const brand = useBrand();
  const { notify } = useToast();

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [criteria, setCriteria] = useState([]);
  const [matchType, setMatchType] = useState('all');
  const [queueId, setQueueId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');
  const [applying, setApplying] = useState(false);

  const { data: cases, status } = useAsync(listAllCases, []);
  const { data: history, run: reloadHistory } = useAsync(listBulkActionHistory, []);

  /**
   * The live match count. Recomputed on every criteria change against the real
   * book — the number in the review step is exactly what will be changed, not
   * an estimate.
   */
  const matched = useMemo(
    () => (cases ? matchCases(cases, criteria, matchType) : []),
    [cases, criteria, matchType],
  );

  const totalExposure = matched.reduce((sum, c) => sum + c.amount, 0);

  const hasAction = Boolean(queueId || assigneeId || statusValue);
  const reasonMissing = Boolean(assigneeId) && !reasonId;

  const reset = () => {
    setStarted(false);
    setStep(0);
    setCriteria([]);
    setQueueId('');
    setAssigneeId('');
    setStatusValue('');
    setReasonId('');
    setNote('');
  };

  const apply = async () => {
    setApplying(true);
    try {
      const changes = {};
      if (queueId) {
        changes.queueId = queueId;
        changes.queueLabel = brand.queues.find((q) => q.id === queueId)?.label;
      }
      if (assigneeId) {
        const analyst = ASSIGNABLE_ANALYSTS.find((a) => a.id === assigneeId);
        changes.assigneeId = assigneeId;
        changes.assigneeName = analyst?.name ?? null;
        changes.assigneeInitials = analyst?.initials ?? null;
        changes.assignmentReasonId = reasonId;
      }
      if (statusValue) changes.status = statusValue;

      const result = await bulkUpdateCases(matched.map((c) => c.id), changes);
      await recordBulkAction({
        name: note.trim() || `Bulk action on ${matched.length} cases`,
        matched: matched.length,
        applied: result.applied,
      });

      notify(`${pluralise(result.applied, 'case')} updated.`, 'success');
      await reloadHistory();
      reset();
    } catch (err) {
      notify(err.message ?? 'Bulk action failed.', 'danger');
    } finally {
      setApplying(false);
    }
  };

  if (status === 'loading') return <SkeletonRows rows={6} />;

  return (
    <>
      <PageHeader
        title="Bulk actions"
        subtitle="Build a criteria set, see exactly how many cases it selects, then apply one change to all of them."
        actions={
          started ? (
            <Button variant="ghost" onClick={reset}>
              Discard
            </Button>
          ) : (
            <Button variant="primary" icon="plus" onClick={() => setStarted(true)}>
              New bulk action
            </Button>
          )
        }
      />

      {!started ? (
        <div className="stack">
          <Card>
            <EmptyState
              icon="layers"
              title="No bulk action in progress"
              body="Bulk actions change many cases at once — routing a whole reason code to a different queue, or reassigning an analyst's book when they go on leave. You will see the exact match count before anything is applied."
              action={{ label: 'New bulk action', icon: 'plus', onClick: () => setStarted(true) }}
            />
          </Card>

          {history?.length > 0 && (
            <Card>
              <CardHead title="Recent bulk actions" />
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Run by</th>
                      <th className="tbl__right">Matched</th>
                      <th className="tbl__right">Applied</th>
                      <th className="tbl__right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={entry.id}>
                        <td className="strong small">{entry.name}</td>
                        <td className="small">{entry.runBy}</td>
                        <td className="tbl__right mono">{formatNumber(entry.matched)}</td>
                        <td className="tbl__right mono">{formatNumber(entry.applied)}</td>
                        <td className="tbl__right micro faint nowrap">{formatDateTime(entry.runAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />

          <CardBody>
            {step === 0 && (
              <div className="stack">
                <CriteriaBuilder
                  criteria={criteria}
                  onChange={setCriteria}
                  cases={cases ?? []}
                  matchType={matchType}
                  onMatchTypeChange={setMatchType}
                />
              </div>
            )}

            {step === 1 && (
              <div className="stack" style={{ maxWidth: 460 }}>
                <p className="small muted">Leave a field blank to leave it unchanged.</p>

                <Select
                  label={`Route to ${brand.terms.queue}`}
                  value={queueId}
                  onChange={(e) => setQueueId(e.target.value)}
                  placeholder="Leave unchanged"
                  options={brand.queues.map((q) => ({ value: q.id, label: q.label }))}
                />

                <Select
                  label="Assign to"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  placeholder="Leave unchanged"
                  options={ASSIGNABLE_ANALYSTS.map((a) => ({ value: a.id, label: a.name }))}
                />

                {assigneeId && (
                  <Select
                    label="Assignment reason"
                    value={reasonId}
                    onChange={(e) => setReasonId(e.target.value)}
                    placeholder="Select a reason…"
                    options={brand.assignmentReasons.map((r) => ({ value: r.id, label: r.label }))}
                    hint={reasonMissing ? 'Required when changing the assignee.' : undefined}
                  />
                )}

                <Select
                  label="Set status"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  placeholder="Leave unchanged"
                  options={STATUSES.map((s) => ({ value: s.id, label: s.label }))}
                />

                <Textarea
                  label="Label this action"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Shown in the bulk action history."
                />
              </div>
            )}

            {step === 2 && (
              <div className="stack">
                <div
                  className="row row--between"
                  style={{
                    padding: 'var(--s-4)',
                    background: matched.length ? 'var(--c-primary-wash)' : 'var(--c-warning-tint)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <div className="stack" style={{ gap: 2 }}>
                    <span className="eyebrow">Cases affected</span>
                    <span className="kpi__value">{formatNumber(matched.length)}</span>
                    <span className="micro faint">of {formatNumber(cases?.length ?? 0)} in the book</span>
                  </div>
                  <div className="stack" style={{ gap: 2, textAlign: 'right' }}>
                    <span className="eyebrow">Total exposure</span>
                    <span className="kpi__value">{formatMoney(totalExposure)}</span>
                  </div>
                </div>

                <div className="stack stack--tight">
                  <span className="eyebrow">Criteria</span>
                  <ul className="small muted" style={{ margin: 0, paddingLeft: 'var(--s-5)' }}>
                    {criteria.map((c) => (
                      <li key={c.id}>{describeCriterion(c)}</li>
                    ))}
                  </ul>
                  <span className="micro faint">Matching {matchType === 'all' ? 'all' : 'any'} of the above.</span>
                </div>

                <div className="stack stack--tight">
                  <span className="eyebrow">Changes</span>
                  <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s-5)' }}>
                    {queueId && <li>Route to {brand.queues.find((q) => q.id === queueId)?.label}</li>}
                    {assigneeId && (
                      <li>
                        Assign to {ASSIGNABLE_ANALYSTS.find((a) => a.id === assigneeId)?.name} (
                        {brand.assignmentReasons.find((r) => r.id === reasonId)?.label})
                      </li>
                    )}
                    {statusValue && <li>Set status to {STATUSES.find((s) => s.id === statusValue)?.label}</li>}
                  </ul>
                </div>

                {matched.length > 0 && (
                  <div className="stack stack--tight">
                    <span className="eyebrow">Sample of affected cases</span>
                    <div className="table-wrap">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Case</th>
                            <th>Type</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th className="tbl__right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matched.slice(0, 6).map((c) => (
                            <tr key={c.id}>
                              <td className="mono small">{c.id}</td>
                              <td>
                                <CaseTypeBadge caseType={c.caseType} short />
                              </td>
                              <td className="small truncate">{c.reasonLabel}</td>
                              <td>
                                <StatusBadge status={c.status} />
                              </td>
                              <td className="tbl__right mono small">{formatMoney(c.amount, c.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {matched.length > 6 && (
                      <span className="micro faint">
                        …and {formatNumber(matched.length - 6)} more.
                      </span>
                    )}
                  </div>
                )}

                {matched.length === 0 && (
                  <p className="small" style={{ color: 'var(--c-warning)' }}>
                    <Icon name="alert" size={13} /> These criteria match no cases. Go back and widen them.
                  </p>
                )}
              </div>
            )}
          </CardBody>

          <footer className="card__foot">
            {/* The live count follows the operator through every step, so scope
                is never a surprise at the end. */}
            <span className="small">
              <strong className="mono">{formatNumber(matched.length)}</strong> case
              {matched.length === 1 ? '' : 's'} match
            </span>
            <span className="spacer" />
            <Button variant="ghost" onClick={() => (step === 0 ? reset() : setStep(step - 1))} disabled={applying}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 2 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={(step === 0 && criteria.length === 0) || (step === 1 && (!hasAction || reasonMissing))}
              >
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={apply} disabled={!matched.length || !hasAction || applying}>
                {applying ? 'Applying…' : `Apply to ${formatNumber(matched.length)} cases`}
              </Button>
            )}
          </footer>
        </Card>
      )}
    </>
  );
}

export default BulkActions;
