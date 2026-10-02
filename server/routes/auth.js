const router = require('express').Router();
const { authLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/authController');

// ---- PUBLIC (rate-limited) ----
router.post('/register', authLimiter, c.register);
router.post('/login', authLimiter, c.login);
router.post('/logout', c.logout); // idempotent: clearing a missing cookie is fine

// ---- AUTH (Passport JWT) ----
router.get('/session', requireAuth, c.session);

module.exports = router;