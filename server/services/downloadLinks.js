// The link scrambler.
//
// Every download link is a fresh 256-bit random value. It is:
//   * unique    - never derived from the user, the time, or any earlier link
//   * single-use - the first request to claim it wins; every later one is refused
//   * short-lived - valid for DOWNLOAD_LINK_TTL_SECONDS (default 2 minutes)
//   * personal  - only works for the logged-in customer it was minted for
//   * rotating  - minting a new link kills every older unused link of that customer
//
// Only SHA-256(link) is stored, so a database leak does not leak working links.
//
// Lifecycle:  issue()  ->  claim()  ->  complete()  |  fail()
const crypto = require('crypto');
const { sha256 } = require('../config/constants');
const { DOWNLOAD_LINK_TTL_SECONDS, MAX_FAILED_DOWNLOADS } = require('../config/env');
const tokens = require('../models/token');

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // base64url of 32 bytes
const httpError = (status, message) => Object.assign(new Error(message), { status });

// Mint a brand-new scrambled link for this customer.
async function issue(userId) {
  if ((await tokens.countFailed(userId)) >= MAX_FAILED_DOWNLOADS) {
    throw httpError(429, 'Your downloads failed too many times. Please contact support.');
  }
  const raw = crypto.randomBytes(32).toString('base64url');
  const ins = await tokens.newToken(userId, sha256(raw), DOWNLOAD_LINK_TTL_SECONDS);
  // Older links die the moment a new one exists. Done AFTER the insert and keyed on id,
  // so simultaneous mints cannot leave two live links: only the newest row survives.
  await tokens.revokeOlder(userId, ins.id);
  if (Math.random() < 0.02) tokens.purgeOld().catch(() => {}); // housekeeping
  return { url: '/download/' + raw, expiresIn: DOWNLOAD_LINK_TTL_SECONDS };
}

// Burn the link. Returns its hash for the winner, or null for everyone else
// (wrong shape, wrong customer, expired, revoked, or already used).
async function claim(userId, raw, ip) {
  if (typeof raw !== 'string' || !TOKEN_RE.test(raw)) return null;
  const hash = sha256(raw);
  const r = await tokens.claimToken(userId, hash, ip);
  return r.affected === 1 ? hash : null;
}

// Delivery finished: the link stays dead for good.
const complete = (userId, hash) => tokens.finishToken(userId, hash, 'completed');

// Delivery failed or was cut off: the link stays dead (never reusable), but the
// customer keeps their purchase and can mint a new one - up to MAX_FAILED_DOWNLOADS times.
const fail = (userId, hash) => tokens.finishToken(userId, hash, 'failed');

// Admin "reset download": revoke everything and clear the failure count.
const reset = (userId) => tokens.resetTokens(userId);

module.exports = { issue, claim, complete, fail, reset };