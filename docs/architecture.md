# Architecture

## Overview

    React (Vite :5173) --/api/*--> Express (:3000) --HTTP--> PHP bridge (api.php) --> MySQL
                                          |
                                          --git archive--> streamed zip

## Layered backend

    request -> middleware -> routes -> controllers -> models -> config/db -> PHP bridge -> MySQL

| Layer | Responsibility | Lives in |
|---|---|---|
| Bootstrap | Wire everything, listen | server.js |
| Registry | Knows which routers exist and in what order | routes/index.js |
| Routes | URL -> controller mapping, auth decisions | routes/*.js |
| Middleware | Cross-cutting: auth, passport, logging, rate limit | middleware/*.js |
| Controllers | Request handling, response shape | controllers/*.js |
| Models | DB access, one module per entity | models/*.js |
| Config | Env, constants, DB bridge | config/*.js |

Rule: models never touch req/res, controllers never write SQL.

## The route registry

routes/index.js is the only place that knows which routers exist. It exposes three
mount functions so server.js can install things in the right order around the body
parser:

1. mountPreJson(app)  - the Yoco webhook (needs the raw body for HMAC)
2. mountPassport(app) - Passport init (must run after cookie-parser)
3. mountPostJson(app) - everything else + the /api JSON 404 fallback

## Auth model

- Stateless: one JWT cookie named `t`. No server session store.
- Single guard: Passport JWT strategy powers requireAuth on every protected route.
- Role checks: requireAdmin runs after requireAuth and re-checks role in the DB.
- Impersonation is a JWT claim: { id, imp }.

See docs/auth.md.

## Payment model

- Yoco hosted checkout. We store checkout_id -> user_id and redirect.
- Yoco POSTs a signed webhook on success. We verify HMAC, look up user, mark paid.
- Downloads are one-time: fresh SHA-256-hashed token per /api/me call, first use burns it.

See docs/payments.md.

## Why workspaces

server/ and client/ as siblings under a workspace root:

- One npm install at root installs both.
- One package-lock.json.
- One npm run dev starts both processes.
- Netlify still deploys client/ alone (base = client in netlify.toml).