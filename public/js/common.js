// Edit these
const BRAND = 'RepoShop', EMAIL = 'support@yourdomain.com';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, body, method) {
  const r = await fetch(url, body === undefined && !method ? {} :
    { method: method || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}
async function logout() {
  try { await api('/api/logout'); } catch {}
  location.href = '/';
}
// Public site header + footer (only on pages that have #header / #footer; dashboards don't)
async function siteHeader() {
  let s = null; try { s = await api('/api/session'); } catch {}
  document.getElementById('header').innerHTML = `<div class="w bar-in"><a class="logo" href="/">${esc(BRAND)}</a>
    <nav><a href="/">Home</a><a href="/about">About</a><a href="/contact">Contact</a></nav><div class="r">`
    + (s ? `<a class="btn" href="/dashboard">Dashboard</a><button id="out">Log out</button>`
         : `<a href="/login">Log in</a><a class="btn primary" href="/signup">Sign up</a>`) + `</div></div>`;
  if (s) document.getElementById('out').onclick = logout;
}
if (document.getElementById('header')) siteHeader();
if (document.getElementById('footer'))
  document.getElementById('footer').innerHTML = `<div class="w">&copy; ${new Date().getFullYear()} ${esc(BRAND)}. All rights reserved.</div>`;