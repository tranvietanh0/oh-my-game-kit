// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * binary-download.cjs — Download a binary from a URL into ~/.agents/tools/ (or %LOCALAPPDATA%\omg\bin\ on Windows).
 *
 * Features:
 *   - Platform-aware URL selection (step.url / step.urlWindows / step.urlMacos).
 *   - Optional SHA-256 verification (BLOCKER 4): aborts on mismatch — never proceed with corrupt binary.
 *   - Atomic download: temp file + rename (crash safety).
 *   - chmod +x on Unix; guarded by `process.platform !== 'win32'`.
 *   - Windows PATH persistence: setx %LOCALAPPDATA%\omg\bin once per session via sentinel.
 *   - Cross-platform: uses https.get with redirect handling, os.homedir(), path.join().
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const { probeCommand } = require('./subprocess-utils.cjs');

const HANDLER_NAME = 'binary-download';
const HANDLER_VERSION = '1.0.0';

// ── Install directory ──────────────────────────────────────────────────────

/** Returns the tools dir where binaries are placed. Created on first use. */
function getToolsDir() {
  let dir;
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    dir = path.join(localAppData, 'omg', 'bin');
  } else {
    dir = path.join(os.homedir(), '.local', 'share', 'omg', 'bin');
  }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Sentinel path for Windows PATH persistence (written once per session). */
function winPathSentinelPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'oh-my-game-kit', 'path-extended');
}

// ── Download helpers ───────────────────────────────────────────────────────

/**
 * Download URL to destPath following redirects. Returns Promise<void>.
 * Uses Node 18+ global fetch if available, falls back to https.get.
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath, { flags: 'w' });
    const onError = (err) => { file.close(); try { fs.unlinkSync(destPath); } catch { /* ignore */ } reject(err); };
    file.on('error', onError);

    function get(currentUrl) {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          get(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          onError(new Error(`Download failed: HTTP ${res.statusCode} for ${currentUrl}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      }).on('error', onError);
    }
    get(url);
  });
}

/**
 * Compute SHA-256 hex digest of a file.
 */
function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

/**
 * Select the correct download URL for the current platform.
 * step.url is the Linux/macOS fallback; step.urlWindows overrides on win32; step.urlMacos on darwin.
 */
function resolveUrl(step) {
  if (process.platform === 'win32' && step.urlWindows) return step.urlWindows;
  if (process.platform === 'darwin' && step.urlMacos) return step.urlMacos;
  if (step.url) return step.url;
  throw new Error(`binary-download: no URL provided for platform '${process.platform}' (target: ${step.target})`);
}

/**
 * Resolve the destination binary name (adds .exe on Windows).
 */
function resolveDestName(step) {
  const base = step.target;
  return process.platform === 'win32' ? `${base}.exe` : base;
}

// ── Windows PATH persistence ───────────────────────────────────────────────

function ensureWindowsPath(toolsDir, logger) {
  if (process.platform !== 'win32') return;
  const sentinel = winPathSentinelPath();
  if (fs.existsSync(sentinel)) return;

  const result = probeCommand('setx', ['PATH', `%PATH%;${toolsDir}`], { timeout: 10_000 });
  if (result.ok) {
    fs.mkdirSync(path.dirname(sentinel), { recursive: true });
    fs.writeFileSync(sentinel, new Date().toISOString(), 'utf8');
    logger.info(`binary-download: Added ${toolsDir} to user PATH. Open a new shell to pick it up.`);
  } else {
    logger.warn(`binary-download: PATH update failed (setx error: ${result.stderr}). Add ${toolsDir} to PATH manually.`);
    // Not a hard fail per plan §H4 §4
  }
}

// ── Prerequisites ──────────────────────────────────────────────────────────

function listPrerequisites() {
  // No external tools required — self-contained downloader.
  return [];
}

// ── Public API ─────────────────────────────────────────────────────────────

async function check(step, _ctx) {
  const toolsDir = getToolsDir();
  const destName = resolveDestName(step);
  const destPath = path.join(toolsDir, destName);
  if (!fs.existsSync(destPath)) return { installed: false, installedVersion: null, path: null };
  return { installed: true, installedVersion: step.version || null, path: destPath };
}

async function install(step, ctx) {
  const toolsDir = getToolsDir();
  const destName = resolveDestName(step);
  const destPath = path.join(toolsDir, destName);

  // Idempotency: if already present and no sha256 to check against, skip
  if (fs.existsSync(destPath) && !step.sha256) {
    ctx.logger.info(`binary-download: '${destName}' already present at ${destPath} — skipping.`);
    return { success: true, method: HANDLER_NAME, log: `already-present` };
  }

  const url = resolveUrl(step);
  ctx.logger.info(`binary-download: downloading ${destName} from ${url} ...`);

  // Atomic: download to temp file first
  const tmpPath = path.join(os.tmpdir(), `omg-bin-${Date.now()}-${destName}`);
  try {
    await downloadFile(url, tmpPath);

    // SHA-256 verification (BLOCKER 4)
    if (step.sha256) {
      const actual = sha256File(tmpPath);
      if (actual.toLowerCase() !== step.sha256.toLowerCase()) {
        fs.unlinkSync(tmpPath);
        throw new Error(
          `binary-download: SHA-256 mismatch for '${destName}'.\n` +
          `  Expected: ${step.sha256}\n` +
          `  Actual:   ${actual}\n` +
          `  Aborting — do NOT use a corrupt binary.`
        );
      }
      ctx.logger.info(`binary-download: SHA-256 verified for ${destName}`);
    }

    // Atomic rename
    fs.renameSync(tmpPath, destPath);

    // chmod +x on Unix
    if (process.platform !== 'win32') {
      fs.chmodSync(destPath, 0o755);
    }

    ensureWindowsPath(toolsDir, ctx.logger);
    ctx.logger.info(`binary-download: installed ${destName} to ${destPath}`);
    return { success: true, method: HANDLER_NAME, log: `installed@${destPath}` };
  } catch (err) {
    // Clean up temp on any failure
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

async function uninstall(step, ctx) {
  const toolsDir = getToolsDir();
  const destName = resolveDestName(step);
  const destPath = path.join(toolsDir, destName);
  if (!fs.existsSync(destPath)) {
    ctx.logger.info(`binary-download: '${destName}' not present — uninstall is a no-op.`);
    return { success: true, log: 'not-present' };
  }
  fs.unlinkSync(destPath);
  ctx.logger.info(`binary-download: removed ${destPath}`);
  return { success: true, log: `removed:${destPath}` };
}

async function verify(step, ctx) {
  const toolsDir = getToolsDir();
  const destName = resolveDestName(step);
  const destPath = path.join(toolsDir, destName);

  if (!fs.existsSync(destPath)) {
    return { ok: false, reason: `'${destName}' not found at ${destPath}` };
  }

  if (step.verify) {
    const parts = step.verify.split(/\s+/);
    const result = probeCommand(parts[0], parts.slice(1), { timeout: 10_000 });
    if (result.ok) return { ok: true, reason: 'verify-command-passed' };
    return { ok: false, reason: `verify command failed: ${result.stderr}` };
  }

  if (step.sha256) {
    const actual = sha256File(destPath);
    if (actual.toLowerCase() !== step.sha256.toLowerCase()) {
      return { ok: false, reason: `SHA-256 mismatch: expected=${step.sha256} actual=${actual}` };
    }
  }

  return { ok: true, reason: `present@${destPath}` };
}

function manifest() {
  return { handler: HANDLER_NAME, version: HANDLER_VERSION };
}

module.exports = { name: HANDLER_NAME, check, install, uninstall, verify, listPrerequisites, manifest };
