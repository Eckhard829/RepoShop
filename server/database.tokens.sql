-- Download-link scrambler migration.
-- Run once, AFTER database.sql (phpMyAdmin > SQL tab, with the repo_shop database selected).
-- Not idempotent: running it twice errors with "Duplicate column". That is intentional.
-- New installs do NOT need this file, database.sql already has the final table.

ALTER TABLE download_tokens
  ADD COLUMN outcome    ENUM('pending','completed','failed','revoked') NOT NULL DEFAULT 'pending' AFTER used,
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN claimed_at DATETIME NULL,
  ADD COLUMN claimed_ip VARCHAR(45) NULL,
  ADD KEY idx_user_state (user_id, used, outcome);

-- Tokens from the old scheme: a used one was a download, an unused one is dead now.
UPDATE download_tokens SET outcome = IF(used = 1, 'completed', 'revoked'), used = 1;