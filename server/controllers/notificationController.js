const N = require('../models/notification');

async function mine(req, res) {
  const rows = (await N.forUser(req.user.id)).rows;
  const unread = rows.filter((r) => !r.read_at).length;
  res.json({ notifications: rows, unread });
}

module.exports = { mine };
