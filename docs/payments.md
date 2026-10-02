# Payments & downloads

## Overview

1. User clicks Buy on dashboard
2. Frontend POSTs /api/me/checkout
3. Backend asks Yoco for a checkout, stores { checkout_id -> user_id }, returns URL
4. Frontend redirects to Yoco
5. User pays. Yoco POSTs to /api/webhook with HMAC signature
6. Backend verifies HMAC, looks up user by checkout_id, marks paid
7. Frontend polls /api/me (3s timeout) until paid: true

## Webhook verification

Yoco uses the Standard Webhooks scheme:

    signature = HMAC-SHA256(whsec_<base64-secret>, `${id}.${timestamp}.${body}`)

- Headers: webhook-id, webhook-timestamp, webhook-signature (space-separated v1,<base64>)
- Timestamp must be within +/- 300 seconds (replay protection)
- Route is mounted BEFORE express.json() so it receives the raw body via
  express.raw({ type: '*/*' }). Parsed JSON cannot be re-serialized byte-identically,
  which would break the HMAC.

Verification fail -> 400. Handler throws -> 500 (Yoco retries).

## One-time downloads

- Every /api/me call (while paid && !downloaded) generates a fresh 64-hex token.
- SHA-256 hash is stored in download_tokens; the raw token is never saved.
- Raw token is embedded in the URL: /download/<token>
- On GET:
  1. Check user owns a paid, un-downloaded purchase
  2. Atomically mark the token used (useToken with affected row count)
  3. Flip purchases.downloaded = 1
  4. Stream git archive --format=zip HEAD from REPO_PATH
- After step 3, the Download button disappears.

## Impersonation rule

Admins viewing a customer's dashboard (req.imp set) never trigger token generation.

## Admin actions

- GET  /api/admin/verify/:id          returns payment_ref + paid_at
- POST /api/admin/grant/:id           sets paid = 1, payment_ref = 'manual'
- POST /api/admin/reset-download/:id  clears downloaded flag

Every admin action writes to audit_log.

## Testing without real money

Set YOCO_SECRET_KEY=sk_test_... and use Yoco test cards. Or grant yourself access
via POST /api/admin/grant/:id after promoting yourself to admin.