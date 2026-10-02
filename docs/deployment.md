# Deployment

## Topology

| Piece | Host | Notes |
|---|---|---|
| Frontend | Netlify | Builds client/, serves static, proxies /api/* |
| Backend | Render | Node 18+, runs npm run start -w server |
| DB | Any MySQL | PHP bridge file reachable at PHP_BRIDGE_URL |

## Netlify

netlify.toml already wires this up:

    [build]
      base = "client"
      command = "npm run build"
      publish = "dist"

    [[redirects]]
      from = "/api/*"
      to = "https://reposhop-iwsr.onrender.com/api/:splat"
      status = 200
      force = true

    [[redirects]]
      from = "/download/*"
      to = "https://reposhop-iwsr.onrender.com/download/:splat"
      status = 200
      force = true

    [[redirects]]
      from = "/*"
      to = "/index.html"
      status = 200

Notes:
- The /api and /download redirects give frontend and backend the same origin in
  production, so cookies work without CORS.
- The /* fallback is required for client-side routing.

## Render (backend)

- Root directory:   repo root
- Build command:    npm install
- Start command:    npm run start -w server
- Health check:     /api/health
- Env vars:         everything in docs/env.md with production values
  - NODE_ENV=production
  - SITE_URL=https://your-site.netlify.app
  - OAUTH_CALLBACK_BASE=https://reposhop-iwsr.onrender.com

## Google OAuth (production)

Add to Authorized redirect URIs:

    http://localhost:3000/api/auth/google/callback
    https://reposhop-iwsr.onrender.com/api/auth/google/callback

## Database

Run once, in order:

    SOURCE server/database.sql;
    SOURCE server/database.oauth.sql;

Then:

    CREATE USER 'repo_app'@'localhost' IDENTIFIED BY '<strong-password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON repo_shop.* TO 'repo_app'@'localhost';

Make yourself admin:

    UPDATE users SET role='admin' WHERE email='you@example.com';

## PHP bridge

php-bridge/api.php is gitignored and lives on the DB host. Required aliases:

- userById, userByEmail, createUser, allClients
- purchaseOf, markPaid, resetDownload, setDownloaded
- newCheckout, userByCheckout
- newToken, clearTokens, useToken
- audit
- oauthByProvider, oauthLink, oauthListForUser

## Health check

    GET /api/health -> { ok: true, ts, uptime, version }

Public, no auth.

## Post-deploy checklist

- [ ] curl https://<render-url>/api/health returns {ok:true}
- [ ] Frontend loads at the Netlify URL
- [ ] Sign-up creates a user in the DB
- [ ] Google sign-in round-trips
- [ ] Buy button redirects to a Yoco checkout
- [ ] Test payment lands in the DB as paid
- [ ] Download link works exactly once
- [ ] Admin panel accessible for an admin account