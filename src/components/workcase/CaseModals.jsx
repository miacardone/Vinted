import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Select, Textarea, TextInput } from '@/components/ui/Field';
import { RESOLUTIONS, getResolution } from '@/domain/statuses';
import { useBrand } from '@/brand/BrandProvider';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';
import { formatMoney } from '@/utils/format';

/**
 * Record decision.
 *
 * The resolution list is the domain's, and each option states the status it
 * will move the case to — so the consequence is visible before committing
 * rather than discovered afterwards. A split needs an amount; the button stays
 * disabled until it has one.
 */
export function RecordDecisionModal({ open, onClose, caseRecord, onSubmit, busy }) {
  const [resolution, setResolution] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const spec = getResolution(resolution);
  const needsAmount = spec?.requiresAmount;
  const invalid = !resolution || (needsAmount && (!amount || Number(amount) <= 0));

  const submit = async () => {
    await onSubmit({ resolution, amount: needsAmount ? Number(amount) : undefined, note: note.trim() || undefined });
    setResolution('');
    setAmount('');
    setNote('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record decision"
      subtitle={caseRecord ? `${caseRecord.id} · ${formatMoney(caseRecord.amount, caseRecord.currency)}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={invalid || busy}>
            {busy ? 'Recording…' : 'Record decision'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="stack stack--tight">
          <span className="field__label">Resolution</span>
          {RESOLUTIONS.map((option) => (
            <label
              key={option.id}
              className={`criterion ${resolution === option.id ? 'criterion--pass' : ''}`.trim()}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="resolution"
                className="checkbox"
                style={{ borderRadius: '50%', marginTop: 2 }}
                checked={resolution === option.id}
                onChange={() => setResolution(option.id)}
              />
              <span className="criterion__body">
                <span className="criterion__label">{option.label}</span>
                <span className="criterion__detail">{option.description}</span>
                <span className="micro faint">Moves the case to “{option.nextStatus}”.</span>
              </span>
            </label>
          ))}
        </div>

        {needsAmount && (
          <TextInput
            label="Amount to defend"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={
              caseRecord
                ? `The remainder of ${formatMoney(caseRecord.amount, caseRecord.currency)} is conceded.`
                : undefined
            }
          />
        )}

        <Textarea
          label="Decision note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Why this decision? Recorded in the case history."
        />
      </div>
    </Modal>
  );
}

/** Route to queue — an assignment reason is mandatory, as it is everywhere else. */
export function RouteToQueueModal({ open, onClose, caseRecord, onSubmit, busy }) {
  const brand = useBrand();
  const [queueId, setQueueId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');

  const invalid = !queueId || !reasonId;

  const submit = async () => {
    const analyst = ASSIGNABLE_ANALYSTS.find((a) => a.id === assigneeId);
    await onSubmit({
      queueId,
      queueLabel: brand.queues.find((q) => q.id === queueId)?.label,
      assignmentReasonId: reasonId,
      ...(assigneeId
        ? { assigneeId, assigneeName: analyst?.name ?? null, assigneeInitials: analyst?.initials ?? null }
        : {}),
      note: note.trim() || undefined,
    });
    setQueueId('');
    setAssigneeId('');
    setReasonId('');
    setNote('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Route to ${brand.terms.queue}`}
      subtitle={caseRecord ? `${caseRecord.id} · currently in ${caseRecord.queueLabel}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={invalid || busy}>
            {busy ? 'Routing…' : 'Route case'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Select
          label={`Destination ${brand.terms.queue}`}
          value={queueId}
          onChange={(e) => setQueueId(e.target.value)}
          placeholder="Select a queue…"
          options={brand.queues
            .filter((q) => q.id !== caseRecord?.queueId)
            .map((q) => ({ value: q.id, label: `${q.label} · ${q.sla}h SLA` }))}
        />

        <Select
          label="Assign to (optional)"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          placeholder="Leave for the queue to pick up"
          options={ASSIGNABLE_ANALYSTS.map((a) => ({ value: a.id, label: a.name }))}
        />

        <Select
          label="Assignment reason"
          value={reasonId}
          onChange={(e) => setReasonId(e.target.value)}
          placeholder="Select a reason…"
          options={brand.assignmentReasons.map((r) => ({ value: r.id, label: r.label }))}
          hint="Recorded against the case so routing decisions stay auditable."
        />

        <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
    </Modal>
  );
}

export default RecordDecisionModal;
