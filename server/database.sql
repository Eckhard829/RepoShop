-- Import this in phpMyAdmin (Import tab), or paste into the SQL tab.

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- paid = true/false, downloaded = true/false (the "button disappears" flag)
CREATE TABLE purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  payment_ref VARCHAR(255),
  paid TINYINT(1) NOT NULL DEFAULT 0,
  paid_at DATETIME NULL,
  downloaded TINYINT(1) NOT NULL DEFAULT 0,
  downloaded_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Which user started which Yoco checkout (Yoco's webhook only sends back the checkout id)
CREATE TABLE checkouts (
  checkout_id VARCHAR(100) PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Only a SHA-256 hash of each link token is stored, never the token itself
CREATE TABLE download_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  used TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  target_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Limited DB user for the PHP file (change the password!)
CREATE USER 'repo_app'@'localhost' IDENTIFIED BY 'CHANGE_THIS_DB_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON repo_shop.* TO 'repo_app'@'localhost';

-- After you register your own account on the site, make it admin:
-- UPDATE users SET role='admin' WHERE email='you@example.com';
