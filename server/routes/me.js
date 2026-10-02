const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/meController');
const n = require('../controllers/notificationController');

// Passport JWT guards every route in this file.
router.use(requireAuth);

router.get('/', c.me);
router.post('/checkout', c.checkout);

// Notifications for the logged-in user
router.get('/notifications', n.mine);

module.exports = router;
