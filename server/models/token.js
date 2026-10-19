const { db } = require('../config/db');

// One row per scrambled download link. Only the SHA-256 of the link is stored.
const newToken = (userId, hash, ttlSeconds) => db('newToken', [userId, hash, ttlSeconds]);
const revokeLive = (userId) => db('revokeLiveTokens', [userId]);
// Kill every unused link older than the one just inserted (id order = insert order).
const revokeOlder = (userId, id) => db('revokeOlderTokens', [userId, id]);
// Atomic: affected === 1 for exactly one caller, even under concurrent requests.
const claimToken = (userId, hash, ip) => db('claimToken', [ip || null, userId, hash]);
const finishToken = (userId, hash, outcome) => db('finishToken', [outcome, userId, hash]);
const countFailed = async (userId) => +(await db('countFailedTokens', [userId])).rows[0].n;
const resetTokens = (userId) => db('resetTokens', [userId]);
const purgeOld = () => db('purgeOldTokens');

module.exports = { newToken, revokeLive, revokeOlder, claimToken, finishToken, countFailed, resetTokens, purgeOld };