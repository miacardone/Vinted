import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import Stepper from '@/components/ui/Stepper';
import { Badge } from '@/components/ui/Badge';
import { Select, Textarea, TextInput } from '@/components/ui/Field';
import { AsyncBoundary, EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import CriteriaBuilder from '@/components/rules/CriteriaBuilder';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { createRule, getRuleHistory, listRuleGroups, listRules, setRuleEnabled } from '@/services/rules.service';
import { listAllCases } from '@/services/cases.service';
import { RULE_ACTIONS, getRuleAction } from '@/data/rules.seed';
import { describeCriterion, matchCases } from '@/domain/criteria';
import { formatDateTime, formatNumber, relativeTime } from '@/utils/format';
import { useBrand } from '@/brand/BrandProvider';
import { STATUSES } from '@/domain/statuses';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';

const WIZARD_STEPS = [
  { id: 'criteria', label: 'Criteria' },
  { id: 'action', label: 'Action' },
  { id: 'details', label: 'Details' },
];

/** Value picker for a rule action — the options depend on the action type. */
function ActionValueField({ action, value, onChange }) {
  const brand = useBrand();
  const spec = getRuleAction(action);

  switch (spec?.valueType) {
    case 'queue':
      return (
        <Select
          label="Destination queue"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select a queue…"
          options={brand.queues.map((q) => ({ value: q.id, label: q.label }))}
        />
      );
    case 'user':
      return (
        <Select
          label="Assign to"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select an analyst…"
          options={ASSIGNABLE_ANALYSTS.map((a) => ({ value: a.id, label: a.name }))}
        />
      );
    case 'status':
      return (
        <Select
          label="Set status to"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select a status…"
          options={STATUSES.map((s) => ({ value: s.id, label: s.label }))}
        />
      );
    case 'text':
      return <Textarea label="Note text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={2} />;
    default:
      return null;
  }
}

function AddRuleWizard({ open, onClose, groups, defaultGroupId, cases, onCreated }) {
  const [step, setStep] = useState(0);
  const [criteria, setCriteria] = useState([]);
  const [matchType, setMatchType] = useState('all');
  const [actionId, setActionId] = useState('route_queue');
  const [actionValue, setActionValue] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? '');
  const [saving, setSaving] = useState(false);

  // The live count is what makes the criteria step honest — it runs the
  // in-progress rule against the real book on every keystroke.
  const matched = matchCases(cases, criteria, matchType);

  const reset = () => {
    setStep(0);
    setCriteria([]);
    setMatchType('all');
    setActionId('route_queue');
    setActionValue('');
    setName('');
    setDescription('');
  };

  const canAdvance =
    (step === 0 && criteria.length > 0) ||
    (step === 1 && Boolean(actionId)) ||
    (step === 2 && name.trim().length > 0 && Boolean(groupId));

  const save = async () => {
    setSaving(true);
    try {
      await onCreated({
        name: name.trim(),
        description: description.trim(),
        groupId,
        enabled: true,
        matchType,
        criteria,
        actions: [{ id: 'a1', actionId, value: actionValue || null }],
      });
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add rule"
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))} disabled={saving}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < 2 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)} disabled={!canAdvance}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={save} disabled={!canAdvance || saving}>
              {saving ? 'Creating…' : 'Create rule'}
            </Button>
          )}
        </>
      }
    >
      <div style={{ margin: 'calc(var(--s-5) * -1) calc(var(--s-5) * -1) var(--s-4)' }}>
        <Stepper steps={WIZARD_STEPS} current={step} onStepClick={setStep} />
      </div>

      {step === 0 && (
        <div className="stack">
          <CriteriaBuilder
            criteria={criteria}
            onChange={setCriteria}
            cases={cases}
            matchType={matchType}
            onMatchTypeChange={setMatchType}
          />

          <div className="row row--tight small" style={{ padding: 'var(--s-3)', background: 'var(--c-primary-wash)', borderRadius: 'var(--r-md)' }}>
            <Icon name="info" size={15} style={{ color: 'var(--c-primary)' }} />
            <span>
              Matches <strong className="mono">{formatNumber(matched.length)}</strong> of{' '}
              <strong className="mono">{formatNumber(cases.length)}</strong> cases in the current book.
            </span>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="stack">
          <Select
            label="Action"
            value={actionId}
            onChange={(e) => {
              setActionId(e.target.value);
              setActionValue('');
            }}
            options={RULE_ACTIONS.map((a) => ({ value: a.id, label: a.label }))}
          />
          <ActionValueField action={actionId} value={actionValue} onChange={setActionValue} />
          <p className="small muted">
            This action applies to every case the criteria match, each time the rule runs.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <TextInput label="Rule name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High-value fraud routing" />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <Select
            label="Rule group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
          />

          <div className="stack stack--tight" style={{ padding: 'var(--s-3)', background: 'var(--c-surface-sunken)', borderRadius: 'var(--r-md)' }}>
            <span className="eyebrow">Summary</span>
            <span className="small">
              When <strong>{matchType === 'all' ? 'all' : 'any'}</strong> of:
            </span>
            <ul className="small muted" style={{ margin: 0, paddingLeft: 'var(--s-5)' }}>
              {criteria.map((c) => (
                <li key={c.id}>{describeCriterion(c)}</li>
              ))}
            </ul>
            <span className="small">
              Then <strong>{getRuleAction(actionId)?.label}</strong>
              {actionValue ? <> → <span className="mono">{actionValue}</span></> : null}
            </span>
            <span className="micro faint">Currently matches {formatNumber(matched.length)} cases.</span>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function RuleGroups() {
  const { notify } = useToast();
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [historyRule, setHistoryRule] = useState(null);

  const { data: groups, status, error, run: reloadGroups } = useAsync(listRuleGroups, []);
  const { data: allCases } = useAsync(listAllCases, []);

  const selectedGroupId = activeGroupId ?? groups?.[0]?.id ?? null;

  const { data: rules, run: reloadRules } = useAsync(
    () => (selectedGroupId ? listRules(selectedGroupId) : Promise.resolve([])),
    [selectedGroupId],
  );

  const { data: history, status: historyStatus } = useAsync(
    () => (historyRule ? getRuleHistory(historyRule.id) : Promise.resolve([])),
    [historyRule],
  );

  const toggle = async (rule) => {
    try {
      await setRuleEnabled(rule.id, !rule.enabled);
      notify(`“${rule.name}” ${rule.enabled ? 'disabled' : 'enabled'}.`, 'success');
      await Promise.all([reloadRules(), reloadGroups()]);
    } catch (err) {
      notify(err.message ?? 'Could not change the rule.', 'danger');
    }
  };

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId);

  return (
    <>
      <PageHeader
        title="Rule groups"
        subtitle="Automation that runs at intake and on a schedule. Groups run in order; rules inside a group all evaluate."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setWizardOpen(true)} disabled={!groups?.length}>
            Add rule
          </Button>
        }
      />

      <AsyncBoundary status={status} error={error} onRetry={reloadGroups} skeleton={<SkeletonRows rows={5} />}>
        {groups && (
          <div className="grid" style={{ gridTemplateColumns: 'minmax(240px, 320px) minmax(0, 1fr)', alignItems: 'start' }}>
            <Card>
              <CardHead title="Groups" subtitle={`${groups.length} groups`} />
              <div className="hairline-list" style={{ padding: '0 var(--s-4)' }}>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className="row row--between"
                    style={{
                      border: 0,
                      background: group.id === selectedGroupId ? 'var(--c-primary-wash)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      margin: '0 calc(var(--s-4) * -1)',
                      padding: 'var(--s-3) var(--s-4)',
                      width: 'calc(100% + var(--s-4) * 2)',
                    }}
                  >
                    <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                      <span className="row row--tight">
                        <span className="small strong">{group.name}</span>
                        {!group.enabled && <Badge tone="muted">Off</Badge>}
                      </span>
                      <span className="micro faint truncate">{group.description}</span>
                    </span>
                    <span className="micro mono faint nowrap">
                      {group.enabledCount}/{group.ruleCount}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardHead
                title={selectedGroup?.name ?? 'Rules'}
                subtitle={selectedGroup?.description}
                actions={
                  <Badge tone={selectedGroup?.scope === 'scheduled' ? 'info' : 'neutral'}>
                    {selectedGroup?.scope === 'scheduled' ? 'Runs on a schedule' : 'Runs at intake'}
                  </Badge>
                }
              />

              {!rules?.length ? (
                <EmptyState
                  icon="rules"
                  title="No rules in this group"
                  body="Add a rule to start routing cases automatically."
                  action={{ label: 'Add rule', icon: 'plus', onClick: () => setWizardOpen(true) }}
                />
              ) : (
                <div className="table-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 54 }}>On</th>
                        <th>Rule</th>
                        <th>Criteria</th>
                        <th>Action</th>
                        <th className="tbl__right">Runs</th>
                        <th className="tbl__right">Last run</th>
                        <th style={{ width: 44 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="toggle"
                              checked={rule.enabled}
                              onChange={() => toggle(rule)}
                              aria-label={`Enable ${rule.name}`}
                            />
                          </td>
                          <td>
                            <span className="stack" style={{ gap: 1 }}>
                              <span className="strong small">{rule.name}</span>
                              <span className="micro faint">{rule.description}</span>
                            </span>
                          </td>
                          <td>
                            <span className="stack" style={{ gap: 1 }}>
                              <span className="micro faint">
                                Match {rule.matchType === 'all' ? 'all' : 'any'}
                              </span>
                              {rule.criteria.map((c) => (
                                <span key={c.id} className="micro">
                                  {describeCriterion(c)}
                                </span>
                              ))}
                            </span>
                          </td>
                          <td>
                            <span className="stack" style={{ gap: 1 }}>
                              {rule.actions.map((a) => (
                                <span key={a.id} className="micro">
                                  {getRuleAction(a.actionId)?.label}
                                  {a.value ? <span className="mono"> → {a.value}</span> : null}
                                </span>
                              ))}
                            </span>
                          </td>
                          <td className="tbl__right mono small">{formatNumber(rule.runCount)}</td>
                          <td className="tbl__right micro faint nowrap">
                            {rule.lastRunAt ? relativeTime(rule.lastRunAt) : 'Never'}
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setHistoryRule(rule)}
                              aria-label={`History for ${rule.name}`}
                              title="Rule history"
                            >
                              <Icon name="clock" size={15} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </AsyncBoundary>

      <AddRuleWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        groups={groups ?? []}
        defaultGroupId={selectedGroupId}
        cases={allCases ?? []}
        onCreated={async (rule) => {
          try {
            await createRule(rule);
            notify(`Rule “${rule.name}” created.`, 'success');
            setWizardOpen(false);
            await Promise.all([reloadRules(), reloadGroups()]);
          } catch (err) {
            notify(err.message ?? 'Could not create the rule.', 'danger');
          }
        }}
      />

      <Drawer
        open={Boolean(historyRule)}
        onClose={() => setHistoryRule(null)}
        title="Rule history"
        subtitle={historyRule?.name}
      >
        {historyStatus === 'loading' ? (
          <SkeletonRows rows={4} />
        ) : history?.length ? (
          <div className="timeline">
            {history.map((entry) => (
              <div key={entry.id} className="timeline__item">
                <span className="timeline__marker" />
                <div className="timeline__body">
                  <span className="timeline__action">{entry.action}</span>
                  <span className="timeline__meta">
                    {entry.actor} · {formatDateTime(entry.at)}
                  </span>
                  <span className="timeline__detail">{entry.detail}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="clock" title="No recorded changes" body="This rule has not been edited since it was created." />
        )}
      </Drawer>
    </>
  );
}

export default RuleGroups;
