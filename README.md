# RepoShop

A single-repo shop that sells one-time download access to a private git repository.

- **Backend** (`server/`) — Express + Passport (JWT + Google OAuth) + Yoco payments.
- **Frontend** (`client/`) — React 18 + Vite + React Router.
- **DB** — MySQL, accessed via a PHP bridge file (`php-bridge/api.php`, not in this repo).

## Layout

RepoShop/
- package.json       npm workspaces root
- README.md
- netlify.toml       Netlify deploy config for the frontend
- docs/              cross-cutting docs
- server/            backend (Express)
- client/            frontend (React + Vite)

See docs/architecture.md for the deep dive.

## Prerequisites

- Node.js 18+ (tested on 20 and 24)
- MySQL 5.7+ / MariaDB
- PHP 7.4+ with PDO MySQL (for the DB bridge)
- git on PATH (used to stream the repo zip on download)
- A Yoco account (payments) — optional for local dev
- A Google Cloud project with OAuth 2.0 credentials — optional for local dev

## First-time setup

    npm install
    Copy-Item server/.env.example server/.env
    mysql -u root -p < server/database.sql
    mysql -u root -p < server/database.oauth.sql
    # place php-bridge/api.php (ask the owner)
    npm run dev

- Frontend: http://localhost:5173
- Backend:  http://localhost:3000
- Health:   http://localhost:3000/api/health

## Scripts (from the repo root)

| Command | What it does |
|---|---|
| npm run dev | Runs backend + frontend together |
| npm run dev:server | Backend only (nodemon) |
| npm run dev:client | Frontend only (Vite) |
| npm run start | Backend in production mode |
| npm run build | Builds the frontend into client/dist |

## Documentation

| Doc | What it covers |
|---|---|
| docs/architecture.md | How the pieces fit together |
| docs/env.md | Every environment variable |
| docs/auth.md | Auth, JWT, Google OAuth |
| docs/payments.md | Yoco checkout + webhook flow |
| docs/deployment.md | Netlify + Render + MySQL |
| docs/contributing.md | Local dev conventions |
| server/README.md | Backend module guide |
| client/README.md | Frontend module guide |

## Deployment

- Frontend to Netlify (netlify.toml handles build + API proxy to Render)
- Backend to Render (env vars in dashboard, root = repo, start = npm run start -w server)
- DB to any MySQL host; run database.sql then database.oauth.sql

See docs/deployment.md.