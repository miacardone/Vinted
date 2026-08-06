import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import { Textarea, TextInput } from '@/components/ui/Field';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { deleteQueue, listQueues, saveQueue } from '@/services/admin.service';
import { formatMoney, formatNumber } from '@/utils/format';

export function QueueManagement() {
  const { notify } = useToast();
  const { data, status, error, run } = useAsync(listQueues, []);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveQueue({ ...editing, sla: Number(editing.sla) || 24 });
      notify(editing.id ? 'Queue updated.' : 'Queue created.', 'success');
      setEditing(null);
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not save the queue.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (queue) => {
    if (queue.depth > 0) {
      notify(`“${queue.label}” still holds ${formatNumber(queue.depth)} open cases — move them first.`, 'warning');
      return;
    }
    try {
      await deleteQueue(queue.id);
      notify(`“${queue.label}” removed.`, 'success');
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not remove the queue.', 'danger');
    }
  };

  const maxDepth = Math.max(1, ...(data ?? []).map((q) => q.depth));

  return (
    <>
      <PageHeader
        title="Queue management"
        subtitle="Queues, their service targets, and how much work is sitting in each right now."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing({ label: '', description: '', sla: 48 })}>
            Add queue
          </Button>
        }
      />

      <Card>
        <CardHead title="Queues" subtitle={data ? `${data.length} configured` : undefined} />

        <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={6} />}>
          {data && (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Queue</th>
                    <th style={{ width: 200 }}>Depth</th>
                    <th className="tbl__right">Overdue</th>
                    <th className="tbl__right">Exposure</th>
                    <th className="tbl__right">SLA</th>
                    <th style={{ width: 96 }} />
                  </tr>
                </thead>
                <tbody>
                  {data.map((queue) => (
                    <tr key={queue.id}>
                      <td>
                        <span className="stack" style={{ gap: 1 }}>
                          <span className="strong small">{queue.label}</span>
                          <span className="micro faint">{queue.description}</span>
                        </span>
                      </td>
                      <td>
                        <div className="row row--tight row--nowrap">
                          <div className="meter" style={{ flex: 1 }}>
                            <div
                              className="meter__fill"
                              style={{ width: `${(queue.depth / maxDepth) * 100}%` }}
                            />
                          </div>
                          <span className="mono small" style={{ width: 28, textAlign: 'right' }}>
                            {formatNumber(queue.depth)}
                          </span>
                        </div>
                      </td>
                      <td className="tbl__right mono small" style={queue.overdue ? { color: 'var(--c-danger)' } : undefined}>
                        {formatNumber(queue.overdue)}
                      </td>
                      <td className="tbl__right mono small">{formatMoney(queue.value)}</td>
                      <td className="tbl__right mono small">{queue.sla}h</td>
                      <td>
                        <div className="row row--tight row--nowrap">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(queue)} aria-label="Edit">
                            <Icon name="edit" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => remove(queue)} aria-label="Remove">
                            <Icon name="trash" size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncBoundary>
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit queue' : 'Add queue'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!editing?.label?.trim() || saving}>
              {saving ? 'Saving…' : 'Save queue'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="stack">
            <TextInput
              label="Queue name"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. Counterfeit and IP"
            />
            <Textarea
              label="Description"
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={2}
            />
            <TextInput
              label="Service target (hours)"
              type="number"
              min="1"
              value={editing.sla ?? ''}
              onChange={(e) => setEditing({ ...editing, sla: e.target.value })}
              hint="How long a case may sit in this queue before it is late."
            />
          </div>
        )}
      </Modal>
    </>
  );
}

export default QueueManagement;
