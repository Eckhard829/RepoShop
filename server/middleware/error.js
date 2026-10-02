function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  res.status(500).json({ error: 'Server error' });
}

module.exports = { notFound, errorHandler };