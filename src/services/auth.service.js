/**
 * Authentication.
 *
 * Demo-only: credentials are checked against brand.demoCredentials and the
 * session is kept in sessionStorage. A real deployment replaces this file with
 * an identity provider — nothing else in the app needs to change, because the
 * rest of the code only ever sees AuthContext.
 */

import { request } from '@/services/apiClient';
import brand from '@/brand/brand.config';
import { CURRENT_USER } from '@/data/users.seed';

const SESSION_KEY = 'ddc.session';

export function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private browsing modes can refuse writes; the session just won't persist.
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
}

export function login({ username, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { username, password },
    fallback: () => {
      const expected = brand.demoCredentials;
      const ok =
        username?.trim().toLowerCase() === expected.username.toLowerCase() &&
        password === expected.password;

      if (!ok) {
        throw new Error('Those credentials were not recognised.');
      }

      return {
        token: 'demo-session-token',
        user: { ...CURRENT_USER },
        issuedAt: new Date().toISOString(),
      };
    },
    delay: 520,
  });
}

export function logout() {
  return request('/auth/logout', {
    method: 'POST',
    fallback: () => {
      clearSession();
      return null;
    },
    delay: 160,
  });
}

export default { login, logout, readSession, writeSession, clearSession };
