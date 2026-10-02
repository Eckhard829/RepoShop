function health(req, res) {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: require('../package.json').version,
  });
}

module.exports = { health };