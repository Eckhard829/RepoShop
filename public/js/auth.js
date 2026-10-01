(async () => {
  try { await api('/api/session'); location.href = '/dashboard'; return; } catch {}
  const up = document.body.dataset.mode === 'signup';
  document.getElementById('f').onsubmit = async ev => {
    ev.preventDefault();
    try {
      await api(up ? '/api/register' : '/api/login',
        { email: document.getElementById('e').value, password: document.getElementById('p').value });
      location.href = '/dashboard';
    } catch (x) { document.getElementById('err').textContent = x.message; }
  };
})();