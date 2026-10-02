const mysql = require("mysql2/promise");
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require("./env");

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
});

// Named queries — the ONLY SQL that can run. Node cannot send raw SQL.
const QUERIES = {
  userByEmail: "SELECT * FROM users WHERE email=?",
  userById: "SELECT id,email,role,created_at FROM users WHERE id=?",
  createUser: "INSERT INTO users(email,password_hash) VALUES(?,?)",

  purchaseOf: "SELECT * FROM purchases WHERE user_id=?",
  markPaid: `INSERT INTO purchases(user_id,payment_ref,paid,paid_at)
                     VALUES(?,?,1,NOW())
                     ON DUPLICATE KEY UPDATE paid=1, paid_at=NOW(), payment_ref=VALUES(payment_ref)`,
  clearTokens: "DELETE FROM download_tokens WHERE user_id=?",
  newToken:
    "INSERT INTO download_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 15 MINUTE))",
  useToken:
    "UPDATE download_tokens SET used=1 WHERE user_id=? AND token_hash=? AND used=0 AND expires_at>NOW()",
  setDownloaded:
    "UPDATE purchases SET downloaded=1, downloaded_at=NOW() WHERE user_id=? AND paid=1",
  resetDownload:
    "UPDATE purchases SET downloaded=0, downloaded_at=NULL WHERE user_id=?",

  allClients: `SELECT u.id,u.email,u.created_at,p.paid,p.paid_at,p.downloaded,p.payment_ref
                     FROM users u LEFT JOIN purchases p ON p.user_id=u.id
                     WHERE u.role='user' ORDER BY u.id DESC`,

  newCheckout: "INSERT INTO checkouts(checkout_id,user_id) VALUES(?,?)",
  userByCheckout: "SELECT user_id FROM checkouts WHERE checkout_id=?",

  audit: "INSERT INTO audit_log(admin_id,target_id,action) VALUES(?,?,?)",

  oauthByProvider:
    "SELECT * FROM oauth_accounts WHERE provider=? AND provider_user_id=? LIMIT 1",
  oauthLink: `INSERT INTO oauth_accounts(user_id,provider,provider_user_id,email,display_name,avatar_url)
                     VALUES(?,?,?,?,?,?)`,
  oauthListForUser: `SELECT provider,provider_user_id,email,display_name,avatar_url,created_at
                     FROM oauth_accounts WHERE user_id=?`,
};

async function db(q, p = []) {
  const sql = QUERIES[q];
  if (!sql) {
    const err = new Error("Unknown query: " + q);
    err.status = 400;
    throw err;
  }
  try {
    const [result] = await pool.execute(sql, p);
    if (Array.isArray(result)) return { rows: result };
    return { affected: result.affectedRows, id: result.insertId };
  } catch (e) {
    console.error("[db error]", e.code, "-", e.message);
    const err = new Error(
      e.code === "ER_DUP_ENTRY" ? "already exists" : "db error",
    );
    err.status = e.code === "ER_DUP_ENTRY" ? 409 : 500;
    err.cause = e;
    throw err;
  }
}

module.exports = { db, pool };
