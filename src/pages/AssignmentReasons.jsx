import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Textarea, TextInput } from '@/components/ui/Field';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { deleteAssignmentReason, listAssignmentReasons, saveAssignmentReason } from '@/services/admin.service';

export function AssignmentReasons() {
  const { notify } = useToast();
  const { data, status, error, run } = useAsync(listAssignmentReasons, []);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveAssignmentReason(editing);
      notify(editing.id ? 'Assignment reason updated.' : 'Assignment reason added.', 'success');
      setEditing(null);
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not save.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (reason) => {
    try {
      await deleteAssignmentReason(reason.id);
      notify(`“${reason.label}” removed.`, 'success');
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not remove.', 'danger');
    }
  };

  return (
    <>
      <PageHeader
        title="Assignment reasons"
        subtitle="The reasons an analyst can pick when a case changes hands. Recorded against every assignment so routing stays auditable."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing({ label: '', description: '' })}>
            Add reason
          </Button>
        }
      />

      <Card>
        <CardHead title="Reasons" subtitle={data ? `${data.length} configured` : undefined} />

        <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={5} />}>
          {data && (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th>Description</th>
                    <th style={{ width: 90 }}>Status</th>
                    <th style={{ width: 96 }} />
                  </tr>
                </thead>
                <tbody>
                  {data.map((reason) => (
                    <tr key={reason.id}>
                      <td className="strong small">{reason.label}</td>
                      <td className="small muted">{reason.description}</td>
                      <td>
                        <Badge tone={reason.enabled ? 'success' : 'muted'}>
                          {reason.enabled ? 'Active' : 'Off'}
                        </Badge>
                      </td>
                      <td>
                        <div className="row row--tight row--nowrap">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(reason)} aria-label="Edit">
                            <Icon name="edit" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => remove(reason)} aria-label="Remove">
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
        title={editing?.id ? 'Edit assignment reason' : 'Add assignment reason'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!editing?.label?.trim() || saving}>
              {saving ? 'Saving…' : 'Save reason'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="stack">
            <TextInput
              label="Label"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. Workload balancing"
            />
            <Textarea
              label="Description"
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={3}
              placeholder="When should an analyst pick this reason?"
            />
          </div>
        )}
      </Modal>
    </>
  );
}

export default AssignmentReasons;
