/**
 * Case reads and writes.
 *
 * Every function here goes through request(). When VITE_API_BASE_URL is set
 * the path is called for real; when it is empty the `fallback` resolver serves
 * the demo book. No component imports the seed data directly, so switching to
 * a live backend is a config change rather than a refactor.
 *
 * Demo mutations are applied to an in-memory copy of the book so the UI behaves
 * like a real system within a session — change a status, and it stays changed
 * until reload.
 */

import { request } from '@/services/apiClient';
import { CASES } from '@/data/cases.seed';
import { buildConsolidationGroups, consolidationStats, indexGroupsByCase } from '@/domain/consolidation';
import { matchCases } from '@/domain/criteria';
import { getResolution, isClosed } from '@/domain/statuses';
import { CURRENT_USER } from '@/data/users.seed';

/** Session-scoped working copy. Reload restores the seeded book. */
let book = CASES.map((c) => ({ ...c }));

/** Consolidation is derived, so it is rebuilt whenever the book changes. */
let groupsCache = null;
let indexCache = null;

function ensureGroups() {
  if (!groupsCache) {
    groupsCache = buildConsolidationGroups(book);
    indexCache = indexGroupsByCase(groupsCache);
  }
  return { groups: groupsCache, index: indexCache };
}

function invalidateGroups() {
  groupsCache = null;
  indexCache = null;
}

const clone = (c) => ({ ...c });

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

const matchesSearch = (c, term) => {
  if (!term) return true;
  const needle = term.toLowerCase().trim();
  return [
    c.id,
    c.card?.arn,
    c.card?.acquirerCaseId,
    c.card?.cardholder,
    c.order?.id,
    c.item?.title,
    c.buyer?.name,
    c.seller?.name,
    c.seller?.handle,
    c.reasonCode,
    c.reasonLabel,
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(needle));
};

function applyFilters(cases, filters = {}) {
  const {
    caseType,
    statuses = [],
    queueIds = [],
    assigneeIds = [],
    schemeIds = [],
    reasonCodes = [],
    entityIds = [],
    markets = [],
    tab = 'open',
    search = '',
    amountMin,
    amountMax,
    dueWithinDays,
  } = filters;

  return cases.filter((c) => {
    if (tab === 'open' && isClosed(c.status)) return false;
    if (tab === 'archived' && !isClosed(c.status)) return false;

    if (caseType && caseType !== 'all' && c.caseType !== caseType) return false;
    if (statuses.length && !statuses.includes(c.status)) return false;
    if (queueIds.length && !queueIds.includes(c.queueId)) return false;
    if (assigneeIds.length) {
      const key = c.assigneeId ?? 'unassigned';
      if (!assigneeIds.includes(key)) return false;
    }
    if (schemeIds.length && !schemeIds.includes(c.schemeId)) return false;
    if (reasonCodes.length && !reasonCodes.includes(c.reasonCode)) return false;
    if (entityIds.length && !entityIds.includes(c.entityId)) return false;
    if (markets.length && !markets.includes(c.market)) return false;
    if (amountMin != null && amountMin !== '' && c.amount < Number(amountMin)) return false;
    if (amountMax != null && amountMax !== '' && c.amount > Number(amountMax)) return false;

    if (dueWithinDays != null && dueWithinDays !== '') {
      const days = (new Date(c.dueAt) - Date.now()) / 86_400_000;
      if (days > Number(dueWithinDays)) return false;
    }

    return matchesSearch(c, search);
  });
}

function applySort(cases, sort = { field: 'dueAt', direction: 'asc' }) {
  const { field, direction } = sort;
  const dir = direction === 'desc' ? -1 : 1;

  return [...cases].sort((a, b) => {
    let av = a[field];
    let bv = b[field];

    if (field === 'dueAt' || field === 'presentedAt') {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    }
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });
}

export function listCases({ filters = {}, sort, page = 1, pageSize = 25 } = {}) {
  return request('/cases', {
    fallback: () => {
      const filtered = applySort(applyFilters(book, filters), sort);
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize).map(clone),
        meta: {
          page,
          pageSize,
          total: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      };
    },
  });
}

/** The whole book, unpaginated — for charts, rule previews and match counts. */
export function listAllCases() {
  return request('/cases?pageSize=all', { fallback: () => book.map(clone), delay: 120 });
}

export function getCase(caseId) {
  return request(`/cases/${caseId}`, {
    fallback: () => {
      const found = book.find((c) => c.id === caseId);
      return found ? clone(found) : null;
    },
  });
}

/** The bench: what this analyst should work next, due date first. */
export function listBench({ assigneeId = CURRENT_USER.id, limit = 12 } = {}) {
  return request('/cases/bench', {
    fallback: () =>
      book
        .filter((c) => !isClosed(c.status))
        .filter((c) => c.assigneeId === assigneeId || !c.assigneeId)
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
        .slice(0, limit)
        .map(clone),
    delay: 140,
  });
}

/* ------------------------------------------------------------------ *
 * Consolidation
 * ------------------------------------------------------------------ */

export function getConsolidationForCase(caseId) {
  return request(`/cases/${caseId}/consolidation`, {
    fallback: () => {
      const { index } = ensureGroups();
      return { groups: index.get(caseId) ?? [] };
    },
    delay: 160,
  });
}

export function getConsolidationOverview() {
  return request('/consolidation', {
    fallback: () => {
      const { groups } = ensureGroups();
      return { groups, stats: consolidationStats(book, groups) };
    },
    delay: 180,
  });
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

function mutate(caseId, changes, historyEntry) {
  const index = book.findIndex((c) => c.id === caseId);
  if (index === -1) return null;

  const current = book[index];
  const next = {
    ...current,
    ...changes,
    updatedAt: new Date().toISOString(),
    history: historyEntry
      ? [...current.history, { id: `${caseId}-EV-${current.history.length + 1}`, at: new Date().toISOString(), actor: CURRENT_USER.name, ...historyEntry }]
      : current.history,
  };

  book[index] = next;
  // Status, queue and assignment all feed consolidation's open-only filter.
  invalidateGroups();
  return next;
}

export function updateCase(caseId, changes) {
  return request(`/cases/${caseId}`, {
    method: 'PATCH',
    body: changes,
    fallback: () => {
      const updated = mutate(caseId, changes, {
        action: 'Case updated',
        detail: Object.entries(changes)
          .map(([key, value]) => `${key} → ${value}`)
          .join(', '),
      });
      return updated ? clone(updated) : null;
    },
    delay: 220,
  });
}

export function bulkUpdateCases(caseIds, changes) {
  return request('/cases/bulk', {
    method: 'POST',
    body: { caseIds, changes },
    fallback: () => {
      const results = caseIds.map((id) => {
        const updated = mutate(id, changes, {
          action: 'Bulk edit applied',
          detail: Object.entries(changes)
            .map(([key, value]) => `${key} → ${value}`)
            .join(', '),
        });
        return { id, ok: Boolean(updated) };
      });
      return { applied: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
    },
    delay: 420,
  });
}

export function recordDecision(caseId, { resolution, amount, note }) {
  return request(`/cases/${caseId}/decision`, {
    method: 'POST',
    body: { resolution, amount, note },
    fallback: () => {
      const spec = getResolution(resolution);
      const updated = mutate(
        caseId,
        {
          status: spec?.nextStatus ?? 'working',
          resolution: {
            id: resolution,
            recordedAt: new Date().toISOString(),
            recordedBy: CURRENT_USER.name,
            amount: amount ?? null,
            note: note ?? null,
          },
        },
        { action: 'Decision recorded', detail: `${spec?.label ?? resolution}${note ? ` — ${note}` : ''}` },
      );
      return updated ? clone(updated) : null;
    },
    delay: 380,
  });
}

export function addNote(caseId, body) {
  return request(`/cases/${caseId}/notes`, {
    method: 'POST',
    body: { body },
    fallback: () => {
      const current = book.find((c) => c.id === caseId);
      if (!current) return null;
      const note = {
        id: `${caseId}-NOTE-${current.notes.length + 1}`,
        body,
        author: CURRENT_USER.name,
        at: new Date().toISOString(),
        pinned: false,
      };
      const updated = mutate(caseId, { notes: [...current.notes, note] }, { action: 'Note added', detail: body.slice(0, 80) });
      return updated ? clone(updated) : null;
    },
    delay: 240,
  });
}

/** Live match count for the bulk-action wizard — real criteria, real book. */
export function previewBulkAction(criteria, matchType = 'all') {
  return request('/bulk-actions/preview', {
    method: 'POST',
    body: { criteria, matchType },
    fallback: () => {
      const matched = matchCases(book, criteria, matchType);
      return {
        matched: matched.length,
        total: book.length,
        sample: matched.slice(0, 8).map(clone),
      };
    },
    delay: 160,
  });
}

export default {
  listCases,
  listAllCases,
  getCase,
  listBench,
  getConsolidationForCase,
  getConsolidationOverview,
  updateCase,
  bulkUpdateCases,
  recordDecision,
  addNote,
  previewBulkAction,
};
