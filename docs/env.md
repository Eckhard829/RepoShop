# Environment variables

All backend env vars live in server/.env. Copy server/.env.example to start.

Never commit .env. It is gitignored. .env.example is the source of truth for
the shape of the config; real values are secret.

| Key | Required | Purpose | Example |
|---|---|---|---|
| PORT | no | Backend listen port | 3000 |
| NODE_ENV | no | development or production | development |
| SITE_URL | yes | Public frontend URL for Yoco and OAuth redirects | http://localhost:5173 |
| JWT_SECRET | yes | Signs the t cookie | 64 hex chars |
| PHP_BRIDGE_URL | yes | URL of php-bridge/api.php | http://localhost/repo-shop/php-bridge/api.php |
| BRIDGE_KEY | yes | Shared secret Node sends as X-Api-Key | random string |
| YOCO_SECRET_KEY | yes | Yoco API secret | sk_test_xxx |
| YOCO_WEBHOOK_SECRET | yes | Yoco webhook signing secret | whsec_xxx |
| PRICE_CENTS | yes | Price in cents (R499.00 -> 49900) | 49900 |
| REPO_PATH | yes | Absolute path to the repo to zip | C:/Users/User/Desktop/RepoShop |
| GOOGLE_CLIENT_ID | no | Google OAuth client id | xxx.apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | no | Google OAuth secret | GOCSPX-xxx |
| OAUTH_CALLBACK_BASE | no | Base URL Google callback is registered at | http://localhost:3000 |

Every backend var is loaded in server/config/env.js and exported as a typed object.
Nothing else calls process.env directly.

## Rotation

- JWT_SECRET       - all sessions invalidated
- BRIDGE_KEY       - update on both Node and PHP sides simultaneously
- YOCO_SECRET_KEY  - regenerate in Yoco dashboard
- GOOGLE_CLIENT_SECRET - regenerate in Google Console