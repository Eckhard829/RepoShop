const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/meController');

// Passport JWT guards every route in this file.
router.use(requireAuth);

router.get('/', c.me);
router.post('/checkout', c.checkout);

module.exports = router;