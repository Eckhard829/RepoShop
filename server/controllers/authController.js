const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, NODE_ENV } = require('../config/env');
const { COOKIE_NAME, JWT_TTL } = require('../config/constants');
const { createUser, userByEmail } = require('../models/user');

const setCookie = (res, o) =>
  res.cookie(COOKIE_NAME, jwt.sign(o, JWT_SECRET, { expiresIn: JWT_TTL }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
  });

async function register(req, res) {
  const { email, password } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8)
    return res.status(400).json({ error: 'Valid email and a password of 8+ characters required' });
  try {
    const r = await createUser(email.toLowerCase(), await bcrypt.hash(password, 12));
    setCookie(res, { id: r.id });
    res.json({ ok: 1 });
  } catch (e) {
    res.status(e.status || 500).json({
      error:
        e.status === 409
          ? 'Email already registered'
          : NODE_ENV === 'production'
          ? 'Error'
          : 'Error: ' + e.message,
    });
  }
}

async function login(req, res) {
  const u = (await userByEmail((req.body.email || '').toLowerCase())).rows[0];
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password_hash)))
    return res.status(401).json({ error: 'Wrong email or password' });
  setCookie(res, { id: u.id });
  res.json({ ok: 1 });
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
  });
  res.json({ ok: 1 });
}

function session(req, res) {
  res.json({ email: req.user.email, role: req.user.role, impersonating: !!req.imp });
}

module.exports = { register, login, logout, session, setCookie };