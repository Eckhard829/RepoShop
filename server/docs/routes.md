# routes/

The URL surface. routes/index.js is the single registry.

## Registry pattern

    mountPreJson(app)   -> webhook (raw body, before express.json)
    mountPassport(app)  -> passport.initialize()
    mountPostJson(app)  -> auth, oauth, me, admin, download + /api 404

## Auth posture

- auth.js       public register/login/logout, guarded session
- oauth.js      public (this IS the auth)
- webhook.js    public (HMAC verified, not JWT)
- me.js         guarded at router level (requireAuth)
- admin.js      guarded at router level (requireAuth + requireAdmin)
- download.js   guarded at router level (requireAuth)

## Endpoints

| Method | Path | Auth | Handler |
|---|---|---|---|
| GET  | /api/health | public | healthController.health |
| POST | /api/webhook | HMAC | webhookController.webhook |
| POST | /api/register | public (rate-limited) | authController.register |
| POST | /api/login | public (rate-limited) | authController.login |
| POST | /api/logout | public | authController.logout |
| GET  | /api/session | requireAuth | authController.session |
| GET  | /api/auth/google | public | passport.authenticate('google') |
| GET  | /api/auth/google/callback | public | passport + oauthController.callback |
| GET  | /api/auth/google/failure | public | oauthController.failure |
| GET  | /api/me | requireAuth | meController.me |
| POST | /api/me/checkout | requireAuth | meController.checkout |
| GET  | /download/:t | requireAuth | downloadController.download |
| GET  | /api/admin/clients | requireAuth + admin | adminController.clients |
| POST | /api/admin/impersonate/:id | requireAuth + admin | adminController.impersonate |
| POST | /api/admin/stop | requireAuth + admin | adminController.stop |
| GET  | /api/admin/verify/:id | requireAuth + admin | adminController.verify |
| POST | /api/admin/reset-download/:id | requireAuth + admin | adminController.resetDownload |
| POST | /api/admin/grant/:id | requireAuth + admin | adminController.grant |
| *    | /api/* (unmatched) | - | notFoundApi (JSON 404) |

## Adding a router

1. Create routes/<name>.js
2. require express.Router()
3. Apply router-level guards (requireAuth) if the whole file is protected
4. Mount in routes/index.js inside mountPostJson
5. Update this file

## Why the pre/post split

The Yoco webhook needs the RAW body to verify HMAC. Express's express.json()
parses the body, which destroys the byte-for-byte content. So the webhook router
is mounted before express.json() and uses express.raw() itself. Everything else
runs after JSON parsing.