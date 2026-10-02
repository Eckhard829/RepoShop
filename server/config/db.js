const { PHP_BRIDGE_URL, BRIDGE_KEY } = require('./env');

// ---- Talk to MySQL ONLY through the PHP file ----
async function db(q, p = []) {
  const r = await fetch(PHP_BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': BRIDGE_KEY },
    body: JSON.stringify({ q, p }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'db error'), { status: r.status });
  return j;
}

module.exports = { db };