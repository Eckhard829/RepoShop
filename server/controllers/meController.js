const crypto = require('crypto');
const { PRICE_CENTS, SITE_URL, YOCO_SECRET_KEY } = require('../config/env');
const { sha256 } = require('../config/constants');
const { purchaseOf } = require('../models/purchase');
const { newToken, clearTokens } = require('../models/token');
const { newCheckout } = require('../models/checkout');

// Customer dashboard data. A NEW scrambled link is generated on every call.
async function me(req, res) {
  const p = await purchaseOf(req.user.id);
  const paid = !!(p && +p.paid);
  const downloaded = !!(p && +p.downloaded);
  let link = null;
  if (paid && !downloaded && !req.imp) {
    // admins never burn the customer's link
    const t = crypto.randomBytes(32).toString('hex');
    await clearTokens(req.user.id); // old links die
    await newToken(req.user.id, sha256(t));
    link = '/download/' + t;
  }
  res.json({
    email: req.user.email,
    role: req.user.role,
    impersonating: !!req.imp,
    paid,
    downloaded,
    link,
  });
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

module.exports = { me, checkout };