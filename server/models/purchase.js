const { db } = require('../config/db');

const purchaseOf = async (id) => (await db('purchaseOf', [id])).rows[0];
const markPaid = (id, ref) => db('markPaid', [id, ref]);
const resetDownload = (id) => db('resetDownload', [id]);
const setDownloaded = (id) => db('setDownloaded', [id]);

module.exports = { purchaseOf, markPaid, resetDownload, setDownloaded };