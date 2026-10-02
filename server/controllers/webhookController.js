const crypto = require('crypto');
const { YOCO_WEBHOOK_SECRET, PRICE_CENTS } = require('../config/env');
const { markPaid } = require('../models/purchase');
const { userByCheckout } = require('../models/checkout');

// Yoco signs webhooks with the Standard Webhooks scheme: HMAC-SHA256 of "id.timestamp.body"
function validYocoSignature(req) {
  const id = req.headers['webhook-id'];
  const ts = req.headers['webhook-timestamp'];
  const sigs = req.headers['webhook-signature'];
  if (!id || !ts || !sigs || Math.abs(Date.now() / 1000 - +ts) > 300) return false;
  const key = Buffer.from((YOCO_WEBHOOK_SECRET || '').replace(/^whsec_/, ''), 'base64');
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${ts}.${req.body}`)
    .digest();
  return sigs.split(' ').some((s) => {
    const got = Buffer.from(s.split(',')[1] || '', 'base64');
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}

async function webhook(req, res) {
  if (!validYocoSignature(req)) return res.sendStatus(400);
  try {
    const ev = JSON.parse(req.body);
    const pay = ev.payload || {};
    if (ev.type === 'payment.succeeded' && pay.status === 'succeeded' && +pay.amount >= +PRICE_CENTS) {
      const cid = pay.metadata?.checkoutId;
      const c = cid && (await userByCheckout(cid));
      if (c) await markPaid(c.user_id, cid);
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(500); // 500 makes Yoco retry
  }
}

module.exports = { webhook, validYocoSignature };