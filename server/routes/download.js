const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/downloadController');

// Passport JWT guards every route in this file.
router.use(requireAuth);

router.get('/:t', c.download);

module.exports = router;