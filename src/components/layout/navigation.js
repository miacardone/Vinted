/**
 * NAVIGATION MODEL
 * ================
 * This is the client's edited information architecture, and the edits are as
 * important as the additions. Deliberate differences from the reference
 * product, all of them intentional:
 *
 *   • "Criteria check" is renamed **Rule check** — it checks a rule, not a
 *     criterion, and the old name sent people looking for a criteria editor.
 *   • **No "Case priority" page.** Priority is derived from due date and value
 *     (see domain/statuses.js), so there is nothing to administer.
 *   • **Archived cases is a tab** inside Case management, not a sibling page —
 *     it is the same table with one filter changed.
 *   • **No separate Scheduler page.** A schedule belongs to a report, so it is
 *     the last step of the report builder.
 *   • **Users is one page**, not a dropdown: three tabs, with Users/Roles/Groups
 *     as sub-tabs inside the first.
 *   • **No "Unmatched docs" section** anywhere.
 *
 * Items with `children` render as an expandable group; items without are
 * direct links.
 */

import { ROUTES } from '@/utils/constants';

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    to: ROUTES.dashboard,
  },
  {
    id: 'rules',
    label: 'Rules',
    icon: 'rules',
    children: [
      { id: 'rule-groups', label: 'Rule groups', to: ROUTES.ruleGroups },
      { id: 'bulk-actions', label: 'Bulk actions', to: ROUTES.bulkActions },
      // Renamed from "Criteria check".
      { id: 'rule-check', label: 'Rule check', to: ROUTES.ruleCheck },
    ],
  },
  {
    id: 'case-admin',
    label: 'Case admin',
    icon: 'folder',
    children: [
      { id: 'assignment-reasons', label: 'Assignment reasons', to: ROUTES.assignmentReasons },
      { id: 'queue-management', label: 'Queue management', to: ROUTES.queueManagement },
      { id: 'case-management', label: 'Case management', to: ROUTES.caseManagement },
      { id: 'upload-cases', label: 'Upload cases', to: ROUTES.uploadCases },
    ],
  },
  {
    id: 'work-case',
    label: 'Work case',
    icon: 'briefcase',
    to: ROUTES.workCase,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart',
    children: [
      { id: 'reports-center', label: 'Reports center', to: ROUTES.reportsCenter, end: true },
      { id: 'monitoring', label: 'Monitoring', to: ROUTES.monitoring },
      { id: 'custom-reports', label: 'Custom reports', to: ROUTES.customReports },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    to: ROUTES.users,
  },
  {
    id: 'api-documentation',
    label: 'API documentation',
    icon: 'code',
    to: ROUTES.apiDocumentation,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'cog',
    children: [
      { id: 'account-settings', label: 'Account settings', to: ROUTES.accountSettings },
      { id: 'webhooks', label: 'Webhooks', to: ROUTES.webhooks },
      { id: 'system-preferences', label: 'System preferences', to: ROUTES.systemPreferences },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    icon: 'help',
    to: ROUTES.help,
  },
];

/** Flattened lookup for breadcrumbs and page titles. */
export const NAV_LOOKUP = NAV_ITEMS.flatMap((item) =>
  item.children
    ? item.children.map((child) => ({ ...child, parent: item.label }))
    : [{ ...item, parent: null }],
);

export const titleForPath = (pathname) =>
  NAV_LOOKUP.find((entry) => pathname.startsWith(entry.to))?.label ?? '';
