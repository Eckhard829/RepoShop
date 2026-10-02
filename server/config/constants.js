const crypto = require('crypto');

const COOKIE_NAME = 't';
const JWT_TTL = '8h';

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

module.exports = { COOKIE_NAME, JWT_TTL, sha256 };