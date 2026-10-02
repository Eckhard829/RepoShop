# controllers/

Request handlers. Each function is (req, res) => void (or async).

## Rules

- Own the response shape. Success = JSON with fields the frontend needs.
  Errors = { error: string }.
- Never write SQL. Call models.
- Never call db() directly.
- Trust req.user / req.imp - populated by requireAuth.
- Do not verify tokens or read cookies. That is middleware's job.

## authController.js

| Handler | Route | Notes |
|---|---|---|
| register | POST /api/register | Validate email + 8-char password, bcrypt cost 12, set cookie |
| login | POST /api/login | bcrypt compare, set cookie |
| logout | POST /api/logout | Clear cookie (idempotent) |
| session | GET /api/session | Return { email, role, impersonating } |
| setCookie | (exported helper) | Used by register, login, oauthController, adminController |

## meController.js

| Handler | Route | Notes |
|---|---|---|
| me | GET /api/me | Returns { email, role, impersonating, paid, downloaded, link }. Generates a fresh download token on every call when paid && !downloaded && !req.imp. |
| checkout | POST /api/me/checkout | Rejects if already paid or impersonating. Creates a Yoco checkout, stores checkout_id -> user_id, returns redirect URL. |

## downloadController.js

| Handler | Route | Notes |
|---|---|---|
| download | GET /download/:t | One-shot. Verifies purchase, atomically burns token, flips downloaded flag, streams git archive zip. |

## webhookController.js

| Handler | Route | Notes |
|---|---|---|
| webhook | POST /api/webhook | Verifies Yoco HMAC. On payment.succeeded, marks user paid. Returns 400 on bad signature, 500 on handler error (Yoco retries). |
| validYocoSignature | (helper) | Standard Webhooks HMAC-SHA256 with 5-minute replay window. |

## adminController.js

All require admin role (routes/admin.js applies requireAuth + requireAdmin).

| Handler | Route |
|---|---|
| clients | GET  /api/admin/clients |
| impersonate | POST /api/admin/impersonate/:id |
| stop | POST /api/admin/stop |
| verify | GET  /api/admin/verify/:id |
| resetDownload | POST /api/admin/reset-download/:id |
| grant | POST /api/admin/grant/:id |

Every mutation writes to audit_log.

## oauthController.js

| Handler | Route | Notes |
|---|---|---|
| callback | GET /api/auth/google/callback | Passport has already resolved req.user. Sets the t cookie, redirects to SITE_URL/dashboard?oauth=ok. |
| failure | GET /api/auth/google/failure | Redirects to SITE_URL/login?oauth=failed. |