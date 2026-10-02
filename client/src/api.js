import { toastOk, toastErr, toastInfo } from './components/toastBus';

// Brand constants — edit these
export const BRAND = 'Jarvis';
export const PRICE = 'R1000';
export const EMAIL = 'support@yourdomain.com';

export { toastOk, toastErr, toastInfo };

export async function api(url, body, method) {
  method = method || (body === undefined ? 'GET' : 'POST');
  const opts = { method, credentials: 'include' };
  if (method !== 'GET') {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body || {});
  }

  let r, j;
  try {
    r = await fetch(url, opts);
    j = await r.json().catch(() => ({}));
  } catch {
    const msg = 'Network error. Check your connection.';
    toastErr(msg);
    throw new Error(msg);
  }

  if (!r.ok) {
    const msg = j.error || 'Request failed';
    if (!(url === '/api/session' && r.status === 401)) toastErr(msg);
    throw new Error(msg);
  }

  return j;
}

export const post = (url, body = {}) => api(url, body, 'POST');

export async function logout() {
  try { await post('/api/logout'); } catch {}
  window.location.href = '/';
}
