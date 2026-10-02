const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60e3, limit: 20 });

module.exports = { authLimiter };