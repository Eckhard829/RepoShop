const morgan = require('morgan');
const { NODE_ENV } = require('../config/env');

// Never write a live download link to the logs.
morgan.token('url', (req) =>
  (req.originalUrl || req.url).replace(/^\/download\/[^/?#]+/, '/download/[hidden]'),
);

// 'dev'   -> concise colored output for local development
// 'combined' -> Apache-style lines for production log aggregation
const format = NODE_ENV === 'production' ? 'combined' : 'dev';

module.exports = morgan(format);