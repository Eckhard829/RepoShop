module.exports = function notFoundApi(req, res) {
  res.status(404).json({ error: 'Not found' });
};