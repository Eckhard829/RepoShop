const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const c = require('../controllers/adminController');

// Passport JWT + admin role.
router.use(requireAuth, requireAdmin);

router.get('/clients', c.clients);
router.post('/impersonate/:id', c.impersonate);
router.post('/stop', c.stop);
router.get('/verify/:id', c.verify);
router.post('/reset-download/:id', c.resetDownload);
router.post('/grant/:id', c.grant);

module.exports = router;