/**
 * Transport layer.
 *
 * Every service in this folder calls `request()` and never touches `fetch`
 * directly. When VITE_API_BASE_URL is set the client talks to a real backend;
 * when it is empty the resolver passed by each service supplies demo data.
 * That is the whole migration path from demo to production — no component
 * changes, no state-management rewrite.
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';

export const isLive = () => Boolean(BASE_URL);

/** Keeps demo interactions honest: real UIs have latency, so loading states get exercised. */
const latency = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * @param {string} path        e.g. '/disputes'
 * @param {object} options
 * @param {Function} options.fallback  () => data, used when running on demo data
 */
export async function request(path, { method = 'GET', body, fallback, delay } = {}) {
  if (!isLive()) {
    await latency(delay);
    if (typeof fallback !== 'function') {
      throw new ApiError(`No demo resolver registered for ${method} ${path}`, 501);
    }
    return fallback();
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(`Request failed: ${method} ${path}`, response.status);
  }

  return response.status === 204 ? null : response.json();
}

export default { request, isLive, ApiError };
