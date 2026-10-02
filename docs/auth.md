# Authentication & authorization

## TL;DR

- One cookie, one guard: JWT named `t`, verified by Passport jwt strategy.
- Default-deny: /api/me, /api/admin, /download apply auth at router level.
- Roles separate: requireAdmin runs after requireAuth and re-checks role in DB.
- Impersonation is a JWT claim: { id: target, imp: adminId }.

## The cookie

    name:  t
    value: JWT signed with JWT_SECRET
    claims: { id, imp?, iat, exp }
    ttl:   8h
    flags: HttpOnly, SameSite=Lax, Secure (production only)

## Issue points

- POST /api/register       creates user, sets cookie
- POST /api/login          verifies password, sets cookie
- POST /api/logout         clears cookie (idempotent)
- Google callback          sets cookie via same helper
- Admin impersonate/stop   re-issues cookie with imp claim

## Verify points

Only one place verifies JWTs: middleware/auth.js -> requireAuth, which wraps
passport.authenticate('jwt'). Returns 401 { error: "Please log in" } on failure.

requireAdmin is a role check on top of requireAuth. It re-loads the user and
checks role === 'admin'.

## Google OAuth flow

    browser                Node                       Google
       |                    |                            |
       |- GET /api/auth/google ------------------------> |
       |                    |  302 to Google consent     |
       | <------------------+----------------------------|
       |                       user consents
       |- GET /api/auth/google/callback?code=... -------> |
       |                    |  exchange code for token   |
       |                    | <--------------------------|
       |                    |  link or create user       |
       |                    |  set t cookie              |
       | <---- 302 /dashboard?oauth=ok ------------------|

## The oauth_accounts table

One row per (provider, provider_user_id). A user can link multiple providers.
users.password_hash is nullable so OAuth-only users have no password.

## Adding another provider

1. npm install passport-<provider>
2. Add strategy block in middleware/passport.js (guard on env vars)
3. Add /api/auth/<provider> + callback in routes/oauth.js
4. Add env vars + .env.example entries
5. No other changes - requireAuth is provider-agnostic

## Security notes

- No auto-link by email. Google login with an existing email creates a new user.
  Auto-linking is a takeover vector if the provider email is not verified.
- Impersonation never burns a customer's download link (meController checks req.imp).
- Rate limit: /api/register and /api/login are 20 attempts / 15 min per IP.