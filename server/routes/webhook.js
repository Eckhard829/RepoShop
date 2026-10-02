const express = require('express');
const router = express.Router();
const c = require('../controllers/webhookController');

// PUBLIC — HMAC verified (no JWT; Yoco cannot send one).
// Must be mounted BEFORE express.json() so the raw body survives for signature check.
router.post('/', express.raw({ type: '*/*' }), c.webhook);

module.exports = router;