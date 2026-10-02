(async () => {
  const app = document.getElementById('app');
  document.getElementById('brand').textContent = BRAND;
  document.getElementById('out').onclick = logout;
  let s;
  try { s = await api('/api/session'); } catch { location.href = '/login'; return; }
  if (s.role !== 'admin' || s.impersonating) { location.href = '/dashboard'; return; }
  document.getElementById('who').textContent = s.email;

  async function draw() {
    const rows = await api('/api/admin/clients');
    app.innerHTML = `<div class="dash"><h1>Clients (${rows.length})</h1><p id="msg" class="ok"></p>
      <div class="card wrap"><table><tr><th>Email</th><th>Joined</th><th>Paid</th><th>Downloaded</th><th>Actions</th></tr>
      ${rows.map(r => `<tr><td>${esc(r.email)}</td><td>${esc(String(r.created_at).slice(0, 10))}</td>
        <td>${+r.paid ? 'Yes' : 'No'}</td><td>${+r.downloaded ? 'Yes' : 'No'}</td>
        <td><button data-a="impersonate" data-id="${r.id}">Open account</button>
            <button data-a="verify" data-id="${r.id}">Verify payment</button>
            <button data-a="reset-download" data-id="${r.id}">Reset download</button>
            <button data-a="grant" data-id="${r.id}">Grant access</button></td></tr>`).join('')}
      </table></div></div>`;
    app.querySelector('table').onclick = async ev => {
      const b = ev.target.closest('button'); if (!b) return;
      const { a, id } = b.dataset;
      if (a === 'verify') {
        const v = await api('/api/admin/verify/' + id);
        document.getElementById('msg').textContent = v.verified
          ? `Paid on ${v.paid_at}. Reference: ${v.ref} (cross-check in your Yoco portal).` : 'Not verified: ' + v.note;
      } else if (a === 'impersonate') { await post('/api/admin/impersonate/' + id); location.href = '/dashboard'; }
      else if (confirm('Are you sure?')) { await post(`/api/admin/${a}/${id}`); draw(); }
    };
  }
  draw();
})();