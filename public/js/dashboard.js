(async () => {
  const PRICE = 'R499', app = document.getElementById('app');
  document.getElementById('brand').textContent = BRAND;
  document.getElementById('out').onclick = logout;
  let m;
  try { m = await api('/api/me'); } catch { location.href = '/login'; return; }
  if (m.role === 'admin' && !m.impersonating) { location.href = '/admin'; return; }
  document.getElementById('who').textContent = m.email;

  let box;
  if (!m.paid) box = `<p>You haven't bought the repository yet.</p><button class="primary" id="buy">Buy the repository (${PRICE})</button>`;
  else if (m.downloaded) box = `<p class="ok"><strong>Repository installed.</strong> Your download link has been used. Contact support if something went wrong.</p>`;
  else if (m.link) box = `<p class="ok">Payment received.</p><a class="btn primary" href="${esc(m.link)}" id="dl">Download repository</a>
      <p class="muted">This link works once, for your account only. After you download, it disappears.</p>`;
  else box = `<p>Paid. Download link hidden while viewing as admin.</p>`;
  if (!m.paid && new URLSearchParams(location.search).has('paid')) { box = `<p>Confirming your payment...</p>`; setTimeout(() => location.reload(), 3000); }

  app.innerHTML = (m.impersonating ? `<div class="imp"><span>Viewing as ${esc(m.email)}</span><button id="stop">Back to admin</button></div>` : '')
    + `<div class="dash"><h1>Your dashboard</h1><div class="card">${box}<p class="err" id="err"></p></div></div>`;
  if (m.impersonating) document.getElementById('stop').onclick = async () => { await post('/api/admin/stop'); location.href = '/admin'; };
  const buy = document.getElementById('buy');
  if (buy) buy.onclick = async () => {
    try { location.href = (await post('/api/checkout')).url; } catch (x) { document.getElementById('err').textContent = x.message; }
  };
  const dl = document.getElementById('dl');
  if (dl) dl.onclick = () => setTimeout(() => location.reload(), 2500);
})();