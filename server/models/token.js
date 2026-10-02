const { db } = require('../config/db');

const newToken = (userId, hash) => db('newToken', [userId, hash]);
const clearTokens = (userId) => db('clearTokens', [userId]);
const useToken = (userId, hash) => db('useToken', [userId, hash]);

module.exports = { newToken, clearTokens, useToken };