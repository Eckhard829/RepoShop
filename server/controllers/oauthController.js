const { SITE_URL } = require('../config/env');
const { setCookie } = require('./authController');

// After Passport resolves, this is what runs. req.user is the DB user.
function callback(req, res) {
  if (!req.user) return res.redirect(`${SITE_URL}/login?oauth=failed`);
  setCookie(res, { id: req.user.id });
  res.redirect(`${SITE_URL}/dashboard?oauth=ok`);
}

function failure(req, res) {
  res.redirect(`${SITE_URL}/login?oauth=failed`);
}

module.exports = { callback, failure };