import { Fragment, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Tabs, { SubTabs } from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Select, Textarea, TextInput } from '@/components/ui/Field';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import {
  listGroups,
  listPermissions,
  listRoles,
  listSkills,
  listUsers,
  saveUser,
  setPermission,
} from '@/services/users.service';
import { relativeTime } from '@/utils/format';

/**
 * ONE page, not a dropdown.
 *
 * Three tabs — User management, Skills, Permissions — with Users/Roles/Groups
 * as sub-tabs inside the first. Splitting these across separate nav entries
 * made people hunt for "where do I add a role?"; they are all the same job.
 */
const TABS = [
  { id: 'management', label: 'User management' },
  { id: 'skills', label: 'Skills' },
  { id: 'permissions', label: 'Permissions' },
];

const SUB_TABS = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
  { id: 'groups', label: 'Groups' },
];

const STATUS_TONE = { active: 'success', suspended: 'warning', invited: 'info' };

export function Users() {
  const { notify } = useToast();
  const [tab, setTab] = useState('management');
  const [subTab, setSubTab] = useState('users');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: users, status, error, run: reloadUsers } = useAsync(listUsers, []);
  const { data: roles } = useAsync(listRoles, []);
  const { data: groups } = useAsync(listGroups, []);
  const { data: skills } = useAsync(listSkills, []);
  const { data: permissionGroups, run: reloadPermissions } = useAsync(listPermissions, []);

  const roleLabel = (roleId) => roles?.find((r) => r.id === roleId)?.label ?? roleId;

  const saveUserRecord = async () => {
    setSaving(true);
    try {
      await saveUser(editing);
      notify(editing.id ? 'User updated.' : 'User invited.', 'success');
      setEditing(null);
      await reloadUsers();
    } catch (err) {
      notify(err.message ?? 'Could not save the user.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = async (permissionId, roleId, next) => {
    try {
      await setPermission(permissionId, roleId, next);
      await reloadPermissions();
    } catch (err) {
      notify(err.message ?? 'Could not change the permission.', 'danger');
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="People, what they can do, and what they are trained on."
        actions={
          tab === 'management' &&
          subTab === 'users' && (
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setEditing({ name: '', email: '', roleId: 'analyst', market: '' })}
            >
              Invite user
            </Button>
          )
        }
      />

      <div className="stack">
        <Card>
          <CardBody tight>
            <Tabs
              tabs={TABS.map((t) => (t.id === 'management' ? { ...t, count: users?.length } : t))}
              active={tab}
              onChange={setTab}
            />
            {tab === 'management' && (
              <div style={{ paddingTop: 'var(--s-4)' }}>
                <SubTabs
                  tabs={SUB_TABS.map((t) => ({
                    ...t,
                    count:
                      t.id === 'users' ? users?.length : t.id === 'roles' ? roles?.length : groups?.length,
                  }))}
                  active={subTab}
                  onChange={setSubTab}
                />
              </div>
            )}
          </CardBody>
        </Card>

        <AsyncBoundary status={status} error={error} onRetry={reloadUsers} skeleton={<SkeletonRows rows={6} />}>
          {tab === 'management' && subTab === 'users' && users && (
            <Card>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Groups</th>
                      <th>Market</th>
                      <th style={{ width: 96 }}>Status</th>
                      <th className="tbl__right">Last active</th>
                      <th style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <span className="row row--tight">
                            <span className="avatar avatar--sm">{user.initials}</span>
                            <span className="stack" style={{ gap: 0 }}>
                              <span className="small strong">{user.name}</span>
                              <span className="micro faint">{user.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="small">{roleLabel(user.roleId)}</td>
                        <td className="micro faint">
                          {user.groupIds.length
                            ? user.groupIds.map((id) => groups?.find((g) => g.id === id)?.label).filter(Boolean).join(', ')
                            : '—'}
                        </td>
                        <td className="small mono">{user.market}</td>
                        <td>
                          <Badge tone={STATUS_TONE[user.status] ?? 'neutral'} dot>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="tbl__right micro faint nowrap">
                          {relativeTime(new Date(Date.now() - user.lastActiveHours * 3_600_000).toISOString())}
                        </td>
                        <td>
                          <Button variant="ghost" size="sm" onClick={() => setEditing(user)} aria-label="Edit user">
                            <Icon name="edit" size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'management' && subTab === 'roles' && roles && (
            <Card>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Description</th>
                      <th className="tbl__right">Members</th>
                      <th style={{ width: 90 }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td className="small strong">{role.label}</td>
                        <td className="small muted">{role.description}</td>
                        <td className="tbl__right mono small">
                          {users?.filter((u) => u.roleId === role.id).length ?? 0}
                        </td>
                        <td>
                          <Badge tone={role.system ? 'neutral' : 'primary'}>{role.system ? 'System' : 'Custom'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'management' && subTab === 'groups' && groups && (
            <Card>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Group</th>
                      <th>Description</th>
                      <th className="tbl__right">Members</th>
                      <th>Who</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.id}>
                        <td className="small strong">{group.label}</td>
                        <td className="small muted">{group.description}</td>
                        <td className="tbl__right mono small">{group.memberIds.length}</td>
                        <td>
                          <span className="row row--tight">
                            {group.memberIds.map((id) => (
                              <span key={id} className="avatar avatar--sm" title={users?.find((u) => u.id === id)?.name}>
                                {users?.find((u) => u.id === id)?.initials ?? '?'}
                              </span>
                            ))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'skills' && skills && (
            <Card>
              <CardHead title="Skills" subtitle="What each person is certified or trained to handle. Drives skill-match assignment." />
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Description</th>
                      <th className="tbl__right">Holders</th>
                      <th>Who</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill.id}>
                        <td className="small strong">{skill.label}</td>
                        <td className="small muted">{skill.description}</td>
                        <td className="tbl__right mono small">{skill.holders.length}</td>
                        <td>
                          <span className="row row--tight">
                            {skill.holders.map((id) => (
                              <span key={id} className="avatar avatar--sm" title={users?.find((u) => u.id === id)?.name}>
                                {users?.find((u) => u.id === id)?.initials ?? '?'}
                              </span>
                            ))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'permissions' && permissionGroups && roles && (
            <Card>
              <CardHead
                title="Permissions"
                subtitle="What each role may do. Changes take effect on the next sign-in."
              />
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 260 }}>Permission</th>
                      {roles.map((role) => (
                        <th key={role.id} className="tbl__right">
                          {role.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionGroups.map((group) => (
                      <Fragment key={group.id}>
                        <tr>
                          <td colSpan={roles.length + 1} style={{ background: 'var(--c-surface-sunken)' }}>
                            <span className="eyebrow">{group.label}</span>
                          </td>
                        </tr>
                        {group.permissions.map((permission) => (
                          <tr key={permission.id}>
                            <td>
                              <span className="stack" style={{ gap: 1 }}>
                                <span className="small">{permission.label}</span>
                                <span className="micro faint mono">{permission.id}</span>
                              </span>
                            </td>
                            {roles.map((role) => (
                              <td key={role.id} className="tbl__right">
                                <input
                                  type="checkbox"
                                  className="toggle"
                                  checked={Boolean(permission.roles[role.id])}
                                  // The admin role is intentionally not editable:
                                  // removing your own access is not a feature.
                                  disabled={role.id === 'admin'}
                                  onChange={(e) => togglePermission(permission.id, role.id, e.target.checked)}
                                  aria-label={`${permission.label} for ${role.label}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </AsyncBoundary>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit user' : 'Invite user'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveUserRecord}
              disabled={!editing?.name?.trim() || !editing?.email?.trim() || saving}
            >
              {saving ? 'Saving…' : editing?.id ? 'Save user' : 'Send invite'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="stack">
            <TextInput
              label="Full name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <TextInput
              label="Email"
              type="email"
              value={editing.email}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
            />
            <Select
              label="Role"
              value={editing.roleId}
              onChange={(e) => setEditing({ ...editing, roleId: e.target.value })}
              options={(roles ?? []).map((r) => ({ value: r.id, label: r.label }))}
            />
            <TextInput
              label="Market"
              value={editing.market ?? ''}
              onChange={(e) => setEditing({ ...editing, market: e.target.value })}
              placeholder="e.g. FR"
            />
          </div>
        )}
      </Modal>
    </>
  );
}

export default Users;
