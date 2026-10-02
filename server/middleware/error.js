const { NODE_ENV } = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message =
    NODE_ENV === 'production' && status >= 500
      ? 'Server error'
      : err.message || 'Server error';

  // Log it so we can see the real cause in the terminal, even in prod.
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}:`, err.message);
    if (NODE_ENV !== 'production') console.error(err.stack);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };