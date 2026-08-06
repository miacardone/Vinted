import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Checkbox, TextInput } from '@/components/ui/Field';
import { AsyncBoundary, EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { deleteWebhook, listWebhookTopics, listWebhooks, saveWebhook } from '@/services/system.service';
import { formatNumber, relativeTime } from '@/utils/format';

const EMPTY = { name: '', url: '', topics: [] };

export function Webhooks() {
  const { notify } = useToast();
  const { data: webhooks, status, error, run } = useAsync(listWebhooks, []);
  const { data: topics } = useAsync(listWebhookTopics, []);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveWebhook(editing);
      notify(editing.id ? 'Webhook updated.' : 'Webhook created.', 'success');
      setEditing(null);
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not save the webhook.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (webhook) => {
    try {
      await deleteWebhook(webhook.id);
      notify(`“${webhook.name}” deleted.`, 'success');
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not delete the webhook.', 'danger');
    }
  };

  const validUrl = editing?.url?.startsWith('https://');

  return (
    <>
      <PageHeader
        title="Webhooks"
        subtitle="Push case events to your own systems. Deliveries retry with backoff and are recorded per endpoint."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing({ ...EMPTY })}>
            Add webhook
          </Button>
        }
      />

      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={4} />}>
        {webhooks && (
          <Card>
            {webhooks.length === 0 ? (
              <EmptyState
                icon="link"
                title="No webhooks configured"
                body="Register an endpoint to receive case events — new cases, status changes, overdue warnings and consolidation alerts."
                action={{ label: 'Add webhook', icon: 'plus', onClick: () => setEditing({ ...EMPTY }) }}
              />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Endpoint</th>
                      <th>Topics</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th className="tbl__right">Last delivery</th>
                      <th className="tbl__right">Failures 24h</th>
                      <th style={{ width: 96 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((webhook) => (
                      <tr key={webhook.id}>
                        <td>
                          <span className="stack" style={{ gap: 1 }}>
                            <span className="small strong">{webhook.name}</span>
                            <span className="micro faint mono truncate">{webhook.url}</span>
                          </span>
                        </td>
                        <td>
                          <span className="chip-row">
                            {webhook.topics.map((topic) => (
                              <span key={topic} className="chip">
                                {topic}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td>
                          <span className="row row--tight">
                            <span className={`status-dot status-dot--${webhook.status}`} />
                            <span className="small">{webhook.status}</span>
                          </span>
                        </td>
                        <td className="tbl__right micro faint nowrap">
                          {webhook.lastDeliveryAt ? relativeTime(webhook.lastDeliveryAt) : 'Never'}
                          {webhook.lastStatus && (
                            <span className="mono"> · {webhook.lastStatus}</span>
                          )}
                        </td>
                        <td
                          className="tbl__right mono small"
                          style={webhook.failures24h ? { color: 'var(--c-danger)' } : undefined}
                        >
                          {formatNumber(webhook.failures24h)}
                        </td>
                        <td>
                          <div className="row row--tight row--nowrap">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(webhook)} aria-label="Edit">
                              <Icon name="edit" size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => remove(webhook)} aria-label="Delete">
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
          </Card>
        )}
      </AsyncBoundary>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit webhook' : 'Add webhook'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={save}
              disabled={!editing?.name?.trim() || !validUrl || !editing?.topics?.length || saving}
            >
              {saving ? 'Saving…' : 'Save webhook'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="stack">
            <TextInput
              label="Name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Ops alerting"
            />
            <TextInput
              label="Endpoint URL"
              value={editing.url}
              onChange={(e) => setEditing({ ...editing, url: e.target.value })}
              placeholder="https://hooks.example.com/disputes"
              hint="Must be HTTPS."
              error={editing.url && !validUrl ? 'The endpoint must use HTTPS.' : undefined}
            />

            <div className="field">
              <span className="field__label">Topics</span>
              <div className="stack stack--tight">
                {(topics ?? []).map((topic) => (
                  <Checkbox
                    key={topic.id}
                    label={topic.label}
                    description={topic.description}
                    checked={editing.topics.includes(topic.id)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        topics: e.target.checked
                          ? [...editing.topics, topic.id]
                          : editing.topics.filter((t) => t !== topic.id),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default Webhooks;
