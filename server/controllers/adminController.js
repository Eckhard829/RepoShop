const { allClients } = require('../models/user');
const { purchaseOf, markPaid, resetDownload } = require('../models/purchase');
const { audit } = require('../models/audit');
const { setCookie } = require('./authController');

async function clients(req, res) {
  res.json((await allClients()).rows);
}

async function impersonate(req, res) {
  await audit(req.adminId, req.params.id, 'impersonate');
  setCookie(res, { id: +req.params.id, imp: req.adminId });
  res.json({ ok: 1 });
}

function stop(req, res) {
  setCookie(res, { id: req.adminId });
  res.json({ ok: 1 });
}

async function verify(req, res) {
  const p = await purchaseOf(req.params.id);
  if (!p || !+p.paid) return res.json({ verified: false, note: 'No confirmed payment on record' });
  res.json({ verified: true, ref: p.payment_ref, paid_at: p.paid_at });
}

async function resetDownloadCtrl(req, res) {
  await resetDownload(req.params.id);
  await audit(req.adminId, req.params.id, 'reset');
  res.json({ ok: 1 });
}

async function grant(req, res) {
  await markPaid(req.params.id, 'manual');
  await audit(req.adminId, req.params.id, 'grant');
  res.json({ ok: 1 });
}

module.exports = { clients, impersonate, stop, verify, resetDownload: resetDownloadCtrl, grant };