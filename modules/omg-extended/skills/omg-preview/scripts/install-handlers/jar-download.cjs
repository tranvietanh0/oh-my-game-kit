// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * jar-download.cjs — Download a Java JAR file into ~/.agents/tools/ (or Windows equivalent).
 *
 * Features:
 *   - Downloads JAR from URL with optional SHA-256 verification (BLOCKER 4).
 *   - Atomic download: temp file + rename.
 *   - Creates a wrapper shell script (Unix: sh, Windows: .cmd) that runs `java -jar <jar> "$@"`.
 *   - Prerequisite: Java JRE >= 11 on PATH.
 *   - Rollback: remove JAR + wrapper.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const { probeCommand, commandExists, PrerequisiteError } = require('./subprocess-utils.cjs');

const HANDLER_NAME = 'jar-download';
const HANDLER_VERSION = '1.0.0';
const JAVA_MIN_MAJOR = 11;

// ── Install directory ──────────────────────────────────────────────────────

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

// ── Prerequisites ──────────────────────────────────────────────────────────

function listPrerequisites() {
  return [
    {
      name: 'Java JRE >= 11',
      check: 'java -version',
      installHint: 'https://adoptium.net (Eclipse Temurin JRE 11+)',
    },
  ];
}

function assertPrerequisites() {
  // java outputs version to stderr
  const result = probeCommand('java', ['-version'], { timeout: 10_000 });
  if (result.exitCode === 127 || (!result.ok && !result.stderr)) {
    throw new PrerequisiteError('Java JRE >= 11', 'https://adoptium.net');
  }
  // Parse major version from e.g. 'openjdk version "11.0.2"' or '"1.8.0_292"'
  const output = result.stderr || result.stdout;
  const match = output.match(/"(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = parseInt(match[1], 10);
    // Java 8 reports as 1.8
    const effective = major === 1 ? parseInt(match[2] || '0', 10) : major;
    if (effective < JAVA_MIN_MAJOR) {
      throw new PrerequisiteError(
        `Java JRE >= ${JAVA_MIN_MAJOR} (found version ${output.slice(0, 40)})`,
        'https://adoptium.net',
      );
    }
  }
}

// ── Download helpers ───────────────────────────────────────────────────────

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

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

// ── Wrapper script creation ────────────────────────────────────────────────

function wrapperPathForJar(jarPath) {
  const base = path.basename(jarPath, '.jar');
  if (process.platform === 'win32') {
    return path.join(path.dirname(jarPath), `${base}.cmd`);
  }
  return path.join(path.dirname(jarPath), base);
}

function writeWrapper(jarPath, logger) {
  const wrapperPath = wrapperPathForJar(jarPath);
  if (process.platform === 'win32') {
    const content = `@echo off\r\njava -jar "${jarPath}" %*\r\n`;
    fs.writeFileSync(wrapperPath, content, 'utf8');
    logger.info(`jar-download: created Windows wrapper ${wrapperPath}`);
  } else {
    const content = `#!/bin/sh\nexec java -jar "${jarPath}" "$@"\n`;
    fs.writeFileSync(wrapperPath, content, 'utf8');
    fs.chmodSync(wrapperPath, 0o755);
    logger.info(`jar-download: created wrapper ${wrapperPath}`);
  }
  return wrapperPath;
}

// ── Public API ─────────────────────────────────────────────────────────────

async function check(step, _ctx) {
  const toolsDir = getToolsDir();
  const jarName = `${step.target}.jar`;
  const jarPath = path.join(toolsDir, jarName);
  if (!fs.existsSync(jarPath)) return { installed: false, installedVersion: null, path: null };
  return { installed: true, installedVersion: step.version || null, path: jarPath };
}

async function install(step, ctx) {
  assertPrerequisites();
  if (!step.url) {
    throw new Error(`jar-download: 'url' is required for target '${step.target}'.`);
  }

  const toolsDir = getToolsDir();
  const jarName = `${step.target}.jar`;
  const jarPath = path.join(toolsDir, jarName);

  if (fs.existsSync(jarPath) && !step.sha256) {
    ctx.logger.info(`jar-download: '${jarName}' already present — skipping.`);
    return { success: true, method: HANDLER_NAME, log: 'already-present' };
  }

  ctx.logger.info(`jar-download: downloading ${jarName} from ${step.url} ...`);
  const tmpPath = path.join(os.tmpdir(), `omg-jar-${Date.now()}-${jarName}`);

  try {
    await downloadFile(step.url, tmpPath);

    if (step.sha256) {
      const actual = sha256File(tmpPath);
      if (actual.toLowerCase() !== step.sha256.toLowerCase()) {
        fs.unlinkSync(tmpPath);
        throw new Error(
          `jar-download: SHA-256 mismatch for '${jarName}'.\n` +
          `  Expected: ${step.sha256}\n` +
          `  Actual:   ${actual}\n` +
          `  Aborting — do NOT use a corrupt JAR.`
        );
      }
      ctx.logger.info(`jar-download: SHA-256 verified for ${jarName}`);
    }

    fs.renameSync(tmpPath, jarPath);
    writeWrapper(jarPath, ctx.logger);

    ctx.logger.info(`jar-download: installed ${jarName} to ${jarPath}`);
    return { success: true, method: HANDLER_NAME, log: `installed@${jarPath}` };
  } catch (err) {
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

async function uninstall(step, ctx) {
  const toolsDir = getToolsDir();
  const jarName = `${step.target}.jar`;
  const jarPath = path.join(toolsDir, jarName);
  const wrapperPath = wrapperPathForJar(jarPath);

  if (!fs.existsSync(jarPath)) {
    ctx.logger.info(`jar-download: '${jarName}' not present — uninstall is a no-op.`);
    return { success: true, log: 'not-present' };
  }

  fs.unlinkSync(jarPath);
  if (fs.existsSync(wrapperPath)) fs.unlinkSync(wrapperPath);
  ctx.logger.info(`jar-download: removed ${jarPath}`);
  return { success: true, log: `removed:${jarPath}` };
}

async function verify(step, ctx) {
  const toolsDir = getToolsDir();
  const jarName = `${step.target}.jar`;
  const jarPath = path.join(toolsDir, jarName);

  if (!fs.existsSync(jarPath)) {
    return { ok: false, reason: `'${jarName}' not found at ${jarPath}` };
  }

  if (step.verify) {
    const parts = step.verify.split(/\s+/);
    const result = probeCommand(parts[0], parts.slice(1), { timeout: 15_000 });
    if (result.ok) return { ok: true, reason: 'verify-command-passed' };
    return { ok: false, reason: `verify command failed: ${result.stderr}` };
  }

  if (step.sha256) {
    const actual = sha256File(jarPath);
    if (actual.toLowerCase() !== step.sha256.toLowerCase()) {
      return { ok: false, reason: `SHA-256 mismatch: expected=${step.sha256} actual=${actual}` };
    }
  }

  return { ok: true, reason: `jar-present@${jarPath}` };
}

function manifest() {
  return { handler: HANDLER_NAME, version: HANDLER_VERSION };
}

module.exports = { name: HANDLER_NAME, check, install, uninstall, verify, listPrerequisites, manifest };
