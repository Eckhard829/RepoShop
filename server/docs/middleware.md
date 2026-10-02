# middleware/

Cross-cutting concerns. One responsibility per file.

## auth.js - the auth entry point

Exports:

- requireAuth          wraps passport.authenticate('jwt'). Returns
                       401 {error:"Please log in"} on failure.
                       Populates req.user and req.imp.
- requireRole(...roles) checks DB role of req.imp || req.user.id.
                        Returns 403 on mismatch. Sets req.adminId.
- requireAdmin        shorthand for requireRole('admin').

Everything authenticated uses requireAuth. No route reads the JWT directly.

## passport.js - strategy registration

- jwt     reads the t cookie, verifies with JWT_SECRET, loads the user,
          attaches imp from the token payload.
- google  registered only if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
          On callback, links or creates a user via models/oauth.js, then
          hands the DB user to done.

Exports { passport }. No HTTP logic.

## logger.js - morgan

dev format in development, combined in production.

## noStore.js - cache control

Sets Cache-Control: no-store on all /api/*.

## rateLimit.js - express-rate-limit

- authLimiter  20 attempts / 15 min per IP. Applied to /api/register and /api/login.

## notFoundApi.js - JSON 404 for /api

Returns { error: 'Not found' }. Mounted last under /api so unknown API paths
never fall through to the static handler.

## error.js - global handlers

- notFound     JSON 404 for anything the app did not handle
- errorHandler JSON 500. Never leaks stack traces.

## Order matters

server.js mounts: logger -> json -> cookie -> static -> passport -> routes ->
no-store -> 404 -> error. Moving any of these changes behavior.