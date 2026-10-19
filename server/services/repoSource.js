// Where the product comes from.
//   REPO_URL set  -> a cached bare clone of that GitHub repo (refreshed every few minutes)
//   otherwise     -> the local folder in REPO_PATH
// For a private repo also set REPO_TOKEN (a GitHub token with read access).
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { REPO_PATH, REPO_URL, REPO_TOKEN } = require('../config/env');

const run = promisify(execFile);
const CACHE = path.join(os.tmpdir(), 'reposhop-product.git');
const REFRESH_MS = 5 * 60 * 1000;
let lastSync = 0;
let pending = null; // one sync at a time

const remote = () => {
  if (!REPO_TOKEN) return REPO_URL;
  return REPO_URL.replace('https://', `https://x-access-token:${encodeURIComponent(REPO_TOKEN)}@`);
};

async function sync() {
  if (!fs.existsSync(CACHE)) {
    await run('git', ['clone', '--bare', '--depth', '1', remote(), CACHE], { timeout: 120000 });
  }
  await run('git', ['-C', CACHE, 'fetch', '--depth', '1', remote(), '+HEAD:refs/heads/deliver'], { timeout: 120000 });
  lastSync = Date.now();
}

// Returns { dir, ref } ready for `git -C dir archive ref`. Throws if unavailable.
async function ensure() {
  if (!REPO_URL) {
    await run('git', ['-C', REPO_PATH, 'rev-parse', '--verify', 'HEAD']);
    return { dir: REPO_PATH, ref: 'HEAD' };
  }
  if (!fs.existsSync(CACHE) || Date.now() - lastSync > REFRESH_MS) {
    pending = pending || sync().finally(() => { pending = null; });
    try {
      await pending;
    } catch (e) {
      if (!fs.existsSync(CACHE)) throw e; // no cached copy to fall back on
      console.error('[repo] refresh failed, using cached copy'); // never log the URL: it may hold a token
    }
  }
  await run('git', ['-C', CACHE, 'rev-parse', '--verify', 'deliver']);
  return { dir: CACHE, ref: 'deliver' };
}

module.exports = { ensure };