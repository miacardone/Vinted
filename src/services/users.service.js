/**
 * Users, roles, groups, skills and the permission matrix.
 */

import { request } from '@/services/apiClient';
import { GROUPS, PERMISSION_GROUPS, ROLES, SKILLS, USERS } from '@/data/users.seed';

let users = USERS.map((u) => ({ ...u }));
let groups = GROUPS.map((g) => ({ ...g }));
let skills = SKILLS.map((s) => ({ ...s }));
let permissionGroups = PERMISSION_GROUPS.map((pg) => ({
  ...pg,
  permissions: pg.permissions.map((p) => ({ ...p, roles: { ...p.roles } })),
}));

export function listUsers() {
  return request('/users', { fallback: () => users.map((u) => ({ ...u })) });
}

export function listRoles() {
  return request('/roles', { fallback: () => ROLES.map((r) => ({ ...r })) });
}

export function listGroups() {
  return request('/groups', { fallback: () => groups.map((g) => ({ ...g })) });
}

export function listSkills() {
  return request('/skills', { fallback: () => skills.map((s) => ({ ...s })) });
}

export function listPermissions() {
  return request('/permissions', { fallback: () => permissionGroups });
}

export function saveUser(user) {
  return request(user.id ? `/users/${user.id}` : '/users', {
    method: user.id ? 'PATCH' : 'POST',
    body: user,
    fallback: () => {
      if (user.id && users.some((u) => u.id === user.id)) {
        users = users.map((u) => (u.id === user.id ? { ...u, ...user } : u));
        return users.find((u) => u.id === user.id);
      }
      const created = {
        status: 'active',
        groupIds: [],
        skillIds: [],
        capacity: 20,
        lastActiveHours: 0,
        ...user,
        id: `u_${String(users.length + 1).padStart(2, '0')}`,
        initials: (user.name ?? '?')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase(),
      };
      users = [...users, created];
      return created;
    },
    delay: 300,
  });
}

export function setPermission(permissionId, roleId, allowed) {
  return request(`/permissions/${permissionId}`, {
    method: 'PATCH',
    body: { roleId, allowed },
    fallback: () => {
      permissionGroups = permissionGroups.map((group) => ({
        ...group,
        permissions: group.permissions.map((p) =>
          p.id === permissionId ? { ...p, roles: { ...p.roles, [roleId]: allowed } } : p,
        ),
      }));
      return { permissionId, roleId, allowed };
    },
    delay: 180,
  });
}

export function saveSkill(skill) {
  return request(skill.id ? `/skills/${skill.id}` : '/skills', {
    method: skill.id ? 'PATCH' : 'POST',
    body: skill,
    fallback: () => {
      if (skill.id && skills.some((s) => s.id === skill.id)) {
        skills = skills.map((s) => (s.id === skill.id ? { ...s, ...skill } : s));
        return skills.find((s) => s.id === skill.id);
      }
      const created = { holders: [], ...skill, id: `sk_${Date.now()}` };
      skills = [...skills, created];
      return created;
    },
    delay: 260,
  });
}

export function saveGroup(group) {
  return request(group.id ? `/groups/${group.id}` : '/groups', {
    method: group.id ? 'PATCH' : 'POST',
    body: group,
    fallback: () => {
      if (group.id && groups.some((g) => g.id === group.id)) {
        groups = groups.map((g) => (g.id === group.id ? { ...g, ...group } : g));
        return groups.find((g) => g.id === group.id);
      }
      const created = { memberIds: [], ...group, id: `grp_${Date.now()}` };
      groups = [...groups, created];
      return created;
    },
    delay: 260,
  });
}

export default {
  listUsers,
  listRoles,
  listGroups,
  listSkills,
  listPermissions,
  saveUser,
  setPermission,
  saveSkill,
  saveGroup,
};
