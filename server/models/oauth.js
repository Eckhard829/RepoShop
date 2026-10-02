const { db } = require('../config/db');

const findByProvider = (provider, providerUserId) =>
  db('oauthByProvider', [provider, providerUserId]);

const linkAccount = (userId, provider, providerUserId, email, displayName, avatarUrl) =>
  db('oauthLink', [userId, provider, providerUserId, email, displayName, avatarUrl]);

const listForUser = (userId) => db('oauthListForUser', [userId]);

module.exports = { findByProvider, linkAccount, listForUser };