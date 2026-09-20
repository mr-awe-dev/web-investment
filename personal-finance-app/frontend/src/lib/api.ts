import type { ApiEnvelope } from '../types/domain';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const TOKEN_KEY = 'pf.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/** Thin fetch wrapper: JSON in/out, bearer token, uniform error envelope. */
export async function api<T>(path: string, init: RequestInit & { query?: Record<string, unknown> } = {}): Promise<T> {
  const url = new URL(`${BASE}/api${path}`);
  Object.entries(init.query ?? {}).forEach(([k, v]) => v !== undefined && v !== '' && v !== null && url.searchParams.set(k, String(v)));
  const token = tokenStore.get();
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  if (res.status === 401 && token) { tokenStore.clear(); window.location.assign('/login'); }
  const text = await res.text();
  if (!res.ok) {
    let code = 'ERROR', message = res.statusText;
    try { const e = JSON.parse(text) as ApiEnvelope<unknown>; code = e.code ?? code; message = e.message ?? message; } catch { /* non-json */ }
    throw new ApiError(res.status, code, message);
  }
  if (!text) return undefined as T;
  if (res.headers.get('content-type')?.includes('text/csv')) return text as T;
  return (JSON.parse(text) as ApiEnvelope<T>).data;
}

export const http = {
  get: <T>(path: string, query?: Record<string, unknown>) => api<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};
