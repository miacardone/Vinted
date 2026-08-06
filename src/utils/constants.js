/**
 * Route table.
 *
 * Mirrors the navigation exactly as specified — including the deliberate
 * omissions: no Case priority page, no separate Scheduler, no Unmatched docs,
 * and Users is a single route rather than a dropdown.
 */

export const ROUTES = {
  login: '/login',

  dashboard: '/dashboard',

  ruleGroups: '/rules/groups',
  bulkActions: '/rules/bulk-actions',
  ruleCheck: '/rules/check',

  assignmentReasons: '/case-admin/assignment-reasons',
  queueManagement: '/case-admin/queues',
  caseManagement: '/case-admin/cases',
  uploadCases: '/case-admin/upload',

  workCase: '/work-case',
  workCaseDetail: (caseId = ':caseId') => `/work-case/${caseId}`,

  reportsCenter: '/reports',
  monitoring: '/reports/monitoring',
  customReports: '/reports/custom',

  users: '/users',
  apiDocumentation: '/api-documentation',

  accountSettings: '/settings/account',
  webhooks: '/settings/webhooks',
  systemPreferences: '/settings/system',

  help: '/help',
};

export const STORAGE_KEYS = {
  session: 'ddc.session',
  caseFilters: 'ddc.case-filters',
  sidebar: 'ddc.sidebar',
};

export const PAGE_SIZES = [25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

/** Case management tabs. Archived is a tab here, not a separate page. */
export const CASE_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];
