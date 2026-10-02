# Contributing

## Setup

    npm install
    Copy-Item server/.env.example server/.env
    # fill in .env
    npm run dev

## Conventions

### Backend

- One entity per model file. Functions, no req/res.
- Controllers never write SQL. They call models.
- Routes never contain logic. URL -> controller + auth only.
- Default-deny in me/admin/download routers. New routes get auth for free.
- New env var? Add to config/env.js, .env.example, docs/env.md.
- New route? Add to routes/*.js, register the router in routes/index.js if new.
- New DB query alias? Add to php-bridge/api.php (owner). Never inline SQL in Node.

### Frontend

- Pages in client/src/pages/, one component per route.
- Components in client/src/components/, one .jsx + one .css per component.
- API calls go through client/src/api.js. Never fetch directly from a page.
- Brand constants (BRAND, PRICE, EMAIL) live in client/src/api.js.

### Both

- No BOM. Save as UTF-8 without BOM.
- No secrets in git. .env, php-bridge/api.php, node_modules are gitignored.

## Testing

    cd server
    powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1

Expected:
- All ANONYMOUS checks PASS
- Register/Login PASS only when DB is reachable
- AUTHENTICATED checks PASS once register succeeds

## Commit style (Conventional Commits)

    feat(server): add google oauth
    fix(client): toast on oauth failure
    refactor(server): split server.js into layers
    docs: add per-module readmes
    chore: bump vite

## Adding a new API endpoint - checklist

- [ ] Model function in models/*.js (if DB-touching)
- [ ] Controller in controllers/*Controller.js
- [ ] Route in routes/*.js with auth decision
- [ ] Register router in routes/index.js (if new file)
- [ ] Alias + SQL in php-bridge/api.php (owner)
- [ ] Test in scripts/smoke.ps1 if it changes auth posture
- [ ] Documented in docs/ if user-facing