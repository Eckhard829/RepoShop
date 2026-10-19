const { PRICE_CENTS, SITE_URL, YOCO_SECRET_KEY } = require('../config/env');
const { purchaseOf } = require('../models/purchase');
const { newCheckout } = require('../models/checkout');
const links = require('../services/downloadLinks');

// Customer dashboard data. No download link lives here: links are minted on demand
// (POST /api/me/download-link) so a page refresh never hands out or kills a link.
async function me(req, res) {
  const p = await purchaseOf(req.user.id);
  const paid = !!(p && +p.paid);
  const downloaded = !!(p && +p.downloaded);
  res.json({
    email: req.user.email,
    role: req.user.role,
    impersonating: !!req.imp,
    paid,
    downloaded,
    // The Download button shows only while this is true:
    // paid, not yet downloaded, and not an admin viewing the account.
    canDownload: paid && !downloaded && !req.imp,
  });
}

// Mint a fresh, scrambled, single-use download link for the logged-in customer.
async function createDownloadLink(req, res, next) {
  try {
    if (req.imp) return res.status(403).json({ error: 'Not available while viewing as admin' });
    const p = await purchaseOf(req.user.id);
    if (!p || !+p.paid) return res.status(403).json({ error: 'Purchase required' });
    if (+p.downloaded) return res.status(409).json({ error: 'Already downloaded' });
    res.json(await links.issue(req.user.id));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

async function checkout(req, res) {
  if (req.imp) return res.status(403).json({ error: 'Not while impersonating' });
  const p = await purchaseOf(req.user.id);
  if (p && +p.paid) return res.status(400).json({ error: 'Already purchased' });
  const r = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + YOCO_SECRET_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: +PRICE_CENTS,
      currency: 'ZAR',
      successUrl: SITE_URL + '/dashboard?paid=1',
      cancelUrl: SITE_URL,
      failureUrl: SITE_URL,
      metadata: { userId: String(req.user.id) },
    }),
  });
  const c = await r.json().catch(() => ({}));
  if (!r.ok || !c.redirectUrl) return res.status(502).json({ error: 'Could not start payment' });
  await newCheckout(c.id, req.user.id);
  res.json({ url: c.redirectUrl });
}

module.exports = { me, createDownloadLink, checkout };