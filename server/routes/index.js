// Route registry — the ONLY place that knows which routers exist and in what order.
//
// Lifecycle:
//   1. mountPreJson   — before express.json() (webhook needs raw body)
//   2. <server.js>    — express.json(), cookies, static
//   3. mountPassport  — initialize Passport (needs cookie-parser installed)
//   4. mountPostJson  — the rest of the routes
//   5. <server.js>    — /api no-store, /api 404 fallback, global 404 + error

const notFoundApi = require('../middleware/notFoundApi');

function mountPreJson(app) {
  // PUBLIC — HMAC verified
  app.use('/api/webhook', require('./webhook'));
}

function mountPassport(app) {
  const { passport } = require('../middleware/passport');
  app.use(passport.initialize());
  // No passport.session(): stateless JWT cookie.
}

function mountPostJson(app) {
  // PUBLIC — health check
  app.get('/api/health', require('../controllers/healthController').health);

  app.use('/api', require('./auth'));          // public: register/login/logout; guarded: session
  app.use('/api/auth', require('./oauth'));    // public: Google redirect + callback
  app.use('/api/me', require('./me'));         // guarded (requireAuth at router level)
  app.use('/api/admin', require('./admin'));   // guarded (requireAuth + requireAdmin)
  app.use('/download', require('./download')); // guarded (requireAuth at router level)

  // Unknown /api/* → JSON 404 (not the static-file fallback).
  app.use('/api', notFoundApi);
}

module.exports = { mountPreJson, mountPassport, mountPostJson };