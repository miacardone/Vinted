import { useMemo, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { TextInput } from '@/components/ui/Field';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { changePassword, getAccount } from '@/services/system.service';
import { formatDateTime, relativeTime } from '@/utils/format';

/**
 * Password policy, validated live.
 *
 * Each rule is a predicate evaluated on every keystroke, so the checklist ticks
 * as you type instead of failing on submit and making you guess which rule you
 * broke.
 */
const POLICY = [
  { id: 'length', label: 'At least 12 characters', test: (v) => v.length >= 12 },
  { id: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'One number', test: (v) => /\d/.test(v) },
  { id: 'symbol', label: 'One symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
  { id: 'nospace', label: 'No leading or trailing spaces', test: (v) => v.length > 0 && v.trim() === v },
];

export function AccountSettings() {
  const { notify } = useToast();
  const { data: account, status, error, run } = useAsync(getAccount, []);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const results = useMemo(() => POLICY.map((rule) => ({ ...rule, met: rule.test(next) })), [next]);
  const allMet = results.every((r) => r.met);
  const matches = next.length > 0 && next === confirm;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      notify('Password changed.', 'success');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      notify(err.message ?? 'Could not change the password.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Account settings" subtitle="Your profile, password and active sessions." />

      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={5} />}>
        {account && (
          <div className="grid grid--split" style={{ alignItems: 'start' }}>
            <div className="stack">
              <Card>
                <CardHead title="Change password" />
                <CardBody>
                  <form className="stack" onSubmit={submit}>
                    <TextInput
                      label="Current password"
                      type="password"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      autoComplete="current-password"
                    />
                    <TextInput
                      label="New password"
                      type="password"
                      value={next}
                      onChange={(e) => setNext(e.target.value)}
                      autoComplete="new-password"
                    />

                    <div className="policy">
                      {results.map((rule) => (
                        <span key={rule.id} className={`policy__item ${rule.met ? 'is-met' : ''}`.trim()}>
                          <span className="policy__marker">
                            <Icon name="check" size={10} strokeWidth={3} />
                          </span>
                          {rule.label}
                        </span>
                      ))}
                    </div>

                    <TextInput
                      label="Confirm new password"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      error={confirm && !matches ? 'Passwords do not match.' : undefined}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!current || !allMet || !matches || saving}
                    >
                      {saving ? 'Saving…' : 'Change password'}
                    </Button>
                  </form>
                </CardBody>
              </Card>

              <Card>
                <CardHead title="Active sessions" />
                <div className="table-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Location</th>
                        <th className="tbl__right">Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.sessions.map((session) => (
                        <tr key={session.id}>
                          <td>
                            <span className="row row--tight">
                              <span className="small">{session.device}</span>
                              {session.current && <Badge tone="primary">This device</Badge>}
                            </span>
                          </td>
                          <td className="small muted">{session.location}</td>
                          <td className="tbl__right micro faint nowrap">{relativeTime(session.lastSeenAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <Card>
              <CardHead title="Profile" />
              <CardBody>
                <div className="stack">
                  <div className="row row--tight">
                    <span className="avatar" style={{ width: 44, height: 44, fontSize: 'var(--fs-small)' }}>
                      {account.initials}
                    </span>
                    <span className="stack" style={{ gap: 1 }}>
                      <span className="strong">{account.name}</span>
                      <span className="micro faint">{account.email}</span>
                    </span>
                  </div>

                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="detail-row__label">Role</span>
                      <span className="detail-row__value small">{account.roleLabel}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Timezone</span>
                      <span className="detail-row__value small">{account.timezone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Locale</span>
                      <span className="detail-row__value mono">{account.locale}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Two-factor</span>
                      <span className="detail-row__value">
                        <Badge tone={account.twoFactorEnabled ? 'success' : 'warning'}>
                          {account.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                        </Badge>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-row__label">Password changed</span>
                      <span className="detail-row__value small">{formatDateTime(account.lastPasswordChangeAt)}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

export default AccountSettings;
