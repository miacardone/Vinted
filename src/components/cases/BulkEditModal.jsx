import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { useBrand } from '@/brand/BrandProvider';
import { STATUSES } from '@/domain/statuses';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';
import { pluralise } from '@/utils/format';

/**
 * Bulk edit for a table selection.
 *
 * Only fields the operator actually sets are sent — an untouched select must
 * not blank the value on every selected case. An assignment reason becomes
 * mandatory as soon as an assignee is chosen, because "who changed this and
 * why" is the whole point of the reason list.
 */
export function BulkEditModal({ open, onClose, count, onApply, busy }) {
  const brand = useBrand();

  const [queueId, setQueueId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState('');
  const [assignmentReasonId, setAssignmentReasonId] = useState('');
  const [note, setNote] = useState('');

  const reasonRequired = Boolean(assigneeId) && !assignmentReasonId;
  const nothingSelected = !queueId && !assigneeId && !status && !note.trim();

  const reset = () => {
    setQueueId('');
    setAssigneeId('');
    setStatus('');
    setAssignmentReasonId('');
    setNote('');
  };

  const apply = async () => {
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
      changes.assignmentReasonId = assignmentReasonId;
    }
    if (status) changes.status = status;
    if (note.trim()) changes.bulkNote = note.trim();

    await onApply(changes);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk edit cases"
      subtitle={`Changes apply to ${pluralise(count, 'selected case')}.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={apply} disabled={nothingSelected || reasonRequired || busy}>
            {busy ? 'Applying…' : `Apply to ${count}`}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="small muted">
          Leave a field untouched to keep its current value on every selected case.
        </p>

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
            value={assignmentReasonId}
            onChange={(e) => setAssignmentReasonId(e.target.value)}
            placeholder="Select a reason…"
            options={brand.assignmentReasons.map((r) => ({ value: r.id, label: r.label }))}
            hint={reasonRequired ? 'Required when changing the assignee.' : undefined}
          />
        )}

        <Select
          label="Change status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Leave unchanged"
          options={STATUSES.map((s) => ({ value: s.id, label: s.label }))}
        />

        <Textarea
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Added to the history of every selected case."
        />
      </div>
    </Modal>
  );
}

export default BulkEditModal;
