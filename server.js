require('dotenv').config();
const express = require('express'), cookie = require('cookie-parser'), bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'), crypto = require('crypto'), { spawn } = require('child_process');
const rateLimit = require('express-rate-limit');
const E = process.env, app = express();
app.set('trust proxy', 1);

// ---- Talk to MySQL ONLY through the PHP file ----
async function db(q, p = []) {
  const r = await fetch(E.PHP_BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': E.BRIDGE_KEY },
    body: JSON.stringify({ q, p }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'db error'), { status: r.status });
  return j;
}
const hash = t => crypto.createHash('sha256').update(t).digest('hex');
const purchase = async id => (await db('purchaseOf', [id])).rows[0];

// ---- Yoco webhook (must come BEFORE express.json) ----
// Yoco signs webhooks with the Standard Webhooks scheme: HMAC-SHA256 of "id.timestamp.body"
function validYocoSignature(req) {
  const id = req.headers['webhook-id'], ts = req.headers['webhook-timestamp'], sigs = req.headers['webhook-signature'];
  if (!id || !ts || !sigs || Math.abs(Date.now() / 1000 - +ts) > 300) return false;
  const key = Buffer.from((E.YOCO_WEBHOOK_SECRET || '').replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${req.body}`).digest();
  return sigs.split(' ').some(s => {
    const got = Buffer.from(s.split(',')[1] || '', 'base64');
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}
app.post('/api/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  if (!validYocoSignature(req)) return res.sendStatus(400);
  try {
    const ev = JSON.parse(req.body), pay = ev.payload || {};
    if (ev.type === 'payment.succeeded' && pay.status === 'succeeded' && +pay.amount >= +E.PRICE_CENTS) {
      const cid = pay.metadata?.checkoutId;                       // Yoco sends back the checkout id
      const c = cid && (await db('userByCheckout', [cid])).rows[0]; // which user started that checkout?
      if (c) await db('markPaid', [c.user_id, cid]);
    }
    res.sendStatus(200);
  } catch { res.sendStatus(500); } // 500 makes Yoco retry
});

app.use(express.json(), cookie(), express.static('public', { extensions: ['html'] }));
app.use('/api', (q, r, n) => { r.set('Cache-Control', 'no-store'); n(); });

// ---- Auth ----
const setCookie = (res, o) => res.cookie('t', jwt.sign(o, E.JWT_SECRET, { expiresIn: '8h' }),
  { httpOnly: true, sameSite: 'lax', secure: E.NODE_ENV === 'production' });

async function auth(req, res, next) {
  try {
    const d = jwt.verify(req.cookies.t, E.JWT_SECRET);
    const u = (await db('userById', [d.id])).rows[0];
    if (!u) throw 0;
    req.user = u; req.imp = d.imp || null; // imp = admin id while impersonating
    next();
  } catch { res.status(401).json({ error: 'Please log in' }); }
}
async function admin(req, res, next) {
  const a = (await db('userById', [req.imp || req.user.id])).rows[0];
  if (a?.role !== 'admin') return res.sendStatus(403);
  req.adminId = a.id; next();
}

app.post('/api/register', rateLimit({ windowMs: 15 * 60e3, limit: 20 }), async (req, res) => {
  const { email, password } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8)
    return res.status(400).json({ error: 'Valid email and a password of 8+ characters required' });
  try {
    const r = await db('createUser', [email.toLowerCase(), await bcrypt.hash(password, 12)]);
    setCookie(res, { id: r.id }); res.json({ ok: 1 });
  } catch (e) { res.status(e.status || 500).json({ error: e.status === 409 ? 'Email already registered' : (E.NODE_ENV === 'production' ? 'Error' : 'Error: ' + e.message) }); }
});

app.post('/api/login', rateLimit({ windowMs: 15 * 60e3, limit: 20 }), async (req, res) => {
  const u = (await db('userByEmail', [(req.body.email || '').toLowerCase()])).rows[0];
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });
  setCookie(res, { id: u.id }); res.json({ ok: 1 });
});
app.post('/api/logout', (req, res) => { res.clearCookie('t', { httpOnly: true, sameSite: 'lax', secure: E.NODE_ENV === 'production' }); res.json({ ok: 1 }); });

// Lightweight login check for page headers (does NOT create a download link)
app.get('/api/session', auth, (req, res) => res.json({ email: req.user.email, role: req.user.role, impersonating: !!req.imp }));

// ---- Customer dashboard data. A NEW scrambled link is generated on every call. ----
app.get('/api/me', auth, async (req, res) => {
  const p = await purchase(req.user.id);
  const paid = !!(p && +p.paid), downloaded = !!(p && +p.downloaded);
  let link = null;
  if (paid && !downloaded && !req.imp) { // admins never burn the customer's link
    const t = crypto.randomBytes(32).toString('hex');
    await db('clearTokens', [req.user.id]);          // old links die
    await db('newToken', [req.user.id, hash(t)]);
    link = '/download/' + t;
  }
  res.json({ email: req.user.email, role: req.user.role, impersonating: !!req.imp, paid, downloaded, link });
});

app.post('/api/checkout', auth, async (req, res) => {
  if (req.imp) return res.status(403).json({ error: 'Not while impersonating' });
  const p = await purchase(req.user.id);
  if (p && +p.paid) return res.status(400).json({ error: 'Already purchased' });
  const r = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + E.YOCO_SECRET_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: +E.PRICE_CENTS, currency: 'ZAR', // amount is in cents: R499.00 = 49900
      successUrl: E.SITE_URL + '/dashboard?paid=1', cancelUrl: E.SITE_URL, failureUrl: E.SITE_URL,
      metadata: { userId: String(req.user.id) },
    }),
  });
  const c = await r.json().catch(() => ({}));
  if (!r.ok || !c.redirectUrl) return res.status(502).json({ error: 'Could not start payment' });
  await db('newCheckout', [c.id, req.user.id]); // remember who this checkout belongs to
  res.json({ url: c.redirectUrl });
});

// ---- One-time download: streams the repo straight out of git ----
app.get('/download/:t', auth, async (req, res) => {
  if (req.imp) return res.status(403).send('Not available while impersonating');
  const p = await purchase(req.user.id);
  if (!p || !+p.paid || +p.downloaded) return res.status(403).send('Not available');
  const used = await db('useToken', [req.user.id, hash(req.params.t)]); // atomic: only 1 request can win
  if (!used.affected) return res.status(410).send('Link invalid or already used');
  await db('setDownloaded', [req.user.id]);                             // flag flips -> button disappears
  res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="repository.zip"' });
  const g = spawn('git', ['-C', E.REPO_PATH, 'archive', '--format=zip', 'HEAD']);
  g.stdout.pipe(res); g.on('error', () => res.end());
});

// ---- Admin ----
const A = [auth, admin];
app.get('/api/admin/clients', ...A, async (q, r) => r.json((await db('allClients')).rows));

app.post('/api/admin/impersonate/:id', ...A, async (req, res) => {
  await db('audit', [req.adminId, req.params.id, 'impersonate']);
  setCookie(res, { id: +req.params.id, imp: req.adminId }); res.json({ ok: 1 });
});
app.post('/api/admin/stop', ...A, (req, res) => { setCookie(res, { id: req.adminId }); res.json({ ok: 1 }); });

// Payment record: only ever written by the signed Yoco webhook (or by "Grant access")
app.get('/api/admin/verify/:id', ...A, async (req, res) => {
  const p = await purchase(req.params.id);
  if (!p || !+p.paid) return res.json({ verified: false, note: 'No confirmed payment on record' });
  res.json({ verified: true, ref: p.payment_ref, paid_at: p.paid_at });
});
app.post('/api/admin/reset-download/:id', ...A, async (req, res) => {
  await db('resetDownload', [req.params.id]); await db('audit', [req.adminId, req.params.id, 'reset']); res.json({ ok: 1 });
});
app.post('/api/admin/grant/:id', ...A, async (req, res) => {
  await db('markPaid', [req.params.id, 'manual']); await db('audit', [req.adminId, req.params.id, 'grant']); res.json({ ok: 1 });
});

app.use((e, req, res, next) => res.status(500).json({ error: 'Server error' }));
app.listen(E.PORT || 3000, () => console.log('Running on port', E.PORT || 3000));