const { spawn } = require('child_process');
const { SITE_URL } = require('../config/env');
const { purchaseOf, setDownloaded } = require('../models/purchase');
const links = require('../services/downloadLinks');

const repo = require('../services/repoSource');

// Errors before streaming send the browser back to the dashboard with a reason,
// instead of leaving the customer on a bare text page.
const back = (res, reason) => res.redirect(302, `${SITE_URL || ''}/dashboard?dl=${reason}`);

// GET /download/:t - one-time download. Streams `git archive` straight to the customer.
async function download(req, res, next) {
  try {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    if (req.imp) return back(res, 'denied'); // admins never burn a customer's link

    const p = await purchaseOf(req.user.id);
    if (!p || !+p.paid) return back(res, 'denied');
    if (+p.downloaded) return back(res, 'used');

    // Make sure we can really deliver BEFORE burning the link.
    let src;
    try {
      src = await repo.ensure();
    } catch {
      console.error('[download] product repository not available');
      return back(res, 'unavailable');
    }

    const hash = await links.claim(req.user.id, req.params.t, req.ip);
    if (!hash) return back(res, 'expired'); // used, expired, replaced, or not yours

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="repository.zip"',
    });
    const git = spawn('git', ['-C', src.dir, 'archive', '--format=zip', src.ref]);
    let settled = false;

    const settle = async (ok) => {
      if (settled) return;
      settled = true;
      if (ok) {
        // Record success first, then close the response.
        try {
          await links.complete(req.user.id, hash);
          await setDownloaded(req.user.id); // flag flips -> the button disappears
        } catch (e) {
          console.error('[download] could not record completed download', e);
        }
        res.end();
      } else {
        await links.fail(req.user.id, hash).catch((e) => console.error('[download]', e));
        res.destroy(); // browser shows a failed download, never a truncated "success"
      }
    };

    git.stdout.pipe(res, { end: false });
    git.on('error', () => settle(false));
    git.on('close', (code) => settle(code === 0));
    res.on('close', () => {
      if (!res.writableEnded) {
        git.kill();
        settle(false); // customer cancelled or lost connection
      }
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { download };