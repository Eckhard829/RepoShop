# server - backend

Express + Passport + Yoco. Talks to MySQL only through a PHP bridge.

## Layout

    server/
      server.js           thin bootstrap: mount -> listen
      package.json
      .env                secrets (gitignored)
      .env.example        shape of the config (tracked)
      database.sql        base schema
      database.oauth.sql  OAuth migration (run once, after base)
      config/             env, db bridge, constants
      middleware/         auth, passport, logger, rate limit, 404, errors
      models/             DB queries, one file per entity
      controllers/        request handlers
      routes/             express routers + index.js (registry)
      scripts/            smoke.ps1
      docs/               per-layer docs

## Boot sequence

server.js does, in order:

1. routes.mountPreJson(app)          - webhook (needs raw body)
2. express.json(), cookie(), static
3. routes.mountPassport(app)         - Passport init
4. routes.mountPostJson(app)         - all other routes + JSON 404 for /api
5. /api no-store header
6. Global 404 + error handlers
7. app.listen(PORT)

## Layers

- config/       see docs/config.md
- middleware/   see docs/middleware.md
- models/       see docs/models.md
- controllers/  see docs/controllers.md
- routes/       see docs/routes.md

## Scripts

| Command | What it does |
|---|---|
| npm run dev | nodemon, auto-restart |
| npm run start | plain node server.js (production) |

## Env

See ../docs/env.md.

## Adding a route

1. Model function (if DB-touching) in models/*.js
2. Handler in controllers/*.js
3. Route in routes/*.js with requireAuth if it needs a session
4. Register router in routes/index.js if new
5. Alias in php-bridge/api.php if new DB access (owner)

## Testing

    cd server
    powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1

## Deployment

See ../docs/deployment.md.