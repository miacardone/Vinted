/**
 * System settings: preferences, webhooks and account security.
 */

import { request } from '@/services/apiClient';
import brand from '@/brand/brand.config';
import { WEBHOOKS, WEBHOOK_TOPICS, buildSystemPreferences } from '@/data/admin.seed';
import { CURRENT_USER } from '@/data/users.seed';

let preferences = buildSystemPreferences(brand);
let webhooks = WEBHOOKS.map((w) => ({ ...w }));

export function getSystemPreferences() {
  return request('/system/preferences', { fallback: () => structuredClone(preferences) });
}

export function saveSystemPreferences(next) {
  return request('/system/preferences', {
    method: 'PATCH',
    body: next,
    fallback: () => {
      preferences = { ...preferences, ...next };
      return structuredClone(preferences);
    },
    delay: 380,
  });
}

export function listWebhookTopics() {
  return request('/webhooks/topics', { fallback: () => WEBHOOK_TOPICS, delay: 90 });
}

export function listWebhooks() {
  return request('/webhooks', { fallback: () => webhooks.map((w) => ({ ...w })) });
}

export function saveWebhook(webhook) {
  return request(webhook.id ? `/webhooks/${webhook.id}` : '/webhooks', {
    method: webhook.id ? 'PATCH' : 'POST',
    body: webhook,
    fallback: () => {
      if (webhook.id && webhooks.some((w) => w.id === webhook.id)) {
        webhooks = webhooks.map((w) => (w.id === webhook.id ? { ...w, ...webhook } : w));
        return webhooks.find((w) => w.id === webhook.id);
      }
      const created = {
        status: 'active',
        lastDeliveryAt: null,
        lastStatus: null,
        failures24h: 0,
        ...webhook,
        id: `wh_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      webhooks = [...webhooks, created];
      return created;
    },
    delay: 320,
  });
}

export function deleteWebhook(webhookId) {
  return request(`/webhooks/${webhookId}`, {
    method: 'DELETE',
    fallback: () => {
      webhooks = webhooks.filter((w) => w.id !== webhookId);
      return null;
    },
    delay: 240,
  });
}

export function getAccount() {
  return request('/account', {
    fallback: () => ({
      ...CURRENT_USER,
      timezone: brand.timezone,
      locale: brand.locale,
      twoFactorEnabled: true,
      lastPasswordChangeAt: new Date(Date.now() - 62 * 86_400_000).toISOString(),
      sessions: [
        { id: 's1', device: 'Chrome on macOS', location: 'Vilnius, LT', lastSeenAt: new Date().toISOString(), current: true },
        { id: 's2', device: 'Safari on iOS', location: 'Milan, IT', lastSeenAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), current: false },
      ],
    }),
    delay: 200,
  });
}

export function changePassword({ currentPassword, newPassword }) {
  return request('/account/password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    fallback: () => ({ ok: true, changedAt: new Date().toISOString() }),
    delay: 520,
  });
}

export default {
  getSystemPreferences,
  saveSystemPreferences,
  listWebhookTopics,
  listWebhooks,
  saveWebhook,
  deleteWebhook,
  getAccount,
  changePassword,
};
