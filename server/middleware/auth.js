const { passport } = require('./passport');

// Passport's default 401 body is plain text "Unauthorized". Wrap it so our API
// always returns JSON, and so we control the message.
function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Please log in' });
    req.user = user;
    req.imp = user.imp || null;
    next();
  })(req, res, next);
}

// Role check that runs AFTER requireAuth.
// Respects impersonation: an admin acting as req.imp still resolves to the real admin.
function requireRole(...roles) {
  return async function (req, res, next) {
    try {
      const { userById } = require('../models/user');
      const id = req.imp || req.user?.id;
      if (!id) return res.sendStatus(401);
      const u = (await userById(id)).rows[0];
      if (!u || !roles.includes(u.role)) return res.sendStatus(403);
      req.adminId = u.id; // used by adminController for audit logs
      next();
    } catch {
      res.sendStatus(403);
    }
  };
}

const requireAdmin = requireRole('admin');

module.exports = { requireAuth, requireRole, requireAdmin };