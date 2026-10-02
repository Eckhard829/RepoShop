const { audit } = require('../models/audit');
const N = require('../models/notification');

async function list(req, res) {
  res.json((await N.list()).rows);
}

async function create(req, res) {
  const { title, message, link } = req.body || {};
  if (!title || !title.trim())   return res.status(400).json({ error: 'Title is required' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  let cleanLink = (link || '').trim();
  if (cleanLink && !/^https?:\/\//i.test(cleanLink)) cleanLink = 'https://' + cleanLink;

  const r = await N.create(title.trim(), message.trim(), cleanLink || null, req.adminId);
  await audit(req.adminId, r.id, 'notif_create');
  res.json({ id: r.id });
}

async function remove(req, res) {
  await N.remove(req.params.id);
  await audit(req.adminId, +req.params.id, 'notif_delete');
  res.json({ ok: 1 });
}

// Creates a send row + fans out to every eligible user.
// Resending calls the exact same function, producing a second send row.
async function send(req, res) {
  const n = await N.byId(req.params.id);
  if (!n) return res.status(404).json({ error: 'Notification not found' });

  const recipients = await N.eligibleCount();
  const sendRow = await N.newSend(n.id, req.adminId, recipients);
  await N.fanout(sendRow.id);
  await N.markSent(n.id);
  await audit(req.adminId, n.id, 'notif_send');

  res.json({ ok: 1, sendId: sendRow.id, recipients });
}

module.exports = { list, create, remove, send };
