// Edit these
export const BRAND = 'RepoShop', PRICE = 'R499', EMAIL = 'support@yourdomain.com';

// GET when there is no body, POST when there is one
export async function api(url, body, method) {
  method = method || (body === undefined ? 'GET' : 'POST');
  const opts = { method, credentials: 'include' };
  if (method !== 'GET') {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body || {});
  }
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}
export const post = (url, body = {}) => api(url, body, 'POST');

export async function logout() {
  try { await post('/api/logout'); } catch {}
  window.location.href = '/';
}
