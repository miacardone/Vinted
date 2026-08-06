/**
 * Case lifecycle vocabulary.
 *
 * Statuses are operational rather than tenant-specific — an acquirer and a
 * marketplace both need "pended" to mean the same thing — so they live here
 * rather than in brand.config. Labels are still swappable if a tenant ever
 * disagrees; the ids are what the data and the rules engine key on.
 */

export const STATUSES = [
  { id: 'open', label: 'Open', tone: 'neutral', stage: 'intake', description: 'Received, not yet triaged.' },
  { id: 'ready', label: 'Ready', tone: 'info', stage: 'intake', description: 'Triaged and eligible for assignment.' },
  { id: 'assigned', label: 'Assigned', tone: 'info', stage: 'active', description: 'Owned by an analyst, not yet started.' },
  { id: 'working', label: 'Working', tone: 'primary', stage: 'active', description: 'Actively being worked.' },
  { id: 'pended', label: 'Pended', tone: 'warning', stage: 'active', description: 'Waiting on a third party.' },
  { id: 'represented', label: 'Represented', tone: 'primary', stage: 'submitted', description: 'Response submitted to the scheme.' },
  { id: 'completed', label: 'Completed', tone: 'success', stage: 'closed', description: 'Resolved in our favour or accepted.' },
  { id: 'rejected', label: 'Rejected', tone: 'danger', stage: 'closed', description: 'Representment declined by the issuer.' },
  { id: 'expired', label: 'Expired', tone: 'danger', stage: 'closed', description: 'Response window elapsed.' },
  { id: 'writtenOff', label: 'Written off', tone: 'muted', stage: 'closed', description: 'Accepted the loss deliberately.' },
];

export const STATUS_IDS = STATUSES.map((s) => s.id);

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

export const getStatus = (id) => STATUS_MAP[id] ?? { id, label: id, tone: 'neutral', stage: 'active' };

export const statusLabel = (id) => getStatus(id).label;

export const statusTone = (id) => getStatus(id).tone;

/** Closed statuses are what the Archived tab shows; everything else is Open. */
export const CLOSED_STATUSES = STATUSES.filter((s) => s.stage === 'closed').map((s) => s.id);

export const isClosed = (statusId) => CLOSED_STATUSES.includes(statusId);

export const isOpenStatus = (statusId) => !isClosed(statusId);

/** Statuses that still consume analyst capacity — drives workload counts. */
export const ACTIVE_STATUSES = ['assigned', 'working', 'pended'];

/* ------------------------------------------------------------------ *
 * Resolutions
 * ------------------------------------------------------------------ */

export const RESOLUTIONS = [
  {
    id: 'represent',
    label: 'Represent',
    tone: 'primary',
    nextStatus: 'represented',
    description: 'Defend the transaction with compelling evidence.',
    requiresAmount: false,
  },
  {
    id: 'write_off',
    label: 'Write off',
    tone: 'muted',
    nextStatus: 'writtenOff',
    description: 'Accept the loss — recovery is not worth the handling cost.',
    requiresAmount: false,
  },
  {
    id: 'split',
    label: 'Split / partial',
    tone: 'warning',
    nextStatus: 'represented',
    description: 'Defend part of the amount and concede the rest.',
    requiresAmount: true,
  },
  {
    id: 'refund',
    label: 'Refund',
    tone: 'info',
    nextStatus: 'completed',
    description: 'Refund the buyer in full and close the case.',
    requiresAmount: false,
  },
  {
    id: 'request_info',
    label: 'Request info',
    tone: 'warning',
    nextStatus: 'pended',
    description: 'Pend the case pending documents from a third party.',
    requiresAmount: false,
  },
];

const RESOLUTION_MAP = Object.fromEntries(RESOLUTIONS.map((r) => [r.id, r]));

export const getResolution = (id) => RESOLUTION_MAP[id] ?? null;

/* ------------------------------------------------------------------ *
 * Priority — derived, never stored
 * ------------------------------------------------------------------ *
 * There is no "Case priority" admin page in this build (the client removed
 * it), so priority is computed from the due date and the risk amount instead
 * of being a field somebody has to maintain.
 */

export const PRIORITY_BANDS = [
  { id: 'critical', label: 'Critical', tone: 'danger' },
  { id: 'high', label: 'High', tone: 'warning' },
  { id: 'normal', label: 'Normal', tone: 'neutral' },
  { id: 'low', label: 'Low', tone: 'muted' },
];

export function priorityOf(caseRecord, riskAmount = 250) {
  if (!caseRecord?.dueAt) return 'low';
  const hours = (new Date(caseRecord.dueAt).getTime() - Date.now()) / 3600000;
  const highValue = (caseRecord.amount ?? 0) >= riskAmount;

  if (hours <= 24) return 'critical';
  if (hours <= 72) return highValue ? 'critical' : 'high';
  if (hours <= 168) return highValue ? 'high' : 'normal';
  return 'low';
}
