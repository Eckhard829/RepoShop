import { toastOk, toastErr, toastInfo } from './components/toastBus';

// Edit these
export const BRAND = 'RepoShop', PRICE = 'R499', EMAIL = 'support@yourdomain.com';

// Re-export for convenience
export { toastOk, toastErr, toastInfo };

// GET when there is no body, POST when there is one.
// On failure, automatically pushes an error toast — callers don't need try/catch
// just to show the message, but they can still catch to do local cleanup.
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
  } catch (e) {
    const msg = 'Network error. Check your connection.';
    toastErr(msg);
    throw new Error(msg);
  }

  if (!r.ok) {
    const msg = j.error || 'Request failed';
    // Don't spam a toast for the /api/session 401 on first load (App.jsx handles it silently).
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
