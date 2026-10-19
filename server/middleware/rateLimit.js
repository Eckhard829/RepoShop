const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60e3, limit: 20 });

// Minting download links: per customer (not per IP), so it works behind Netlify/Render.
// Mounted after requireAuth, so req.user is always set.
const downloadLinkLimiter = rateLimit({
  windowMs: 10 * 60e3,
  limit: 10,
  keyGenerator: (req) => 'user:' + req.user.id,
  message: { error: 'Too many download attempts. Try again in a few minutes.' },
});

module.exports = { authLimiter, downloadLinkLimiter };