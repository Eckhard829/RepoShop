-- Notifications migration. Run once, AFTER database.sql + database.oauth.sql.
-- Not idempotent.

-- 1. The notification definition (draft -> sent)
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500) NULL,
  status ENUM('draft','sent') NOT NULL DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. One row per send (resending adds a row)
CREATE TABLE notification_sends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  sent_by INT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recipients INT NOT NULL DEFAULT 0,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (sent_by)        REFERENCES users(id)         ON DELETE CASCADE
);

-- 3. One row per (send, user). This is what the user sees.
CREATE TABLE notification_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  send_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_send_user (send_id, user_id),
  FOREIGN KEY (send_id) REFERENCES notification_sends(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)              ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, read_at)
);
