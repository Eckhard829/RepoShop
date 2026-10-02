const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const c = require('../controllers/adminController');
const n = require('../controllers/adminNotificationController');

// Passport JWT + admin role for everything below.
router.use(requireAuth, requireAdmin);

// ---- Clients ----
router.get('/clients', c.clients);
router.post('/impersonate/:id', c.impersonate);
router.post('/stop', c.stop);
router.get('/verify/:id', c.verify);
router.post('/reset-download/:id', c.resetDownload);
router.post('/grant/:id', c.grant);

// ---- Notifications ----
router.get('/notifications', n.list);
router.post('/notifications', n.create);
router.delete('/notifications/:id', n.remove);
router.post('/notifications/:id/send', n.send);

module.exports = router;
