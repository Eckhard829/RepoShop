const mysql = require('mysql2/promise');
const {
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
} = require('./env');

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

// Named queries — the ONLY SQL that can run. Node cannot send raw SQL.
const QUERIES = {
  userByEmail:      'SELECT * FROM users WHERE email=?',
  userById:         'SELECT id,email,role,created_at FROM users WHERE id=?',
  createUser:       'INSERT INTO users(email,password_hash) VALUES(?,?)',

  purchaseOf:       'SELECT * FROM purchases WHERE user_id=?',
  markPaid:         `INSERT INTO purchases(user_id,payment_ref,paid,paid_at)
                     VALUES(?,?,1,NOW())
                     ON DUPLICATE KEY UPDATE paid=1, paid_at=NOW(), payment_ref=VALUES(payment_ref)`,
  clearTokens:      'DELETE FROM download_tokens WHERE user_id=?',
  newToken:         'INSERT INTO download_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 15 MINUTE))',
  useToken:         'UPDATE download_tokens SET used=1 WHERE user_id=? AND token_hash=? AND used=0 AND expires_at>NOW()',
  setDownloaded:    'UPDATE purchases SET downloaded=1, downloaded_at=NOW() WHERE user_id=? AND paid=1',
  resetDownload:    'UPDATE purchases SET downloaded=0, downloaded_at=NULL WHERE user_id=?',

  allClients:       `SELECT u.id,u.email,u.created_at,p.paid,p.paid_at,p.downloaded,p.payment_ref
                     FROM users u LEFT JOIN purchases p ON p.user_id=u.id
                     WHERE u.role='user' ORDER BY u.id DESC`,

  newCheckout:      'INSERT INTO checkouts(checkout_id,user_id) VALUES(?,?)',
  userByCheckout:   'SELECT user_id FROM checkouts WHERE checkout_id=?',

  audit:            'INSERT INTO audit_log(admin_id,target_id,action) VALUES(?,?,?)',

  oauthByProvider:  'SELECT * FROM oauth_accounts WHERE provider=? AND provider_user_id=? LIMIT 1',
  oauthLink:        `INSERT INTO oauth_accounts(user_id,provider,provider_user_id,email,display_name,avatar_url)
                     VALUES(?,?,?,?,?,?)`,
  oauthListForUser: `SELECT provider,provider_user_id,email,display_name,avatar_url,created_at
                     FROM oauth_accounts WHERE user_id=?`,

  // ---- Notifications ----
  // Admin: list all notifications with send count + last sent
  notifList: `SELECT n.id, n.title, n.message, n.link, n.status, n.created_at,
                     (SELECT COUNT(*) FROM notification_sends s WHERE s.notification_id = n.id) AS send_count,
                     (SELECT MAX(s.sent_at) FROM notification_sends s WHERE s.notification_id = n.id) AS last_sent
              FROM notifications n
              ORDER BY n.id DESC`,

  notifCreate: `INSERT INTO notifications(title,message,link,status,created_by)
                VALUES(?,?,?,'draft',?)`,

  notifById:   'SELECT * FROM notifications WHERE id=?',

  notifDelete: 'DELETE FROM notifications WHERE id=?',

  // Fan-out: create a send row, then insert one recipient per eligible user.
  notifNewSend: `INSERT INTO notification_sends(notification_id,sent_by,recipients)
                 VALUES(?,?,?)`,

  // Eligible users: role='user' AND has a paid purchase
  notifEligibleCount: `SELECT COUNT(*) AS n
                       FROM users u
                       JOIN purchases p ON p.user_id = u.id AND p.paid = 1
                       WHERE u.role='user'`,

  notifFanout: `INSERT IGNORE INTO notification_recipients(send_id,user_id)
                SELECT ?, u.id
                FROM users u
                JOIN purchases p ON p.user_id = u.id AND p.paid = 1
                WHERE u.role='user'`,

  notifMarkSent: `UPDATE notifications SET status='sent' WHERE id=?`,

  // User-facing: all notifications sent to this user
  notifForUser: `SELECT n.id AS notification_id,
                        n.title, n.message, n.link,
                        ns.id AS send_id, ns.sent_at,
                        nr.read_at
                 FROM notification_recipients nr
                 JOIN notification_sends ns ON ns.id = nr.send_id
                 JOIN notifications     n  ON n.id  = ns.notification_id
                 WHERE nr.user_id = ?
                 ORDER BY ns.sent_at DESC, nr.id DESC`,

  notifUnreadCount: `SELECT COUNT(*) AS n
                     FROM notification_recipients
                     WHERE user_id=? AND read_at IS NULL`,
};

async function db(q, p = []) {
  const sql = QUERIES[q];
  if (!sql) {
    const err = new Error('Unknown query: ' + q);
    err.status = 400;
    throw err;
  }
  try {
    const [result] = await pool.execute(sql, p);
    if (Array.isArray(result)) return { rows: result };
    return { affected: result.affectedRows, id: result.insertId };
  } catch (e) {
    const err = new Error(e.code === 'ER_DUP_ENTRY' ? 'already exists' : 'db error');
    err.status = e.code === 'ER_DUP_ENTRY' ? 409 : 500;
    err.cause = e;
    throw err;
  }
}

module.exports = { db, pool };
