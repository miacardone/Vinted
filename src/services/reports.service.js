/**
 * Reporting: the reports centre rollups, monitoring series, and the saved /
 * scheduled custom reports.
 *
 * There is no separate scheduler endpoint — a schedule is a property of a
 * report, set in the last step of the builder.
 */

import { request } from '@/services/apiClient';
import {
  DISPUTE_OUTCOMES,
  DOCUMENT_PROCESSING,
  ERROR_HANDLING,
  REPORT_ACCESSORS,
  SAVED_REPORTS,
} from '@/data/reports.seed';
import { listAllCases } from '@/services/cases.service';
import {
  analystHandling,
  caseKpis,
  dailyIntake,
  reasonCodeDistribution,
  totalsByDueBucket,
  totalsByQueue,
  totalsByReasonCategory,
  weeklyCaseActivity,
} from '@/domain/metrics';
import { ASSIGNABLE_ANALYSTS, CURRENT_USER } from '@/data/users.seed';
import brand from '@/brand/brand.config';

let savedReports = SAVED_REPORTS.map((r) => ({ ...r }));

/** Everything the dashboard needs, in one round trip. */
export async function getDashboard() {
  const cases = await listAllCases();

  return request('/dashboard', {
    fallback: () => ({
      kpis: caseKpis(cases),
      weeklyActivity: weeklyCaseActivity(cases),
      dailyIntake: dailyIntake(cases),
      analysts: analystHandling(cases, ASSIGNABLE_ANALYSTS),
      reasonDonuts: brand.schemes.map((scheme) => ({
        schemeId: scheme.id,
        schemeLabel: scheme.label,
        colorKey: scheme.colorKey,
        ...reasonCodeDistribution(cases, scheme.id),
      })),
    }),
    delay: 220,
  });
}

export async function getReportsSummary() {
  const cases = await listAllCases();

  return request('/reports/summary', {
    fallback: () => ({
      byCategory: totalsByReasonCategory(cases),
      byDueBucket: totalsByDueBucket(cases),
      byQueue: totalsByQueue(cases),
      kpis: caseKpis(cases),
    }),
    delay: 240,
  });
}

export function getMonitoring() {
  return request('/monitoring', {
    fallback: () => ({
      documentProcessing: DOCUMENT_PROCESSING,
      disputeOutcomes: DISPUTE_OUTCOMES,
      errorHandling: ERROR_HANDLING,
    }),
    delay: 260,
  });
}

export function listReports() {
  return request('/reports', { fallback: () => savedReports.map((r) => ({ ...r })) });
}

export function saveReport(report) {
  return request(report.id ? `/reports/${report.id}` : '/reports', {
    method: report.id ? 'PATCH' : 'POST',
    body: report,
    fallback: () => {
      if (report.id && savedReports.some((r) => r.id === report.id)) {
        savedReports = savedReports.map((r) => (r.id === report.id ? { ...r, ...report } : r));
        return savedReports.find((r) => r.id === report.id);
      }
      const created = {
        ...report,
        id: `rep_${String(savedReports.length + 1).padStart(2, '0')}`,
        createdBy: CURRENT_USER.name,
        createdAt: new Date().toISOString(),
        lastRunAt: null,
      };
      savedReports = [...savedReports, created];
      return created;
    },
    delay: 340,
  });
}

export function deleteReport(reportId) {
  return request(`/reports/${reportId}`, {
    method: 'DELETE',
    fallback: () => {
      savedReports = savedReports.filter((r) => r.id !== reportId);
      return null;
    },
    delay: 220,
  });
}

/**
 * Preview rows for the report builder. Runs against the real book so the
 * preview and the eventual export agree.
 */
export async function previewReport({ fields = [], limit = 8 }) {
  const cases = await listAllCases();

  return request('/reports/preview', {
    method: 'POST',
    body: { fields, limit },
    fallback: () => ({
      rows: cases.slice(0, limit).map((c) => {
        const row = {};
        fields.forEach((fieldId) => {
          row[fieldId] = REPORT_ACCESSORS[fieldId]?.(c) ?? null;
        });
        return row;
      }),
      total: cases.length,
    }),
    delay: 200,
  });
}

export function runReport(reportId) {
  return request(`/reports/${reportId}/run`, {
    method: 'POST',
    fallback: () => {
      savedReports = savedReports.map((r) =>
        r.id === reportId ? { ...r, lastRunAt: new Date().toISOString() } : r,
      );
      return { ok: true, reportId, ranAt: new Date().toISOString() };
    },
    delay: 620,
  });
}

export default {
  getDashboard,
  getReportsSummary,
  getMonitoring,
  listReports,
  saveReport,
  deleteReport,
  previewReport,
  runReport,
};
