const { spawn } = require('child_process');
const { REPO_PATH } = require('../config/env');
const { sha256 } = require('../config/constants');
const { purchaseOf, setDownloaded } = require('../models/purchase');
const { useToken } = require('../models/token');

// One-time download: streams the repo straight out of git
async function download(req, res) {
  if (req.imp) return res.status(403).send('Not available while impersonating');
  const p = await purchaseOf(req.user.id);
  if (!p || !+p.paid || +p.downloaded) return res.status(403).send('Not available');
  const used = await useToken(req.user.id, sha256(req.params.t)); // atomic: only 1 request can win
  if (!used.affected) return res.status(410).send('Link invalid or already used');
  await setDownloaded(req.user.id); // flag flips -> button disappears
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="repository.zip"',
  });
  const g = spawn('git', ['-C', REPO_PATH, 'archive', '--format=zip', 'HEAD']);
  g.stdout.pipe(res);
  g.on('error', () => res.end());
}

module.exports = { download };