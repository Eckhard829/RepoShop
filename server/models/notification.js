const { db } = require('../config/db');

const list       = () => db('notifList');
const create     = (title, message, link, adminId) => db('notifCreate', [title, message, link, adminId]);
const byId       = async (id) => (await db('notifById', [id])).rows[0];
const remove     = (id) => db('notifDelete', [id]);
const markSent   = (id) => db('notifMarkSent', [id]);

const eligibleCount = async () => (await db('notifEligibleCount')).rows[0].n;
const newSend       = (notificationId, adminId, recipients) =>
  db('notifNewSend', [notificationId, adminId, recipients]);
const fanout        = (sendId) => db('notifFanout', [sendId]);

const forUser        = (userId) => db('notifForUser', [userId]);
const unreadCount    = async (userId) => (await db('notifUnreadCount', [userId])).rows[0].n;

module.exports = {
  list, create, byId, remove, markSent,
  eligibleCount, newSend, fanout,
  forUser, unreadCount,
};
