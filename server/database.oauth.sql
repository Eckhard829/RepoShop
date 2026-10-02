-- OAuth (Google) support migration.
-- Run once, AFTER database.sql.
-- Not idempotent — if re-run, MySQL 5.7+ will error "Duplicate column/key".
-- That is intentional: migrations should be one-shot and tracked.

-- 1. Allow OAuth-only users (no password) and provider accounts without an email.
ALTER TABLE users
  MODIFY password_hash VARCHAR(100) NULL,
  MODIFY email         VARCHAR(190) NULL;

-- 2. One row per (provider, provider_user_id). UNIQUE prevents double-linking.
CREATE TABLE oauth_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider VARCHAR(32) NOT NULL,               -- 'google'
  provider_user_id VARCHAR(190) NOT NULL,      -- Google's `sub` claim
  email VARCHAR(190) NULL,                     -- email as returned by the provider
  display_name VARCHAR(190) NULL,
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_provider_user (provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);