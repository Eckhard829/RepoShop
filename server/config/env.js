const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = process.env;

module.exports = {
  PORT: env.PORT || 3000,
  NODE_ENV: env.NODE_ENV || 'development',
  SITE_URL: env.SITE_URL,
  JWT_SECRET: env.JWT_SECRET,
  PHP_BRIDGE_URL: env.PHP_BRIDGE_URL,
  BRIDGE_KEY: env.BRIDGE_KEY,
  YOCO_SECRET_KEY: env.YOCO_SECRET_KEY,
  YOCO_WEBHOOK_SECRET: env.YOCO_WEBHOOK_SECRET,
  PRICE_CENTS: env.PRICE_CENTS,
  REPO_PATH: env.REPO_PATH,

  // OAuth — Google only
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,

  // Base URL Google's callback is registered at. Must match the Google Console EXACTLY.
  // Local:      http://localhost:3000
  // Production: https://reposhop-iwsr.onrender.com
  OAUTH_CALLBACK_BASE: env.OAUTH_CALLBACK_BASE || `http://localhost:${env.PORT || 3000}`,
};