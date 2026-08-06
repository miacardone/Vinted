/**
 * People, roles, groups, skills and the permission grid.
 *
 * Kept free of case data so cases.seed.js can import analysts without a cycle.
 */

export const ROLES = [
  {
    id: 'analyst',
    label: 'Analyst',
    description: 'Works cases in assigned queues. Cannot change rules or system settings.',
    system: true,
  },
  {
    id: 'senior_analyst',
    label: 'Senior analyst',
    description: 'Works cases and approves write-offs above the risk amount.',
    system: true,
  },
  {
    id: 'team_lead',
    label: 'Team lead',
    description: 'Manages assignment, queues and bulk actions for a group.',
    system: true,
  },
  {
    id: 'rules_admin',
    label: 'Rules administrator',
    description: 'Owns rule groups, routing logic and bulk actions.',
    system: false,
  },
  {
    id: 'read_only',
    label: 'Read only',
    description: 'Reporting access with no write capability anywhere.',
    system: true,
  },
  {
    id: 'admin',
    label: 'Administrator',
    description: 'Full access including users, permissions and system preferences.',
    system: true,
  },
];

export const GROUPS = [
  { id: 'grp_fraud', label: 'Fraud operations', description: 'Fraud reason codes and high-value risk.', memberIds: ['u_02', 'u_05', 'u_09'] },
  { id: 'grp_consumer', label: 'Consumer disputes', description: 'Not received, not as described, credit not processed.', memberIds: ['u_01', 'u_03', 'u_06', 'u_10'] },
  { id: 'grp_authenticity', label: 'Authenticity', description: 'Counterfeit escalations and brand referrals.', memberIds: ['u_04', 'u_08'] },
  { id: 'grp_prearb', label: 'Pre-arbitration', description: 'Second presentments and pre-arb responses.', memberIds: ['u_05', 'u_07'] },
];

export const SKILLS = [
  { id: 'sk_visa', label: 'Visa reason codes', description: 'Certified on the Visa Claims Resolution rulebook.', holders: ['u_01', 'u_02', 'u_05', 'u_07', 'u_09'] },
  { id: 'sk_mc', label: 'Mastercard reason codes', description: 'Certified on Mastercard Chargeback Guide cycles.', holders: ['u_02', 'u_03', 'u_05', 'u_08'] },
  { id: 'sk_auth', label: 'Authentication review', description: 'Trained to assess authenticity reports.', holders: ['u_04', 'u_08', 'u_10'] },
  { id: 'sk_prearb', label: 'Pre-arbitration', description: 'Authorised to file pre-arbitration responses.', holders: ['u_05', 'u_07'] },
  { id: 'sk_fr', label: 'French', description: 'Case correspondence in French.', holders: ['u_01', 'u_06'] },
  { id: 'sk_de', label: 'German', description: 'Case correspondence in German.', holders: ['u_03', 'u_09'] },
  { id: 'sk_pl', label: 'Polish', description: 'Case correspondence in Polish.', holders: ['u_10'] },
  { id: 'sk_lt', label: 'Lithuanian', description: 'Case correspondence in Lithuanian.', holders: ['u_02', 'u_04'] },
];

/**
 * Permission grid rendered on Users > Permissions. `roles` is a map of
 * roleId -> boolean, which is exactly the shape the toggle grid needs.
 */
export const PERMISSION_GROUPS = [
  {
    id: 'cases',
    label: 'Case handling',
    permissions: [
      {
        id: 'cases.view',
        label: 'View cases',
        roles: { analyst: true, senior_analyst: true, team_lead: true, rules_admin: true, read_only: true, admin: true },
      },
      {
        id: 'cases.work',
        label: 'Work and edit cases',
        roles: { analyst: true, senior_analyst: true, team_lead: true, rules_admin: false, read_only: false, admin: true },
      },
      {
        id: 'cases.decide',
        label: 'Record a decision',
        roles: { analyst: true, senior_analyst: true, team_lead: true, rules_admin: false, read_only: false, admin: true },
      },
      {
        id: 'cases.writeoff_high',
        label: 'Write off above the risk amount',
        roles: { analyst: false, senior_analyst: true, team_lead: true, rules_admin: false, read_only: false, admin: true },
      },
      {
        id: 'cases.bulk_edit',
        label: 'Bulk edit cases',
        roles: { analyst: false, senior_analyst: false, team_lead: true, rules_admin: true, read_only: false, admin: true },
      },
      {
        id: 'cases.upload',
        label: 'Upload cases',
        roles: { analyst: false, senior_analyst: false, team_lead: true, rules_admin: true, read_only: false, admin: true },
      },
    ],
  },
  {
    id: 'rules',
    label: 'Rules and automation',
    permissions: [
      {
        id: 'rules.view',
        label: 'View rule groups',
        roles: { analyst: true, senior_analyst: true, team_lead: true, rules_admin: true, read_only: true, admin: true },
      },
      {
        id: 'rules.edit',
        label: 'Create and edit rules',
        roles: { analyst: false, senior_analyst: false, team_lead: false, rules_admin: true, read_only: false, admin: true },
      },
      {
        id: 'rules.bulk_actions',
        label: 'Run bulk actions',
        roles: { analyst: false, senior_analyst: false, team_lead: true, rules_admin: true, read_only: false, admin: true },
      },
    ],
  },
  {
    id: 'admin',
    label: 'Case administration',
    permissions: [
      {
        id: 'admin.queues',
        label: 'Manage queues',
        roles: { analyst: false, senior_analyst: false, team_lead: true, rules_admin: true, read_only: false, admin: true },
      },
      {
        id: 'admin.assignment_reasons',
        label: 'Manage assignment reasons',
        roles: { analyst: false, senior_analyst: false, team_lead: true, rules_admin: false, read_only: false, admin: true },
      },
      {
        id: 'admin.users',
        label: 'Manage users and roles',
        roles: { analyst: false, senior_analyst: false, team_lead: false, rules_admin: false, read_only: false, admin: true },
      },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    permissions: [
      {
        id: 'reports.view',
        label: 'View reports',
        roles: { analyst: true, senior_analyst: true, team_lead: true, rules_admin: true, read_only: true, admin: true },
      },
      {
        id: 'reports.build',
        label: 'Build custom reports',
        roles: { analyst: false, senior_analyst: true, team_lead: true, rules_admin: true, read_only: false, admin: true },
      },
      {
        id: 'reports.schedule',
        label: 'Schedule report delivery',
        roles: { analyst: false, senior_analyst: false, team_lead: true, rules_admin: true, read_only: false, admin: true },
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    permissions: [
      {
        id: 'settings.webhooks',
        label: 'Manage webhooks',
        roles: { analyst: false, senior_analyst: false, team_lead: false, rules_admin: true, read_only: false, admin: true },
      },
      {
        id: 'settings.system',
        label: 'Edit system preferences',
        roles: { analyst: false, senior_analyst: false, team_lead: false, rules_admin: false, read_only: false, admin: true },
      },
    ],
  },
];

export const USERS = [
  {
    id: 'u_01', name: 'Camille Dubois', email: 'camille.dubois@example.com', initials: 'CD',
    roleId: 'senior_analyst', groupIds: ['grp_consumer'], skillIds: ['sk_visa', 'sk_fr'],
    status: 'active', market: 'FR', lastActiveHours: 1, capacity: 24,
  },
  {
    id: 'u_02', name: 'Lukas Kazlauskas', email: 'lukas.kazlauskas@example.com', initials: 'LK',
    roleId: 'senior_analyst', groupIds: ['grp_fraud'], skillIds: ['sk_visa', 'sk_mc', 'sk_lt'],
    status: 'active', market: 'LT', lastActiveHours: 2, capacity: 24,
  },
  {
    id: 'u_03', name: 'Lena Fischer', email: 'lena.fischer@example.com', initials: 'LF',
    roleId: 'analyst', groupIds: ['grp_consumer'], skillIds: ['sk_mc', 'sk_de'],
    status: 'active', market: 'DE', lastActiveHours: 4, capacity: 20,
  },
  {
    id: 'u_04', name: 'Rasa Butkutė', email: 'rasa.butkute@example.com', initials: 'RB',
    roleId: 'analyst', groupIds: ['grp_authenticity'], skillIds: ['sk_auth', 'sk_lt'],
    status: 'active', market: 'LT', lastActiveHours: 6, capacity: 20,
  },
  {
    id: 'u_05', name: 'Matteo Rossi', email: 'matteo.rossi@example.com', initials: 'MR',
    roleId: 'team_lead', groupIds: ['grp_fraud', 'grp_prearb'], skillIds: ['sk_visa', 'sk_mc', 'sk_prearb'],
    status: 'active', market: 'IT', lastActiveHours: 1, capacity: 16,
  },
  {
    id: 'u_06', name: 'Anouk Bakker', email: 'anouk.bakker@example.com', initials: 'AB',
    roleId: 'analyst', groupIds: ['grp_consumer'], skillIds: ['sk_fr'],
    status: 'active', market: 'NL', lastActiveHours: 3, capacity: 20,
  },
  {
    id: 'u_07', name: 'Petr Svoboda', email: 'petr.svoboda@example.com', initials: 'PS',
    roleId: 'senior_analyst', groupIds: ['grp_prearb'], skillIds: ['sk_visa', 'sk_prearb'],
    status: 'active', market: 'CZ', lastActiveHours: 9, capacity: 18,
  },
  {
    id: 'u_08', name: 'Alba García', email: 'alba.garcia@example.com', initials: 'AG',
    roleId: 'analyst', groupIds: ['grp_authenticity'], skillIds: ['sk_mc', 'sk_auth'],
    status: 'active', market: 'ES', lastActiveHours: 5, capacity: 20,
  },
  {
    id: 'u_09', name: 'Jonas Weber', email: 'jonas.weber@example.com', initials: 'JW',
    roleId: 'analyst', groupIds: ['grp_fraud'], skillIds: ['sk_visa', 'sk_de'],
    status: 'suspended', market: 'DE', lastActiveHours: 220, capacity: 0,
  },
  {
    id: 'u_10', name: 'Zofia Nowak', email: 'zofia.nowak@example.com', initials: 'ZN',
    roleId: 'analyst', groupIds: ['grp_consumer'], skillIds: ['sk_auth', 'sk_pl'],
    status: 'active', market: 'PL', lastActiveHours: 2, capacity: 20,
  },
  {
    id: 'u_11', name: 'Hugo Ferreira', email: 'hugo.ferreira@example.com', initials: 'HF',
    roleId: 'rules_admin', groupIds: [], skillIds: ['sk_visa', 'sk_mc'],
    status: 'active', market: 'PT', lastActiveHours: 12, capacity: 0,
  },
  {
    id: 'u_12', name: 'Marta Ortega', email: 'marta.ortega@example.com', initials: 'MO',
    roleId: 'read_only', groupIds: [], skillIds: [],
    status: 'active', market: 'ES', lastActiveHours: 48, capacity: 0,
  },
];

/** Only people who actually take case assignments. */
export const ASSIGNABLE_ANALYSTS = USERS.filter(
  (u) => u.status === 'active' && u.capacity > 0,
);

export const getUser = (id) => USERS.find((u) => u.id === id) ?? null;
export const getRole = (id) => ROLES.find((r) => r.id === id) ?? null;

/** The signed-in demo operator. */
export const CURRENT_USER = {
  id: 'u_05',
  name: 'Matteo Rossi',
  initials: 'MR',
  email: 'matteo.rossi@example.com',
  roleId: 'admin',
  roleLabel: 'Administrator',
};
