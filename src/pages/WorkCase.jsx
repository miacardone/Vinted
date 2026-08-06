import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Badge, CaseTypeBadge, StatusBadge } from '@/components/ui/Badge';
import { AsyncBoundary, EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import CaseDetails from '@/components/workcase/CaseDetails';
import DocumentViewer from '@/components/workcase/DocumentViewer';
import { HistoryTab, NotesTab } from '@/components/workcase/HistoryAndNotes';
import ConsolidationPanel from '@/components/workcase/ConsolidationPanel';
import { RecordDecisionModal, RouteToQueueModal } from '@/components/workcase/CaseModals';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { addNote, getCase, getConsolidationForCase, listBench, recordDecision, updateCase } from '@/services/cases.service';
import { priorityOf } from '@/domain/statuses';
import { useBrand } from '@/brand/BrandProvider';
import { formatDate, formatDueIn, formatMoney, formatShortDate, urgencyOf } from '@/utils/format';
import { ROUTES } from '@/utils/constants';

const CENTRE_TABS = [
  { id: 'documents', label: 'Document viewer' },
  { id: 'history', label: 'History' },
  { id: 'notes', label: 'Notes' },
];

/** Bench: what to pick up next, most urgent first. */
function Bench({ cases, activeId }) {
  return (
    <div className="bench">
      {cases.map((record) => {
        const urgency = urgencyOf(record.dueAt);
        return (
          <Link
            key={record.id}
            to={ROUTES.workCaseDetail(record.id)}
            className={`bench__item ${record.id === activeId ? 'is-active' : ''}`.trim()}
          >
            <div className="bench__body">
              <span className="row row--tight">
                <span className="mono small strong">{record.id}</span>
                <CaseTypeBadge caseType={record.caseType} short />
              </span>
              <span className="micro truncate muted">{record.reasonLabel}</span>
              <span className="row row--tight">
                <span className={`due due--${urgency}`}>{formatDueIn(record.dueAt)}</span>
                <span className="micro mono faint">{formatMoney(record.amount, record.currency)}</span>
              </span>
            </div>
            <Icon name="chevron" size={13} className="faint" />
          </Link>
        );
      })}
    </div>
  );
}

export function WorkCase() {
  const { caseId } = useParams();
  const brand = useBrand();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('documents');
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: bench, status: benchStatus } = useAsync(listBench, []);
  const { data: caseRecord, status, error, run, setData } = useAsync(
    () => (caseId ? getCase(caseId) : Promise.resolve(null)),
    [caseId],
  );
  const { data: consolidation, run: reloadConsolidation } = useAsync(
    () => (caseId ? getConsolidationForCase(caseId) : Promise.resolve({ groups: [] })),
    [caseId],
  );

  const priority = useMemo(
    () => (caseRecord ? priorityOf(caseRecord, brand.thresholds.riskAmount) : null),
    [caseRecord, brand.thresholds.riskAmount],
  );

  const mutate = useCallback(
    async (fn, successMessage) => {
      setBusy(true);
      try {
        const updated = await fn();
        if (updated) setData(updated);
        notify(successMessage, 'success');
        await reloadConsolidation();
        return updated;
      } catch (err) {
        notify(err.message ?? 'That did not save.', 'danger');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [notify, setData, reloadConsolidation],
  );

  // No case selected — show the bench so there is always somewhere to go.
  if (!caseId) {
    return (
      <>
        <PageHeader
          title="Work case"
          subtitle="Your bench, most urgent first. Pick a case to start working."
        />
        <Card>
          <CardHead title="Your bench" subtitle="Assigned to you or waiting in intake." />
          {benchStatus === 'loading' ? (
            <SkeletonRows rows={6} />
          ) : bench?.length ? (
            <Bench cases={bench} />
          ) : (
            <EmptyState icon="check" title="Nothing on your bench" body="Every case assigned to you is closed." />
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={6} height={60} />}>
        {caseRecord === null ? (
          <EmptyState
            icon="search"
            title={`No case with ID ${caseId}`}
            body="It may have been merged or the ID mistyped."
            action={{ label: 'Back to the bench', icon: 'arrowLeft', onClick: () => navigate(ROUTES.workCase) }}
          />
        ) : (
          caseRecord && (
            <>
              <PageHeader
                eyebrow={`${caseRecord.entityLabel} · ${caseRecord.market}`}
                title={
                  <span className="row row--tight">
                    <span className="mono">{caseRecord.id}</span>
                    <CaseTypeBadge caseType={caseRecord.caseType} />
                    <StatusBadge status={caseRecord.status} />
                  </span>
                }
                subtitle={`${caseRecord.reasonCode} · ${caseRecord.reasonLabel}`}
                actions={
                  <>
                    <Button as={Link} to={ROUTES.workCase} variant="ghost" icon="arrowLeft">
                      Bench
                    </Button>
                    <Button variant="secondary" icon="send" onClick={() => setRouteOpen(true)}>
                      Route to queue
                    </Button>
                    <Button variant="primary" icon="check" onClick={() => setDecisionOpen(true)}>
                      Record decision
                    </Button>
                  </>
                }
              />

              <div className="workcase">
                {/* ---------- Left: case details ---------- */}
                <div className="stack">
                  <Card>
                    <CardHead title="Case details" />
                    <CardBody>
                      <CaseDetails caseRecord={caseRecord} />
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHead title="Your bench" subtitle="Most urgent first." />
                    {bench?.length ? <Bench cases={bench.slice(0, 6)} activeId={caseId} /> : <SkeletonRows rows={3} />}
                  </Card>
                </div>

                {/* ---------- Centre: documents / history / notes ---------- */}
                <Card>
                  <CardBody tight>
                    <Tabs
                      tabs={CENTRE_TABS.map((t) =>
                        t.id === 'notes'
                          ? { ...t, count: caseRecord.notes?.length }
                          : t.id === 'documents'
                            ? { ...t, count: caseRecord.documents?.length }
                            : t,
                      )}
                      active={tab}
                      onChange={setTab}
                    />
                  </CardBody>
                  <CardBody>
                    {tab === 'documents' && <DocumentViewer documents={caseRecord.documents} />}
                    {tab === 'history' && <HistoryTab history={caseRecord.history} />}
                    {tab === 'notes' && (
                      <NotesTab
                        notes={caseRecord.notes}
                        busy={busy}
                        onAddNote={(body) => mutate(() => addNote(caseRecord.id, body), 'Note added.')}
                      />
                    )}
                  </CardBody>
                </Card>

                {/* ---------- Right: actions ---------- */}
                <div className="stack workcase__actions">
                  <Card>
                    <CardHead title="Flags" />
                    <CardBody>
                      <div className="stack stack--tight">
                        <div className="row row--between">
                          <span className="small muted">Priority</span>
                          <Badge tone={priority === 'critical' ? 'danger' : priority === 'high' ? 'warning' : 'neutral'}>
                            {priority}
                          </Badge>
                        </div>
                        <div className="row row--between">
                          <span className="small muted">Internal due</span>
                          <span className={`due due--${urgencyOf(caseRecord.dueAt)}`}>
                            {formatDueIn(caseRecord.dueAt)} · {formatShortDate(caseRecord.dueAt)}
                          </span>
                        </div>
                        <div className="row row--between">
                          <span className="small muted">Network due</span>
                          <span className="mono small">{formatDate(caseRecord.networkDueAt)}</span>
                        </div>
                        <div className="row row--between">
                          <span className="small muted">Above risk amount</span>
                          <Badge tone={caseRecord.amount >= brand.thresholds.riskAmount ? 'warning' : 'muted'}>
                            {caseRecord.amount >= brand.thresholds.riskAmount ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {caseRecord.claim?.escrowHeld && (
                          <div className="row row--between">
                            <span className="small muted">Escrow</span>
                            <Badge tone="info">Held</Badge>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHead
                      title="Consolidation"
                      subtitle={`${consolidation?.groups?.length ?? 0} linked group${
                        (consolidation?.groups?.length ?? 0) === 1 ? '' : 's'
                      }`}
                    />
                    <CardBody>
                      <ConsolidationPanel
                        groups={consolidation?.groups ?? []}
                        currentCaseId={caseRecord.id}
                        onWorkAll={(group) => {
                          notify(
                            `Working ${group.size} linked cases as one decision — ${formatMoney(
                              group.totalExposure,
                              group.currency,
                            )} total exposure.`,
                            group.duplicateRefundRisk ? 'warning' : 'success',
                          );
                          const next = group.caseIds.find((id) => id !== caseRecord.id);
                          if (next) navigate(ROUTES.workCaseDetail(next));
                        }}
                      />
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHead title="Assignment" />
                    <CardBody>
                      <div className="stack stack--tight">
                        <div className="row row--between">
                          <span className="small muted">Owner</span>
                          {caseRecord.assigneeName ? (
                            <span className="row row--tight">
                              <span className="avatar avatar--sm">{caseRecord.assigneeInitials}</span>
                              <span className="small">{caseRecord.assigneeName}</span>
                            </span>
                          ) : (
                            <span className="small faint">Unassigned</span>
                          )}
                        </div>
                        <div className="row row--between">
                          <span className="small muted">Queue</span>
                          <span className="small">{caseRecord.queueLabel}</span>
                        </div>
                        <div className="row row--between">
                          <span className="small muted">Reason</span>
                          <span className="small">
                            {brand.assignmentReasons.find((r) => r.id === caseRecord.assignmentReasonId)?.label ?? '—'}
                          </span>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          block
                          icon="user"
                          onClick={() => setRouteOpen(true)}
                          style={{ marginTop: 'var(--s-2)' }}
                        >
                          Reassign or re-route
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHead title="Statement" subtitle="Generated for submission to the scheme." />
                    <CardBody>
                      <div className="stack stack--tight">
                        <p className="small muted">
                          {caseRecord.caseType === 'chargeback'
                            ? `Compelling-evidence pack for ${caseRecord.schemeLabel} ${caseRecord.reasonCode}, built from the attached documents and the listing record.`
                            : `${brand.terms.claimProgramme} decision summary, built from the claim evidence and order history.`}
                        </p>
                        <div className="row row--tight">
                          <Button variant="secondary" size="sm" icon="file">
                            Preview
                          </Button>
                          <Button variant="secondary" size="sm" icon="download">
                            Download
                          </Button>
                        </div>
                        <span className="micro faint">
                          {caseRecord.documents?.filter((d) => d.processing === 'processed').length ?? 0} of{' '}
                          {caseRecord.documents?.length ?? 0} documents processed and ready to include.
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>

              <RecordDecisionModal
                open={decisionOpen}
                onClose={() => setDecisionOpen(false)}
                caseRecord={caseRecord}
                busy={busy}
                onSubmit={async (payload) => {
                  await mutate(() => recordDecision(caseRecord.id, payload), 'Decision recorded.');
                  setDecisionOpen(false);
                }}
              />

              <RouteToQueueModal
                open={routeOpen}
                onClose={() => setRouteOpen(false)}
                caseRecord={caseRecord}
                busy={busy}
                onSubmit={async (changes) => {
                  await mutate(() => updateCase(caseRecord.id, changes), 'Case routed.');
                  setRouteOpen(false);
                }}
              />
            </>
          )
        )}
      </AsyncBoundary>
    </>
  );
}

export default WorkCase;
