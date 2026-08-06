/**
 * Case administration: queues, assignment reasons and CSV uploads.
 *
 * Queues and assignment reasons start from brand.config (they are tenant
 * configuration) and are then editable at runtime within the session.
 */

import { request } from '@/services/apiClient';
import brand from '@/brand/brand.config';
import { BULK_ACTION_HISTORY, UPLOAD_HISTORY, buildUploadSchema } from '@/data/admin.seed';
import { listAllCases } from '@/services/cases.service';
import { totalsByQueue } from '@/domain/metrics';
import { CURRENT_USER } from '@/data/users.seed';

let queues = brand.queues.map((q) => ({ ...q, enabled: true }));
let assignmentReasons = brand.assignmentReasons.map((r) => ({ ...r, enabled: true }));
let uploads = UPLOAD_HISTORY.map((u) => ({ ...u }));
let bulkHistory = BULK_ACTION_HISTORY.map((b) => ({ ...b }));

/* --- Queues ---------------------------------------------------------- */

export async function listQueues() {
  const cases = await listAllCases();
  const depths = totalsByQueue(cases);

  return request('/queues', {
    fallback: () =>
      queues.map((queue) => {
        const stats = depths.find((d) => d.id === queue.id);
        return { ...queue, depth: stats?.depth ?? 0, overdue: stats?.overdue ?? 0, value: stats?.value ?? 0 };
      }),
  });
}

export function saveQueue(queue) {
  return request(queue.id ? `/queues/${queue.id}` : '/queues', {
    method: queue.id ? 'PATCH' : 'POST',
    body: queue,
    fallback: () => {
      if (queue.id && queues.some((q) => q.id === queue.id)) {
        queues = queues.map((q) => (q.id === queue.id ? { ...q, ...queue } : q));
        return queues.find((q) => q.id === queue.id);
      }
      const created = { ...queue, id: queue.id || `queue_${Date.now()}`, enabled: true };
      queues = [...queues, created];
      return created;
    },
    delay: 260,
  });
}

export function deleteQueue(queueId) {
  return request(`/queues/${queueId}`, {
    method: 'DELETE',
    fallback: () => {
      queues = queues.filter((q) => q.id !== queueId);
      return null;
    },
    delay: 220,
  });
}

/* --- Assignment reasons ----------------------------------------------- */

export function listAssignmentReasons() {
  return request('/assignment-reasons', { fallback: () => assignmentReasons.map((r) => ({ ...r })) });
}

export function saveAssignmentReason(reason) {
  return request(reason.id ? `/assignment-reasons/${reason.id}` : '/assignment-reasons', {
    method: reason.id ? 'PATCH' : 'POST',
    body: reason,
    fallback: () => {
      if (reason.id && assignmentReasons.some((r) => r.id === reason.id)) {
        assignmentReasons = assignmentReasons.map((r) => (r.id === reason.id ? { ...r, ...reason } : r));
        return assignmentReasons.find((r) => r.id === reason.id);
      }
      const created = { ...reason, id: reason.id || `reason_${Date.now()}`, enabled: true };
      assignmentReasons = [...assignmentReasons, created];
      return created;
    },
    delay: 240,
  });
}

export function deleteAssignmentReason(reasonId) {
  return request(`/assignment-reasons/${reasonId}`, {
    method: 'DELETE',
    fallback: () => {
      assignmentReasons = assignmentReasons.filter((r) => r.id !== reasonId);
      return null;
    },
    delay: 200,
  });
}

/* --- Uploads ----------------------------------------------------------- */

export function listUploads() {
  return request('/uploads', { fallback: () => uploads.map((u) => ({ ...u })) });
}

export function getUploadSchema() {
  return request('/uploads/schema', { fallback: () => buildUploadSchema(brand), delay: 80 });
}

/**
 * Demo import. A real backend parses the file; here we record a plausible
 * result so the history table and the success path are exercised.
 */
export function uploadCases(file) {
  return request('/cases/import', {
    method: 'POST',
    body: { filename: file?.name },
    fallback: () => {
      const rows = 20 + (file?.name?.length ?? 10) * 3;
      const rejected = file?.name?.includes('prearb') ? 2 : 0;

      const record = {
        id: `up_${String(uploads.length + 15).padStart(3, '0')}`,
        filename: file?.name ?? 'upload.csv',
        uploadedAt: new Date().toISOString(),
        uploadedBy: CURRENT_USER.name,
        rows,
        accepted: rows - rejected,
        rejected,
        status: 'completed',
        note: rejected ? `${rejected} rows rejected: unrecognised reason code.` : null,
      };

      uploads = [record, ...uploads];
      return record;
    },
    delay: 900,
  });
}

/* --- Bulk action history ------------------------------------------------ */

export function listBulkActionHistory() {
  return request('/bulk-actions', { fallback: () => bulkHistory.map((b) => ({ ...b })) });
}

export function recordBulkAction({ name, matched, applied }) {
  return request('/bulk-actions', {
    method: 'POST',
    body: { name, matched, applied },
    fallback: () => {
      const record = {
        id: `ba_${Date.now()}`,
        name,
        runAt: new Date().toISOString(),
        runBy: CURRENT_USER.name,
        matched,
        applied,
        status: 'completed',
      };
      bulkHistory = [record, ...bulkHistory];
      return record;
    },
    delay: 300,
  });
}

export default {
  listQueues,
  saveQueue,
  deleteQueue,
  listAssignmentReasons,
  saveAssignmentReason,
  deleteAssignmentReason,
  listUploads,
  getUploadSchema,
  uploadCases,
  listBulkActionHistory,
  recordBulkAction,
};
