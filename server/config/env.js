const path = require('path');
// Look for .env in server/ first, then fall back to the repo root.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = process.env;

module.exports = {
  PORT: env.PORT || 3000,
  NODE_ENV: env.NODE_ENV || 'development',
  SITE_URL: env.SITE_URL,
  JWT_SECRET: env.JWT_SECRET,

  // Database (cPanel MySQL)
  DB_HOST: env.DB_HOST || 'localhost',
  DB_PORT: parseInt(env.DB_PORT || '3306', 10),
  DB_USER: env.DB_USER,
  DB_PASSWORD: env.DB_PASSWORD,
  DB_NAME: env.DB_NAME,

  // Yoco
  YOCO_SECRET_KEY: env.YOCO_SECRET_KEY,
  YOCO_WEBHOOK_SECRET: env.YOCO_WEBHOOK_SECRET,
  PRICE_CENTS: env.PRICE_CENTS,

  // Download
  REPO_PATH: env.REPO_PATH,

  // OAuth
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  OAUTH_CALLBACK_BASE: env.OAUTH_CALLBACK_BASE || `http://localhost:${env.PORT || 3000}`,
};